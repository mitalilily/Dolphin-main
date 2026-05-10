const DEFAULT_API_BASE_URL = '/api'
const DEFAULT_SOCKET_URL = typeof window !== 'undefined' ? window.location.origin : ''
const ACTIVE_ADMIN_API_BASE_URL_KEY = 'activeAdminApiBaseUrl'

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

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const readStoredApiBaseUrl = () => {
  if (!canUseStorage()) return null
  return normalizeBaseUrl(window.localStorage.getItem(ACTIVE_ADMIN_API_BASE_URL_KEY), {
    ensureApi: true,
  })
}

export const setPreferredAdminApiBaseUrl = (value) => {
  const normalized = normalizeBaseUrl(value, { ensureApi: true })
  if (!canUseStorage()) return normalized

  if (normalized) {
    window.localStorage.setItem(ACTIVE_ADMIN_API_BASE_URL_KEY, normalized)
  } else {
    window.localStorage.removeItem(ACTIVE_ADMIN_API_BASE_URL_KEY)
  }

  return normalized
}

export const getAdminApiBaseUrlCandidates = () => {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : ''
  const isHostedFrontend =
    currentHost.endsWith('netlify.app') || currentHost.endsWith('vercel.app')
  const isLocalhost =
    currentHost === 'localhost' || currentHost === '127.0.0.1' || currentHost === '0.0.0.0'
  const isSelfHostedFrontend = Boolean(currentHost) && !isHostedFrontend && !isLocalhost

  const configured = normalizeBaseUrl(
    process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_BACKEND_URL,
    { ensureApi: true },
  )
  const socketDerived = normalizeBaseUrl(process.env.REACT_APP_SOCKET_URL, { ensureApi: true })
  const sameOriginApi = normalizeBaseUrl(DEFAULT_API_BASE_URL, { ensureApi: true })
  const stored = readStoredApiBaseUrl()
  const environmentCandidates = [configured, socketDerived, sameOriginApi]
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
  const trustedCandidates = environmentCandidates

  // On hosted/self-hosted frontends, ignore stale manual overrides that don't match
  // the current deployment. This prevents browser-local storage from pinning Admin to a wrong backend.
  const safeStored =
    stored &&
    (!isHostedFrontend && !isSelfHostedFrontend
      ? true
      : isSelfHostedFrontend
        ? environmentCandidates.includes(stored)
        : trustedCandidates.includes(stored))
      ? stored
      : null
  if (stored && !safeStored && canUseStorage()) {
    window.localStorage.removeItem(ACTIVE_ADMIN_API_BASE_URL_KEY)
  }

  const candidates = [configured, socketDerived, sameOriginApi, safeStored]
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)

  return candidates.filter((candidate) => {
    try {
      const parsed = new URL(candidate)
      const pointsBackToFrontend = parsed.hostname === currentHost
      if (pointsBackToFrontend && isHostedFrontend && !isLocalhost) {
        return false
      }
      return true
    } catch {
      return false
    }
  })
}

export const getAdminApiBaseUrl = () => {
  const [primaryCandidate] = getAdminApiBaseUrlCandidates()
  return primaryCandidate || DEFAULT_API_BASE_URL
}

export const getNextAdminApiBaseUrl = (currentValue) => {
  const candidates = getAdminApiBaseUrlCandidates()
  const normalizedCurrent = normalizeBaseUrl(currentValue, { ensureApi: true })
  const currentIndex = candidates.findIndex((candidate) => candidate === normalizedCurrent)

  if (currentIndex === -1) return candidates[0] || null

  return candidates[currentIndex + 1] || null
}

export const getAdminSocketUrl = () => {
  const configuredSocket = normalizeBaseUrl(process.env.REACT_APP_SOCKET_URL)
  if (configuredSocket) return configuredSocket

  const apiBase = getAdminApiBaseUrl()
  if (apiBase) return apiBase.replace(/\/api\/?$/, '')

  return DEFAULT_SOCKET_URL
}
