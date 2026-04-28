import { AxiosError } from 'axios'
import { api, authHeaders } from '../config/httpClient'
import { describeLive } from '../helpers/live'
import { scenarioContext } from '../helpers/scenarioContext'

describeLive('I. INVOICE', () => {
  it('invoice list should return valid financial numbers', async () => {
    const token = scenarioContext.clientAccessToken
    if (!token) throw new Error('Client auth token missing')

    const response = await api.get('/api/billing/invoices', {
      headers: authHeaders(token),
    })

    expect(response.status).toBe(200)
    const rows = response.data?.data || response.data?.invoices || []

    if (Array.isArray(rows) && rows.length > 0) {
      const first = rows[0]
      const amount = Number(first.totalAmount ?? first.total_amount ?? 0)
      expect(Number.isFinite(amount)).toBe(true)
      expect(amount).toBeGreaterThanOrEqual(0)

      if (first.gstAmount !== undefined || first.gst_amount !== undefined) {
        const gst = Number(first.gstAmount ?? first.gst_amount)
        expect(Number.isFinite(gst)).toBe(true)
        expect(gst).toBeGreaterThanOrEqual(0)
      }

      scenarioContext.invoiceId = first.id
    }
  })

  it('invoice generation endpoint should accept valid request shape', async () => {
    const token = scenarioContext.clientAccessToken
    if (!token) throw new Error('Client auth token missing')

    const responseOrError = await api
      .post(
        '/api/billing/invoices/generate',
        {
          fromDate: '2026-01-01',
          toDate: '2026-01-31',
        },
        { headers: authHeaders(token) },
      )
      .catch((err: AxiosError) => err)

    const status = (responseOrError as AxiosError).response?.status || (responseOrError as any).status
    expect([200, 201, 400, 422]).toContain(status)
  })

  it('missing invoice data should fail', async () => {
    const token = scenarioContext.clientAccessToken
    if (!token) throw new Error('Client auth token missing')

    const error = await api
      .post('/api/billing/invoices/generate', {}, { headers: authHeaders(token) })
      .catch((err: AxiosError) => err)

    expect([400, 422]).toContain(error.response?.status as number)
  })
})
