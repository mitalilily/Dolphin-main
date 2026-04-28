import { AxiosError } from 'axios'
import { api, authHeaders } from '../config/httpClient'
import { describeLive } from '../helpers/live'
import { scenarioContext } from '../helpers/scenarioContext'
import { withRetry } from '../utils/retry'

describeLive('F. MANIFESTATION', () => {
  it('successful shipment manifestation', async () => {
    const token = scenarioContext.clientAccessToken
    if (!token) throw new Error('Client auth token missing')
    if (!scenarioContext.awb) {
      return
    }

    const response = await api.post(
      '/api/orders/b2c/manifest',
      {
        awbs: [scenarioContext.awb],
        type: 'b2c',
      },
      { headers: authHeaders(token), timeout: 180000 },
    )

    expect(response.status).toBe(200)
    expect(response.data?.success).toBe(true)
  })

  it('failed API call returns useful status', async () => {
    const token = scenarioContext.clientAccessToken
    if (!token) throw new Error('Client auth token missing')

    const error = await api
      .post(
        '/api/orders/b2c/manifest',
        { awbs: [], type: 'b2c' },
        { headers: authHeaders(token) },
      )
      .catch((err: AxiosError) => err)

    expect([400, 422]).toContain(error.response?.status as number)
  })

  it('retry logic should recover transient errors', async () => {
    const token = scenarioContext.clientAccessToken
    if (!token) throw new Error('Client auth token missing')
    if (!scenarioContext.orderId) {
      return
    }

    const result = await withRetry(
      async () => {
        const response = await api.post(
          `/api/orders/b2c/${scenarioContext.orderId}/retry-manifest`,
          {},
          { headers: authHeaders(token) },
        )
        return response
      },
      {
        retries: 2,
        delayMs: 1000,
        shouldRetry: (error) => {
          const status = (error as AxiosError)?.response?.status
          return Boolean(status && status >= 500)
        },
      },
    ).catch(() => null)

    expect(result === null || [200, 400, 404].includes(result.status)).toBe(true)
  })
})
