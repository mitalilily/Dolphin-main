import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
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
    const migrationPath = path.resolve(__dirname, '../../migration_fix_kyc_select_query_columns.sql')
    const sql = readFileSync(migrationPath, 'utf-8')
    console.log('Applying KYC schema patch (safe/idempotent)...')
    await client.query(sql)
    console.log('KYC patch applied successfully.')
  } finally {
    await client.end()
  }
}

run().catch((err) => {
  console.error('Failed to patch KYC columns:', err)
  process.exit(1)
})
