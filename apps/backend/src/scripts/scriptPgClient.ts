import type { ClientConfig } from 'pg'

export function buildScriptPgClientConfig(connectionString: string): ClientConfig {
  let sslMode = process.env.PGSSLMODE || ''

  try {
    sslMode ||= new URL(connectionString).searchParams.get('sslmode') || ''
  } catch {
    sslMode ||= ''
  }

  const normalizedSslMode = sslMode.toLowerCase()
  const forceSsl =
    ['require', 'verify-ca', 'verify-full', 'no-verify'].includes(normalizedSslMode) ||
    /railway|render|supabase|neon|aiven|amazonaws/i.test(connectionString)

  if (['disable', 'false', '0', 'off'].includes(normalizedSslMode)) {
    return { connectionString, ssl: false }
  }

  if (forceSsl) {
    return { connectionString, ssl: { rejectUnauthorized: false } }
  }

  return { connectionString }
}
