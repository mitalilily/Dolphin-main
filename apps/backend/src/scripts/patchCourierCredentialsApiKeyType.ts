import { pool } from '../models/client'

async function main() {
  await pool.query(`
    ALTER TABLE courier_credentials
    ALTER COLUMN api_key TYPE TEXT
  `)
  console.log('[patch] courier_credentials.api_key converted to TEXT')
}

main()
  .then(async () => {
    await pool.end()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('[patch] failed', error?.message || error)
    await pool.end()
    process.exit(1)
  })
