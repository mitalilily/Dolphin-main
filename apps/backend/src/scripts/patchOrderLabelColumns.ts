import * as dotenv from 'dotenv'
import path from 'path'
import { Client } from 'pg'
import { databaseSslConfig } from '../utils/databaseSsl'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

async function run() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not set')

  const client = new Client({
    connectionString,
    ssl: databaseSslConfig(connectionString),
  })

  await client.connect()
  try {
    console.log('Patching order label/manifest/sort_code columns to TEXT (idempotent)...')
    await client.query(`
      ALTER TABLE "b2c_orders"
      ALTER COLUMN "label" TYPE text,
      ALTER COLUMN "manifest" TYPE text,
      ALTER COLUMN "sort_code" TYPE text
    `)

    await client.query(`
      ALTER TABLE "b2b_orders"
      ALTER COLUMN "label" TYPE text,
      ALTER COLUMN "manifest" TYPE text
    `)

    console.log('Order column patch applied successfully.')
  } finally {
    await client.end()
  }
}

run().catch((err) => {
  console.error('Failed to patch order columns:', err)
  process.exit(1)
})

