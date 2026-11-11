/**
 * Анализ страницы для поиска (SEO), читаемости и ИИ-поиска (GEO/AEO).
 * Чистый TypeScript без зависимостей: работает и в админке (живая панель),
 * и на сервере (сводный SEO-аудит).
 */

export type Kind = 'post' | 'service' | 'project' | 'page' | 'term' | 'global'
export type Status = 'good' | 'ok' | 'bad'
export type Group = 'seo' | 'read' | 'ai'
export type Check = { id: string; group: Group; status: Status; title: string; tip?: string }

export type AnalysisInput = {
  kind: Kind
  /** Заголовок страницы (H1) */
  h1: string
  slug?: string
  metaTitle?: string
  metaDesc?: string
  focus?: string
  synonyms?: string
  hasImage?: boolean
  answer?: string
  faqCount?: number
  noindex?: boolean
  canonical?: string
  authorSet?: boolean
  updatedAt?: string
  /** Открыт ли сайт для ИИ-поисковиков (настройка «SEO и ИИ») */
  aiOpen?: boolean
  /** Сколько других страниц используют ту же ключевую фразу / тот же title */
  dupFocus?: number
  dupTitle?: number
  /** Сам документ (данные формы) — из него собирается текст */
  data: any
}

export type Extracted = {
  text: string
  words: string[]
  paragraphs: string[]
  firstPara: string
  headings: { level: number; text: string }[]
  linksInternal: number
  linksExternal: number
  lists: number
  tables: number
}

export type Analysis = {
  checks: Check[]
  scores: Record<Group, number>
  extracted: Extracted
  wordCount: number
  density: number
  readingEase: number | null
}

/* ---------------- текст ---------------- */

const SKIP_KEYS = new Set([
  'meta', 'seo', 'slug', 'id', '_status', 'createdAt', 'updatedAt', 'contentHtml', 'icon', 'anchor', 'number', 'wpId', 'wpPath',
  'url', 'publishedAt', 'order', 'readingTime', 'authorName', 'author', 'categories', 'tags', 'globalType', 'hoverVideo',
  'cover', 'image', 'images', 'gallery', 'filename', 'mimeType', 'sizes', 'blockType', 'blockName', 'seoBlockText', 'metrikaId',
])

const SITE_HOST = /(^|\.)getgeobit\.ru$/i

const isLexical = (v: any) => v && typeof v === 'object' && v.root && Array.isArray(v.root.children)

function lexText(n: any): string {
  if (!n) return ''
  if (n.type === 'text') return n.text || ''
  if (n.type === 'linebreak') return '\n'
  return Array.isArray(n.children) ? n.children.map(lexText).join('') : ''
}

function isInternalUrl(url: string) {
  if (!url) return false
  if (url.startsWith('/') || url.startsWith('#')) return true
  try {
    return SITE_HOST.test(new URL(url).hostname)
  } catch {
    return false
  }
}

export function extract(data: any): Extracted {
  const paragraphs: string[] = []
  const headings: { level: number; text: string }[] = []
  let linksInternal = 0
  let linksExternal = 0
  let lists = 0
  let tables = 0

  const walkLex = (n: any) => {
    if (!n) return
    switch (n.type) {
      case 'heading': {
        const t = lexText(n).trim()
        if (t) headings.push({ level: Number(String(n.tag || 'h2').slice(1)) || 2, text: t })
        return
      }
      case 'paragraph':
      case 'quote': {
        const t = lexText(n).trim()
        if (t) paragraphs.push(t)
        break
      }
      case 'list':
        lists++
        ;(n.children || []).forEach((li: any) => {
          const t = lexText(li).trim()
          if (t) paragraphs.push(t)
        })
        return
      case 'table':
        tables++
        break
      case 'link':
      case 'autolink': {
        const f = n.fields || {}
        if (f.linkType === 'internal' || isInternalUrl(f.url || n.url || '')) linksInternal++
        else linksExternal++
        break
      }
    }
    ;(n.children || []).forEach(walkLex)
  }

  const fromHtml = (html: string) => {
    for (const m of html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)) headings.push({ level: Number(m[1]), text: strip(m[2]) })
    for (const m of html.matchAll(/<a\s[^>]*href=["']([^"']+)["']/gi)) (isInternalUrl(m[1]) ? linksInternal++ : linksExternal++)
    lists += (html.match(/<(ul|ol)[\s>]/gi) || []).length
    tables += (html.match(/<table[\s>]/gi) || []).length
    const body = html.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, '\n\n')
    body
      .split(/<\/p>|<br\s*\/?>\s*<br\s*\/?>|<\/li>|\n{2,}/i)
      .map(strip)
      .filter(Boolean)
      .forEach((p) => paragraphs.push(p))
  }

  const walk = (v: any, key?: string) => {
    if (v == null || (key && SKIP_KEYS.has(key))) return
    if (typeof v === 'string') {
      const s = v.trim()
      // одиночные «технические» значения (классы иконок, ссылки, коды) — не текст
      if (s.length < 3 || (!/\s/.test(s) && !/[а-яё]/i.test(s))) return
      if (/<[a-z][\s\S]*>/i.test(s)) fromHtml(s)
      else s.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean).forEach((p) => paragraphs.push(p))
      return
    }
    if (Array.isArray(v)) return v.forEach((x) => walk(x))
    if (typeof v === 'object') {
      if (isLexical(v)) return (v.root.children || []).forEach(walkLex)
      if (v.filename || v.mimeType) return // загруженный файл
      for (const [k, x] of Object.entries(v)) walk(x, k)
    }
  }
  walk(data)

  const text = paragraphs.join('\n\n')
  const words = tokenize(text)
  const firstPara = paragraphs.find((p) => tokenize(p).length >= 8) || paragraphs[0] || ''
  return { text, words, paragraphs, firstPara, headings, linksInternal, linksExternal, lists, tables }
}

export const strip = (s: string) =>
  s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const tokenize = (s: string) => (s.toLowerCase().replace(/ё/g, 'е').match(/[a-zа-я0-9]+(?:-[a-zа-я0-9]+)*/g) || []) as string[]

/* ---------------- ключевая фраза ---------------- */

const STOP = new Set('в во на и или для с со по о об от до из к ко у за а но же ли как что это под над при про без the a an of to in for and or'.split(' '))

/** Грубый стемминг для русского: отрезаем окончание, чтобы «сайт», «сайта», «сайтов» совпадали */
export const stem = (w: string) => (w.length > 6 ? w.slice(0, -3) : w.length > 4 ? w.slice(0, -2) : w.length > 3 ? w.slice(0, -1) : w)

export const keyStems = (phrase?: string) => tokenize(phrase || '').filter((w) => !STOP.has(w)).map(stem)

/** Сколько раз фраза встречается в тексте: все её слова в окне длиной (N + 3) */
export function countPhrase(words: string[], stems: string[]): number {
  if (!stems.length) return 0
  const win = stems.length + 3
  let count = 0
  for (let i = 0; i < words.length; i++) {
    if (!words[i].startsWith(stems[0])) continue
    const slice = words.slice(Math.max(0, i - 3), i + win)
    if (stems.every((s) => slice.some((w) => w.startsWith(s)))) {
      count++
      i += stems.length - 1
    }
  }
  return count
}

export const containsPhrase = (text: string, stems: string[]) => stems.length > 0 && countPhrase(tokenize(text), stems) > 0

const TR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}
export const translit = (s: string) => s.toLowerCase().split('').map((c) => TR[c] ?? c).join('')

/** Разные схемы транслита (sajt / sayt, kh / h, ts / c) приводим к одной */
const normLat = (s: string) => s.toLowerCase().replace(/shch|sch/g, 'sh').replace(/kh/g, 'h').replace(/ts/g, 'c').replace(/j/g, 'y').replace(/w/g, 'v').replace(/[^a-z0-9]/g, '')

function inSlug(slug: string, phrase: string) {
  const s = normLat(slug || '')
  const parts = tokenize(phrase).filter((w) => !STOP.has(w))
  if (!s || !parts.length) return false
  // для каждого слова фразы ищем в адресе первые 4 буквы транслита (латинские слова — как есть)
  const hits = parts.filter((w) => s.includes(normLat(translit(w)).slice(0, 4)))
  return hits.length >= Math.ceil(parts.length / 2)
}

/* ---------------- читаемость ---------------- */

const syllables = (w: string) => (w.match(/[аеиоуыэюяaeiouy]/g) || []).length || 1
const sentencesOf = (text: string) => text.split(/(?<=[.!?…])\s+|\n+/).map((s) => s.trim()).filter((s) => tokenize(s).length > 0)

/** Индекс удобочитаемости Флеша, адаптированный для русского (Оборнева) */
export function readingEase(text: string): number | null {
  const words = tokenize(text).filter((w) => /[а-яa-z]/.test(w))
  const sents = sentencesOf(text)
  if (words.length < 60 || !sents.length) return null
  const asl = words.length / sents.length
  const asw = words.reduce((n, w) => n + syllables(w), 0) / words.length
  return Math.round(Math.max(0, Math.min(100, 206.835 - 1.52 * asl - 65.14 * asw)))
}

/* ---------------- проверки ---------------- */

const KIND_LABEL: Record<Kind, string> = { post: 'статьи', service: 'услуги', project: 'кейса', page: 'страницы', term: 'рубрики', global: 'страницы' }

export function analyze(inp: AnalysisInput): Analysis {
  const ex = extract(inp.data)
  const checks: Check[] = []
  const add = (group: Group, id: string, status: Status, title: string, tip?: string) => checks.push({ id, group, status, title, tip })
  const wc = ex.words.length
  const isPost = inp.kind === 'post'
  const minWords = isPost ? 600 : inp.kind === 'term' || inp.kind === 'project' || inp.kind === 'global' ? 150 : 300
  const title = (inp.metaTitle || '').trim()
  const desc = (inp.metaDesc || '').trim()
  const focus = (inp.focus || '').trim()
  const stems = keyStems(focus)
  const synStems = (inp.synonyms || '')
    .split(',')
    .map((s) => keyStems(s))
    .filter((s) => s.length)
  const anyPhrase = (text: string) => containsPhrase(text, stems) || synStems.some((s) => containsPhrase(text, s))

  /* ---- SEO ---- */
  if (inp.noindex) add('seo', 'noindex', 'bad', 'Страница закрыта от поисковиков', 'Включена галочка «Не индексировать». Если страница должна быть в поиске — снимите её.')

  if (!focus) {
    add('seo', 'focus', 'bad', 'Не задана ключевая фраза', 'Впишите запрос, по которому страницу должны находить, например «создание сайта в Севастополе». Без неё половина проверок не работает.')
  } else {
    const n = tokenize(focus).length
    if (n > 5) add('seo', 'focusLen', 'ok', `Ключевая фраза длинная: ${n} слов`, 'Люди редко ищут фразами длиннее 4–5 слов. Сократите до сути.')
    if (inp.dupFocus) add('seo', 'focusDup', 'bad', `Эта ключевая фраза уже используется ещё на ${inp.dupFocus} стр.`, 'Две страницы с одной фразой конкурируют друг с другом в поиске. Выберите для этой страницы другой запрос.')

    add('seo', 'kwTitle', anyPhrase(title || inp.h1) ? 'good' : 'bad',
      anyPhrase(title || inp.h1) ? 'Ключевая фраза есть в title' : 'Ключевой фразы нет в title', 'Title — самый сильный сигнал для поиска. Лучше ставить фразу ближе к началу.')
    add('seo', 'kwDesc', anyPhrase(desc) ? 'good' : 'bad',
      anyPhrase(desc) ? 'Ключевая фраза есть в описании' : 'Ключевой фразы нет в описании', 'Поисковик выделяет совпадения жирным в сниппете — это повышает кликабельность.')
    add('seo', 'kwH1', anyPhrase(inp.h1) ? 'good' : 'ok',
      anyPhrase(inp.h1) ? 'Ключевая фраза есть в заголовке H1' : 'Ключевой фразы нет в заголовке H1', 'Заголовок на странице подтверждает поисковику, о чём она.')
    if (inp.slug != null)
      add('seo', 'kwSlug', inSlug(inp.slug, focus) ? 'good' : 'ok',
        inSlug(inp.slug, focus) ? 'Ключевая фраза есть в адресе' : 'Ключевой фразы нет в адресе страницы', 'Например, /sozdanie-sajta-sevastopol/. Меняйте адрес только у новых страниц — старый адрес лучше не трогать или настроить редирект.')
    add('seo', 'kwFirst', anyPhrase(ex.firstPara) ? 'good' : 'ok',
      anyPhrase(ex.firstPara) ? 'Ключевая фраза есть в первом абзаце' : 'Ключевой фразы нет в первом абзаце', 'Скажите в первых строках, о чём страница, — это читают и люди, и роботы.')

    const occ = countPhrase(ex.words, stems) + synStems.reduce((n, s) => n + countPhrase(ex.words, s), 0)
    const density = wc ? (occ * Math.max(1, stems.length) * 100) / wc : 0
    if (wc >= 100) {
      if (density > 3.5) add('seo', 'density', 'bad', `Переспам: фраза встречается ${occ} раз (${density.toFixed(1)}%)`, 'Яндекс и Google понижают переоптимизированные тексты. Замените часть упоминаний синонимами.')
      else if (density < 0.4) add('seo', 'density', 'ok', `Ключевая фраза встречается редко: ${occ} раз`, 'Упомяните её ещё 1–3 раза естественно, в тексте и подзаголовках.')
      else add('seo', 'density', 'good', `Ключевая фраза встречается ${occ} раз — в меру`)
    }
    if (isPost && ex.headings.some((h) => h.level >= 2)) {
      const inH = ex.headings.filter((h) => h.level >= 2 && anyPhrase(h.text)).length
      add('seo', 'kwH2', inH ? 'good' : 'ok', inH ? `Ключевая фраза есть в ${inH} подзаголовк.` : 'Ключевой фразы нет в подзаголовках', 'Используйте фразу или синонимы хотя бы в одном H2.')
    }
  }

  if (!title) add('seo', 'title', 'bad', 'Не заполнен title', 'Без него поисковик возьмёт заголовок сам, и обычно хуже. Нажмите «Взять из заголовка» и допишите.')
  else if (title.length < 30) add('seo', 'title', 'ok', `Title короткий: ${title.length} симв.`, 'Добавьте уточнение: город, выгоду, цену. Оптимально 40–60 символов.')
  else if (title.length > 65) add('seo', 'title', 'ok', `Title длинный: ${title.length} симв.`, 'В выдаче хвост обрежется троеточием. Оптимально 40–60 символов.')
  else add('seo', 'title', 'good', `Длина title в норме: ${title.length} симв.`)
  if (inp.dupTitle) add('seo', 'titleDup', 'bad', `Такой же title ещё у ${inp.dupTitle} стр.`, 'У каждой страницы title должен быть уникальным.')

  if (!desc) add('seo', 'desc', 'bad', 'Не заполнено описание (description)', 'Это текст под ссылкой в выдаче. Нажмите «Собрать из текста» и отредактируйте.')
  else if (desc.length < 100) add('seo', 'desc', 'ok', `Описание короткое: ${desc.length} симв.`, 'Оптимально 120–160 символов: выгода + призыв к действию.')
  else if (desc.length > 170) add('seo', 'desc', 'ok', `Описание длинное: ${desc.length} симв.`, 'Поисковик обрежет текст после ~160 символов.')
  else add('seo', 'desc', 'good', `Длина описания в норме: ${desc.length} симв.`)

  if (wc < minWords * 0.5) add('seo', 'length', inp.kind === 'global' ? 'ok' : 'bad', `Мало текста: ${wc} слов`, `Для ${KIND_LABEL[inp.kind]} желательно от ${minWords} слов — иначе поисковику не за что зацепиться.`)
  else if (wc < minWords) add('seo', 'length', 'ok', `Текста немного: ${wc} слов`, `Для ${KIND_LABEL[inp.kind]} хорошо от ${minWords} слов.`)
  else add('seo', 'length', 'good', `Объём текста хороший: ${wc} слов`)

  if (isPost || inp.kind === 'service') {
    add('seo', 'linksIn', ex.linksInternal ? 'good' : isPost ? 'bad' : 'ok',
      ex.linksInternal ? `Внутренних ссылок: ${ex.linksInternal}` : 'Нет ссылок на другие страницы сайта', 'Ссылки на услуги и статьи помогают роботу найти страницы и передают им вес.')
  }
  if (isPost) add('seo', 'linksOut', ex.linksExternal ? 'good' : 'ok', ex.linksExternal ? `Ссылок на источники: ${ex.linksExternal}` : 'Нет ссылок на внешние источники', 'Ссылка на авторитетный источник (закон, исследование) повышает доверие.')
  add('seo', 'image', inp.hasImage ? 'good' : 'ok', inp.hasImage ? 'Картинка для соцсетей есть' : 'Нет картинки для соцсетей', 'Без неё ссылка в Telegram и ВК будет без превью.')
  if (inp.canonical) add('seo', 'canonical', 'ok', 'Задан другой канонический адрес', 'Поисковик будет считать главной копией указанную страницу, а эту — дублем.')

  /* ---- Читаемость ---- */
  const ease = readingEase(ex.text)
  if (wc >= 120) {
    const sents = sentencesOf(ex.text)
    const longS = sents.filter((s) => tokenize(s).length > 20).length
    const share = sents.length ? Math.round((longS * 100) / sents.length) : 0
    add('read', 'sent', share > 30 ? 'bad' : share > 20 ? 'ok' : 'good',
      share > 20 ? `Длинных предложений (больше 20 слов): ${share}%` : 'Предложения короткие и понятные', 'Делите длинные предложения на два. Хорошо, когда длинных не больше 20%.')
    const longP = ex.paragraphs.filter((p) => tokenize(p).length > 120).length
    add('read', 'para', longP ? 'ok' : 'good', longP ? `Слишком длинных абзацев: ${longP}` : 'Абзацы удобной длины', 'Абзац больше 120 слов на телефоне превращается в «простыню».')
    if (isPost || inp.kind === 'page') {
      const h = ex.headings.filter((x) => x.level >= 2).length
      const need = Math.floor(wc / 350)
      add('read', 'subh', h >= need ? 'good' : 'ok', h >= need ? `Подзаголовков достаточно: ${h}` : `Мало подзаголовков: ${h}, нужно около ${need}`, 'Подзаголовок каждые 250–350 слов помогает дочитать и попасть в «содержание» выдачи.')
    }
    if (ease != null) {
      // для русского текста шкала ниже, чем для английского: 40+ — норма для сайта услуг
      add('read', 'ease', ease >= 40 ? 'good' : ease >= 20 ? 'ok' : 'bad',
        `Простота текста: ${ease} из 100 (${ease >= 60 ? 'легко' : ease >= 40 ? 'нормально' : ease >= 20 ? 'сложновато' : 'тяжело'})`, 'Короткие слова и предложения читаются легче. Для сайта услуг цель — от 40.')
    }
    if (ex.lists + ex.tables === 0 && wc > 300) add('read', 'lists', 'ok', 'В тексте нет списков', 'Перечисления удобнее читать списком.')
  } else {
    add('read', 'short', 'ok', 'Текста слишком мало для оценки читаемости')
  }

  /* ---- ИИ-поиск (GEO / AEO) ---- */
  if (inp.aiOpen === false) add('ai', 'bots', 'bad', 'Сайт закрыт для ИИ-поисковиков', 'В «SEO и ИИ» запрещены ИИ-поисковики: ChatGPT, Perplexity и Алиса не смогут цитировать сайт.')
  else if (inp.aiOpen) add('ai', 'bots', 'good', 'Сайт открыт для ИИ-поисковиков')

  const ans = (inp.answer || '').trim()
  const aw = tokenize(ans).length
  const wantAnswer = isPost || inp.kind === 'service'
  if (!ans) add('ai', 'answer', wantAnswer ? 'bad' : 'ok', 'Нет короткого ответа', 'Ответ в 2–3 предложения на главный вопрос страницы. Именно такие фрагменты ИИ-ассистенты и «быстрые ответы» Яндекса берут в выдачу.')
  else if (aw < 20 || aw > 80) add('ai', 'answer', 'ok', `Короткий ответ: ${aw} слов`, 'Оптимально 30–60 слов: достаточно, чтобы ответить, и мало, чтобы процитировали целиком.')
  else add('ai', 'answer', 'good', `Короткий ответ есть: ${aw} слов`)
  if (ans && focus && !anyPhrase(ans)) add('ai', 'answerKw', 'ok', 'В коротком ответе нет ключевой фразы', 'Ответ должен прямо отвечать на запрос — повторите в нём фразу.')

  const fc = inp.faqCount || 0
  add('ai', 'faq', fc >= 3 ? 'good' : fc ? 'ok' : wantAnswer ? 'bad' : 'ok',
    fc ? `Вопросов в FAQ: ${fc}` : 'Нет блока «Вопросы и ответы»', 'Вопросы так, как их задают люди («Сколько стоит…?»). Сайт размечает их для Google, Яндекса и ИИ.')

  if (isPost) {
    const qh = ex.headings.filter((h) => /\?\s*$/.test(h.text)).length
    add('ai', 'qHeads', qh ? 'good' : 'ok', qh ? `Подзаголовков-вопросов: ${qh}` : 'Нет подзаголовков в форме вопроса', 'Подзаголовок «Сколько стоит лендинг?» + ответ в первом предложении под ним — любимый формат ИИ-выдачи.')
    add('ai', 'author', inp.authorSet ? 'good' : 'bad', inp.authorSet ? 'Указан автор' : 'Не выбран автор статьи', 'Выберите автора с фото и подписью: ИИ и поисковики больше доверяют текстам с понятным экспертом.')
    if (inp.updatedAt) {
      const days = (Date.now() - new Date(inp.updatedAt).getTime()) / 86400000
      add('ai', 'fresh', days < 365 ? 'good' : 'ok', days < 365 ? 'Статья обновлялась в последний год' : 'Статья не обновлялась больше года', 'ИИ-поиск предпочитает свежие материалы. Обновите цифры и цены.')
    }
  }
  const nums = (ex.text.match(/\d[\d\s]*(?:[.,]\d+)?\s*(?:%|₽|руб|дн|час|лет|год|мин)/gi) || []).length
  if (wc >= 100) add('ai', 'facts', nums >= 3 ? 'good' : 'ok', nums >= 3 ? `Конкретных цифр в тексте: ${nums}` : 'Мало конкретики: цен, сроков, цифр', 'ИИ цитирует факты: «лендинг от 29 900 ₽ за 7 дней» лучше, чем «недорого и быстро».')
  if (wc >= 100 && (isPost || inp.kind === 'service')) add('ai', 'structure', ex.lists + ex.tables ? 'good' : 'ok', ex.lists + ex.tables ? 'Есть списки или таблицы' : 'Нет списков и таблиц', 'Структурированные блоки ИИ легче вытаскивает в ответ.')
  const all = `${inp.h1} ${ex.text} ${ans}`
  const brand = /geobit|геобит/i.test(all)
  const geo = /севастопол|крым/i.test(all)
  if (wc >= 50) add('ai', 'entity', brand && geo ? 'good' : 'ok', brand && geo ? 'Упомянуты бренд и город' : !brand ? 'В тексте нет названия GeoBit' : 'В тексте нет города (Севастополь, Крым)', 'Так ИИ связывает страницу с компанией и регионом и показывает её на запросы «…в Севастополе».')

  const scores = { seo: 0, read: 0, ai: 0 } as Record<Group, number>
  for (const g of ['seo', 'read', 'ai'] as Group[]) {
    const list = checks.filter((c) => c.group === g)
    scores[g] = list.length ? Math.round((list.reduce((n, c) => n + (c.status === 'good' ? 1 : c.status === 'ok' ? 0.5 : 0), 0) * 100) / list.length) : 0
  }
  const occAll = stems.length ? countPhrase(ex.words, stems) : 0
  return { checks, scores, extracted: ex, wordCount: wc, density: wc ? (occAll * Math.max(1, stems.length) * 100) / wc : 0, readingEase: ease }
}

/** Описание из текста: первый внятный абзац, обрезанный по словам до ~155 символов */
export function suggestDescription(data: any, max = 155): string {
  const ex = extract(data)
  const src = ex.paragraphs.find((p) => p.length > 60) || ex.firstPara || ''
  if (src.length <= max) return src
  const cut = src.slice(0, max)
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:—-]\s*$/, '') + '…'
}

export const scoreColor = (n: number) => (n >= 75 ? '#16a34a' : n >= 45 ? '#f59e0b' : '#dc2626')
