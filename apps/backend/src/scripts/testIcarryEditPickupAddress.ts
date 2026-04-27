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
      if (lowered.includes('token') || lowered.includes('key')) out[key] = '[redacted]'
      else out[key] = safePayload(nested)
    }
    return out
  }
  return value
}

async function main() {
  const warehouseId = String(process.env.ICARRY_TEST_PICKUP_WAREHOUSE_ID || '').trim()
  if (!warehouseId) {
    throw new Error('Set ICARRY_TEST_PICKUP_WAREHOUSE_ID with an existing iCarry warehouse_id')
  }

  const payload = {
    warehouse_id: warehouseId,
    name: process.env.ICARRY_TEST_PICKUP_NAME || 'Pickup Contact',
    email: process.env.ICARRY_TEST_PICKUP_EMAIL || 'pickup@example.com',
    phone: process.env.ICARRY_TEST_PICKUP_PHONE || '9876543210',
    alt_phone: process.env.ICARRY_TEST_PICKUP_ALT_PHONE || '',
    street1: process.env.ICARRY_TEST_PICKUP_STREET1 || 'D1003 Purva Skywood, Silver County Road',
    street2: process.env.ICARRY_TEST_PICKUP_STREET2 || 'Near Shobha Cinnamon',
    locality: process.env.ICARRY_TEST_PICKUP_LOCALITY || 'HSR Layout',
    city: process.env.ICARRY_TEST_PICKUP_CITY || 'Bengaluru',
    pincode: process.env.ICARRY_TEST_PICKUP_PINCODE || '560068',
    zone_id: Number(process.env.ICARRY_TEST_PICKUP_ZONE_ID || 1489),
    country_id: process.env.ICARRY_TEST_PICKUP_COUNTRY_ID || '99',
  }

  const service = new IcarryService()
  const response = await service.editPickupAddress(payload as any)

  console.log('[iCarry Edit Pickup Address Test] Success')
  console.log(
    JSON.stringify(
      {
        request: safePayload(payload),
        response: safePayload(response),
      },
      null,
      2,
    ),
  )
}

main().catch((error: any) => {
  console.error('[iCarry Edit Pickup Address Test] Failed')
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
