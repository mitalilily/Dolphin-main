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
  console.log(`\n[Shiprocket Inventory Test] ${label}`)
  console.log(
    JSON.stringify(
      payload,
      (key, value) => {
        const lowered = String(key || '').toLowerCase()
        if (
          [
            'token',
            'authorization',
            'access_token',
            'api_key',
            'apikey',
            'password',
          ].includes(lowered)
        ) {
          return value ? '[redacted]' : value
        }
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
      console.error(`\n[Shiprocket Inventory Test] ${name} failed`)
      console.error(error?.message || error)
      return null
    }
  }

  const productId = safeString(process.env.SHIPROCKET_TEST_INVENTORY_PRODUCT_ID) || '17454637'
  const quantity = toNumber(process.env.SHIPROCKET_TEST_INVENTORY_QUANTITY, 2)
  const rawAction = safeString(process.env.SHIPROCKET_TEST_INVENTORY_ACTION).toLowerCase()
  const action: 'add' | 'replace' | 'remove' =
    rawAction === 'add' || rawAction === 'replace' || rawAction === 'remove'
      ? rawAction
      : 'remove'

  await runCheck('login', () => shiprocket.login())
  await runCheck('inventory-update', () =>
    shiprocket.updateInventory(productId, {
      quantity,
      action,
    }),
  )

  console.log('\n[Shiprocket Inventory Test] Summary')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('[Shiprocket Inventory Test] Fatal error', error)
  process.exit(1)
})
