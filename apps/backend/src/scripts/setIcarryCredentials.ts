import { eq } from 'drizzle-orm'
import { db, pool } from '../models/client'
import { courier_credentials } from '../models/schema/courierCredentials'

async function main() {
  const username = String(process.env.ICARRY_USERNAME || '').trim()
  const apiKey = String(process.env.ICARRY_API_KEY || '').trim()
  const apiBase = String(process.env.ICARRY_API_BASE || 'https://www.icarry.in').trim()

  if (!username || !apiKey) {
    throw new Error('ICARRY_USERNAME and ICARRY_API_KEY are required')
  }

  const [existing] = await db
    .select({ id: courier_credentials.id })
    .from(courier_credentials)
    .where(eq(courier_credentials.provider, 'icarry'))
    .limit(1)

  if (existing) {
    await db
      .update(courier_credentials)
      .set({
        apiBase,
        username,
        apiKey,
        updatedAt: new Date(),
      })
      .where(eq(courier_credentials.provider, 'icarry'))
  } else {
    await db.insert(courier_credentials).values({
      provider: 'icarry',
      apiBase,
      username,
      apiKey,
      clientName: '',
      clientId: '',
      password: '',
      webhookSecret: '',
    })
  }

  console.log('[icarry] credentials upserted')
}

main()
  .then(async () => {
    await pool.end()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('[icarry] failed', error)
    await pool.end()
    process.exit(1)
  })
