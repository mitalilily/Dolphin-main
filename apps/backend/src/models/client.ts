import * as dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../schema/schema'

// Load environment variables (platform-injected in production).
const env = process.env.NODE_ENV || 'development'
console.log('ENVIRONMENT', env)
dotenv.config()

if (!process.env.DATABASE_URL) {
  throw new Error('âŒ DATABASE_URL is missing')
}

const databaseUrl = process.env.DATABASE_URL as string
const shouldUseSsl =
  process.env.PGSSLMODE === 'require' ||
  env === 'production' ||
  /render\.com|railway\.app|supabase\.co/i.test(databaseUrl)

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
})

// console.log('DEBUG: pool created?', !!pool, 'pool.constructor.name=', pool?.constructor?.name)

export const db = drizzle(pool, {
  schema: schema,
})

// âœ… New function you can call explicitly in scripts
export function initPool() {
  console.log('â„¹ï¸ initPool called')
  return { pool, db }
}

// Surface unexpected pool-level errors
pool.on('error', (err) => {
  console.error('âŒ PG Pool error:', {
    message: err?.message,
    stack: err?.stack,
  })
})

/**
 * Test database connection on startup
 * Returns true if connection succeeds, false otherwise
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect()
    try {
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version')
      const { current_time, pg_version } = result.rows[0]
      console.log('âœ… Database connection succeeded')
      
      // Parse PostgreSQL version (format: "PostgreSQL 15.3 on x86_64...")
      const versionMatch = pg_version.match(/PostgreSQL\s+([\d.]+)/)
      const version = versionMatch ? versionMatch[1] : 'unknown'
      console.log(`   PostgreSQL version: ${version}`)
      console.log(`   Server time: ${current_time}`)
      
      return true
    } finally {
      client.release()
    }
  } catch (err: any) {
    console.error('âŒ Database connection failed:')
    console.error(`   Error: ${err.message}`)
    if (err.code) {
      console.error(`   Code: ${err.code}`)
    }
    if (err.host) {
      console.error(`   Host: ${err.host}`)
    }
    if (err.port) {
      console.error(`   Port: ${err.port}`)
    }
    if (process.env.NODE_ENV === 'development' && err.stack) {
      console.error(`   Stack: ${err.stack}`)
    }
    return false
  }
}

