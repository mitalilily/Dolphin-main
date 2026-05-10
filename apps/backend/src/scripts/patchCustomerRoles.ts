import * as dotenv from 'dotenv'
import path from 'path'
import { Client } from 'pg'
import { databaseSslConfig } from '../utils/databaseSsl'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

async function run() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  const client = new Client({
    connectionString,
    ssl: databaseSslConfig(connectionString),
  })

  await client.connect()

  try {
    console.log('Normalizing customer roles for admin user-management visibility...')
    const result = await client.query(`
      UPDATE "users"
      SET "role" = 'customer'
      WHERE ("role" IS NULL OR "role" = '' OR lower("role") = 'user')
        AND COALESCE("email", '') <> ''
    `)
    console.log(`Updated ${result.rowCount ?? 0} user role(s) to customer.`)
  } finally {
    await client.end()
  }
}

run().catch((err) => {
  console.error('Failed to patch customer roles:', err)
  process.exit(1)
})
