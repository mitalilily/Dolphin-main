import { AxiosError } from 'axios'
import { api, authHeaders } from '../config/httpClient'
import { describeLive } from '../helpers/live'
import { scenarioContext } from '../helpers/scenarioContext'

describeLive('H. LABEL + AWB', () => {
  it('AWB generation success', async () => {
    expect(scenarioContext.awb).toBeTruthy()
  })

  it('label regeneration endpoint should respond', async () => {
    const token = scenarioContext.clientAccessToken
    if (!token || !scenarioContext.orderId) return

    const response = await api.post(
      `/api/orders/${scenarioContext.orderId}/regenerate-documents`,
      {
        regenerateLabel: true,
        regenerateInvoice: false,
      },
      { headers: authHeaders(token) },
    )

    expect([200, 400, 404]).toContain(response.status)
  })

  it('missing AWB edge case should fail tracking', async () => {
    const error = await api.get('/api/orders/track').catch((err: AxiosError) => err)
    expect([400, 422]).toContain(error.response?.status as number)
  })
})
