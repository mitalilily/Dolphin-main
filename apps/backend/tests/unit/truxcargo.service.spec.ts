import nock from 'nock'
import { TruxcargoService } from '../../src/models/services/couriers/truxcargo.service'

jest.mock('../../src/models/services/courierCredentials.service', () => ({
  getEffectiveCourierConfig: jest.fn().mockResolvedValue(null),
}))

describe('TruxcargoService', () => {
  const base = 'https://b2b.truxcargo.com'

  beforeEach(() => {
    process.env.TRUXCARGO_API_BASE = base
    process.env.TRUXCARGO_USER_ID = 'qa-user'
    process.env.TRUXCARGO_API_KEY = 'qa-key'
    TruxcargoService.clearCachedConfig()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('adds credentials to Truxcargo create-order payloads', async () => {
    const scope = nock(base, {
      reqheaders: {
        'api-key': 'qa-key',
        'x-api-key': 'qa-key',
      },
    })
      .post('/api/orderb2c/creation', (body) => {
        return body?.key === 'qa-key' && body?.user_id === 'qa-user' && body?.order_id === 'ORD-1'
      })
      .reply(200, { status: true, data: { waybill: 'TRUX123' } })

    const service = new TruxcargoService()
    const result = await service.createOrder({ order_id: 'ORD-1' })

    expect(result.data.waybill).toBe('TRUX123')
    expect(scope.isDone()).toBe(true)
  })

  it('tracks shipments through the Truxcargo B2C tracking endpoint', async () => {
    nock(base)
      .post('/api/orderb2c/tracking', (body) => {
        return body?.key === 'qa-key' && body?.user_id === 'qa-user' && body?.waybill === 'TRUX123'
      })
      .reply(200, { status: true, data: { status: 'In Transit' } })

    const service = new TruxcargoService()
    const result = await service.trackShipment({ waybill: 'TRUX123' })

    expect(result.data.status).toBe('In Transit')
  })

  it('surfaces Truxcargo API validation errors', async () => {
    nock(base).post('/api/orderb2c/creation').reply(400, { message: 'Invalid courier_id' })

    const service = new TruxcargoService()

    await expect(service.createOrder({ order_id: 'ORD-1' })).rejects.toThrow('Invalid courier_id')
  })
})
