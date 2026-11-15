import QRCode from 'qrcode'
import { addDataAndFileToRequest, APIError, type CollectionBeforeLoginHook, type CollectionAfterOperationHook, type Endpoint, type PayloadRequest } from 'payload'
import { hashCode, newRecoveryCodes, newSecret, otpauthUri, verifyTotp } from './totp'
import { isAdmin } from '../access/roles'
import { audit } from '../collections/AuditLog'

const LOCK_MS = 15 * 60_000
const MAX_FAILS = 5

const full = (req: PayloadRequest, id: string | number) =>
  req.payload.findByID({ collection: 'users', id, depth: 0, showHiddenFields: true, overrideAccess: true, req }) as Promise<any>

const save = (req: PayloadRequest, id: string | number, data: any) =>
  req.payload.update({ collection: 'users', id, data, overrideAccess: true, req, context: { skipAudit: true, skip2fa: true } })

/** Код из приложения или резервный код. Возвращает обновлённый список резервных кодов, если использован резервный */
function check(u: any, code: string): { ok: boolean; recovery?: string[] } {
  if (verifyTotp(u.totpSecret, code)) return { ok: true }
  if (/^[0-9a-f]{5}-?[0-9a-f]{5}$/i.test(code.trim())) {
    const list: string[] = Array.isArray(u.totpRecovery) ? u.totpRecovery : []
    const h = hashCode(code)
    if (list.includes(h)) return { ok: true, recovery: list.filter((x) => x !== h) }
  }
  return { ok: false }
}

/** Вход: после верного пароля требуем код, если у пользователя включена 2FA */
export const beforeLogin2fa: CollectionBeforeLoginHook = async ({ req, user }) => {
  const u = await full(req, user.id)
  if (!u?.totpEnabled) return user
  if (u.totpLockUntil && new Date(u.totpLockUntil) > new Date()) throw new APIError('Слишком много неверных кодов. Подождите 15 минут.', 429, undefined, true)
  const code = String((req.data as any)?.totp || '').trim()
  if (!code) throw new APIError('TOTP_REQUIRED', 401, undefined, true)
  const r = check(u, code)
  if (!r.ok) {
    const fails = (u.totpFails || 0) + 1
    await save(req, u.id, { totpFails: fails >= MAX_FAILS ? 0 : fails, ...(fails >= MAX_FAILS ? { totpLockUntil: new Date(Date.now() + LOCK_MS).toISOString() } : {}) })
    throw new APIError(fails >= MAX_FAILS ? 'Слишком много неверных кодов. Подождите 15 минут.' : 'Неверный код. Проверьте время на телефоне и попробуйте ещё раз.', 401, undefined, true)
  }
  await save(req, u.id, { totpFails: 0, totpLockUntil: null, ...(r.recovery ? { totpRecovery: r.recovery } : {}) })
  return user
}

/** Сброс пароля по ссылке сразу впускает в админку — для пользователей с 2FA отключаем этот автовход */
export const afterOperation2fa: CollectionAfterOperationHook = async ({ operation, result, req }) => {
  if (operation !== 'resetPassword' || !result) return result
  const r: any = result
  const id = r?.user?.id
  if (!id) return result
  const u = await full(req, id).catch(() => null)
  if (u?.totpEnabled) {
    delete r.token
    r.message = 'Пароль изменён. Войдите с новым паролем и кодом из приложения.'
  }
  return r
}

const body = async (req: PayloadRequest) => {
  await addDataAndFileToRequest(req)
  return (req.data || {}) as any
}
const err = (msg: string, status = 400) => Response.json({ error: msg }, { status })

export const twofaEndpoints: Endpoint[] = [
  {
    // шаг 1: новый секрет и QR-код (пока не включено — только «ожидает подтверждения»)
    path: '/2fa/setup',
    method: 'post',
    handler: async (req) => {
      if (!req.user) return err('Нужно войти', 401)
      const secret = newSecret()
      await save(req, req.user.id, { totpPending: secret })
      const uri = otpauthUri(secret, (req.user as any).email)
      const qr = await QRCode.toString(uri, { type: 'svg', margin: 1, width: 220 })
      return Response.json({ ok: true, secret, uri, qr })
    },
  },
  {
    // шаг 2: подтверждение кодом → включаем и выдаём резервные коды (один раз)
    path: '/2fa/enable',
    method: 'post',
    handler: async (req) => {
      if (!req.user) return err('Нужно войти', 401)
      const { code } = await body(req)
      const u = await full(req, req.user.id)
      if (!u.totpPending) return err('Сначала нажмите «Подключить»')
      if (!verifyTotp(u.totpPending, String(code || ''))) return err('Код не подошёл. Проверьте, что время на телефоне точное, и введите свежий код.')
      const rc = newRecoveryCodes()
      await save(req, u.id, { totpSecret: u.totpPending, totpPending: null, totpEnabled: true, totpRecovery: rc.hashes, totpFails: 0 })
      await audit(req, { action: 'update', target: 'users', targetLabel: 'Пользователи', docId: String(u.id), docTitle: u.name || u.email, changed: ['Вход с кодом: включён'] })
      return Response.json({ ok: true, recovery: rc.plain })
    },
  },
  {
    // отключить у себя — нужен действующий код
    path: '/2fa/disable',
    method: 'post',
    handler: async (req) => {
      if (!req.user) return err('Нужно войти', 401)
      const { code } = await body(req)
      const u = await full(req, req.user.id)
      if (!u.totpEnabled) return Response.json({ ok: true })
      if (!check(u, String(code || '')).ok) return err('Неверный код')
      await save(req, u.id, { totpEnabled: false, totpSecret: null, totpRecovery: null, totpPending: null })
      await audit(req, { action: 'update', target: 'users', targetLabel: 'Пользователи', docId: String(u.id), docTitle: u.name || u.email, changed: ['Вход с кодом: отключён'] })
      return Response.json({ ok: true })
    },
  },
  {
    // администратор сбрасывает 2FA другому пользователю (потерян телефон)
    path: '/:id/2fa/reset',
    method: 'post',
    handler: async (req) => {
      if (!isAdmin(req.user)) return err('Только администратор', 403)
      const id = String(req.routeParams?.id || '')
      if (String(req.user!.id) === id) return err('Свою защиту отключайте кодом в профиле')
      const u = await full(req, id)
      await save(req, id, { totpEnabled: false, totpSecret: null, totpRecovery: null, totpPending: null, totpFails: 0, totpLockUntil: null })
      await audit(req, { action: 'update', target: 'users', targetLabel: 'Пользователи', docId: id, docTitle: u.name || u.email, changed: ['Вход с кодом: сброшен администратором'] })
      return Response.json({ ok: true })
    },
  },
  {
    // сколько резервных кодов осталось — для подсказки в профиле
    path: '/2fa/status',
    method: 'get',
    handler: async (req) => {
      if (!req.user) return err('Нужно войти', 401)
      const id = req.searchParams.get('id') || String(req.user.id)
      if (id !== String(req.user.id) && !isAdmin(req.user)) return err('Нет доступа', 403)
      const u = await full(req, id)
      return Response.json({ enabled: Boolean(u.totpEnabled), recoveryLeft: Array.isArray(u.totpRecovery) ? u.totpRecovery.length : 0, self: id === String(req.user.id) })
    },
  },
]
