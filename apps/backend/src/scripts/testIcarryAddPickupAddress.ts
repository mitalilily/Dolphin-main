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

const toAlphaSuffix = (seed: number) => {
  let n = Math.abs(seed)
  const chars: string[] = []
  for (let i = 0; i < 6; i += 1) {
    chars.push(String.fromCharCode(65 + (n % 26)))
    n = Math.floor(n / 26)
  }
  return chars.join('')
}

async function main() {
  const generatedNickname = `Pickup${toAlphaSuffix(Date.now())}`
  const payload = {
    nickname: String(process.env.ICARRY_TEST_PICKUP_NICKNAME || generatedNickname)
      .replace(/[^A-Za-z]/g, '')
      .slice(0, 24),
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

  if (!payload.nickname) throw new Error('ICARRY_TEST_PICKUP_NICKNAME resolved to empty nickname')

  const service = new IcarryService()
  const response = await service.addPickupAddress(payload as any)

  console.log('[iCarry Add Pickup Address Test] Success')
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
  console.error('[iCarry Add Pickup Address Test] Failed')
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
