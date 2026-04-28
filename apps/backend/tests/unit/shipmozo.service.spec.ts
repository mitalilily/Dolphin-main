import nock from 'nock'
import { ShipmozoService } from '../../src/models/services/couriers/shipmozo.service'

jest.mock('../../src/models/services/courierCredentials.service', () => ({
  getEffectiveCourierConfig: jest.fn().mockResolvedValue(null),
}))

describe('ShipmozoService', () => {
  const base = 'https://shipping-api.com'

  beforeEach(() => {
    process.env.SHIPMOZO_API_BASE = `${base}/app/api/v1`
    process.env.SHIPMOZO_PUBLIC_KEY = 'pub'
    process.env.SHIPMOZO_PRIVATE_KEY = 'priv'
    ShipmozoService.clearCachedConfig()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('validates required fields for rate calculator', async () => {
    const service = new ShipmozoService()
    await expect(service.rateCalculator({} as any)).rejects.toThrow('Missing required fields')
  })

  it('returns rate calculator data', async () => {
    nock(base)
      .post('/app/api/v1/rate-calculator')
      .reply(200, { result: 1, data: [{ courier_name: 'Shipmozo Express', amount: 99 }] })

    const service = new ShipmozoService()
    const result = await service.rateCalculator({
      pickup_pincode: '560001',
      delivery_pincode: '400001',
      payment_type: 'PREPAID',
      shipment_type: 'Forward',
      order_amount: 500,
      type_of_package: 'Box',
      rov_type: 'none',
      weight: 0.8,
      dimensions: [{ no_of_box: 1, length: 10, width: 8, height: 5 }],
    })

    expect(result.result).toBe(1)
  })
})
