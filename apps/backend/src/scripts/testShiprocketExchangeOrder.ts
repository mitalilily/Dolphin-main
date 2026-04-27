import path from 'path'
import * as dotenv from 'dotenv'
import { ShiprocketCourierService } from '../models/services/couriers/shiprocket.service'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const safeString = (value: unknown) => String(value || '').trim()

const parseJsonPayload = (value: string) => {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const buildDefaultPayload = () => ({
  exchange_order_id: safeString(process.env.SHIPROCKET_TEST_EXCHANGE_ORDER_ID) || `EX_TEST_${Date.now()}`,
  seller_pickup_location_id: safeString(process.env.SHIPROCKET_TEST_SELLER_PICKUP_LOCATION_ID) || '5723898',
  seller_shipping_location_id:
    safeString(process.env.SHIPROCKET_TEST_SELLER_SHIPPING_LOCATION_ID) || '5723898',
  return_order_id: safeString(process.env.SHIPROCKET_TEST_RETURN_ORDER_ID) || 'R_TEST002',
  order_date: safeString(process.env.SHIPROCKET_TEST_ORDER_DATE) || '2024-12-10',
  payment_method: safeString(process.env.SHIPROCKET_TEST_PAYMENT_METHOD) || 'prepaid',
  buyer_shipping_first_name: 'Test',
  buyer_shipping_last_name: 'User',
  buyer_shipping_email: safeString(process.env.SHIPROCKET_TEST_BUYER_EMAIL) || 'test@example.com',
  buyer_shipping_address: 'Test Shipping Address',
  buyer_shipping_address_2: '',
  buyer_shipping_city: 'South West Delhi',
  buyer_shipping_state: 'Delhi',
  buyer_shipping_country: 'India',
  buyer_shipping_pincode: '110045',
  buyer_shipping_phone: safeString(process.env.SHIPROCKET_TEST_BUYER_PHONE) || '9999999999',
  buyer_pickup_first_name: 'Test',
  buyer_pickup_last_name: 'User',
  buyer_pickup_email: safeString(process.env.SHIPROCKET_TEST_BUYER_EMAIL) || 'test@example.com',
  buyer_pickup_address: 'Test Pickup Address',
  buyer_pickup_address_2: '',
  buyer_pickup_city: 'South West Delhi',
  buyer_pickup_state: 'Delhi',
  buyer_pickup_country: 'India',
  buyer_pickup_pincode: '110045',
  buyer_pickup_phone: safeString(process.env.SHIPROCKET_TEST_BUYER_PHONE) || '9999999999',
  order_items: [
    {
      name: 'Black tshirt XL',
      selling_price: 500.0,
      units: 1,
      hsn: '1733808730720',
      sku: 'mackbook',
      tax: 0,
      discount: 0,
      exchange_item_id: '193658024',
      exchange_item_name: 'Black tshirt XL',
      exchange_item_sku: 'mackbook',
    },
  ],
  sub_total: 500.0,
  shipping_charges: 0,
  giftwrap_charges: 0,
  total_discount: 0,
  transaction_charges: 0,
  return_length: 10.0,
  return_breadth: 10.0,
  return_height: 10.0,
  return_weight: 0.5,
  exchange_length: 11.0,
  exchange_breadth: 11.0,
  exchange_height: 11.0,
  exchange_weight: 11.0,
  return_reason: '29',
})

async function main() {
  const service = new ShiprocketCourierService()
  const payloadOverride = parseJsonPayload(safeString(process.env.SHIPROCKET_TEST_EXCHANGE_PAYLOAD))
  const payload = payloadOverride || buildDefaultPayload()

  console.log('[Shiprocket Exchange Test] Logging in...')
  await service.login()
  console.log('[Shiprocket Exchange Test] Login OK')

  console.log('[Shiprocket Exchange Test] Creating exchange order...')
  const response = await service.createExchangeOrder(payload)
  console.log(
    JSON.stringify(
      {
        success: true,
        message: response?.message || 'Exchange order request completed',
        data: response,
      },
      null,
      2,
    ),
  )
}

main().catch((error: any) => {
  console.error(
    JSON.stringify(
      {
        success: false,
        message: error?.message || 'Exchange order test failed',
        statusCode: error?.statusCode || null,
      },
      null,
      2,
    ),
  )
  process.exit(1)
})

