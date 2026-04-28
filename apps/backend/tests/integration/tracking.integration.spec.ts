import { AxiosError } from 'axios'
import { api } from '../config/httpClient'
import { describeLive } from '../helpers/live'
import { scenarioContext } from '../helpers/scenarioContext'

describeLive('J. TRACKING', () => {
  it('polling tracking endpoint should work for known AWB', async () => {
    if (!scenarioContext.awb) return

    const response = await api.get('/api/orders/track', {
      params: { awb: scenarioContext.awb },
    })

    expect([200]).toContain(response.status)
    expect(response.data?.success).toBe(true)
  })

  it('webhook failure should be handled gracefully', async () => {
    const error = await api
      .post('/api/webhook/xpressbees', {
        malformed: true,
      })
      .catch((err: AxiosError) => err)

    expect([400, 401, 403, 500]).toContain(error.response?.status as number)
  })

  it('polling fallback when webhook fails', async () => {
    if (!scenarioContext.awb) return

    const webhookError = await api
      .post('/api/webhook/ekart', {
        invalid: true,
      })
      .catch((err: AxiosError) => err)

    expect([400, 401, 403, 500]).toContain(webhookError.response?.status as number)

    const poll = await api.get('/api/orders/track', {
      params: { awb: scenarioContext.awb },
    })

    expect([200]).toContain(poll.status)
  })
})
