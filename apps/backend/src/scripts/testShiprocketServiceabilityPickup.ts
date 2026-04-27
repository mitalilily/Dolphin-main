import * as dotenv from 'dotenv'
import path from 'path'
import { ShiprocketCourierService } from '../models/services/couriers/shiprocket.service'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const safeString = (value: unknown) => String(value || '').trim()
const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const logResult = (label: string, payload: any) => {
  console.log(`\n[Shiprocket Serviceability+Pickup Test] ${label}`)
  console.log(
    JSON.stringify(
      payload,
      (_key, value) => {
        if (typeof value === 'string' && value.length > 500) {
          return `${value.slice(0, 500)}...<trimmed>`
        }
        return value
      },
      2,
    ),
  )
}

async function main() {
  const shiprocket = new ShiprocketCourierService()
  const summary: Array<{ api: string; ok: boolean; message: string }> = []

  const runCheck = async (name: string, fn: () => Promise<any>) => {
    try {
      const response = await fn()
      summary.push({ api: name, ok: true, message: safeString(response?.message || 'OK') })
      logResult(name, response)
      return response
    } catch (error: any) {
      summary.push({ api: name, ok: false, message: safeString(error?.message || error) })
      console.error(`\n[Shiprocket Serviceability+Pickup Test] ${name} failed`)
      console.error(error?.message || error)
      return null
    }
  }

  await runCheck('login', () => shiprocket.login())

  const serviceabilityPayload = {
    pickup_postcode: toNumber(process.env.SHIPROCKET_TEST_PICKUP_POSTCODE, 122001),
    delivery_postcode: toNumber(process.env.SHIPROCKET_TEST_DELIVERY_POSTCODE, 110001),
    cod: toNumber(process.env.SHIPROCKET_TEST_COD, 0),
    weight: safeString(process.env.SHIPROCKET_TEST_WEIGHT) || '0.5',
    length: toNumber(process.env.SHIPROCKET_TEST_LENGTH, 10),
    breadth: toNumber(process.env.SHIPROCKET_TEST_BREADTH, 10),
    height: toNumber(process.env.SHIPROCKET_TEST_HEIGHT, 10),
    declared_value: toNumber(process.env.SHIPROCKET_TEST_DECLARED_VALUE, 1000),
  }

  await runCheck('courier-serviceability', () =>
    shiprocket.checkCourierServiceability(serviceabilityPayload),
  )

  const shipmentId = toNumber(process.env.SHIPROCKET_TEST_SHIPMENT_ID, 0)
  await runCheck('courier-generate-pickup', () =>
    shiprocket.generatePickup({
      shipment_id: [shipmentId],
    }),
  )

  const shouldRetry = safeString(process.env.SHIPROCKET_TEST_PICKUP_RETRY) === '1'
  if (shouldRetry) {
    await runCheck('courier-generate-pickup-retry', () =>
      shiprocket.generatePickup({
        shipment_id: [shipmentId],
        status: 'retry',
      }),
    )
  }

  console.log('\n[Shiprocket Serviceability+Pickup Test] Summary')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('[Shiprocket Serviceability+Pickup Test] Fatal error', error)
  process.exit(1)
})
