import * as dotenv from 'dotenv'
import path from 'path'
import { ShiprocketCourierService } from '../models/services/couriers/shiprocket.service'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const safeString = (value: unknown) => String(value || '').trim()

const logResult = (label: string, payload: any) => {
  console.log(`\n[Shiprocket Zones+Locality Test] ${label}`)
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
      console.error(`\n[Shiprocket Zones+Locality Test] ${name} failed`)
      console.error(error?.message || error)
      return null
    }
  }

  await runCheck('login', () => shiprocket.login())
  await runCheck('countries-show-zones', () =>
    shiprocket.getAllZones(safeString(process.env.SHIPROCKET_TEST_COUNTRY_ID) || '4'),
  )
  await runCheck('open-postcode-details', () =>
    shiprocket.getLocalityDetails(safeString(process.env.SHIPROCKET_TEST_POSTCODE) || '110077'),
  )

  console.log('\n[Shiprocket Zones+Locality Test] Summary')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('[Shiprocket Zones+Locality Test] Fatal error', error)
  process.exit(1)
})

