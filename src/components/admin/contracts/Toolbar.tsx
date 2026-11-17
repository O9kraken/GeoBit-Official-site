'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type Plan = { name: string; price: number; features: string }
type Service = { id: number; title: string; slug: string; kind: 'dev' | 'seo' | 'design'; price: number; days: number | null; plans: Plan[] }
type Client = { key: string; from: string; id: number; name: string; phone?: string; email?: string; address?: string; site?: string }
type Data = { services: Service[]; settings: any; clients: Client[] }

const STEPS = ['Услуга', 'Заказчик', 'Деньги', 'Условия', 'Проверка']
const TYPES = [
  { v: 'company', l: 'Юрлицо', d: 'ООО, АО — реквизиты, подписант' },
  { v: 'ip', l: 'ИП', d: 'ФИО, ИНН, ОГРНИП' },
  { v: 'person', l: 'Физлицо', d: 'Частный заказчик: защита прав потребителей' },
]
const PAY = [
  { v: 'half', l: '50 / 50', d: 'Предоплата и остаток после акта' },
  { v: 'prepay100', l: '100 % вперёд', d: 'Для небольших работ' },
  { v: 'thirds', l: '40 / 30 / 30', d: 'Предоплата, после макета, после акта' },
]
const rub = (n: number) => `${Math.round(n || 0).toLocaleString('ru-RU')} ₽`

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="gb-q__f">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

/** Квиз: пять шагов, на выходе — готовый договор из шаблона под выбранную услугу */
function Quiz({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [data, setData] = useState<Data | null>(null)
  const [err, setErr] = useState('')
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [serviceId, setServiceId] = useState<number | null>(null)
  const [clientType, setClientType] = useState('company')
  const [client, setClient] = useState<Record<string, string>>({ basis: 'Устава' })
  const [link, setLink] = useState('')
  const [terms, setTerms] = useState<Record<string, any>>({ payment: 'half', revisions: 2, warrantyDays: 30, hosting: 'client', content: 'client', concepts: 3, minMonths: 3, credit: true })

  useEffect(() => {
    fetch('/api/contracts/quiz', { credentials: 'include' })
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok) throw new Error(j?.error || `Ошибка ${r.status}`)
        setData(j)
        setTerms((t) => ({ ...t, revisions: j.settings?.revisions ?? 2, warrantyDays: j.settings?.warrantyDays ?? 30 }))
      })
      .catch((e) => setErr(e.message))
  }, [])

  const svc = useMemo(() => data?.services.find((s) => s.id === serviceId) || null, [data, serviceId])
  const kind = svc?.kind || 'dev'
  const setT = (k: string, v: any) => setTerms((t) => ({ ...t, [k]: v }))
  const setC = (k: string, v: string) => setClient((c) => ({ ...c, [k]: v }))

  const pickService = (s: Service) => {
    setServiceId(s.id)
    const plan = s.plans[0]
    setTerms((t) => ({ ...t, plan: plan?.name || '', price: plan?.price || s.price, days: s.days || (s.kind === 'dev' ? 14 : 7), payment: s.kind === 'seo' ? 'monthly' : t.payment === 'monthly' ? 'half' : t.payment }))
  }
  const pickClient = (key: string) => {
    setLink(key)
    const c = data?.clients.find((x) => x.key === key)
    if (!c) return
    setClient((k) => ({ ...k, name: c.name || k.name || '', phone: c.phone || k.phone || '', email: c.email || k.email || '', address: c.address || k.address || '' }))
    if (c.site) setT('site', c.site.replace(/^https?:\/\//, '').replace(/\/$/, ''))
  }

  const problems: string[] = []
  if (step >= 0 && !svc) problems.push('выберите услугу')
  if (step >= 1 && !client.name) problems.push(clientType === 'company' ? 'название организации' : 'ФИО заказчика')
  if (step >= 2 && !(Number(terms.price) > 0)) problems.push('стоимость')
  if (step >= 3 && kind === 'seo' && !terms.site) problems.push('домен продвигаемого сайта')
  const canNext = problems.length === 0

  const create = async () => {
    setBusy(true)
    setErr('')
    try {
      const [from, id] = link.split(':')
      const r = await fetch('/api/contracts/quiz', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceId, clientType, client, terms: { ...terms, price: Number(terms.price) || 0 }, ...(from === 'lead' ? { lead: id } : {}), ...(from === 'prospect' ? { prospect: id } : {}) }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || `Ошибка ${r.status}`)
      router.push(`/admin/collections/contracts/${j.id}`)
      onClose()
    } catch (e: any) {
      setErr(e.message)
      setBusy(false)
    }
  }

  const input = (k: string, ph = '', type = 'text') => <input type={type} value={client[k] || ''} placeholder={ph} onChange={(e) => setC(k, e.target.value)} />
  const tnum = (k: string, min = 0) => <input type="number" min={min} value={terms[k] ?? ''} onChange={(e) => setT(k, e.target.value === '' ? '' : Number(e.target.value))} />

  return (
    <div className="gb-write-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gb-q">
        <button type="button" className="gb-write__x" onClick={onClose} aria-label="Закрыть">×</button>
        <h3 className="gb-q__title">Составить договор</h3>
        <ol className="gb-q__steps">
          {STEPS.map((s, i) => (
            <li key={s} className={i === step ? 'is-on' : i < step ? 'is-done' : ''}>
              <button type="button" disabled={i > step} onClick={() => setStep(i)}>
                <b>{i + 1}</b> {s}
              </button>
            </li>
          ))}
        </ol>

        {!data && !err && <p className="gb-q__muted">Загружаю услуги…</p>}
        {data && (
          <div className="gb-q__body">
            {step === 0 && (
              <>
                <p className="gb-q__lead">Какую услугу оформляем? Шаблон договора подберётся сам.</p>
                <div className="gb-q__cards">
                  {data.services.map((s) => (
                    <button type="button" key={s.id} className={`gb-q__card${serviceId === s.id ? ' is-on' : ''}`} onClick={() => pickService(s)}>
                      <b>{s.title}</b>
                      <small>{s.kind === 'seo' ? 'ежемесячно' : s.kind === 'design' ? 'дизайн + права' : 'разработка'} · от {rub(s.price)}</small>
                    </button>
                  ))}
                </div>
                {svc && svc.plans.length > 0 && (
                  <>
                    <p className="gb-q__lead">Тариф</p>
                    <div className="gb-q__chips">
                      {svc.plans.map((p) => (
                        <button type="button" key={p.name} className={terms.plan === p.name ? 'is-on' : ''} onClick={() => setTerms((t) => ({ ...t, plan: p.name, price: p.price || t.price }))}>
                          {p.name} · {rub(p.price)}
                        </button>
                      ))}
                      <button type="button" className={!terms.plan ? 'is-on' : ''} onClick={() => setT('plan', '')}>
                        Без тарифа
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {step === 1 && (
              <>
                {data.clients.length > 0 && (
                  <Field label="Подставить из заявки или клиента" hint="Необязательно: заполнит название и контакты, договор свяжется с карточкой">
                    <select value={link} onChange={(e) => pickClient(e.target.value)}>
                      <option value="">— заполню вручную —</option>
                      {data.clients.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.from}: {c.name}
                          {c.phone ? ` · ${c.phone}` : ''}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <div className="gb-q__seg">
                  {TYPES.map((t) => (
                    <button type="button" key={t.v} className={clientType === t.v ? 'is-on' : ''} onClick={() => setClientType(t.v)}>
                      <b>{t.l}</b>
                      <small>{t.d}</small>
                    </button>
                  ))}
                </div>
                <div className="gb-q__grid">
                  <Field label={clientType === 'company' ? 'Название организации *' : 'ФИО полностью *'}>{input('name', clientType === 'company' ? 'ООО «Ромашка»' : 'Иванов Иван Иванович')}</Field>
                  {clientType !== 'person' && <Field label="ИНН">{input('inn')}</Field>}
                  {clientType === 'company' && <Field label="КПП">{input('kpp')}</Field>}
                  {clientType !== 'person' && <Field label={clientType === 'ip' ? 'ОГРНИП' : 'ОГРН'}>{input('ogrn')}</Field>}
                  {clientType === 'company' && (
                    <>
                      <Field label="Подписант (ФИО)">{input('signer', 'Иванов Иван Иванович')}</Field>
                      <Field label="В лице (кого)" hint="Должность и ФИО в родительном падеже">{input('signerGen', 'Генерального директора Иванова Ивана Ивановича')}</Field>
                      <Field label="На основании">{input('basis', 'Устава')}</Field>
                    </>
                  )}
                  <Field label={clientType === 'person' ? 'Адрес регистрации' : 'Юридический адрес'}>{input('address')}</Field>
                  {clientType === 'person' && <Field label="Паспорт" hint="Необязательно">{input('passport', 'серия, номер, кем и когда выдан')}</Field>}
                  {clientType !== 'person' && (
                    <>
                      <Field label="Р/с">{input('bankAccount')}</Field>
                      <Field label="Банк">{input('bankName')}</Field>
                      <Field label="БИК">{input('bik')}</Field>
                      <Field label="К/с">{input('corrAccount')}</Field>
                    </>
                  )}
                  <Field label="Телефон">{input('phone')}</Field>
                  <Field label="Эл. почта">{input('email', '', 'email')}</Field>
                </div>
                <p className="gb-q__muted">Реквизиты можно дописать позже в карточке договора — Word и страница обновятся сами.</p>
              </>
            )}

            {step === 2 && (
              <>
                <div className="gb-q__grid">
                  <Field label={kind === 'seo' ? 'Стоимость в месяц, ₽ *' : 'Стоимость, ₽ *'} hint={terms.plan ? `Тариф «${terms.plan}»` : undefined}>
                    {tnum('price', 0)}
                  </Field>
                </div>
                {kind === 'seo' ? (
                  <p className="gb-q__muted">SEO оплачивается ежемесячно авансом — так и будет в договоре.</p>
                ) : (
                  <div className="gb-q__seg">
                    {PAY.map((p) => (
                      <button type="button" key={p.v} className={terms.payment === p.v ? 'is-on' : ''} onClick={() => setT('payment', p.v)}>
                        <b>{p.l}</b>
                        <small>{p.d}</small>
                      </button>
                    ))}
                  </div>
                )}
                {Number(terms.price) > 0 && kind !== 'seo' && (
                  <p className="gb-q__muted">
                    {terms.payment === 'half' && `Предоплата ${rub(terms.price / 2)}, остаток ${rub(terms.price - Math.round(terms.price / 2))}.`}
                    {terms.payment === 'thirds' && `${rub(terms.price * 0.4)} → ${rub(terms.price * 0.3)} → ${rub(terms.price - Math.round(terms.price * 0.4) - Math.round(terms.price * 0.3))}.`}
                    {terms.payment === 'prepay100' && `Вся сумма ${rub(terms.price)} до начала работ.`}
                  </p>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <div className="gb-q__grid">
                  {kind !== 'seo' && <Field label="Срок, рабочих дней">{tnum('days', 1)}</Field>}
                  {kind !== 'seo' && <Field label={kind === 'design' ? 'Кругов правок концепции' : 'Кругов правок на этап'}>{tnum('revisions', 0)}</Field>}
                  {kind === 'dev' && <Field label="Гарантия, дней">{tnum('warrantyDays', 0)}</Field>}
                  {kind === 'design' && <Field label="Концепций на выбор">{tnum('concepts', 1)}</Field>}
                  {kind === 'seo' && <Field label="Минимальный срок, мес.">{tnum('minMonths', 1)}</Field>}
                  {kind !== 'design' && (
                    <Field label={kind === 'seo' ? 'Домен сайта *' : 'Домен (если известен)'}>
                      <input value={terms.site || ''} placeholder="example.ru" onChange={(e) => setT('site', e.target.value)} />
                    </Field>
                  )}
                  {kind === 'dev' && <Field label="Консультации после запуска, мес.">{tnum('supportMonths', 0)}</Field>}
                </div>
                {kind === 'dev' && (
                  <>
                    <p className="gb-q__lead">Домен и хостинг</p>
                    <div className="gb-q__seg">
                      <button type="button" className={terms.hosting === 'client' ? 'is-on' : ''} onClick={() => setT('hosting', 'client')}>
                        <b>Покупает заказчик</b>
                        <small>Даёт доступы на время работ</small>
                      </button>
                      <button type="button" className={terms.hosting === 'executor' ? 'is-on' : ''} onClick={() => setT('hosting', 'executor')}>
                        <b>Регистрирую я</b>
                        <small>На имя заказчика, оплачивает он</small>
                      </button>
                    </div>
                    <p className="gb-q__lead">Тексты и фото</p>
                    <div className="gb-q__seg">
                      <button type="button" className={terms.content === 'client' ? 'is-on' : ''} onClick={() => setT('content', 'client')}>
                        <b>Даёт заказчик</b>
                        <small>5 рабочих дней на материалы</small>
                      </button>
                      <button type="button" className={terms.content === 'executor' ? 'is-on' : ''} onClick={() => setT('content', 'executor')}>
                        <b>Готовлю я</b>
                        <small>Заказчик даёт сведения и проверяет</small>
                      </button>
                    </div>
                    <label className="gb-q__check">
                      <input type="checkbox" checked={terms.credit !== false} onChange={(e) => setT('credit', e.target.checked)} /> Ссылка на GeoBit в подвале сайта (заказчик может удалить)
                    </label>
                  </>
                )}
                <Field label="Особые условия" hint="Необязательно: попадут в заключительные положения">
                  <textarea rows={3} value={terms.extra || ''} onChange={(e) => setT('extra', e.target.value)} />
                </Field>
              </>
            )}

            {step === 4 && svc && (
              <div className="gb-q__sum">
                <dl>
                  <dt>Услуга</dt>
                  <dd>
                    {svc.title}
                    {terms.plan ? `, тариф «${terms.plan}»` : ''}
                  </dd>
                  <dt>Заказчик</dt>
                  <dd>
                    {TYPES.find((t) => t.v === clientType)?.l}: {client.name}
                  </dd>
                  <dt>Стоимость</dt>
                  <dd>
                    {rub(terms.price)}
                    {kind === 'seo' ? ' в месяц' : ''} · {kind === 'seo' ? 'ежемесячно авансом' : PAY.find((p) => p.v === terms.payment)?.l}
                  </dd>
                  {kind !== 'seo' && (
                    <>
                      <dt>Срок</dt>
                      <dd>
                        {terms.days} раб. дн., правок: {terms.revisions}
                        {kind === 'dev' ? `, гарантия ${terms.warrantyDays} дн.` : `, концепций: ${terms.concepts}`}
                      </dd>
                    </>
                  )}
                  {kind === 'seo' && (
                    <>
                      <dt>Сайт</dt>
                      <dd>
                        {terms.site}, минимум {terms.minMonths} мес.
                      </dd>
                    </>
                  )}
                </dl>
                <p className="gb-q__muted">
                  {clientType === 'person'
                    ? 'Для физлица в договор попадут условия по Закону «О защите прав потребителей»: без «молчаливой» приёмки и с возвратом денег за невыполненную часть.'
                    : 'Для юрлица и ИП: приёмка без ответа за 5 дней, неустойка с потолком, ограничение ответственности суммой договора.'}{' '}
                  Исполнитель — самозанятый (НПД), без НДС, чеки из «Мой налог».
                </p>
                {!data.settings?.fio && <p className="gb-write__err">Не заполнены реквизиты исполнителя — договор создастся, но ФИО и ИНН будут пустыми. Заполните «Реквизиты для договоров».</p>}
              </div>
            )}
          </div>
        )}

        {err && <p className="gb-write__err">{err}</p>}
        <div className="gb-q__nav">
          <button type="button" className="gb-btn" onClick={() => (step ? setStep(step - 1) : onClose())}>
            {step ? '← Назад' : 'Отмена'}
          </button>
          {!canNext && <span className="gb-q__muted">Нужно: {problems.join(', ')}</span>}
          {step < 4 ? (
            <button type="button" className="gb-btn gb-btn--accent" disabled={!canNext} onClick={() => setStep(step + 1)}>
              Дальше →
            </button>
          ) : (
            <button type="button" className="gb-btn gb-btn--accent" disabled={busy || !canNext} onClick={create}>
              {busy ? 'Составляю…' : 'Создать договор'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ContractsToolbar() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return (
    <div className="gb-ctool">
      <button type="button" className="gb-btn gb-btn--accent" onClick={() => setOpen(true)}>
        ＋ Составить договор
      </button>
      <a className="gb-btn" href="/admin/collections/contract-templates">
        Шаблоны договоров
      </a>
      <a className="gb-btn" href="/admin/globals/contract-settings">
        Мои реквизиты
      </a>
      <span className="gb-q__muted">Квиз спросит услугу, заказчика, деньги и условия — договор соберётся из шаблона, его можно править и скачать в Word.</span>
      {open && mounted && createPortal(<Quiz onClose={() => setOpen(false)} />, document.body)}
    </div>
  )
}

export function TemplatesToolbar() {
  const router = useRouter()
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const seed = async () => {
    setBusy(true)
    try {
      const r = await fetch('/api/contract-templates/seed', { method: 'POST', credentials: 'include' })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || `Ошибка ${r.status}`)
      setMsg(j.created ? `Создано шаблонов: ${j.created}` : 'Шаблоны есть для всех услуг')
      router.refresh()
    } catch (e: any) {
      setMsg(e.message)
    }
    setBusy(false)
  }
  return (
    <div className="gb-ctool">
      <button type="button" className="gb-btn gb-btn--accent" disabled={busy} onClick={seed}>
        {busy ? 'Создаю…' : 'Создать шаблоны для всех услуг'}
      </button>
      <a className="gb-btn" href="/admin/collections/contracts">
        ← К договорам
      </a>
      <span className="gb-q__muted">{msg || 'Для каждой услуги сайта — свой шаблон. Уже существующие не трогаются.'}</span>
    </div>
  )
}
