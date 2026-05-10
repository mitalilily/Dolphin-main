export const shouldUseDatabaseSsl = (databaseUrl: string, sslOverride?: string) => {
  const sslMode = `${sslOverride || process.env.PGSSLMODE || process.env.DATABASE_SSL || process.env.DB_SSL || ''}`
    .trim()
    .toLowerCase()

  if (['require', 'true', '1', 'yes'].includes(sslMode)) return true
  if (['disable', 'false', '0', 'no'].includes(sslMode)) return false

  return (
    /sslmode=require/i.test(databaseUrl) ||
    /sslmode=no-verify/i.test(databaseUrl) ||
    /render\.com|railway\.app|supabase\.co/i.test(databaseUrl)
  )
}

export const databaseSslConfig = (databaseUrl: string) =>
  shouldUseDatabaseSsl(databaseUrl) ? { rejectUnauthorized: false } : false
