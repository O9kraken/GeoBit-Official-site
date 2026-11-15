import type { Payload } from 'payload'
import { can, type Role } from '@/access/roles'
import { DashSources, DashToday } from './DashToday'

type Props = { payload: Payload; user?: any }

const ADMIN = '/admin'

/** Блок над стандартным дашбордом: свежие заявки и частые действия */
export async function Dashboard({ payload, user }: Props) {
  const sales = can(user, 'admin', 'manager')
  const [fresh, total, latest] = sales
    ? await Promise.all([
        payload.count({ collection: 'leads', where: { status: { equals: 'new' } }, overrideAccess: true }),
        payload.count({ collection: 'leads', overrideAccess: true }),
        payload.find({ collection: 'leads', sort: '-createdAt', limit: 5, depth: 0, overrideAccess: true }),
      ])
    : [{ totalDocs: 0 }, { totalDocs: 0 }, { docs: [] as any[] }]
  const C: Role[] = ['admin', 'editor']
  const S: Role[] = ['admin', 'manager']
  const all: [string, string, string, Role[]][] = [
    ['Первый экран главной', `${ADMIN}/globals/home`, 'Заголовок, кнопки, цифры', C],
    ['Цены и услуги', `${ADMIN}/collections/services`, 'Карточки, тарифы, FAQ', C],
    ['Калькулятор', `${ADMIN}/globals/calculator`, 'Цены типов сайтов и блоков', ['admin']],
    ['Кейсы', `${ADMIN}/collections/projects`, 'Портфолио и скриншоты', C],
    ['Новая статья', `${ADMIN}/collections/posts/create`, 'Блог', C],
    ['Поиск клиентов', `${ADMIN}/collections/prospects`, 'Компании без сайта или со старым сайтом', S],
    ['Контакты и соцсети', `${ADMIN}/globals/settings`, 'Телефон, мессенджеры, Метрика', ['admin']],
    ['Отзывы', `${ADMIN}/collections/testimonials`, 'Тексты и фото клиентов', C],
    ['Пользователи и роли', `${ADMIN}/collections/users`, 'Кто входит в админку и что может', ['admin']],
    ['Мой профиль', `${ADMIN}/account`, 'Имя, аватар автора, пароль', ['admin', 'editor', 'manager']],
    ['SEO-аудит', `${ADMIN}/seo`, 'Слабые страницы, ИИ-поиск, llms.txt', C],
  ]
  const quick = all.filter((q) => can(user, ...q[3])).map(([t, h, d]) => [t, h, d] as [string, string, string])
  const status: Record<string, string> = { new: 'Новая', progress: 'В работе', won: 'Клиент', lost: 'Отказ', spam: 'Спам' }
  const fmt = (d: string) => new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })
  return (
    <div className="gb-dash">
      <div className="gb-dash__head">
        <div>
          <h2>Добро пожаловать в GeoBit</h2>
          <p>Всё, что меняете здесь, сразу появляется на сайте.</p>
        </div>
        <a className="gb-dash__site" href="/" target="_blank" rel="noopener">
          Открыть сайт ↗
        </a>
      </div>

      {sales && (
      <div className="gb-dash__grid">
        <a className={`gb-dash__leads ${fresh.totalDocs ? 'is-hot' : ''}`} href={`${ADMIN}/collections/leads?where[status][equals]=new`}>
          <span className="gb-dash__num">{fresh.totalDocs}</span>
          <span className="gb-dash__lbl">{fresh.totalDocs ? 'новых заявок — ответьте в течение часа' : 'новых заявок нет'}</span>
          <span className="gb-dash__sub">всего заявок: {total.totalDocs}</span>
        </a>
        <div className="gb-dash__latest">
          <h3>Последние заявки</h3>
          {latest.docs.length ? (
            <ul>
              {latest.docs.map((l: any) => (
                <li key={l.id}>
                  <a href={`${ADMIN}/collections/leads/${l.id}`}>
                    <b>{l.name}</b> · {l.service || 'без услуги'}
                  </a>
                  <span className={`gb-dash__st gb-dash__st--${l.status}`}>{status[l.status] || l.status}</span>
                  <time>{fmt(l.createdAt)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="gb-dash__empty">Пока пусто. Заявки со всех форм сайта появятся здесь.</p>
          )}
        </div>
      </div>
      )}

      {sales && <DashToday payload={payload} />}

      <h3 className="gb-dash__title">Быстрые действия</h3>
      <div className="gb-dash__quick">
        {quick.map(([t, href, d]) => (
          <a key={href} href={href}>
            <b>{t}</b>
            <span>{d}</span>
          </a>
        ))}
      </div>

      {sales && <DashSources payload={payload} />}
    </div>
  )
}
