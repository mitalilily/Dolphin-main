import fs from 'fs'
import os from 'os'
import path from 'path'
import * as dotenv from 'dotenv'
import { ShiprocketCourierService } from '../models/services/couriers/shiprocket.service'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const safeString = (value: unknown) => String(value || '').trim()

const parseNumberList = (value: string): number[] =>
  value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((num) => Number.isFinite(num))

const parseStringList = (value: string): string[] =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const logResult = (label: string, payload: any) => {
  console.log(`\n[Shiprocket Order Ops Test] ${label}`)
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
      console.error(`\n[Shiprocket Order Ops Test] ${name} failed`)
      console.error(error?.message || error)
      return null
    }
  }

  await runCheck('login', () => shiprocket.login())

  const cancelIdsRaw = safeString(process.env.SHIPROCKET_TEST_CANCEL_ORDER_IDS)
  const cancelIds = cancelIdsRaw ? parseNumberList(cancelIdsRaw) : [0]
  await runCheck('orders-cancel', () => shiprocket.cancelOrders({ ids: cancelIds }))

  const fulfillPayload = {
    data: [
      {
        order_id: toNumber(safeString(process.env.SHIPROCKET_TEST_FULFILL_ORDER_ID), 0),
        order_product_id: toNumber(safeString(process.env.SHIPROCKET_TEST_ORDER_PRODUCT_ID), 0),
        quantity: safeString(process.env.SHIPROCKET_TEST_FULFILL_QTY) || '1',
        action: 'add',
      },
    ],
  }
  await runCheck('orders-fulfill', () => shiprocket.addInventoryForOrderedProduct(fulfillPayload))

  const mappingPayload = {
    data: [
      {
        order_id: toNumber(safeString(process.env.SHIPROCKET_TEST_MAPPING_ORDER_ID), 0),
        order_product_id: toNumber(safeString(process.env.SHIPROCKET_TEST_MAPPING_PRODUCT_ID), 0),
        master_sku: safeString(process.env.SHIPROCKET_TEST_MAPPING_MASTER_SKU) || 'TEST-SKU',
      },
    ],
  }
  await runCheck('orders-mapping', () => shiprocket.mapUnmappedProducts(mappingPayload))

  const cancelAwbsRaw = safeString(process.env.SHIPROCKET_TEST_CANCEL_AWBS)
  const cancelAwbs = cancelAwbsRaw ? parseStringList(cancelAwbsRaw) : ['19041211125783']
  await runCheck('orders-cancel-shipment-awbs', () =>
    shiprocket.cancelShipmentByAwbs({ awbs: cancelAwbs }),
  )

  const inventoryActionRaw = safeString(process.env.SHIPROCKET_TEST_INVENTORY_ACTION).toLowerCase()
  const inventoryAction: 'add' | 'replace' | 'remove' =
    inventoryActionRaw === 'add' || inventoryActionRaw === 'replace' || inventoryActionRaw === 'remove'
      ? inventoryActionRaw
      : 'remove'
  await runCheck('inventory-update', () =>
    shiprocket.updateInventory(
      safeString(process.env.SHIPROCKET_TEST_INVENTORY_PRODUCT_ID) || '17454637',
      {
        quantity: toNumber(safeString(process.env.SHIPROCKET_TEST_INVENTORY_QUANTITY), 2),
        action: inventoryAction,
      },
    ),
  )

  const customFilePath = safeString(process.env.SHIPROCKET_TEST_IMPORT_FILE_PATH)
  let tempFilePath: string | null = null

  try {
    const finalPath = customFilePath || (() => {
      const tmpPath = path.join(os.tmpdir(), `shiprocket-import-${Date.now()}.csv`)
      fs.writeFileSync(
        tmpPath,
        'order_id,channel_order_id,payment_method,billing_customer_name\nTEST-1,TEST-1,Prepaid,API Test\n',
        'utf8',
      )
      tempFilePath = tmpPath
      return tmpPath
    })()

    const fileBuffer = fs.readFileSync(finalPath)
    await runCheck('orders-import', () =>
      shiprocket.importOrdersInBulkFromFile({
        buffer: fileBuffer,
        originalname: path.basename(finalPath),
        mimetype: 'text/csv',
      }),
    )
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath)
    }
  }

  console.log('\n[Shiprocket Order Ops Test] Summary')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('[Shiprocket Order Ops Test] Fatal error', error)
  process.exit(1)
})
