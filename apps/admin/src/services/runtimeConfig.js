const DEFAULT_API_BASE_URL = 'https://delexpress-backend.onrender.com/api'
const DEFAULT_SOCKET_URL = 'https://delexpress-backend.onrender.com'

const normalizeBaseUrl = (value, { ensureApi = false } = {}) => {
  if (!value) return null

  try {
    const candidate = new URL(value, window.location.origin)
    const normalized = candidate.href.replace(/\/+$/, '')
    if (!ensureApi) return normalized
    if (normalized.endsWith('/api') || normalized.includes('/api/')) return normalized
    return `${normalized}/api`
  } catch {
    return null
  }
}

export const getAdminApiBaseUrl = () => {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : ''
  const isHostedFrontend =
    currentHost.endsWith('netlify.app') || currentHost.endsWith('vercel.app')
  const isLocalhost =
    currentHost === 'localhost' || currentHost === '127.0.0.1' || currentHost === '0.0.0.0'

  const configured = normalizeBaseUrl(process.env.REACT_APP_API_BASE_URL, { ensureApi: true })
  if (!configured) return DEFAULT_API_BASE_URL

  try {
    const candidate = new URL(configured)
    const pointsBackToFrontend = candidate.hostname === currentHost
    if (pointsBackToFrontend && (isHostedFrontend || !isLocalhost)) {
      return DEFAULT_API_BASE_URL
    }
  } catch {
    return DEFAULT_API_BASE_URL
  }

  return configured
}

export const getAdminSocketUrl = () => {
  const configuredSocket = normalizeBaseUrl(process.env.REACT_APP_SOCKET_URL)
  if (configuredSocket) return configuredSocket

  const apiBase = getAdminApiBaseUrl()
  if (apiBase) return apiBase.replace(/\/api\/?$/, '')

  return DEFAULT_SOCKET_URL
}
