import { AxiosError } from 'axios'
import { api, authHeaders } from '../config/httpClient'
import { adminLogin } from '../helpers/auth'
import { describeLive } from '../helpers/live'
import { scenarioContext } from '../helpers/scenarioContext'

describeLive('G. EXTERNAL API VERIFICATION', () => {
  it('fetch shipment using AWB and validate status', async () => {
    if (!scenarioContext.awb) return

    const adminToken = scenarioContext.adminAccessToken || (await adminLogin()).accessToken

    const response = await api.get(`/api/admin/couriers/shiprocket/courier/track/${scenarioContext.awb}`, {
      headers: authHeaders(adminToken),
    })

    expect(response.status).toBe(200)
    expect(response.data?.success !== false).toBe(true)
  })

  it('mismatch AWB should be handled', async () => {
    const adminToken = scenarioContext.adminAccessToken || (await adminLogin()).accessToken

    const error = await api
      .get('/api/admin/couriers/shiprocket/courier/track/INVALID-AWB-123', {
        headers: authHeaders(adminToken),
      })
      .catch((err: AxiosError) => err)

    expect([400, 404, 422, 500]).toContain(error.response?.status as number)
  })
})
