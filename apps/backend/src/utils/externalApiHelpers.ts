/**
 * External API Helper Functions
 * These utilities are used across external API controllers
 */

// Map integration types to opaque codes that don't reveal the provider
const PROVIDER_CODE_MAP: Record<string, string> = {
  delhivery: 'XC7K9',
  shipmozo: 'SM8Z2',
  shiprocket: 'SR4T6',
  truxcargo: 'TX9C4',
  icarry: 'IC6R3',
  icaarry: 'IC6R3',
}

// Reverse map: provider code -> integration type
const PROVIDER_CODE_REVERSE_MAP: Record<string, string> = {
  XC7K9: 'delhivery',
  SM8Z2: 'shipmozo',
  SR4T6: 'shiprocket',
  TX9C4: 'truxcargo',
  IC6R3: 'icarry',
}

/**
 * Generate an opaque provider code from integration_type
 * This hides the actual service provider from external API users
 * The code is opaque and cannot be reverse-engineered to determine the provider
 */
export const getOpaqueProviderCode = (integrationType: string | null | undefined): string => {
  const normalizedType = integrationType?.toLowerCase().trim() || 'delhivery'
  return PROVIDER_CODE_MAP[normalizedType] || 'XC7K9'
}

/**
 * Convert provider_code back to integration_type (for internal use only)
 * Used when external API users send provider_code in requests
 */
export const getIntegrationTypeFromProviderCode = (
  providerCode: string | null | undefined,
): 'delhivery' | 'shipmozo' | 'shiprocket' | 'truxcargo' | 'icarry' | null => {
  if (!providerCode) return null

  const normalizedCode = providerCode.trim().toUpperCase()
  const integrationType = PROVIDER_CODE_REVERSE_MAP[normalizedCode]

  if (integrationType) {
    const normalized = integrationType === 'icaarry' ? 'icarry' : integrationType
    return normalized as
      | 'delhivery'
      | 'shipmozo'
      | 'shiprocket'
      | 'truxcargo'
      | 'icarry'
  }

  return null
}
