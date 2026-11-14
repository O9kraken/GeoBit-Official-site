// Собирает основной CSS сайта: style.css + geobit.css → убирает неиспользуемые правила → сжимает.
// Результат: public/legacy/css/site.min.css (подключается в layout).
// Запуск: npm run css (и автоматически перед сборкой в Dockerfile).
// Правите стили — правьте style.css / geobit.css, а не site.min.css.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { PurgeCSS } from 'purgecss'
import { transform } from 'lightningcss'

const root = new URL('..', import.meta.url).pathname
const CSS = ['public/legacy/css/style.css', 'public/legacy/css/geobit.css']
const OUT = 'public/legacy/css/site.min.css'

function walk(dir, exts, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      if (name === 'node_modules' || name.startsWith('.')) continue
      walk(p, exts, acc)
    } else if (exts.some((e) => name.endsWith(e))) acc.push(p)
  }
  return acc
}

// где могут встретиться классы: компоненты, контент, скрипты старой темы
const content = [
  ...walk(join(root, 'src'), ['.tsx', '.ts', '.css']),
  ...walk(join(root, 'public/legacy/js'), ['.js']),
  ...walk(join(root, 'public/legacy/calculator'), ['.js']),
]

// теги из текстов статей и редактора — оставляем всегда
const TAGS =
  'html body main header footer nav section article aside div span p a b i em strong small mark sup sub ul ol li dl dt dd h1 h2 h3 h4 h5 h6 blockquote figure figcaption img picture video iframe table thead tbody tfoot tr th td caption hr br pre code kbd details summary button input textarea select option label form fieldset legend svg path canvas'

// классы из HTML, который лежит в базе (макеты услуг и т.п.) — список собран из базы
const dbClasses = readFileSync(join(root, 'scripts/css-safelist.txt'), 'utf8')
  .split('\n')
  .filter((l) => l && !l.startsWith('#'))
  .join(' ')

const css = CSS.map((f) => readFileSync(join(root, f), 'utf8')).join('\n')

const [res] = await new PurgeCSS().purge({
  content: content.map((file) => ({ raw: readFileSync(file, 'utf8'), extension: file.split('.').pop() })).concat([{ raw: TAGS + ' ' + dbClasses, extension: 'html' }]),
  css: [{ raw: css }],
  // классы, которые собираются из кусочков или ставятся скриптами
  safelist: {
    standard: [/^is-/, /^fb\d/, /^sb-/, /^has-/, /^aos-/, /^gb-tone-/, /^fa-/, /active$/, /open$/, /visible$/, /hidden$/, /show$/, /scrolled$/, /loaded$/],
    greedy: [/--/, /data-theme/, /gb-in-preview/, /swiper/, /lh-/],
  },
  defaultExtractor: (s) => s.match(/[\w-/:%.]+(?<!:)/g) || [],
  fontFace: false,
  keyframes: false,
  variables: false,
})

const { code } = transform({
  filename: 'site.css',
  code: Buffer.from(res.css),
  minify: true,
  targets: { chrome: 100 << 16, safari: 15 << 16, firefox: 100 << 16 },
  errorRecovery: true,
})

writeFileSync(join(root, OUT), '/* Сгенерировано scripts/build-css.mjs из style.css и geobit.css — не править вручную */\n' + code.toString())
console.log(`site.min.css: ${(css.length / 1024).toFixed(0)} КБ → ${(code.length / 1024).toFixed(0)} КБ`)
