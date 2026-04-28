import nock from 'nock'
import { ShiprocketCourierService } from '../../src/models/services/couriers/shiprocket.service'

jest.mock('../../src/models/services/courierCredentials.service', () => ({
  getEffectiveCourierConfig: jest.fn().mockResolvedValue(null),
}))

describe('ShiprocketCourierService', () => {
  const base = 'https://apiv2.shiprocket.in'

  beforeEach(() => {
    process.env.SHIPROCKET_API_BASE = `${base}/v1/external`
    process.env.SHIPROCKET_EMAIL = 'qa@example.com'
    process.env.SHIPROCKET_PASSWORD = 'secret'
    ShiprocketCourierService.clearCachedConfig()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('fetches serviceability successfully', async () => {
    nock(base).post('/v1/external/auth/login').reply(200, { token: 'token-1' })
    nock(base)
      .get('/v1/external/courier/serviceability')
      .query(true)
      .reply(200, { status: 200, data: { available_courier_companies: [{ courier_name: 'X' }] } })

    const service = new ShiprocketCourierService()
    const result = await service.checkCourierServiceability({ pickup_postcode: '560001' })

    expect(result.status).toBe(200)
  })

  it('handles upstream failure', async () => {
    nock(base).post('/v1/external/auth/login').reply(200, { token: 'token-1' })
    nock(base)
      .get('/v1/external/courier/serviceability')
      .query(true)
      .reply(503, { message: 'Service unavailable' })

    const service = new ShiprocketCourierService()
    await expect(service.checkCourierServiceability({ pickup_postcode: '560001' })).rejects.toThrow(
      'Service unavailable',
    )
  })

  it('handles timeout responses', async () => {
    nock(base).post('/v1/external/auth/login').reply(200, { token: 'token-1' })
    nock(base)
      .get('/v1/external/courier/serviceability')
      .query(true)
      .delay(31000)
      .reply(200, { status: 200, data: {} })

    const service = new ShiprocketCourierService()
    await expect(service.checkCourierServiceability({ pickup_postcode: '560001' })).rejects.toThrow()
  })
})
