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
  const pincode = String(process.env.ICARRY_TEST_PINCODE || '560068').trim()
  if (!pincode) throw new Error('Set ICARRY_TEST_PINCODE with a valid pincode')

  const service = new IcarryService()
  const response = await service.checkPincodeServiceability({ pincode })

  console.log('[iCarry Pincode Serviceability Test] Success')
  console.log(
    JSON.stringify(
      {
        pincode,
        success: response?.success,
        error: response?.error || '',
        msg: safePayload((response as any)?.msg ?? null),
      },
      null,
      2,
    ),
  )
}

main().catch((error: any) => {
  console.error('[iCarry Pincode Serviceability Test] Failed')
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
