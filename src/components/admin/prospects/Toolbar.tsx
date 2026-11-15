'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CITIES, NICHES } from '@/lib/prospects/presets'

const API = '/api/prospects'

/** Панель над списком: найти компании, проверить сайты, выгрузить в Excel, быстрые фильтры */
export function ProspectsToolbar() {
  const router = useRouter()
  const [source, setSource] = useState('osm')
  const [city, setCity] = useState('sevastopol')
  const [niche, setNiche] = useState('cafe')
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // при первом открытии досчитываем потенциал у старых записей
  useEffect(() => {
    fetch(`${API}/rescore?ifNeeded=1`, { method: 'POST', credentials: 'include' })
      .then((r) => r.json())
      .then((j) => j?.updated && router.refresh())
      .catch(() => {})
  }, [router])

  const call = async (url: string) => {
    const r = await fetch(url, { method: 'POST', credentials: 'include' })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j?.error || `Ошибка ${r.status}`)
    return j
  }

  const search = async () => {
    setBusy('search')
    setMsg(null)
    try {
      const p = new URLSearchParams({ source, city, niche, q })
      const j = await call(`${API}/search?${p}`)
      setMsg({ ok: true, text: `Найдено ${j.found}, добавлено новых ${j.created}, уже были в базе ${j.dup}.${j.created ? ' Проверяю сайты…' : ''}` })
      router.refresh()
      if (j.created) await check(true)
    } catch (e: any) {
      setMsg({ ok: false, text: e.message })
    } finally {
      setBusy(null)
    }
  }

  const check = async (chain = false) => {
    setBusy('check')
    try {
      let left = 1
      let total = 0
      while (left > 0) {
        const j = await call(`${API}/check-sites?batch=40`)
        total += j.checked
        left = j.left
        setMsg({ ok: true, text: `Проверено сайтов: ${total}${left ? `, осталось ${left}…` : '. Считаю потенциал…'}` })
        router.refresh()
        if (!j.checked) break
      }
      const rs = await call(`${API}/rescore`)
      setMsg({ ok: true, text: `Готово. Проверено сайтов: ${total}. Дублей отсеяно: ${rs.dups}. Сверху — те, кому стоит написать в первую очередь.` })
      router.refresh()
    } catch (e: any) {
      setMsg({ ok: false, text: e.message })
    } finally {
      if (!chain) setBusy(null)
    }
  }

  const BASE = '/admin/collections/prospects'
  const filters: [string, string][] = [
    ['🔥 Звонить первыми', `${BASE}?where[potential][greater_than_equal]=70&where[status][equals]=new&sort=-potential`],
    ['Можно попробовать', `${BASE}?where[potential][greater_than_equal]=50&where[potential][less_than]=70&where[status][equals]=new&sort=-potential`],
    ['Написали — ждём', `${BASE}?where[status][in]=contacted,offer&sort=nextAt`],
    ['👁 Открыли КП', `${BASE}?where[kpViewedAt][exists]=true&sort=-kpViewedAt`],
    ['Интересно / клиенты', `${BASE}?where[status][in]=interested,client`],
    ['Отсеяно', `${BASE}?where[status][equals]=skip`],
    ['Все', BASE],
  ]

  return (
    <div className="gb-pr">
      <ol className="gb-pr__how">
        <li><b>Найдите компании</b> — город и сфера ниже</li>
        <li><b>Сайты проверятся сами</b>, сети, дубли и компании без контактов отсеются</li>
        <li><b>Откройте «🔥 Звонить первыми»</b> — там самые выгодные</li>
        <li><b>«Написать»</b> — готовый текст со ссылкой на КП, отправьте в WhatsApp или на почту</li>
        <li><b>«👁 Открыли КП»</b> — кто посмотрел предложение: им звоните</li>
      </ol>
      <div className="gb-pr__form">
        <label>
          <span>Источник</span>
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="osm">OpenStreetMap — бесплатно</option>
            <option value="2gis">2ГИС API — по ключу</option>
          </select>
        </label>
        <label>
          <span>Город</span>
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            {Object.entries(CITIES).map(([k, c]) => (
              <option key={k} value={k}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Сфера</span>
          <select value={niche} onChange={(e) => setNiche(e.target.value)}>
            <option value="">— только по запросу —</option>
            {Object.entries(NICHES).map(([k, n]) => (
              <option key={k} value={k}>
                {n.label}
              </option>
            ))}
          </select>
        </label>
        <label className="gb-pr__q">
          <span>Запрос (необязательно)</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="например: пиццерия" onKeyDown={(e) => e.key === 'Enter' && !busy && search()} />
        </label>
        <button type="button" className="gb-tb__btn gb-tb__btn--main" disabled={!!busy} onClick={search}>
          {busy === 'search' ? 'Ищу… (до минуты)' : 'Найти компании'}
        </button>
      </div>
      {msg && <div className={`gb-pr__msg${msg.ok ? '' : ' is-err'}`}>{msg.text}</div>}
      <div className="gb-pr__bar">
        <div className="gb-tb__chips">
          {filters.map(([l, h]) => (
            <a key={l} className="gb-tb__chip" href={h}>
              {l}
            </a>
          ))}
        </div>
        <div className="gb-tb__actions">
          <button type="button" className="gb-tb__btn" disabled={!!busy} onClick={() => check()}>
            {busy === 'check' ? 'Проверяю…' : 'Проверить сайты'}
          </button>
          <a className="gb-tb__btn" href={`${API}/export`}>
            Скачать для Excel
          </a>
        </div>
      </div>
    </div>
  )
}
