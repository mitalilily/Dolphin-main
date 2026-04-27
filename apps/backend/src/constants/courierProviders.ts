export const KNOWN_COURIER_PROVIDERS = [
  'delhivery',
  'shipway',
  'xpressbees',
  'ekart',
  'shipmozo',
  'shiprocket',
  'juxcargo',
  'icarry',
] as const

export const ADMIN_SUPPORTED_COURIER_PROVIDERS = [
  'delhivery',
  'ekart',
  'xpressbees',
  'shipmozo',
  'shiprocket',
  'juxcargo',
  'icarry',
] as const

export type KnownCourierProvider = (typeof KNOWN_COURIER_PROVIDERS)[number]
