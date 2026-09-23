/** Возвращает 10 цифр российского номера без кода страны или null, если номер некорректный */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) return digits.slice(1)
  if (digits.length === 10) return digits
  return null
}

export const formatPhone = (d: string): string =>
  `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}`

export function telHref(phone: string): string {
  const d = normalizePhone(phone)
  return d ? `tel:+7${d}` : `tel:${phone.replace(/[^\d+]/g, '')}`
}
