import * as dotenv from 'dotenv'
import path from 'path'
import { IcarryService } from '../models/services/couriers/icarry.service'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const summarizeEstimate = (estimate: any) => {
  if (Array.isArray(estimate)) return { type: 'array', count: estimate.length }
  if (estimate && typeof estimate === 'object') return { type: 'object', count: Object.keys(estimate).length }
  return { type: typeof estimate, count: 0 }
}

const safePayload = (value: any): any => {
  if (value == null) return value
  if (Array.isArray(value)) return value.map((entry) => safePayload(entry))
  if (typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const [key, nested] of Object.entries(value)) {
      if (key.toLowerCase().includes('token') || key.toLowerCase().includes('key')) {
        out[key] = '[redacted]'
      } else {
        out[key] = safePayload(nested)
      }
    }
    return out
  }
  return value
}

async function runCase(name: string, fn: () => Promise<any>) {
  try {
    const response = await fn()
    console.log(`\n[iCarry Estimate Test] ${name} - SUCCESS`)
    console.log(
      JSON.stringify(
        {
          success: response?.success,
          error: response?.error || '',
          estimateSummary: summarizeEstimate(response?.estimate),
        },
        null,
        2,
      ),
    )
    return { api: name, ok: true, message: String(response?.error || 'OK') }
  } catch (error: any) {
    console.log(`\n[iCarry Estimate Test] ${name} - FAILED`)
    console.log(
      JSON.stringify(
        {
          message: error?.message || String(error),
          response: safePayload(error?.response?.data || null),
        },
        null,
        2,
      ),
    )
    return { api: name, ok: false, message: String(error?.message || error) }
  }
}

async function main() {
  const service = new IcarryService()
  const summary = []

  summary.push(
    await runCase('estimate-single', async () =>
      service.getEstimateSingleShipment({
        length: 10,
        breadth: 10,
        height: 25,
        weight: 520,
        destination_pincode: '560068',
        origin_pincode: '400081',
        destination_country_code: 'IN',
        origin_country_code: 'IN',
        shipment_mode: 'E',
        shipment_type: 'P',
        shipment_value: 1000,
      }),
    ),
  )

  summary.push(
    await runCase('estimate-multi-box-b2b', async () =>
      service.getEstimateMultiBoxShipment({
        destination_pincode: '560068',
        origin_pincode: '400081',
        destination_country_code: 'IN',
        origin_country_code: 'IN',
        shipment_mode: 'E',
        shipment_type: 'P',
        shipment_value: 1000,
        boxes: [
          {
            quantity: 2,
            length: 10,
            breadth: 4,
            height: 20,
            dimension_unit: 'cm',
            weight: 20000,
            weight_unit: 'gm',
          },
          {
            quantity: 3,
            length: 10,
            breadth: 4,
            height: 20,
            dimension_unit: 'cm',
            weight: 30000,
            weight_unit: 'gm',
          },
        ],
      }),
    ),
  )

  summary.push(
    await runCase('estimate-international', async () =>
      service.getEstimateInternationalShipment({
        weight: 520,
        length: 10,
        breadth: 10,
        height: 25,
        origin_pincode: '400081',
        origin_country_code: 'IN',
        destination_country_code: 'US',
      }),
    ),
  )

  console.log('\n[iCarry Estimate Test] Summary')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('[iCarry Estimate Test] Fatal error', error)
  process.exit(1)
})
