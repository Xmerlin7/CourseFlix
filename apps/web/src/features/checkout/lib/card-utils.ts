export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'mada' | 'unknown'

const MADA_PREFIXES = ['588983', '636120', '401757', '445564', '543265', '604906', '968211']

export function detectBrand(value: string): CardBrand {
  const digits = value.replace(/\D/g, '')
  if (MADA_PREFIXES.some((prefix) => digits.startsWith(prefix))) return 'mada'
  if (/^3[47]/.test(digits)) return 'amex'
  if (/^(?:5[1-5]|2[2-7])/.test(digits)) return 'mastercard'
  if (/^4/.test(digits)) return 'visa'
  return 'unknown'
}

export function brandMinDigits(brand: CardBrand): number {
  if (brand === 'amex') return 15
  if (brand === 'visa') return 13
  return 16
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19)
  const groups = digits.match(/.{1,4}/g) ?? []
  return groups.join(' ')
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function isExpired(expiry: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry)
  if (!match) return true
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  if (month < 1 || month > 12) return true
  return year < now.getFullYear() || (year === now.getFullYear() && month < currentMonth)
}

export function isValidCardNumber(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  const brand = detectBrand(digits)
  if (digits.length < brandMinDigits(brand) || digits.length > 19) return false
  if (brand === 'amex' && digits.length !== 15) return false
  if (brand === 'mastercard' && digits.length !== 16) return false
  if (brand === 'mada' && digits.length !== 16) return false
  return true
}