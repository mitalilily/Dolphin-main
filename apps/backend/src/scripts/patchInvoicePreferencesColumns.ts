import * as dotenv from 'dotenv'
import path from 'path'
import { Client } from 'pg'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

async function run() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    console.log('Patching invoice_preferences columns (safe/idempotent)...')
    await client.query(`
      ALTER TABLE "invoice_preferences"
      ADD COLUMN IF NOT EXISTS "seller_name" varchar(255),
      ADD COLUMN IF NOT EXISTS "brand_name" varchar(255),
      ADD COLUMN IF NOT EXISTS "gst_number" varchar(32),
      ADD COLUMN IF NOT EXISTS "pan_number" varchar(32),
      ADD COLUMN IF NOT EXISTS "seller_address" text,
      ADD COLUMN IF NOT EXISTS "state_code" varchar(10),
      ADD COLUMN IF NOT EXISTS "support_email" varchar(150),
      ADD COLUMN IF NOT EXISTS "support_phone" varchar(50),
      ADD COLUMN IF NOT EXISTS "invoice_notes" text,
      ADD COLUMN IF NOT EXISTS "terms_and_conditions" text
    `)
    console.log('Patch applied successfully.')
  } finally {
    await client.end()
  }
}

run().catch((err) => {
  console.error('Failed to patch invoice_preferences columns:', err)
  process.exit(1)
})

