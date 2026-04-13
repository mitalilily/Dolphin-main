type UnknownRecord = Record<string, unknown>

const coerceString = (value: unknown) => {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

const pickFirst = (values: unknown[]) => {
  for (const value of values) {
    const str = coerceString(value)
    if (str) return str
  }
  return ''
}

const extractFromMessage = (message: unknown) => {
  if (typeof message !== 'string') return ''
  const normalized = message.trim()
  const otpMatch = normalized.match(/\b(\d{6})\b/)
  if (otpMatch?.[1]) return otpMatch[1]
  const verifyMatch = normalized.match(/\b([A-Z0-9]{8})\b/i)
  if (verifyMatch?.[1]) return verifyMatch[1]
  return ''
}

export const extractInlineCode = (response: UnknownRecord | undefined) => {
  if (!response) return ''

  const direct = pickFirst([
    response.otp,
    response.verificationToken,
    response.verification_code,
    response?.data && (response.data as UnknownRecord).otp,
    response?.data && (response.data as UnknownRecord).verificationToken,
    response?.data && (response.data as UnknownRecord).verification_code,
    response?.result && (response.result as UnknownRecord).otp,
    response?.result && (response.result as UnknownRecord).verificationToken,
  ])
  if (direct) return direct

  const message = pickFirst([response.message, response?.data && (response.data as UnknownRecord).message])
  const fromMessage = extractFromMessage(message)
  return fromMessage
}
