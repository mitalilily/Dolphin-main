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
  console.log(`\n[Shiprocket Products Test] ${label}`)
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
      console.error(`\n[Shiprocket Products Test] ${name} failed`)
      console.error(error?.message || error)
      return null
    }
  }

  await runCheck('login', () => shiprocket.login())

  const uniqueSuffix = Date.now().toString().slice(-8)
  const createPayload = {
    name: safeString(process.env.SHIPROCKET_TEST_PRODUCT_NAME) || `Codex Test Product ${uniqueSuffix}`,
    category_code: safeString(process.env.SHIPROCKET_TEST_PRODUCT_CATEGORY_CODE) || 'default',
    type: safeString(process.env.SHIPROCKET_TEST_PRODUCT_TYPE) || 'Single',
    qty: String(toNumber(process.env.SHIPROCKET_TEST_PRODUCT_QTY, 10)),
    sku: safeString(process.env.SHIPROCKET_TEST_PRODUCT_SKU) || `codex-sku-${uniqueSuffix}`,
  }

  const createResp = await runCheck('products-create', () => shiprocket.addProduct(createPayload))

  const responseProductId =
    createResp?.data?.id ??
    createResp?.data?.product_id ??
    createResp?.id ??
    createResp?.product_id ??
    null

  const fallbackProductId = safeString(process.env.SHIPROCKET_TEST_PRODUCT_ID)
  const finalProductId = safeString(responseProductId || fallbackProductId)

  if (!finalProductId) {
    summary.push({
      api: 'products-show',
      ok: false,
      message: 'SKIPPED: no product id in create response and SHIPROCKET_TEST_PRODUCT_ID not set',
    })
    console.warn(
      '\n[Shiprocket Products Test] Skipping products-show because no product id is available.',
    )
  } else {
    await runCheck('products-show', () => shiprocket.getProductDetail(finalProductId))
  }

  console.log('\n[Shiprocket Products Test] Summary')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('[Shiprocket Products Test] Fatal error', error)
  process.exit(1)
})
