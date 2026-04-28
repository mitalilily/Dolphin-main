import { AxiosError } from 'axios'
import { qaEnv } from '../config/env'
import { api, authHeaders } from '../config/httpClient'
import { describeLive } from '../helpers/live'
import { scenarioContext } from '../helpers/scenarioContext'
import { loadWarehousePayload } from '../helpers/payloads'
import { readJsonFile } from '../utils/file'
import { qaLog } from '../utils/logger'

describeLive('B. WAREHOUSE', () => {
  it('valid warehouse creation', async () => {
    const token = scenarioContext.clientAccessToken
    if (!token) throw new Error('Client auth token missing. Run auth suite first.')

    const payload = loadWarehousePayload(qaEnv.validWarehousePayloadPath)
    qaLog.step('Create warehouse', payload)

    const response = await api.post('/api/pickup-addresses', payload, {
      headers: authHeaders(token),
    })

    expect([200, 201]).toContain(response.status)
    scenarioContext.warehouseId = response.data?.data?.id || response.data?.id
  })

  it('invalid pincode should fail', async () => {
    const token = scenarioContext.clientAccessToken
    if (!token) throw new Error('Client auth token missing')

    const invalid = readJsonFile<any>('tests/data/payloads/invalid-cases.json').invalidWarehouse

    const error = await api
      .post('/api/pickup-addresses', invalid, { headers: authHeaders(token) })
      .catch((err: AxiosError) => err)

    expect([400, 422]).toContain(error.response?.status as number)
  })

  it('duplicate warehouse should be handled', async () => {
    const token = scenarioContext.clientAccessToken
    if (!token) throw new Error('Client auth token missing')

    const payload = loadWarehousePayload(qaEnv.validWarehousePayloadPath)

    const errorOrResponse = await api
      .post('/api/pickup-addresses', payload, { headers: authHeaders(token) })
      .catch((err: AxiosError) => err)

    const status = (errorOrResponse as AxiosError).response?.status || (errorOrResponse as any).status
    expect([200, 201, 400, 409]).toContain(status)
  })
})
