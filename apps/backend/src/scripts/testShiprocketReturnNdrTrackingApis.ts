import path from 'path'
import * as dotenv from 'dotenv'
import { ShiprocketCourierService } from '../models/services/couriers/shiprocket.service'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const safeString = (value: unknown) => String(value || '').trim()

const parseStringArray = (value: string, fallback: string[]) => {
  if (!value) return fallback
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.map((x) => String(x || '').trim()).filter(Boolean)
  } catch {}
  return value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

const parseJsonObject = (value: string) => {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const logResult = (label: string, payload: any) => {
  console.log(`\n[Shiprocket Return/NDR/Tracking Test] ${label}`)
  console.log(
    JSON.stringify(
      payload,
      (_key, value) => {
        if (typeof value === 'string' && value.length > 500) return `${value.slice(0, 500)}...<trimmed>`
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
      console.error(`\n[Shiprocket Return/NDR/Tracking Test] ${name} failed`)
      console.error(error?.message || error)
      return null
    }
  }

  await runCheck('login', () => shiprocket.login())

  const updateReturnPayload =
    parseJsonObject(safeString(process.env.SHIPROCKET_TEST_UPDATE_RETURN_ORDER_PAYLOAD)) || {
      order_id: safeString(process.env.SHIPROCKET_TEST_RETURN_ORDER_ID_FOR_EDIT) || '79596',
      action: ['product_details'],
      length: '11',
      breadth: '10',
      height: '10',
      return_warehouse_id: Number(safeString(process.env.SHIPROCKET_TEST_RETURN_WAREHOUSE_ID) || '1072'),
      weight: 1.5,
    }
  await runCheck('orders-edit-return', () => shiprocket.updateReturnOrder(updateReturnPayload))

  const assignReturnAwbPayload =
    parseJsonObject(safeString(process.env.SHIPROCKET_TEST_ASSIGN_RETURN_AWB_PAYLOAD)) || {
      shipment_id: Number(safeString(process.env.SHIPROCKET_TEST_RETURN_SHIPMENT_ID) || '16016920'),
      courier_id: safeString(process.env.SHIPROCKET_TEST_RETURN_COURIER_ID)
        ? Number(safeString(process.env.SHIPROCKET_TEST_RETURN_COURIER_ID))
        : undefined,
      status: safeString(process.env.SHIPROCKET_TEST_RETURN_AWB_STATUS) || undefined,
      is_return: 1,
    }
  await runCheck('courier-assign-awb-return', () =>
    shiprocket.generateAwbForReturnShipment(assignReturnAwbPayload),
  )

  const createReturnShipmentPayload =
    parseJsonObject(safeString(process.env.SHIPROCKET_TEST_CREATE_RETURN_SHIPMENT_PAYLOAD)) || {
      order_id: safeString(process.env.SHIPROCKET_TEST_CREATE_RETURN_ORDER_ID) || `RET_${Date.now()}`,
      order_date: safeString(process.env.SHIPROCKET_TEST_CREATE_RETURN_ORDER_DATE) || '2024-12-10',
      pickup_customer_name: 'John',
      pickup_address: 'Home',
      pickup_city: 'Delhi',
      pickup_state: 'Delhi',
      pickup_country: 'India',
      pickup_pincode: 110002,
      pickup_email: 'john@example.com',
      pickup_phone: '9999999999',
      shipping_customer_name: 'Jane',
      shipping_address: 'Castle',
      shipping_city: 'Mumbai',
      shipping_country: 'India',
      shipping_pincode: 220022,
      shipping_state: 'Maharashtra',
      shipping_email: 'jane@example.com',
      shipping_phone: '8888888888',
      order_items: [{ name: 'ball123', sku: 'Tennis Ball', units: 1, selling_price: 10 }],
      payment_method: 'Prepaid',
      sub_total: 10,
      length: 10,
      breadth: 15,
      height: 20,
      weight: 1,
      request_pickup: false,
    }
  await runCheck('shipments-create-return-shipment', () =>
    shiprocket.createReturnShipment(createReturnShipmentPayload),
  )

  const ndrAwb = safeString(process.env.SHIPROCKET_TEST_NDR_AWB) || '94711332'
  await runCheck('ndr-by-awb', () => shiprocket.getNdrShipmentDetails(ndrAwb))

  const ndrActionPayload =
    parseJsonObject(safeString(process.env.SHIPROCKET_TEST_NDR_ACTION_PAYLOAD)) || {
      action: safeString(process.env.SHIPROCKET_TEST_NDR_ACTION) || 're-attempt',
      comments: safeString(process.env.SHIPROCKET_TEST_NDR_COMMENTS) || 'Buyer requested re-attempt',
    }
  await runCheck('ndr-action', () => shiprocket.actionNdrShipment(ndrAwb, ndrActionPayload))

  const trackingAwbs = parseStringArray(
    safeString(process.env.SHIPROCKET_TEST_TRACK_AWBS),
    ['788830567028', '788829354408'],
  ).slice(0, 50)
  await runCheck('courier-track-awbs', () => shiprocket.trackByAwbs({ awbs: trackingAwbs }))

  const shipmentId = safeString(process.env.SHIPROCKET_TEST_TRACK_SHIPMENT_ID) || '16104408'
  await runCheck('courier-track-shipment', () => shiprocket.trackByShipmentId(shipmentId))

  const cancelAwbs = parseStringArray(
    safeString(process.env.SHIPROCKET_TEST_CANCEL_AWBS),
    ['19041211125783'],
  ).slice(0, 2000)
  await runCheck('orders-cancel-shipment-awbs', () => shiprocket.cancelShipmentByAwbs({ awbs: cancelAwbs }))

  console.log('\n[Shiprocket Return/NDR/Tracking Test] Summary')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('[Shiprocket Return/NDR/Tracking Test] Fatal error', error)
  process.exit(1)
})

