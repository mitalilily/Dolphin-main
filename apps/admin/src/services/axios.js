import axios from 'axios'
import {
  getAdminApiBaseUrl,
  getNextAdminApiBaseUrl,
  setPreferredAdminApiBaseUrl,
} from './runtimeConfig'

const API_BASE_URL = getAdminApiBaseUrl()

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  config.baseURL = getAdminApiBaseUrl()
  const token = localStorage.getItem('accessToken')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const currentBaseUrl = originalRequest?.baseURL || API_BASE_URL

    if (!error.response && originalRequest && !originalRequest._backendRetry) {
      const nextBaseUrl = getNextAdminApiBaseUrl(currentBaseUrl)

      if (nextBaseUrl && nextBaseUrl !== currentBaseUrl) {
        originalRequest._backendRetry = true
        originalRequest.baseURL = setPreferredAdminApiBaseUrl(nextBaseUrl) || nextBaseUrl
        return api(originalRequest)
      }
    }

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/auth/refresh-token') &&
      localStorage.getItem('refreshToken')
    ) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken },
          {
            headers: {
              'x-refresh-token': refreshToken,
            },
          },
        )

        const newAccessToken = res.data.accessToken
        const newRefreshToken = res.data.refreshToken

        localStorage.setItem('accessToken', newAccessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        import('../store/useAuthStore').then(({ useAuthStore }) => {
          const userId = localStorage.getItem('userId')
          useAuthStore.getState().login(newAccessToken, userId, newRefreshToken)
        })

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshErr) {
        console.error('Refresh token failed:', refreshErr)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('userId')

        import('../store/useAuthStore').then(({ useAuthStore }) => {
          useAuthStore.getState().logout()
        })

        window.location.href = '/auth/signin'
      }
    }

    return Promise.reject(error)
  },
)

export default api
