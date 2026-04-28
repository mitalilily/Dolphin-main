import { AxiosError } from 'axios'
import { qaEnv } from '../config/env'
import { api, authHeaders } from '../config/httpClient'
import { adminLogin, signupClientByOtp } from '../helpers/auth'
import { describeLive } from '../helpers/live'
import { scenarioContext } from '../helpers/scenarioContext'
import { qaLog } from '../utils/logger'

describeLive('A. AUTH & CLIENT', () => {
  it('client signup via OTP should succeed', async () => {
    const email = `${Date.now()}-${qaEnv.testClientEmail}`.replace('@', '+qa@')
    qaLog.step('Request OTP for client signup', { email })

    const tokens = await signupClientByOtp(email)

    expect(tokens.accessToken).toBeTruthy()
    scenarioContext.clientAccessToken = tokens.accessToken
    scenarioContext.clientRefreshToken = tokens.refreshToken
    scenarioContext.clientUserId = tokens.userId
  })

  it('admin approval should succeed', async () => {
    if (!scenarioContext.clientUserId) {
      throw new Error('No client user ID found from signup test')
    }

    const admin = await adminLogin()
    scenarioContext.adminAccessToken = admin.accessToken

    const response = await api.patch(
      `/api/admin/users/${scenarioContext.clientUserId}/approve`,
      {},
      { headers: authHeaders(admin.accessToken) },
    )

    expect([200, 204]).toContain(response.status)
  })

  it('invalid signup payload should fail', async () => {
    await expect(api.post('/api/auth/request-otp', { email: 'not-an-email' })).rejects.toMatchObject({
      response: { status: 400 },
    })
  })

  it('blocked client access should be denied when blocked account is configured', async () => {
    if (!qaEnv.blockedClientEmail) {
      qaLog.info('Skipping blocked-client test. QA_BLOCKED_CLIENT_EMAIL is not configured.')
      return
    }

    const error = await api
      .post('/api/auth/request-password-login', {
        email: qaEnv.blockedClientEmail,
        password: qaEnv.blockedClientPassword,
      })
      .catch((err: AxiosError) => err)

    const status = (error as AxiosError)?.response?.status
    expect([401, 403]).toContain(status as number)
  })
})
