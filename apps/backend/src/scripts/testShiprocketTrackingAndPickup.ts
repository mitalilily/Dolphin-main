import * as dotenv from 'dotenv'
import path from 'path'
import { ShiprocketCourierService } from '../models/services/couriers/shiprocket.service'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const safeString = (value: unknown) => String(value || '').trim()

const logResult = (label: string, payload: any) => {
  console.log(`\n[Shiprocket Tracking+Pickup Test] ${label}`)
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
      console.error(`\n[Shiprocket Tracking+Pickup Test] ${name} failed`)
      console.error(error?.message || error)
      return null
    }
  }

  await runCheck('login', () => shiprocket.login())

  await runCheck('track-by-shipment-id', () =>
    shiprocket.trackByShipmentId(safeString(process.env.SHIPROCKET_TEST_TRACK_SHIPMENT_ID) || '16104408'),
  )

  await runCheck('track-by-order-id', () =>
    shiprocket.trackByOrderId({
      order_id: safeString(process.env.SHIPROCKET_TEST_TRACK_ORDER_ID) || '123',
      channel_id: safeString(process.env.SHIPROCKET_TEST_TRACK_CHANNEL_ID) || undefined,
    }),
  )

  await runCheck('pickup-locations', () => shiprocket.getPickupLocations())

  const shouldAddPickup = safeString(process.env.SHIPROCKET_TEST_ADD_PICKUP) === '1'
  if (shouldAddPickup) {
    const uniqueSuffix = `${Date.now()}`.slice(-6)
    await runCheck('add-pickup-location', () =>
      shiprocket.addPickupLocation({
        pickup_location: safeString(process.env.SHIPROCKET_TEST_PICKUP_LOCATION_NAME) || `APIHome${uniqueSuffix}`,
        name: safeString(process.env.SHIPROCKET_TEST_PICKUP_NAME) || 'API User',
        email: safeString(process.env.SHIPROCKET_TEST_PICKUP_EMAIL) || 'api.user@example.com',
        phone: safeString(process.env.SHIPROCKET_TEST_PICKUP_PHONE) || '9777777779',
        address: safeString(process.env.SHIPROCKET_TEST_PICKUP_ADDRESS) || '1900 GF, Sector 45',
        address_2: safeString(process.env.SHIPROCKET_TEST_PICKUP_ADDRESS2) || '',
        city: safeString(process.env.SHIPROCKET_TEST_PICKUP_CITY) || 'Gurgaon',
        state: safeString(process.env.SHIPROCKET_TEST_PICKUP_STATE) || 'Haryana',
        country: safeString(process.env.SHIPROCKET_TEST_PICKUP_COUNTRY) || 'India',
        pin_code: safeString(process.env.SHIPROCKET_TEST_PICKUP_PINCODE) || '122003',
      }),
    )
  } else {
    summary.push({
      api: 'add-pickup-location',
      ok: true,
      message: 'Skipped (set SHIPROCKET_TEST_ADD_PICKUP=1 to run)',
    })
  }

  console.log('\n[Shiprocket Tracking+Pickup Test] Summary')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('[Shiprocket Tracking+Pickup Test] Fatal error', error)
  process.exit(1)
})
