import nock from 'nock'
import { IcarryService } from '../../src/models/services/couriers/icarry.service'

jest.mock('../../src/models/services/courierCredentials.service', () => ({
  getEffectiveCourierConfig: jest.fn().mockResolvedValue(null),
}))

describe('IcarryService', () => {
  const base = 'https://www.icarry.in'

  beforeEach(() => {
    process.env.ICARRY_API_BASE = base
    process.env.ICARRY_USERNAME = 'qa-user'
    process.env.ICARRY_API_KEY = 'qa-key'
    IcarryService.clearCachedConfig()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('fails when mandatory payload fields are missing', async () => {
    const service = new IcarryService()
    await expect(service.checkPincodeServiceability({ pincode: '' })).rejects.toThrow('pincode is required')
  })

  it('gets estimate for single shipment', async () => {
    nock(base).post('/api_login').reply(200, { success: 1, api_token: 'token-1' })
    nock(base)
      .post('/api_get_estimate')
      .query({ api_token: 'token-1' })
      .reply(200, { success: 1, estimate: [{ amount: 130 }] })

    const service = new IcarryService()
    const result = await service.getEstimateSingleShipment({
      length: 10,
      breadth: 8,
      height: 5,
      weight: 1,
      destination_pincode: '400001',
      origin_pincode: '560001',
      destination_country_code: 'IN',
      origin_country_code: 'IN',
      shipment_mode: 'E',
      shipment_type: 'C',
      shipment_value: 1000,
    })

    expect(result.success).toBe(1)
  })

  it('handles failed login', async () => {
    nock(base).post('/api_login').reply(401, { error: 'Invalid credentials' })

    const service = new IcarryService()
    await expect(service.login(true)).rejects.toThrow('Invalid credentials')
  })
})
