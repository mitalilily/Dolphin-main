import * as dotenv from 'dotenv'
import path from 'path'
import { ShipmozoService } from '../models/services/couriers/shipmozo.service'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const safeString = (value: unknown) => {
  if (value == null) return ''
  return String(value).trim()
}

const logResult = (label: string, payload: any) => {
  console.log(`\n[Shipmozo Live Test] ${label}`)
  console.log(
    JSON.stringify(
      payload,
      (_key, value) => {
        if (typeof value === 'string' && value.length > 400) {
          return `${value.slice(0, 400)}...<trimmed>`
        }
        return value
      },
      2,
    ),
  )
}

async function main() {
  const shipmozo = new ShipmozoService()
  const testOrderId = safeString(process.env.SHIPMOZO_TEST_ORDER_ID)
  const testAwb = safeString(process.env.SHIPMOZO_TEST_AWB)
  const testCourierId = safeString(process.env.SHIPMOZO_TEST_COURIER_ID)
  const testWarehouseId = safeString(process.env.SHIPMOZO_TEST_WAREHOUSE_ID)
  const runMutations = safeString(process.env.SHIPMOZO_RUN_MUTATIONS).toLowerCase() === 'true'
  const runCancel = safeString(process.env.SHIPMOZO_RUN_CANCEL).toLowerCase() === 'true'
  const runWarehouseCreate =
    safeString(process.env.SHIPMOZO_RUN_CREATE_WAREHOUSE).toLowerCase() === 'true'
  const runWarehouseUpdate =
    safeString(process.env.SHIPMOZO_RUN_UPDATE_WAREHOUSE).toLowerCase() === 'true'

  const checks: Array<{ name: string; run: () => Promise<any> }> = [
    { name: 'info', run: () => shipmozo.info() },
    { name: 'login', run: () => shipmozo.login() },
    { name: 'get-warehouses', run: () => shipmozo.getWarehouses() },
    { name: 'get-return-reason', run: () => shipmozo.getReturnReasons() },
    {
      name: 'pincode-serviceability',
      run: () =>
        shipmozo.checkPincodeServiceability({
          pickup_pincode: 122001,
          delivery_pincode: 110001,
        }),
    },
    {
      name: 'rate-calculator',
      run: () =>
        shipmozo.rateCalculator({
          order_id: '',
          pickup_pincode: 122001,
          delivery_pincode: 110001,
          payment_type: 'PREPAID',
          shipment_type: 'FORWARD',
          order_amount: 1000,
          type_of_package: 'SPS',
          rov_type: 'ROV_OWNER',
          cod_amount: '',
          weight: 500,
          dimensions: [{ no_of_box: '1', length: '22', width: '10', height: '10' }],
        }),
    },
  ]

  if (testOrderId) {
    checks.push({
      name: 'get-order-detail',
      run: () => shipmozo.getOrderDetail(testOrderId),
    })
  }

  if (runMutations && testOrderId && testCourierId) {
    checks.push({
      name: 'assign-courier',
      run: () =>
        shipmozo.assignCourier({
          order_id: testOrderId,
          courier_id: testCourierId,
        }),
    })
  }

  if (runMutations && runWarehouseCreate) {
    checks.push({
      name: 'create-warehouse',
      run: () =>
        shipmozo.createWarehouse({
          address_title: `Dolphin${Date.now()}`,
          name: 'Dolphin Ops',
          phone: '9876543210',
          alternate_phone: '9876543211',
          email: 'dolphin.altos@gmail.com',
          address_line_one: 'Sector 49',
          address_line_two: 'Sohna Road',
          pin_code: 122001,
        }),
    })
  }

  if (runMutations && runWarehouseUpdate && testOrderId && testWarehouseId) {
    checks.push({
      name: 'order/update-warehouse',
      run: () =>
        shipmozo.updateWarehouseForOrder({
          order_id: testOrderId,
          warehouse_id: testWarehouseId,
        }),
    })
  }

  if (runMutations && testOrderId) {
    checks.push({
      name: 'auto-assign-order',
      run: () =>
        shipmozo.autoAssignOrder({
          order_id: testOrderId,
        }),
    })
    checks.push({
      name: 'schedule-pickup',
      run: () =>
        shipmozo.schedulePickup({
          order_id: testOrderId,
        }),
    })
  }

  if (runMutations && runCancel && testOrderId && testAwb) {
    checks.push({
      name: 'cancel-order',
      run: () =>
        shipmozo.cancelOrder({
          order_id: testOrderId,
          awb_number: testAwb,
        }),
    })
  }

  if (testAwb) {
    checks.push({
      name: 'get-order-label',
      run: () => shipmozo.getOrderLabel(testAwb),
    })
    checks.push({
      name: 'track-order',
      run: () => shipmozo.trackOrder(testAwb),
    })
  }

  const summary: Array<{ api: string; ok: boolean; message: string }> = []

  for (const check of checks) {
    try {
      const response = await check.run()
      summary.push({
        api: check.name,
        ok: String(response?.result ?? '') === '1',
        message: safeString(response?.message || 'OK'),
      })
      logResult(check.name, response)
    } catch (error: any) {
      summary.push({
        api: check.name,
        ok: false,
        message: safeString(error?.message || error),
      })
      console.error(`\n[Shipmozo Live Test] ${check.name} failed`)
      console.error(error?.message || error)
    }
  }

  console.log('\n[Shipmozo Live Test] Summary')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('[Shipmozo Live Test] Fatal error', error)
  process.exit(1)
})
