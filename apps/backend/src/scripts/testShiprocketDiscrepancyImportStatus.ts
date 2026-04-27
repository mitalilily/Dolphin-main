import * as dotenv from 'dotenv'
import path from 'path'
import { ShiprocketCourierService } from '../models/services/couriers/shiprocket.service'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const safeString = (value: unknown) => String(value || '').trim()

const logResult = (label: string, payload: any) => {
  console.log(`\n[Shiprocket Discrepancy/Import Test] ${label}`)
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
      console.error(`\n[Shiprocket Discrepancy/Import Test] ${name} failed`)
      console.error(error?.message || error)
      return null
    }
  }

  await runCheck('login', () => shiprocket.login())
  await runCheck('billing-discrepancy', () => shiprocket.getDiscrepancyData())

  const importId = safeString(process.env.SHIPROCKET_TEST_IMPORT_ID)
  if (!importId) {
    summary.push({
      api: 'errors/{import_id}/check',
      ok: false,
      message: 'SKIPPED: SHIPROCKET_TEST_IMPORT_ID not provided',
    })
    console.warn(
      '\n[Shiprocket Discrepancy/Import Test] Skipping file import status check because SHIPROCKET_TEST_IMPORT_ID is not set.',
    )
  } else {
    await runCheck('errors/{import_id}/check', () => shiprocket.checkFileImportStatus(importId))
  }

  console.log('\n[Shiprocket Discrepancy/Import Test] Summary')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('[Shiprocket Discrepancy/Import Test] Fatal error', error)
  process.exit(1)
})
