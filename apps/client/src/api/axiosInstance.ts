// src/api/axiosInstance.ts
import axios from 'axios'
import { clearAuthTokens, getAuthTokens, setAuthTokens } from './tokenVault'

const RAW_API_BASE_URL = import.meta.env.VITE_API_URL
const DEFAULT_API_BASE_URL = '/api'

const getApiBaseUrl = () => {
  const fallback = DEFAULT_API_BASE_URL.replace(/\/+$/, '')

  try {
    if (!RAW_API_BASE_URL) return fallback

    const candidate = new URL(RAW_API_BASE_URL, window.location.origin)
    const normalized = candidate.href.replace(/\/+$/, '')
    if (normalized.endsWith('/api') || normalized.includes('/api/')) return normalized
    return `${normalized}/api`
  } catch {
    return fallback
  }
}

const API_BASE_URL = getApiBaseUrl()

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

/* ----- attach access token to every request ----- */
api.interceptors.request.use((cfg) => {
  const { accessToken } = getAuthTokens()
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`
  return cfg
})

/* ----- silent‑refresh once per 401 ----- */
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    // Skip refresh if:
    // 1. Not a 401 error
    // 2. Already retried
    // 3. This is the refresh token endpoint itself (avoid infinite loop)
    if (
      err.response?.status !== 401 ||
      original._retry ||
      original.url?.includes('/auth/refresh-token')
    ) {
      return Promise.reject(err)
    }

    original._retry = true

    const { refreshToken } = getAuthTokens()
    if (!refreshToken) {
      console.warn('⚠️ No refresh token available, redirecting to login')
      clearAuthTokens()
      window.location.href = '/login'
      return Promise.reject(err)
    }

    try {
      console.log('🔄 Attempting to refresh access token...')
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/refresh-token`,
        { refreshToken },
        {
          headers: {
            'x-refresh-token': refreshToken, // ✅ Send in header for better security
          },
        },
      )

      if (!data?.accessToken || !data?.refreshToken) {
        throw new Error('Invalid response from refresh token endpoint')
      }

      setAuthTokens(data.accessToken, data.refreshToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      
      console.log('✅ Token refreshed successfully, retrying original request')
      return api(original) // retry original request with new token
    } catch (e: unknown) {
      const error = e as { response?: { data?: { error?: string } }; message?: string }
      console.error('❌ Refresh token failed:', error?.response?.data?.error || error?.message || e)
      clearAuthTokens()
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
      return Promise.reject(e)
    }
  },
)

export default api
