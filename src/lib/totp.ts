import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/** TOTP (RFC 6238): 6 цифр, шаг 30 секунд, SHA-1 — понимают Яндекс Ключ, Google Authenticator, 1Password и др. */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function newSecret(bytes = 20): string {
  const buf = randomBytes(bytes)
  let bits = 0
  let value = 0
  let out = ''
  for (const b of buf) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]
  return out
}

function base32Decode(s: string): Buffer {
  const clean = s.replace(/=+$/, '').replace(/\s+/g, '').toUpperCase()
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch)
    if (idx < 0) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

function hotp(key: Buffer, counter: number): string {
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  const h = createHmac('sha1', key).update(msg).digest()
  const off = h[h.length - 1] & 15
  const code = ((h[off] & 127) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3]
  return String(code % 1_000_000).padStart(6, '0')
}

/** Проверка кода; допускаем расхождение часов ±1 шаг (30 секунд) */
export function verifyTotp(secret: string, code: string, window = 1): boolean {
  const c = String(code || '').replace(/\D/g, '')
  if (c.length !== 6 || !secret) return false
  const key = base32Decode(secret)
  const step = Math.floor(Date.now() / 30_000)
  for (let w = -window; w <= window; w++) {
    const exp = Buffer.from(hotp(key, step + w))
    if (timingSafeEqual(exp, Buffer.from(c))) return true
  }
  return false
}

export const otpauthUri = (secret: string, account: string, issuer = 'GeoBit') =>
  `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`

/** Резервные коды: показываем один раз, храним только хэши */
export function newRecoveryCodes(n = 10): { plain: string[]; hashes: string[] } {
  const plain = Array.from({ length: n }, () => {
    const s = randomBytes(5).toString('hex').toUpperCase()
    return `${s.slice(0, 5)}-${s.slice(5)}`
  })
  return { plain, hashes: plain.map(hashCode) }
}
export const hashCode = (c: string) => createHash('sha256').update(String(c).replace(/[^0-9A-Z]/gi, '').toUpperCase()).digest('hex')
