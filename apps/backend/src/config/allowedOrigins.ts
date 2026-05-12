type CorsOriginCallback = (error: Error | null, allow?: boolean) => void

export const normalizeOrigin = (origin: string) => origin.trim().replace(/\/+$/, '').toLowerCase()

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5176',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5176',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'https://dolphinenterprises.in',
  'https://www.dolphinenterprises.in',
  'https://app.dolphinenterprises.in',
  'https://admin.dolphinenterprises.in',
  'https://shopnship.in',
  'https://www.shopnship.in',
  'https://client.shopnship.in',
  'https://app.shopnship.in',
  'https://admin.shopnship.in',
]

const getConfiguredOrigins = () =>
  `${process.env.CORS_ALLOWED_ORIGINS || ''},${process.env.CORS_ORIGINS || ''}`
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map(normalizeOrigin)

export const getAllowedOrigins = () =>
  new Set([...defaultOrigins.map(normalizeOrigin), ...getConfiguredOrigins()])

export const isAllowedOrigin = (origin: string) => {
  const normalizedOrigin = normalizeOrigin(origin)

  if (getAllowedOrigins().has(normalizedOrigin)) {
    return true
  }

  return /^https:\/\/([a-z0-9-]+\.)*(dolphinenterprises|shopnship)\.in$/.test(normalizedOrigin)
}

export const isPlatformPreviewOrigin = (origin?: string) =>
  typeof origin === 'string' &&
  (origin.endsWith('.netlify.app') ||
    origin.endsWith('.netlify.live') ||
    origin.endsWith('.onrender.com') ||
    origin.endsWith('.railway.app') ||
    origin.endsWith('.up.railway.app'))

export const buildCorsOrigin = () => (origin: string | undefined, callback: CorsOriginCallback) => {
  if (!origin || isAllowedOrigin(origin) || isPlatformPreviewOrigin(origin)) {
    callback(null, true)
    return
  }

  callback(new Error(`Not allowed by CORS: ${origin}`))
}
