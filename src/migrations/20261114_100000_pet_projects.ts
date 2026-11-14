import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Два собственных проекта в портфолио: клуб карточных игр NOIR RIVER и учебная платформа ZERO/STACK.
 * Скриншоты — public/portfolio-seed/. Создаются только отсутствующие кейсы. Ссылки потом можно
 * поменять в админке (например, после переезда с Render на свой сервер).
 */
type Pet = {
  slug: string
  title: string
  client: string
  categoryLabel: string
  year: string
  duration: string
  technologies: string
  url: string
  excerpt: string
  challenge: string
  solution: string
  results: [string, string][]
  shots: [string, string][]
  order: number
}

const PETS: Pet[] = [
  {
    slug: 'noir-river',
    title: 'NOIR RIVER — клуб карточных игр',
    client: 'Собственный проект',
    categoryLabel: 'Веб-приложение, игры онлайн',
    year: '2026',
    duration: 'Пет-проект',
    technologies: 'Node.js, JavaScript',
    url: 'https://noir-river-poker.onrender.com',
    excerpt: 'Онлайн-клуб для своей компании: покер, турниры, дурак, блэкджек, шахматы, «Капитал» и мафия прямо в браузере. Игра на фишки, без денег.',
    challenge:
      'Сделать место, где друзья собираются на вечер карточных и настольных игр без установки приложений: зашёл по ссылке — и уже за столом. Игры должны идти в реальном времени у всех участников, а раздачи — быть честными, чтобы никто не мог подсмотреть карты или подкрутить колоду.',
    solution:
      'Веб-приложение с 14 играми в одном клубе. Тасовка и раздача идут на сервере с криптографически стойким генератором, клиент получает только свои карты. Столы обновляются в реальном времени, есть турниры Sit & Go, игра с компьютером для тренировки, профили с балансом фишек и уведомления «ваш ход». Интерфейс — тёмный «клубный» дизайн с 3D-графикой фишек и карт, адаптирован под телефон и устанавливается на рабочий стол как приложение.',
    results: [
      ['14', 'игр в одном клубе'],
      ['100%', 'раздач на сервере'],
      ['PWA', 'установка на телефон'],
    ],
    shots: [
      ['noir-river-hero.webp', 'Главный экран клуба: тёмный дизайн, 3D-фишки и карты'],
      ['noir-river-games.webp', 'Витрина игр: покер, турниры, рулетка, шашки'],
    ],
    order: 10,
  },
  {
    slug: 'zero-stack',
    title: 'ZERO/STACK — платформа для обучения веб-разработке',
    client: 'Собственный проект',
    categoryLabel: 'Веб-приложение, онлайн-обучение',
    year: '2026',
    duration: 'Пет-проект',
    technologies: 'Node.js, JavaScript',
    url: 'https://fe-platform-tvz1.onrender.com',
    excerpt: 'Учебная платформа «с нуля до fullstack»: три направления, короткие уроки, живые схемы, редактор кода с автотестами и прогресс с уровнями.',
    challenge:
      'Собрать понятный путь в веб-разработку для новичка без опыта: чтобы учиться можно было прямо в браузере, без установки программ, а прогресс и мотивация не терялись через пару недель.',
    solution:
      'Платформа с тремя направлениями — Frontend, Backend и Fullstack — на общей основе: пройденные уроки засчитываются везде, направление можно сменить без потери прогресса. Внутри — уроки с конспектами, интерактивные схемы, задачи в редакторе кода с мгновенной автопроверкой и тесты. Учебный день, серии, опыт и уровни помогают не бросить. Есть аккаунты учеников и панель администратора.',
    results: [
      ['55', 'уроков с конспектами'],
      ['75', 'задач с автопроверкой'],
      ['3', 'направления обучения'],
    ],
    shots: [
      ['zerostack-hero.webp', 'Главный экран: прогресс ученика, уровень и учебная неделя'],
      ['zerostack-tracks.webp', 'Три направления: Frontend, Backend и Fullstack'],
    ],
    order: 11,
  },
]

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const cat = await payload.find({ collection: 'portfolio-categories', where: { slug: { equals: 'develop' } }, limit: 1, depth: 0, req })
  const catId = cat.docs[0]?.id

  for (const p of PETS) {
    const exists = await payload.find({ collection: 'projects', where: { slug: { equals: p.slug } }, limit: 1, depth: 0, req })
    if (exists.totalDocs) continue

    const media: { id: number | string; desc: string }[] = []
    for (const [file, desc] of p.shots) {
      try {
        const data = await readFile(path.join(process.cwd(), 'public', 'portfolio-seed', file))
        const m = await payload.create({
          collection: 'media',
          req,
          data: { alt: `${p.title}: ${desc}` } as any,
          file: { data, mimetype: 'image/webp', name: file, size: data.length },
        })
        media.push({ id: m.id, desc })
      } catch (e) {
        payload.logger.warn(`pet_projects: скриншот ${file} не загружен: ${String(e)}`)
      }
    }

    await payload.create({
      collection: 'projects',
      req,
      data: {
        title: p.title,
        slug: p.slug,
        client: p.client,
        categoryLabel: p.categoryLabel,
        year: p.year,
        duration: p.duration,
        technologies: p.technologies,
        url: p.url,
        excerpt: p.excerpt,
        cover: media[0]?.id,
        gallery: media.map((m) => ({ image: m.id })),
        media: media.map((m) => ({ image: m.id, desc: m.desc })),
        challenge: p.challenge,
        solution: p.solution,
        results: p.results.map(([value, label]) => ({ value, label })),
        categories: catId ? [catId] : [],
        isFeatured: false,
        order: p.order,
        publishedAt: new Date().toISOString(),
      } as any,
    })
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.delete({ collection: 'projects', where: { slug: { in: PETS.map((p) => p.slug) } }, req })
}
