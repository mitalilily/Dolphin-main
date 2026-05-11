// src/api/axiosInstance.ts
import axios from 'axios'
import { clearAuthTokens, getAuthTokens, setAuthTokens } from './tokenVault'

const RAW_API_BASE_URL = import.meta.env.VITE_API_URL
const DEFAULT_API_BASE_URL = '/api'

const getApiBaseUrl = () => {
  const fallback = DEFAULT_API_BASE_URL.replace(/\/+$/, '')

  try {
    if (!RAW_API_BASE_URL) return fallback
    const raw = String(RAW_API_BASE_URL).trim()

    // Handle relative path-style env values robustly (e.g. "/api", "//api/").
    if (raw.startsWith('/')) {
      const collapsed = `/${raw.replace(/^\/+/, '').replace(/\/+$/, '')}`
      if (collapsed === '/api' || collapsed.startsWith('/api/')) return collapsed
      return `${collapsed}/api`
    }

    const candidate = new URL(raw, window.location.origin)
    const normalized = candidate.href.replace(/\/+$/, '')
    if (normalized.endsWith('/api') || normalized.includes('/api/')) return normalized
    return `${normalized}/api`
  } catch {
    return fallback
  }
}

const API_BASE_URL = getApiBaseUrl()

const PUBLIC_AUTH_PATHS = [
  '/auth/request-password-login',
  '/auth/verify-user-email',
  '/auth/request-otp',
  '/auth/verify-otp',
  '/auth/signin-with-google',
  '/auth/admin/login',
]

const getPathname = (url?: string) => {
  if (!url) return ''

  try {
    return new URL(url, window.location.origin).pathname
  } catch {
    return url.startsWith('/') ? url.split('?')[0] : `/${url.split('?')[0]}`
  }
}

const isPublicAuthRequest = (url?: string) => {
  const pathname = getPathname(url)
  const apiPath = pathname.startsWith('/api/') ? pathname.slice(4) : pathname
  return PUBLIC_AUTH_PATHS.some((path) => apiPath === path || apiPath.endsWith(path))
}

const isAuthScreen = () =>
  typeof window !== 'undefined' &&
  (window.location.pathname === '/login' || window.location.pathname === '/signup')

const removeAuthorizationHeader = (headers: unknown) => {
  if (!headers || typeof headers !== 'object') return

  const maybeAxiosHeaders = headers as { delete?: (name: string) => void; Authorization?: string }
  if (typeof maybeAxiosHeaders.delete === 'function') {
    maybeAxiosHeaders.delete('Authorization')
    return
  }

  delete maybeAxiosHeaders.Authorization
}

const redirectToLoginWhenNeeded = () => {
  clearAuthTokens()
  if (!isAuthScreen()) {
    window.location.href = '/login'
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

/* ----- attach access token to every protected request ----- */
api.interceptors.request.use((cfg) => {
  if (isPublicAuthRequest(cfg.url)) {
    removeAuthorizationHeader(cfg.headers)
    return cfg
  }

  const { accessToken } = getAuthTokens()
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`
  return cfg
})

/* ----- silent refresh once per protected 401 ----- */
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    // Public auth failures are form errors, not session-expiry events.
    if (
      err.response?.status !== 401 ||
      original?._retry ||
      original?.url?.includes('/auth/refresh-token') ||
      isPublicAuthRequest(original?.url)
    ) {
      return Promise.reject(err)
    }

    original._retry = true

    const { refreshToken } = getAuthTokens()
    if (!refreshToken) {
      console.warn('No refresh token available; clearing stale auth state.')
      redirectToLoginWhenNeeded()
      return Promise.reject(err)
    }

    try {
      console.log('Attempting to refresh access token...')
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/refresh-token`,
        { refreshToken },
        {
          headers: {
            'x-refresh-token': refreshToken,
          },
        },
      )

      if (!data?.accessToken || !data?.refreshToken) {
        throw new Error('Invalid response from refresh token endpoint')
      }

      setAuthTokens(data.accessToken, data.refreshToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`

      console.log('Token refreshed successfully; retrying original request.')
      return api(original)
    } catch (e: unknown) {
      const error = e as { response?: { data?: { error?: string } }; message?: string }
      console.error('Refresh token failed:', error?.response?.data?.error || error?.message || e)
      redirectToLoginWhenNeeded()
      return Promise.reject(e)
    }
  },
)

export default api
