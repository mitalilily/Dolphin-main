import { ShipmozoService } from '../models/services/couriers/shipmozo.service'

type CleanupOrder = {
  order_id: string
  awb_number: string | number
}

const parseOrders = (): CleanupOrder[] => {
  const raw = String(process.env.SHIPMOZO_CLEANUP_ORDERS_JSON || '').trim()
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => ({
        order_id: String(item?.order_id || '').trim(),
        awb_number: String(item?.awb_number || '').trim(),
      }))
      .filter((item) => item.order_id && item.awb_number)
  } catch (error) {
    console.error('Invalid SHIPMOZO_CLEANUP_ORDERS_JSON:', error)
    return []
  }
}

async function run() {
  const service = new ShipmozoService()
  const orders = parseOrders()
  const confirmed =
    String(process.env.SHIPMOZO_CLEANUP_CONFIRM || '')
      .trim()
      .toLowerCase() === 'true'

  if (!orders.length) {
    console.log(
      'No cleanup orders provided. Set SHIPMOZO_CLEANUP_ORDERS_JSON to a JSON array with order_id + awb_number.',
    )
    process.exit(0)
  }

  console.log(`Shipmozo cleanup target count: ${orders.length}`)
  if (!confirmed) {
    console.log(
      'Dry-run only. Set SHIPMOZO_CLEANUP_CONFIRM=true to perform actual cancel-order calls.',
    )
    console.log(JSON.stringify(orders, null, 2))
    process.exit(0)
  }

  for (const item of orders) {
    try {
      const resp = await service.cancelOrder({
        order_id: item.order_id,
        awb_number: item.awb_number,
      })
      console.log('✅ Cancelled', {
        order_id: item.order_id,
        awb_number: item.awb_number,
        result: resp?.result,
        message: resp?.message,
      })
    } catch (error: any) {
      console.error('❌ Failed to cancel', {
        order_id: item.order_id,
        awb_number: item.awb_number,
        message: error?.message || error,
      })
    }
  }
}

run().catch((error) => {
  console.error('Cleanup script failed:', error)
  process.exit(1)
})

