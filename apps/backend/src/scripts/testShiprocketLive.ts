import * as dotenv from 'dotenv'
import path from 'path'
import { ShiprocketCourierService } from '../models/services/couriers/shiprocket.service'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const safeString = (value: unknown) => String(value || '').trim()

const logResult = (label: string, payload: any) => {
  console.log(`\n[Shiprocket Live Test] ${label}`)
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
      console.error(`\n[Shiprocket Live Test] ${name} failed`)
      console.error(error?.message || error)
      return null
    }
  }

  await runCheck('login', () => shiprocket.login())
  await runCheck('channels', () => shiprocket.getIntegratedChannels())
  const pickupLocations = await runCheck('pickup-locations', () => shiprocket.getPickupLocations())
  const serviceability = await runCheck('serviceability', () =>
    shiprocket.checkCourierServiceability({
      pickup_postcode: 122001,
      delivery_postcode: 110001,
      cod: 0,
      weight: 0.5,
      length: 10,
      breadth: 10,
      height: 10,
      declared_value: 1000,
    }),
  )

  const existingOrderId = safeString(process.env.SHIPROCKET_TEST_EXISTING_ORDER_ID)
  const existingAwb = safeString(process.env.SHIPROCKET_TEST_EXISTING_AWB)

  if (existingOrderId) {
    await runCheck('order-detail', () => shiprocket.getOrderDetail(existingOrderId))
    await runCheck('invoice', () =>
      shiprocket.generateInvoice({ ids: [Number(existingOrderId)] }),
    )
  }

  if (existingAwb) {
    await runCheck('track-awb', () => shiprocket.trackByAwb(existingAwb))
  }

  const shouldWrite = safeString(process.env.SHIPROCKET_TEST_WRITE) === '1'
  if (shouldWrite) {
    const pickupLocation =
      safeString(process.env.SHIPROCKET_TEST_PICKUP_LOCATION) ||
      safeString(process.env.SHIPROCKET_DEFAULT_PICKUP_LOCATION) ||
      safeString(
        pickupLocations?.data?.shipping_address?.[0]?.pickup_location ||
          pickupLocations?.data?.data?.shipping_address?.[0]?.pickup_location,
      )

    if (!pickupLocation) {
      throw new Error(
        'SHIPROCKET_TEST_PICKUP_LOCATION is required for write tests when no pickup location is returned by API.',
      )
    }

    const availableCouriers = Array.isArray(serviceability?.data?.available_courier_companies)
      ? serviceability.data.available_courier_companies
      : Array.isArray(serviceability?.available_courier_companies)
        ? serviceability.available_courier_companies
        : []
    const firstCourier = availableCouriers[0] || null
    const courierId = Number(
      safeString(process.env.SHIPROCKET_TEST_COURIER_ID) ||
        firstCourier?.courier_company_id ||
        0,
    )

    const orderNumber = safeString(process.env.SHIPROCKET_TEST_ORDER_NUMBER) || `SRTEST-${Date.now()}`
    const createResp = await runCheck('create-custom-order', () =>
      shiprocket.createCustomOrder({
        order_id: orderNumber,
        order_date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        pickup_location: pickupLocation,
        billing_customer_name: safeString(process.env.SHIPROCKET_TEST_CUSTOMER_NAME) || 'Test Customer',
        billing_last_name: '',
        billing_address: safeString(process.env.SHIPROCKET_TEST_ADDRESS) || 'Sector 49',
        billing_address_2: safeString(process.env.SHIPROCKET_TEST_ADDRESS_2) || 'Sohna Road',
        billing_city: safeString(process.env.SHIPROCKET_TEST_CITY) || 'Gurgaon',
        billing_pincode: Number(safeString(process.env.SHIPROCKET_TEST_PINCODE) || '122001'),
        billing_state: safeString(process.env.SHIPROCKET_TEST_STATE) || 'Haryana',
        billing_country: 'India',
        billing_email: safeString(process.env.SHIPROCKET_TEST_EMAIL) || 'test@example.com',
        billing_phone: Number(safeString(process.env.SHIPROCKET_TEST_PHONE) || '9876543210'),
        shipping_is_billing: true,
        order_items: [
          {
            name: 'Live Test Item',
            sku: 'LIVE-SR-1',
            units: 1,
            selling_price: 1000,
          },
        ],
        payment_method: 'Prepaid',
        sub_total: 1000,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5,
      }),
    )

    const createdOrderId = Number(createResp?.order_id || createResp?.data?.order_id || 0)
    const shipmentId = Number(createResp?.shipment_id || createResp?.data?.shipment_id || 0)

    if (shipmentId > 0 && courierId > 0) {
      await runCheck('assign-awb', () =>
        shiprocket.assignAwb({
          shipment_id: shipmentId,
          courier_id: courierId,
        }),
      )
      await runCheck('generate-pickup', () =>
        shiprocket.generatePickup({ shipment_id: [shipmentId] }),
      )
      await runCheck('generate-manifest', () =>
        shiprocket.generateManifest({ shipment_id: [shipmentId] }),
      )
      if (createdOrderId > 0) {
        await runCheck('print-manifest', () =>
          shiprocket.printManifest({ order_ids: [createdOrderId] }),
        )
        await runCheck('generate-invoice', () =>
          shiprocket.generateInvoice({ ids: [createdOrderId] }),
        )
      }
      await runCheck('generate-label', () =>
        shiprocket.generateLabel({ shipment_id: [shipmentId] }),
      )
    }
  }

  console.log('\n[Shiprocket Live Test] Summary')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('[Shiprocket Live Test] Fatal error', error)
  process.exit(1)
})
