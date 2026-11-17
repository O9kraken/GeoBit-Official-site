import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  PageBreak,
} from 'docx'
import type { DocModel } from './render'

/* Word-файл договора: A4, Times New Roman 12, пункты с номерами, реквизиты сторон в две колонки */

const F = 'Times New Roman'
const SZ = 24 // 12 pt
const t = (text: string, o: { bold?: boolean; italics?: boolean; size?: number } = {}) => new TextRun({ text, font: F, size: o.size || SZ, bold: o.bold, italics: o.italics })
const para = (children: TextRun[], o: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; before?: number; after?: number; indent?: number; hanging?: number; keepNext?: boolean } = {}) =>
  new Paragraph({
    children,
    alignment: o.align ?? AlignmentType.JUSTIFIED,
    spacing: { before: o.before ?? 0, after: o.after ?? 80, line: 264 },
    indent: o.indent !== undefined || o.hanging !== undefined ? { left: o.indent ?? 0, hanging: o.hanging } : undefined,
    keepNext: o.keepNext,
  })

const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE }

// A4 без полей: 11906 DXA, поля 1134 (2 см) слева и 850 справа → текст 9922
const TEXT_W = 9922
const COL = TEXT_W / 2

function partiesTable(m: DocModel, compact = false) {
  const cellW = { size: COL, type: WidthType.DXA }
  const pad = { top: 60, bottom: 40, left: 80, right: 160 }
  const info = (title: string, p: { title: string; lines: string[] }) =>
    new TableCell({
      width: cellW,
      margins: pad,
      children: [
        para([t(title, { bold: true })], { align: AlignmentType.LEFT, after: 60 }),
        para([t(p.title, { bold: true })], { align: AlignmentType.LEFT, after: 40 }),
        ...(compact ? [] : p.lines.map((l) => para([t(l, { size: 22 })], { align: AlignmentType.LEFT, after: 20 }))),
      ],
    })
  // подписи — отдельной строкой, чтобы линии стояли на одном уровне при разном объёме реквизитов
  const sign = (p: { sign: string }) =>
    new TableCell({
      width: cellW,
      margins: pad,
      children: [
        para([t(`_______________ / ${p.sign}`)], { align: AlignmentType.LEFT, before: 360, after: 0 }),
        para([t('подпись', { size: 18, italics: true })], { align: AlignmentType.LEFT, indent: 600, after: 0 }),
      ],
    })
  return new Table({
    width: { size: TEXT_W, type: WidthType.DXA },
    columnWidths: [COL, COL],
    borders: noBorders,
    rows: [
      new TableRow({ cantSplit: true, children: [info('Исполнитель', m.parties.executor), info('Заказчик', m.parties.client)] }),
      new TableRow({ cantSplit: true, children: [sign(m.parties.executor), sign(m.parties.client)] }),
    ],
  })
}

export async function contractDocx(m: DocModel): Promise<Buffer> {
  const body: (Paragraph | Table)[] = []
  if (m.draft) body.push(para([t('ПРОЕКТ', { bold: true, size: 20 })], { align: AlignmentType.RIGHT, after: 120 }))
  body.push(para([t(m.title, { bold: true, size: 28 })], { align: AlignmentType.CENTER, after: 40 }))
  if (m.subtitle) body.push(para([t(m.subtitle, { bold: true })], { align: AlignmentType.CENTER, after: 240 }))

  // город слева, дата справа — таблица без рамок, чтобы не зависеть от табуляции
  body.push(
    new Table({
      width: { size: TEXT_W, type: WidthType.DXA },
      columnWidths: [COL, COL],
      borders: noBorders,
      rows: [
        new TableRow({
          children: [
            new TableCell({ width: { size: COL, type: WidthType.DXA }, children: [para([t(`г. ${m.city}`)], { align: AlignmentType.LEFT, after: 0 })] }),
            new TableCell({ width: { size: COL, type: WidthType.DXA }, children: [para([t(m.date)], { align: AlignmentType.RIGHT, after: 0 })] }),
          ],
        }),
      ],
    }),
  )
  body.push(para([t(m.preamble)], { before: 240, after: 160, indent: 0 }))

  for (const s of m.sections) {
    body.push(para([t(`${s.no}. ${s.title.toUpperCase()}`, { bold: true })], { align: AlignmentType.CENTER, before: 200, after: 100, keepNext: true }))
    for (const c of s.clauses) {
      if (c.kind === 'num') body.push(para([t(`${c.no} `, { bold: true }), t(c.text)]))
      else if (c.kind === 'bullet') body.push(new Paragraph({ numbering: { reference: 'dash', level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { after: 40, line: 264 }, children: [t(c.text)] }))
      else body.push(para([t(c.text)]))
    }
  }
  body.push(partiesTable(m))

  // Приложение № 1
  body.push(new Paragraph({ children: [new PageBreak()] }))
  body.push(para([t(m.appendix.title, { size: 22 })], { align: AlignmentType.RIGHT, after: 240 }))
  body.push(para([t('ТЕХНИЧЕСКОЕ ЗАДАНИЕ И ГРАФИК ОПЛАТЫ', { bold: true })], { align: AlignmentType.CENTER, after: 200 }))
  body.push(para([t('1. Состав работ (услуг)', { bold: true })], { before: 120, keepNext: true }))
  m.appendix.scope.forEach((s, i) => body.push(para([t(`1.${i + 1}. `, { bold: true }), t(s)])))
  body.push(para([t('2. Основные условия', { bold: true })], { before: 160, keepNext: true }))
  m.appendix.terms.forEach((s, i) => body.push(para([t(`2.${i + 1}. `, { bold: true }), t(s)])))
  body.push(para([t('3. График оплаты', { bold: true })], { before: 160, keepNext: true }))
  m.appendix.payments.forEach((s, i) => body.push(para([t(`3.${i + 1}. `, { bold: true }), t(s)])))
  body.push(para([t('Подписи Сторон', { bold: true })], { align: AlignmentType.CENTER, before: 360, after: 120, keepNext: true }))
  body.push(partiesTable(m, true))

  const doc = new Document({
    creator: m.parties.executor.title,
    title: `${m.title} ${m.subtitle}`.trim(),
    styles: { default: { document: { run: { font: F, size: SZ } } } },
    numbering: {
      config: [{ reference: 'dash', levels: [{ level: 0, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 709, hanging: 283 } } } }] }],
    },
    sections: [
      {
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 850 } } },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ font: F, size: 18, children: [`Договор № ${m.number} · стр. `, PageNumber.CURRENT, ' из ', PageNumber.TOTAL_PAGES] })],
              }),
            ],
          }),
        },
        children: body,
      },
    ],
  })
  return Packer.toBuffer(doc)
}

/* ----------------------------- Акт ----------------------------- */

export type ActInput = {
  number: string
  date: string
  rows: { name: string; qty: number; unit: string; price: number }[]
  totalWords: string
  total: string
  statement: string[]
}

export async function actDocx(m: DocModel, a: ActInput): Promise<Buffer> {
  const W = [560, 4962, 900, 900, 1300, 1300]
  const cell = (text: string, w: number, o: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) =>
    new TableCell({ width: { size: w, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [para([t(text, { bold: o.bold, size: 22 })], { align: o.align ?? AlignmentType.LEFT, after: 0 })] })
  const money = (n: number) => `${Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ')},00`
  const head = ['№', 'Наименование работ (услуг)', 'Кол-во', 'Ед.', 'Цена, ₽', 'Сумма, ₽']
  const table = new Table({
    width: { size: TEXT_W, type: WidthType.DXA },
    columnWidths: W,
    rows: [
      new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, W[i], { bold: true, align: AlignmentType.CENTER })) }),
      ...a.rows.map(
        (r, i) =>
          new TableRow({
            cantSplit: true,
            children: [
              cell(String(i + 1), W[0], { align: AlignmentType.CENTER }),
              cell(r.name, W[1]),
              cell(String(r.qty), W[2], { align: AlignmentType.CENTER }),
              cell(r.unit, W[3], { align: AlignmentType.CENTER }),
              cell(money(r.price), W[4], { align: AlignmentType.RIGHT }),
              cell(money(r.price * r.qty), W[5], { align: AlignmentType.RIGHT }),
            ],
          }),
      ),
    ],
  })
  const body: (Paragraph | Table)[] = [
    para([t(`АКТ № ${a.number}`, { bold: true, size: 28 })], { align: AlignmentType.CENTER, after: 40 }),
    para([t('сдачи-приёмки выполненных работ (оказанных услуг)', { bold: true })], { align: AlignmentType.CENTER, after: 40 }),
    para([t(`по Договору № ${m.number} от ${m.date}`)], { align: AlignmentType.CENTER, after: 240 }),
    new Table({
      width: { size: TEXT_W, type: WidthType.DXA },
      columnWidths: [COL, COL],
      borders: noBorders,
      rows: [
        new TableRow({
          children: [
            new TableCell({ width: { size: COL, type: WidthType.DXA }, children: [para([t(`г. ${m.city}`)], { align: AlignmentType.LEFT, after: 0 })] }),
            new TableCell({ width: { size: COL, type: WidthType.DXA }, children: [para([t(a.date)], { align: AlignmentType.RIGHT, after: 0 })] }),
          ],
        }),
      ],
    }),
    para([t(m.preamble.replace(/заключили настоящий договор[\s\S]*$/, 'составили настоящий Акт о нижеследующем:'))], { before: 240, after: 160 }),
    para([t('1. Исполнитель выполнил (оказал), а Заказчик принял следующие работы (услуги):')], { after: 120 }),
    table,
    para([t('Итого: ', { bold: true }), t(a.totalWords)], { before: 160 }),
    para([t('НДС не облагается: Исполнитель применяет специальный налоговый режим «Налог на профессиональный доход».')]),
    ...a.statement.map((s, i) => para([t(`${i + 2}. ${s}`)])),
    para([t('Подписи Сторон', { bold: true })], { align: AlignmentType.CENTER, before: 360, after: 120, keepNext: true }),
    partiesTable(m, true),
  ]
  const doc = new Document({
    creator: m.parties.executor.title,
    title: `Акт № ${a.number} к Договору № ${m.number}`,
    styles: { default: { document: { run: { font: F, size: SZ } } } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 850 } } }, children: body }],
  })
  return Packer.toBuffer(doc)
}
