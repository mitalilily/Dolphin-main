import * as dotenv from 'dotenv'
import path from 'path'
import { IcarryService } from '../models/services/couriers/icarry.service'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const safePayload = (value: any): any => {
  if (value == null) return value
  if (Array.isArray(value)) return value.map((entry) => safePayload(entry))
  if (typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const [key, nested] of Object.entries(value)) {
      const lowered = key.toLowerCase()
      if (lowered.includes('token') || lowered.includes('key')) {
        out[key] = '[redacted]'
      } else {
        out[key] = safePayload(nested)
      }
    }
    return out
  }
  return value
}

async function main() {
  const pickupAddressId = Number(process.env.ICARRY_TEST_PICKUP_ADDRESS_ID || 0)
  const courierId = String(process.env.ICARRY_TEST_INTL_COURIER_ID || '').trim()
  const consigneeCountryCode = String(process.env.ICARRY_TEST_INTL_COUNTRY_CODE || 'US')
    .trim()
    .toUpperCase()

  if (!Number.isFinite(pickupAddressId) || pickupAddressId <= 0) {
    throw new Error('Set ICARRY_TEST_PICKUP_ADDRESS_ID with a valid pickup address id')
  }
  if (!courierId) {
    throw new Error(
      'Set ICARRY_TEST_INTL_COURIER_ID from /icarry/estimate/international response before booking',
    )
  }

  const service = new IcarryService()
  const payload = {
    pickup_address_id: pickupAddressId,
    courier_id: courierId,
    client_order_id: `INTL-${Date.now()}`,
    parcel: {
      type: 'Prepaid' as const,
      value: Number(process.env.ICARRY_TEST_PARCEL_VALUE || 1200),
      currency: 'INR' as const,
      contents: process.env.ICARRY_TEST_PARCEL_CONTENTS || 'Fashion Jewellery',
      dimensions: {
        length: Number(process.env.ICARRY_TEST_PARCEL_LENGTH || 10),
        breadth: Number(process.env.ICARRY_TEST_PARCEL_BREADTH || 4),
        height: Number(process.env.ICARRY_TEST_PARCEL_HEIGHT || 20),
        unit: 'cm' as const,
      },
      weight: {
        weight: Number(process.env.ICARRY_TEST_PARCEL_WEIGHT_GM || 1250),
        unit: 'gm' as const,
      },
    },
    consignee: {
      name: process.env.ICARRY_TEST_CONSIGNEE_NAME || 'John Doe',
      mobile: process.env.ICARRY_TEST_CONSIGNEE_MOBILE || '9876543210',
      address:
        process.env.ICARRY_TEST_CONSIGNEE_ADDRESS || '123 Main St, Downtown, Near Central Mall',
      city: process.env.ICARRY_TEST_CONSIGNEE_CITY || 'New York',
      pincode: process.env.ICARRY_TEST_CONSIGNEE_PINCODE || '10001',
      state: process.env.ICARRY_TEST_CONSIGNEE_STATE || 'New York',
      country_code: consigneeCountryCode,
    },
  }

  console.log('[iCarry International Shipment Test] Request payload')
  console.log(JSON.stringify(safePayload(payload), null, 2))

  const response = await service.bookInternationalShipment(payload)

  console.log('[iCarry International Shipment Test] Success')
  console.log(JSON.stringify(safePayload(response), null, 2))
}

main().catch((error: any) => {
  console.error('[iCarry International Shipment Test] Failed')
  console.error(
    JSON.stringify(
      {
        message: error?.message || String(error),
        response: safePayload(error?.response?.data || null),
      },
      null,
      2,
    ),
  )
  process.exit(1)
})
