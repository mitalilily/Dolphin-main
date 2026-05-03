import * as dotenv from 'dotenv'
import path from 'path'
import { Client } from 'pg'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

async function run() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not set')

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "invoice_sequences" (
        "user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
        "last_sequence" bigint NOT NULL DEFAULT 0,
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `)

    await client.query(`
      ALTER TABLE "invoice_sequences"
      ALTER COLUMN "last_sequence" SET DEFAULT 0,
      ALTER COLUMN "updated_at" SET DEFAULT now()
    `)

    console.log('Invoice sequences table is ready.')
  } finally {
    await client.end()
  }
}

run().catch((err) => {
  console.error('Failed to patch invoice sequences table:', err)
  process.exit(1)
})
