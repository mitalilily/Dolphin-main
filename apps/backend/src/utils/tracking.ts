import { HttpError } from './classes'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const readFirstQueryValue = (value: unknown): string => {
  if (Array.isArray(value)) return readFirstQueryValue(value[0])
  return value === null || value === undefined ? '' : String(value)
}

export const normalizeAwb = (value: unknown): string =>
  readFirstQueryValue(value).trim().replace(/\s+/g, '').toUpperCase()

export const normalizeOrderNumber = (value: unknown): string => readFirstQueryValue(value).trim()

export const normalizePhoneDigits = (value: unknown): string => {
  const digits = readFirstQueryValue(value).replace(/\D/g, '')

  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)

  return digits
}

export const normalizeTrackingContact = (
  value: unknown,
): { raw: string; email?: string; phone?: string } => {
  const raw = readFirstQueryValue(value).trim()
  const email = raw.toLowerCase()

  if (EMAIL_REGEX.test(email)) {
    return { raw, email }
  }

  const phone = normalizePhoneDigits(raw)
  if (phone.length >= 7 && phone.length <= 15) {
    return { raw, phone }
  }

  throw new HttpError(400, 'Contact must be a valid email or phone number')
}

export type ParsedTrackingQuery =
  | { mode: 'awb'; awb: string }
  | { mode: 'order'; orderNumber: string; contact: string; email?: string; phone?: string }

export const parseTrackingQuery = (query: Record<string, unknown>): ParsedTrackingQuery => {
  const awb = normalizeAwb(query.awb)
  if (awb) return { mode: 'awb', awb }

  const orderNumber = normalizeOrderNumber(query.orderNumber)
  const contactValue = readFirstQueryValue(query.contact).trim()

  if (!orderNumber || !contactValue) {
    throw new HttpError(400, "Provide either 'awb' or ('orderNumber' with 'contact')")
  }

  const contact = normalizeTrackingContact(contactValue)

  return {
    mode: 'order',
    orderNumber,
    contact: contact.raw,
    email: contact.email,
    phone: contact.phone,
  }
}

const PROVIDER_ALIASES: Array<[string, string[]]> = [
  ['shiprocket', ['shiprocket', 'sr express', 'sr-express']],
  ['shipmozo', ['shipmozo', 'ship mozo']],
  ['icarry', ['icarry', 'i carry', 'i-carry']],
  ['truxcargo', ['truxcargo', 'trux cargo']],
  ['delhivery', ['delhivery']],
  ['ekart', ['ekart']],
  ['xpressbees', ['xpressbees', 'xpress bees', 'xpressbee']],
]

export const detectTrackingProviderKey = (value?: string | null): string | null => {
  const normalized = String(value || '').toLowerCase().trim()
  if (!normalized) return null

  for (const [provider, aliases] of PROVIDER_ALIASES) {
    if (aliases.some((alias) => normalized.includes(alias))) return provider
  }

  return null
}

export const resolveTrackingProviderKey = (
  integrationType?: string | null,
  courierPartner?: string | null,
): string => {
  return (
    detectTrackingProviderKey(courierPartner) ||
    detectTrackingProviderKey(integrationType) ||
    'delhivery'
  )
}

export const normalizeTrackingStatusCode = (value?: unknown): string => {
  const raw = String(value || '').trim()
  if (!raw) return 'PP'

  const compact = raw.toUpperCase().replace(/\s+/g, '-')
  if (['BK', 'PP', 'IT', 'OFD', 'DL', 'CAN', 'RT', 'RT-IT', 'RT-DL', 'EX'].includes(compact)) {
    return compact
  }

  const text = raw.toLowerCase()
  if (text.includes('cancel')) return 'CAN'
  if (text.includes('rto') && text.includes('deliver')) return 'RT-DL'
  if (text.includes('rto')) return 'RT'
  if (text.includes('delivered') || text === 'dl') return 'DL'
  if (text.includes('out for delivery') || text.includes('ofd')) return 'OFD'
  if (text.includes('exception') || text.includes('failed') || text.includes('ndr')) return 'EX'
  if (text.includes('transit') || text.includes('shipped') || text.includes('dispatch')) return 'IT'
  if (text.includes('pickup')) return 'PP'
  if (text.includes('book') || text.includes('created') || text.includes('manifest')) return 'BK'

  return compact.slice(0, 80)
}

export const getHttpStatusCode = (error: unknown, fallback = 500): number => {
  const err = error as {
    statusCode?: unknown
    status?: unknown
    response?: { status?: unknown }
  }
  const candidates = [err?.statusCode, err?.status, err?.response?.status]

  for (const candidate of candidates) {
    const status = Number(candidate)
    if (Number.isInteger(status) && status >= 400 && status < 600) return status
  }

  return fallback
}

