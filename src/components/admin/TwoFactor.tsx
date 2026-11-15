'use client'
import { useAuth, useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

type Status = { enabled: boolean; recoveryLeft: number; self: boolean }

const api = async (path: string, init?: RequestInit) => {
  const r = await fetch(`/api/users${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j?.error || j?.errors?.[0]?.message || `Ошибка ${r.status}`)
  return j
}

/** Профиль → «Вход с кодом»: подключение по QR, резервные коды, отключение; админ может сбросить чужую защиту */
export function TwoFactorField() {
  const { id } = useDocumentInfo()
  const { user } = useAuth()
  const [st, setSt] = useState<Status | null>(null)
  const [setup, setSetup] = useState<{ qr: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [codes, setCodes] = useState<string[] | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => id && api(`/2fa/status?id=${id}`).then(setSt).catch((e) => setErr(e.message))
  useEffect(() => {
    load()
  }, [id])
  if (!id || !st) return null
  const isAdmin = (user as any)?.role === 'admin' || !(user as any)?.role

  const run = async (fn: () => Promise<void>) => {
    setErr('')
    setBusy(true)
    try {
      await fn()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="gb-2fa">
      <div className="gb-2fa__head">
        <b>🔐 Вход с кодом из приложения</b>
        <span className={`gb-2fa__badge${st.enabled ? ' is-on' : ''}`}>{st.enabled ? 'включён' : 'выключен'}</span>
      </div>

      {!st.self && (
        <>
          <p>{st.enabled ? 'У пользователя включён вход с кодом.' : 'Пользователь входит только по паролю.'}</p>
          {st.enabled && isAdmin && (
            <button type="button" className="gb-act__b" disabled={busy} onClick={() => window.confirm('Сбросить вход с кодом? Пользователь сможет войти по паролю и подключить защиту заново.') && run(async () => { await api(`/${id}/2fa/reset`, { method: 'POST' }); await load() })}>
              Сбросить (потерян телефон)
            </button>
          )}
        </>
      )}

      {st.self && !st.enabled && !setup && !codes && (
        <>
          <p>Даже если пароль утечёт, без телефона в админку не попасть. Подойдёт Яндекс Ключ, Google Authenticator или любое приложение для кодов.</p>
          <button type="button" className="gb-act__b gb-act__b--go" disabled={busy} onClick={() => run(async () => setSetup(await api('/2fa/setup', { method: 'POST' })))}>
            Подключить
          </button>
        </>
      )}

      {setup && (
        <div className="gb-2fa__setup">
          <div className="gb-2fa__qr" dangerouslySetInnerHTML={{ __html: setup.qr }} />
          <div className="gb-2fa__steps">
          <ol>
            <li>Откройте приложение для кодов и отсканируйте QR-код.</li>
            <li>
              Не сканируется — введите ключ вручную: <code>{setup.secret.replace(/(.{4})/g, '$1 ').trim()}</code>
            </li>
            <li>Введите 6 цифр, которые показало приложение:</li>
          </ol>
          <div className="gb-2fa__row">
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" />
            <button type="button" className="gb-act__b gb-act__b--go" disabled={busy || code.length !== 6} onClick={() => run(async () => { const r = await api('/2fa/enable', { method: 'POST', body: JSON.stringify({ code }) }); setCodes(r.recovery); setSetup(null); setCode(''); await load() })}>
              Включить
            </button>
          </div>
          </div>
        </div>
      )}

      {codes && (
        <div className="gb-2fa__codes">
          <p>
            <b>Сохраните резервные коды</b> — каждый можно использовать один раз, если телефона нет под рукой. Больше они не покажутся.
          </p>
          <pre>{codes.join('\n')}</pre>
          <div className="gb-2fa__row">
            <button type="button" className="gb-act__b" onClick={() => navigator.clipboard.writeText(codes.join('\n'))}>
              Скопировать
            </button>
            <a className="gb-act__b" href={`data:text/plain;charset=utf-8,${encodeURIComponent('Резервные коды GeoBit (вход в админку)\n\n' + codes.join('\n'))}`} download="geobit-reserve-codes.txt">
              Скачать .txt
            </a>
            <button type="button" className="gb-act__b gb-act__b--go" onClick={() => setCodes(null)}>
              Я сохранил
            </button>
          </div>
        </div>
      )}

      {st.self && st.enabled && !codes && (
        <>
          <p>
            При входе после пароля спрашивается код из приложения. Резервных кодов осталось: <b>{st.recoveryLeft}</b>
            {st.recoveryLeft < 3 && ' — отключите и подключите защиту заново, чтобы получить новые.'}
          </p>
          <div className="gb-2fa__row">
            <input inputMode="numeric" maxLength={11} value={code} onChange={(e) => setCode(e.target.value)} placeholder="код для отключения" />
            <button type="button" className="gb-act__b gb-act__b--muted" disabled={busy || code.length < 6} onClick={() => run(async () => { await api('/2fa/disable', { method: 'POST', body: JSON.stringify({ code }) }); setCode(''); await load() })}>
              Отключить
            </button>
          </div>
        </>
      )}
      {err && <p className="gb-2fa__err">{err}</p>}
    </div>
  )
}
