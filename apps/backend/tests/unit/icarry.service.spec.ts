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

  it('gets multi-box estimate with top-level boxes payload', async () => {
    nock(base).post('/api_login').reply(200, { success: 1, api_token: 'token-1' })
    nock(base)
      .post('/api_get_estimate_b2b', (body) => {
        return Array.isArray(body?.boxes) && body.boxes.length === 1 && body?.parcel === undefined
      })
      .query({ api_token: 'token-1' })
      .reply(200, { success: 1, estimate: { 'iCarry LTL': { courier_cost: 250 } } })

    const service = new IcarryService()
    const result = await service.getEstimateMultiBoxShipment({
      destination_pincode: '400001',
      origin_pincode: '560001',
      destination_country_code: 'IN',
      origin_country_code: 'IN',
      shipment_mode: 'E',
      shipment_type: 'P',
      shipment_value: 1000,
      boxes: [
        {
          quantity: 1,
          length: 10,
          breadth: 8,
          height: 5,
          dimension_unit: 'cm',
          weight: 1000,
          weight_unit: 'gm',
        },
      ],
    })

    expect(result.success).toBe(1)
  })

  it('aliases international estimates into estimate for callers', async () => {
    nock(base).post('/api_login').reply(200, { success: 1, api_token: 'token-1' })
    nock(base)
      .post('/api_get_estimate_international')
      .query({ api_token: 'token-1' })
      .reply(200, { success: 1, estimates: [{ courier_name: 'iCarry Global', total: 999 }] })

    const service = new IcarryService()
    const result = await service.getEstimateInternationalShipment({
      weight: 520,
      length: 10,
      breadth: 10,
      height: 25,
      origin_pincode: '400081',
      origin_country_code: 'IN',
      destination_country_code: 'US',
    })

    expect(result.estimates).toHaveLength(1)
    expect(result.estimate).toHaveLength(1)
  })

  it('handles failed login', async () => {
    nock(base).post('/api_login').reply(401, { error: 'Invalid credentials' })

    const service = new IcarryService()
    await expect(service.login(true)).rejects.toThrow('Invalid credentials')
  })

  it('handles timeout responses', async () => {
    nock(base).post('/api_login').reply(200, { success: 1, api_token: 'token-1' })
    nock(base)
      .post('/api_get_estimate')
      .times(3)
      .query({ api_token: 'token-1' })
      .delay(31000)
      .reply(200, { success: 1, estimate: [] })

    const service = new IcarryService()
    await expect(
      service.getEstimateSingleShipment({
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
      }),
    ).rejects.toThrow()
  })
})
