import * as dotenv from 'dotenv'
import path from 'path'
import { Client } from 'pg'
import { buildScriptPgClientConfig } from './scriptPgClient'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

async function run() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  const client = new Client(buildScriptPgClientConfig(connectionString))

  await client.connect()

  try {
    console.log('Ensuring invoice_preferences table exists...')
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "invoice_preferences" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "prefix" varchar(10) NOT NULL DEFAULT 'INV',
        "suffix" varchar(10) DEFAULT '',
        "template" varchar(20) NOT NULL DEFAULT 'classic',
        "include_logo" boolean NOT NULL DEFAULT true,
        "include_signature" boolean NOT NULL DEFAULT true,
        "logo_file" varchar(255),
        "signature_file" varchar(255),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `)

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

    await client.query(`
      CREATE INDEX IF NOT EXISTS "invoice_preferences_user_id_idx"
      ON "invoice_preferences" ("user_id")
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
