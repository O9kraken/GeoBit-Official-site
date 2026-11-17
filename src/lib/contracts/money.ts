/** Сумма прописью для договора: 125 000 → «сто двадцать пять тысяч рублей 00 копеек» */

const ONES_M = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять']
const ONES_F = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять']
const TEENS = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать']
const TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто']
const HUNDREDS = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот']

/** Форма слова по числу: 1 рубль, 2 рубля, 5 рублей */
export const plural = (n: number, one: string, few: string, many: string) => {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return many
  if (b > 1 && b < 5) return few
  if (b === 1) return one
  return many
}

function triad(n: number, female: boolean): string {
  const out: string[] = []
  out.push(HUNDREDS[Math.floor(n / 100)])
  const t = n % 100
  if (t >= 10 && t < 20) out.push(TEENS[t - 10])
  else {
    out.push(TENS[Math.floor(t / 10)])
    out.push((female ? ONES_F : ONES_M)[t % 10])
  }
  return out.filter(Boolean).join(' ')
}

export function numberWords(n: number): string {
  n = Math.floor(Math.abs(n))
  if (n === 0) return 'ноль'
  const groups: [number, boolean, [string, string, string] | null][] = [
    [Math.floor(n / 1e9) % 1000, false, ['миллиард', 'миллиарда', 'миллиардов']],
    [Math.floor(n / 1e6) % 1000, false, ['миллион', 'миллиона', 'миллионов']],
    [Math.floor(n / 1e3) % 1000, true, ['тысяча', 'тысячи', 'тысяч']],
    [n % 1000, false, null],
  ]
  const parts: string[] = []
  for (const [v, female, forms] of groups) {
    if (!v) continue
    parts.push(triad(v, female))
    if (forms) parts.push(plural(v, ...forms))
  }
  return parts.join(' ')
}

export const rub = (n: number) => `${Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ')} ₽`

/** «125 000 (сто двадцать пять тысяч) рублей 00 копеек» */
export function rubFull(n: number): string {
  const r = Math.floor(n)
  const k = Math.round((n - r) * 100)
  const words = numberWords(r)
  return `${r.toLocaleString('ru-RU').replace(/ /g, ' ')} (${words}) ${plural(r, 'рубль', 'рубля', 'рублей')} ${String(k).padStart(2, '0')} ${plural(k, 'копейка', 'копейки', 'копеек')}`
}
