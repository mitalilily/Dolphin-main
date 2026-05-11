export type DeploymentSurface = 'marketing' | 'app' | 'full'

const PRODUCTION_MARKETING_URL = 'https://shopnship.in'
const PRODUCTION_CLIENT_APP_URL = 'https://app.shopnship.in'
const PRODUCTION_ADMIN_APP_URL = 'https://admin.shopnship.in'

const normalizeUrl = (url: string) => url.trim().replace(/\/+$/, '')

const getSurfaceFromValue = (value?: string): DeploymentSurface | null => {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'marketing' || normalized === 'app' || normalized === 'full') {
    return normalized
  }
  return null
}

const getSurfaceFromMode = (): DeploymentSurface | null => {
  const mode = import.meta.env.MODE?.trim().toLowerCase()
  if (mode === 'marketing') return 'marketing'
  if (mode === 'app') return 'app'
  return null
}

export const DEPLOYMENT_SURFACE: DeploymentSurface =
  getSurfaceFromValue(import.meta.env.VITE_APP_SURFACE) || getSurfaceFromMode() || 'full'

export const isMarketingSurface = DEPLOYMENT_SURFACE === 'marketing'
export const isSellerAppSurface = DEPLOYMENT_SURFACE === 'app'

export const MARKETING_SITE_URL = normalizeUrl(
  import.meta.env.VITE_MARKETING_SITE_URL || PRODUCTION_MARKETING_URL,
)

export const CLIENT_APP_URL = normalizeUrl(
  import.meta.env.VITE_CLIENT_APP_URL || PRODUCTION_CLIENT_APP_URL,
)

export const AUTH_APP_URL = normalizeUrl(import.meta.env.VITE_AUTH_APP_URL || `${CLIENT_APP_URL}/login`)

export const ADMIN_APP_URL = normalizeUrl(
  import.meta.env.VITE_ADMIN_APP_URL || PRODUCTION_ADMIN_APP_URL,
)

export const ADMIN_AUTH_URL = normalizeUrl(
  import.meta.env.VITE_ADMIN_AUTH_URL || `${ADMIN_APP_URL}/auth/signin`,
)

export const buildExternalUrl = (baseUrl: string, path = '/') => {
  const normalizedBase = `${normalizeUrl(baseUrl)}/`
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  return new URL(normalizedPath, normalizedBase).href.replace(/\/+$/, '')
}
