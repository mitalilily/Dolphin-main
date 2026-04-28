import { qaEnv } from '../config/env'
import { api, authHeaders } from '../config/httpClient'
import { signupClientByOtp } from '../helpers/auth'
import { loadOrderPayload } from '../helpers/payloads'
import { qaLog } from '../utils/logger'

const describeLoad = qaEnv.runLoad && qaEnv.runLiveE2E ? describe : describe.skip

describeLoad('LOAD - 100 concurrent orders', () => {
  it('creates 100 concurrent order requests and reports pass/fail summary', async () => {
    const client = await signupClientByOtp(`${Date.now()}-load@example.com`)
    const token = client.accessToken
    const template = loadOrderPayload(qaEnv.validOrderPayloadPath)

    const requests = Array.from({ length: 100 }).map((_, index) => {
      const payload = {
        ...template,
        order_number: `LOAD-${Date.now()}-${index}`,
      }

      return api
        .post('/api/orders/b2c/create', payload, {
          headers: authHeaders(token),
          timeout: qaEnv.longTimeoutMs,
        })
        .then((response) => ({ ok: true, status: response.status }))
        .catch((error) => ({ ok: false, status: error?.response?.status || 0 }))
    })

    const results = await Promise.all(requests)
    const successCount = results.filter((item) => item.ok).length
    const failureCount = results.length - successCount

    qaLog.info('Load test result', {
      total: results.length,
      successCount,
      failureCount,
      statuses: results.reduce<Record<string, number>>((acc, curr) => {
        const key = String(curr.status)
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {}),
    })

    expect(results.length).toBe(100)
    // Keep threshold configurable for real systems under varying constraints.
    expect(successCount).toBeGreaterThanOrEqual(50)
  })
})
