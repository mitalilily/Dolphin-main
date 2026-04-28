import { qaEnv } from '../config/env'
import { api, authHeaders } from '../config/httpClient'
import { adminLogin, signupClientByOtp } from '../helpers/auth'
import { describeLive } from '../helpers/live'
import { loadOrderPayload, loadWarehousePayload } from '../helpers/payloads'
import { scenarioContext } from '../helpers/scenarioContext'
import { qaLog } from '../utils/logger'

describeLive('E2E - FULL SHIPPING WORKFLOW', () => {
  it('runs onboarding -> warehouse -> order -> rate -> manifest -> invoice -> tracking', async () => {
    qaLog.step('Client onboarding via OTP')
    const clientEmail = `${Date.now()}-workflow@example.com`
    const client = await signupClientByOtp(clientEmail)
    scenarioContext.clientAccessToken = client.accessToken
    scenarioContext.clientUserId = client.userId

    qaLog.step('Admin approval')
    const admin = await adminLogin()
    await api.patch(`/api/admin/users/${client.userId}/approve`, {}, { headers: authHeaders(admin.accessToken) })

    qaLog.step('Create warehouse')
    const warehousePayload = loadWarehousePayload(qaEnv.validWarehousePayloadPath)
    const warehouseRes = await api.post('/api/pickup-addresses', warehousePayload, {
      headers: authHeaders(client.accessToken),
    })
    expect([200, 201]).toContain(warehouseRes.status)

    qaLog.step('Create order')
    const orderPayload = loadOrderPayload(qaEnv.validOrderPayloadPath)
    const orderRes = await api.post('/api/orders/b2c/create', orderPayload, {
      headers: authHeaders(client.accessToken),
      timeout: qaEnv.longTimeoutMs,
    })
    expect([200, 201]).toContain(orderRes.status)

    const shipment = orderRes.data?.shipment || {}
    const awb = shipment?.awb_number || shipment?.awb

    qaLog.step('Rate calculation')
    const rateRes = await api.post(
      '/api/couriers/available',
      {
        origin: '560001',
        destination: '400001',
        payment_type: 'prepaid',
        weight: 1,
        order_amount: 1000,
      },
      { headers: authHeaders(client.accessToken) },
    )
    expect(rateRes.status).toBe(200)

    if (awb) {
      qaLog.step('Manifest shipment')
      const manifestRes = await api.post(
        '/api/orders/b2c/manifest',
        { awbs: [awb], type: 'b2c' },
        { headers: authHeaders(client.accessToken), timeout: 180000 },
      )
      expect([200]).toContain(manifestRes.status)

      qaLog.step('Tracking')
      const trackRes = await api.get('/api/orders/track', { params: { awb } })
      expect(trackRes.status).toBe(200)
    }

    qaLog.step('Invoice list')
    const invoiceRes = await api.get('/api/billing/invoices', {
      headers: authHeaders(client.accessToken),
    })
    expect(invoiceRes.status).toBe(200)
  })
})
