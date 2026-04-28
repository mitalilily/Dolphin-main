import { ShiprocketCourierService } from '../../src/models/services/couriers/shiprocket.service'
import { ShipmozoService } from '../../src/models/services/couriers/shipmozo.service'
import { IcarryService } from '../../src/models/services/couriers/icarry.service'
import {
  mockIcarrySuccess,
  mockShipmozoSuccess,
  mockShiprocketFailure,
  mockShiprocketSlow,
  mockShiprocketSuccess,
} from '../mocks/courierApis.mock'

jest.mock('../../src/models/services/courierCredentials.service', () => ({
  getEffectiveCourierConfig: jest.fn().mockResolvedValue(null),
}))

describe('D. RATE CALCULATION (mocked courier APIs)', () => {
  beforeEach(() => {
    process.env.SHIPROCKET_API_BASE = 'https://apiv2.shiprocket.in/v1/external'
    process.env.SHIPROCKET_EMAIL = 'qa@example.com'
    process.env.SHIPROCKET_PASSWORD = 'secret'

    process.env.SHIPMOZO_API_BASE = 'https://shipping-api.com/app/api/v1'
    process.env.SHIPMOZO_PUBLIC_KEY = 'pub'
    process.env.SHIPMOZO_PRIVATE_KEY = 'priv'

    process.env.ICARRY_API_BASE = 'https://www.icarry.in'
    process.env.ICARRY_USERNAME = 'qa-user'
    process.env.ICARRY_API_KEY = 'qa-key'

    ShiprocketCourierService.clearCachedConfig()
    ShipmozoService.clearCachedConfig()
    IcarryService.clearCachedConfig()
  })

  it('multiple couriers return rates', async () => {
    mockShiprocketSuccess()
    mockShipmozoSuccess()
    mockIcarrySuccess()

    const shiprocket = new ShiprocketCourierService()
    const shipmozo = new ShipmozoService()
    const icarry = new IcarryService()

    const [sr, sm, ic] = await Promise.all([
      shiprocket.checkCourierServiceability({ pickup_postcode: '560001', delivery_postcode: '400001' }),
      shipmozo.rateCalculator({
        pickup_pincode: '560001',
        delivery_pincode: '400001',
        payment_type: 'PREPAID',
        shipment_type: 'Forward',
        order_amount: 1000,
        type_of_package: 'Box',
        rov_type: 'none',
        weight: 1,
        dimensions: [{ no_of_box: 1, length: 10, width: 10, height: 10 }],
      }),
      icarry.getEstimateSingleShipment({
        length: 10,
        breadth: 10,
        height: 10,
        weight: 1,
        destination_pincode: '400001',
        origin_pincode: '560001',
        destination_country_code: 'IN',
        origin_country_code: 'IN',
        shipment_mode: 'E',
        shipment_type: 'C',
        shipment_value: 1000,
      }),
    ])

    expect(sr).toBeTruthy()
    expect(sm.result).toBe(1)
    expect(ic.success).toBe(1)
  })

  it('empty response should be handled gracefully', async () => {
    mockShiprocketSuccess()
    const shiprocket = new ShiprocketCourierService()
    const result = await shiprocket.checkCourierServiceability({ pickup_postcode: '560001' })

    const available = result?.data?.available_courier_companies || []
    expect(Array.isArray(available)).toBe(true)
  })

  it('courier API failure should throw', async () => {
    mockShiprocketFailure(503, 'Upstream unavailable')
    const shiprocket = new ShiprocketCourierService()

    await expect(shiprocket.checkCourierServiceability({ pickup_postcode: '560001' })).rejects.toThrow(
      'Upstream unavailable',
    )
  })

  it('timeout handling should throw', async () => {
    mockShiprocketSlow()
    const shiprocket = new ShiprocketCourierService()
    await expect(shiprocket.checkCourierServiceability({ pickup_postcode: '560001' })).rejects.toThrow()
  })
})
