import * as dotenv from 'dotenv'
import path from 'path'
import { upsertCourierCredentials } from '../models/services/courierCredentials.service'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const val = (key: string) => String(process.env[key] || '').trim()
const has = (...keys: string[]) => keys.some((key) => val(key).length > 0)

async function main() {
  const summary: Array<{ provider: string; seeded: boolean; reason: string }> = []
  const shipmozoHasAuth = (val('SHIPMOZO_PUBLIC_KEY') && val('SHIPMOZO_PRIVATE_KEY')) || (val('SHIPMOZO_USERNAME') && val('SHIPMOZO_PASSWORD'))
  const shiprocketHasAuth = val('SHIPROCKET_EMAIL') && val('SHIPROCKET_PASSWORD')

  if (shipmozoHasAuth) {
    await upsertCourierCredentials({
      serviceProvider: 'shipmozo',
      b2c: {
        config: {
          apiBase: val('SHIPMOZO_API_BASE'),
          publicKey: val('SHIPMOZO_PUBLIC_KEY'),
          privateKey: val('SHIPMOZO_PRIVATE_KEY'),
          username: val('SHIPMOZO_USERNAME'),
          password: val('SHIPMOZO_PASSWORD'),
          defaultWarehouseId: val('SHIPMOZO_DEFAULT_WAREHOUSE_ID'),
        },
      },
    })
    summary.push({ provider: 'shipmozo', seeded: true, reason: 'Upserted from env' })
  } else {
    summary.push({
      provider: 'shipmozo',
      seeded: false,
      reason: 'Missing SHIPMOZO auth pair (PUBLIC_KEY+PRIVATE_KEY or USERNAME+PASSWORD)',
    })
  }

  if (shiprocketHasAuth) {
    await upsertCourierCredentials({
      serviceProvider: 'shiprocket',
      b2c: {
        config: {
          apiBase: val('SHIPROCKET_API_BASE'),
          username: val('SHIPROCKET_EMAIL'),
          password: val('SHIPROCKET_PASSWORD'),
          defaultPickupLocation: val('SHIPROCKET_DEFAULT_PICKUP_LOCATION'),
          defaultChannelId: val('SHIPROCKET_DEFAULT_CHANNEL_ID'),
        },
      },
    })
    summary.push({ provider: 'shiprocket', seeded: true, reason: 'Upserted from env' })
  } else {
    summary.push({
      provider: 'shiprocket',
      seeded: false,
      reason: 'Missing SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD in env',
    })
  }

  console.log('[Seed Courier Credentials] Summary')
  console.log(JSON.stringify(summary, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[Seed Courier Credentials] Failed', error)
    process.exit(1)
  })
