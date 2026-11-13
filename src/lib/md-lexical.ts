/**
 * Мини-markdown → Lexical (формат текстов Payload): ## и ### — подзаголовки, «- » — список,
 * «1. » — нумерованный список, **жирный**, [текст](ссылка). Абзацы — через пустую строку.
 */
const textNode = (text: string, format = 0) => ({ type: 'text', text, format, mode: 'normal', style: '', detail: 0, version: 1 })

function inline(src: string): any[] {
  const out: any[] = []
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(textNode(src.slice(last, m.index)))
    if (m[1]) out.push(textNode(m[1], 1))
    else
      out.push({
        type: 'link',
        id: `gbl${Date.now().toString(36)}${i++}`,
        fields: { url: m[3], newTab: false, linkType: 'custom' },
        children: [textNode(m[2])],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 3,
      })
    last = m.index + m[0].length
  }
  if (last < src.length) out.push(textNode(src.slice(last)))
  return out
}

const block = (type: string, children: any[], extra: Record<string, unknown> = {}) => ({ type, children, direction: 'ltr', format: '', indent: 0, version: 1, ...extra })

export function toLexical(md: string) {
  const children: any[] = []
  for (const raw of md.trim().split(/\n\s*\n/)) {
    const b = raw.trim()
    const lines = b.split('\n').map((l) => l.trim())
    if (b.startsWith('### ')) children.push(block('heading', inline(b.slice(4)), { tag: 'h3' }))
    else if (b.startsWith('## ')) children.push(block('heading', inline(b.slice(3)), { tag: 'h2' }))
    else if (lines.every((l) => l.startsWith('- ')))
      children.push(
        block('list', lines.map((l, i) => block('listitem', inline(l.slice(2)), { value: i + 1 })), { listType: 'bullet', tag: 'ul', start: 1 }),
      )
    else if (lines.every((l) => /^\d+\.\s/.test(l)))
      children.push(
        block('list', lines.map((l, i) => block('listitem', inline(l.replace(/^\d+\.\s/, '')), { value: i + 1 })), { listType: 'number', tag: 'ol', start: 1 }),
      )
    else children.push(block('paragraph', inline(lines.join(' ')), { textFormat: 0, textStyle: '' }))
  }
  return { root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 } }
}

