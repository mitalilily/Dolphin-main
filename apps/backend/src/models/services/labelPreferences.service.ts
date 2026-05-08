import { eq } from 'drizzle-orm'
import { db } from '../client'
import { labelPreferences } from '../schema/labelPreferences'

const PLATFORM_POWERED_BY = 'Dolphin Enterprise'
const LEGACY_POWERED_BY_PATTERN = /(?:mera\s*courier\s*wala|meracourierwala)/i

export const normalizePoweredBy = (value: unknown) => {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text || LEGACY_POWERED_BY_PATTERN.test(text)) return PLATFORM_POWERED_BY
  return text
}

const normalizePreferences = <T extends Record<string, any>>(prefs: T): T => ({
  ...prefs,
  powered_by: normalizePoweredBy(prefs.powered_by),
})

export const DEFAULT_PREFERENCES = {
  printer_type: 'thermal',
  char_limit: 25,
  max_items: 3,
  order_info: {
    orderId: true,
    invoiceNumber: true,
    orderDate: false,
    invoiceDate: false,
    orderBarcode: true,
    invoiceBarcode: true,
    declaredValue: true,
    cod: true,
    awb: true,
    terms: true,
  },
  shipper_info: {
    shipperPhone: true,
    gstin: true,
    shipperAddress: true,
    rtoAddress: false,
    sellerBrandName: true,
    brandLogo: true,
  },
  product_info: {
    itemName: true,
    productCost: true,
    productQuantity: true,
    skuCode: false,
    dimension: false,
    deadWeight: false,
    otherCharges: true,
  },
  brand_logo: null,
  powered_by: PLATFORM_POWERED_BY,
  created_at: new Date(),
  updated_at: new Date(),
}

export const labelPreferencesService = {
  async getByUser(userId: string) {
    const [prefs] = await db
      .select()
      .from(labelPreferences)
      .where(eq(labelPreferences.user_id, userId))

    if (prefs) return normalizePreferences(prefs)

    // Fallback defaults
    return normalizePreferences({
      id: null,
      user_id: userId,
      ...DEFAULT_PREFERENCES,
    })
  },

  async createOrUpdate(userId: string, data: any) {
    const payload = {
      ...data,
      powered_by: normalizePoweredBy(data?.powered_by),
    }

    const [existing] = await db
      .select()
      .from(labelPreferences)
      .where(eq(labelPreferences.user_id, userId))

    if (existing) {
      const [updated] = await db
        .update(labelPreferences)
        .set({ ...payload, updated_at: new Date() })
        .where(eq(labelPreferences.user_id, userId))
        .returning()
      return normalizePreferences(updated)
    } else {
      const [created] = await db
        .insert(labelPreferences)
        .values({ user_id: userId, ...DEFAULT_PREFERENCES, ...payload })
        .returning()
      return normalizePreferences(created)
    }
  },
}
