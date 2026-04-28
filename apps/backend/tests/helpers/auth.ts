import { api } from '../config/httpClient'
import { hasAdminCreds, qaEnv } from '../config/env'
import { qaLog } from '../utils/logger'

export type AuthTokens = {
  accessToken: string
  refreshToken?: string
  userId?: number
}

export const skipIfNoLiveE2E = () => {
  if (!qaEnv.runLiveE2E) {
    qaLog.info('Skipping live E2E suite because QA_RUN_LIVE_E2E=false')
    return true
  }
  return false
}

export const adminLogin = async (): Promise<AuthTokens> => {
  if (!hasAdminCreds()) {
    throw new Error('QA_ADMIN_EMAIL/QA_ADMIN_PASSWORD are required for admin login')
  }

  const { data } = await api.post('/api/auth/admin/login', {
    email: qaEnv.adminEmail,
    password: qaEnv.adminPassword,
  })

  const accessToken = data?.token || data?.accessToken
  if (!accessToken) {
    throw new Error('Admin login succeeded but no token returned')
  }

  return {
    accessToken,
    refreshToken: data?.refreshToken,
    userId: data?.user?.id,
  }
}

export const signupClientByOtp = async (email: string): Promise<AuthTokens> => {
  const req = await api.post('/api/auth/request-otp', { email })
  const otp = req?.data?.otp

  if (!otp && qaEnv.exposeAuthCodes) {
    throw new Error('Inline OTP is expected but not returned by /request-otp')
  }

  const verify = await api.post('/api/auth/verify-otp', {
    email,
    otp,
  })

  const accessToken = verify?.data?.token
  if (!accessToken) {
    throw new Error('OTP verification succeeded but no token returned')
  }

  return {
    accessToken,
    refreshToken: verify?.data?.refreshToken,
    userId: verify?.data?.user?.id,
  }
}
