import { AxiosError } from 'axios'
import { qaEnv } from '../config/env'
import { api, authHeaders } from '../config/httpClient'
import { describeLive } from '../helpers/live'
import { scenarioContext } from '../helpers/scenarioContext'
import { loadOrderPayload } from '../helpers/payloads'
import { readJsonFile } from '../utils/file'

describeLive('C. ORDER CREATION', () => {
  it('valid order should be created', async () => {
    const token = scenarioContext.clientAccessToken
    if (!token) throw new Error('Client auth token missing')

    const payload = loadOrderPayload(qaEnv.validOrderPayloadPath)

    const response = await api.post('/api/orders/b2c/create', payload, {
      headers: authHeaders(token),
      timeout: qaEnv.longTimeoutMs,
    })

    expect([200, 201]).toContain(response.status)

    const shipment = response.data?.shipment || response.data?.data || {}
    scenarioContext.orderId = shipment?.id || shipment?.order_id || payload.order_number
    scenarioContext.awb = shipment?.awb_number || shipment?.awb
  })

  it('missing required fields should fail', async () => {
    const token = scenarioContext.clientAccessToken
    if (!token) throw new Error('Client auth token missing')

    const error = await api
      .post(
        '/api/orders/b2c/create',
        { order_number: '' },
        { headers: authHeaders(token) },
      )
      .catch((err: AxiosError) => err)

    expect([400, 422]).toContain(error.response?.status as number)
  })

  it('invalid weight/dimensions should fail', async () => {
    const token = scenarioContext.clientAccessToken
    if (!token) throw new Error('Client auth token missing')

    const payload = readJsonFile<any>('tests/data/payloads/invalid-cases.json').invalidOrder
    const error = await api
      .post('/api/orders/b2c/create', payload, { headers: authHeaders(token) })
      .catch((err: AxiosError) => err)

    expect([400, 422]).toContain(error.response?.status as number)
  })
})
