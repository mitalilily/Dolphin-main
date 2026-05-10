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

  it('pushes an order without assigning courier or pickup', async () => {
    nock(base)
      .post('/app/api/v1/push-order', (body) => {
        expect(body.order_id).toBe('DOLPHIN-UNIT-1')
        expect(body.warehouse_id).toBe('119176')
        return true
      })
      .reply(200, {
        result: 1,
        message: 'Success',
        data: { order_id: 'DOLPHIN-UNIT-1', reference_id: 'REF-1' },
      })

    const service = new ShipmozoService()
    const result = await service.pushOrder({
      order_id: 'DOLPHIN-UNIT-1',
      order_date: '2026-05-10',
      order_type: 'ESSENTIALS',
      consignee_name: 'Test Customer',
      consignee_phone: '9876543210',
      consignee_address_line_one: 'Connaught Place',
      consignee_pin_code: '110001',
      consignee_city: 'Delhi',
      consignee_state: 'Delhi',
      product_detail: [{ name: 'Item', quantity: 1, unit_price: 100 }],
      payment_type: 'PREPAID',
      cod_amount: '',
      weight: 500,
      length: 22,
      width: 10,
      height: 10,
      warehouse_id: '119176',
    })

    expect(result.data?.order_id).toBe('DOLPHIN-UNIT-1')
  })

  it('preserves Shipmozo business validation errors', async () => {
    nock(base)
      .post('/app/api/v1/push-order')
      .reply(200, { result: 0, message: 'Order already exists' })

    const service = new ShipmozoService()
    await expect(
      service.pushOrder({
        order_id: 'DOLPHIN-UNIT-1',
        order_date: '2026-05-10',
        consignee_name: 'Test Customer',
        consignee_phone: '9876543210',
        consignee_address_line_one: 'Connaught Place',
        consignee_pin_code: '110001',
        consignee_city: 'Delhi',
        consignee_state: 'Delhi',
        product_detail: [{ name: 'Item', quantity: 1, unit_price: 100 }],
        payment_type: 'PREPAID',
        weight: 500,
        length: 22,
        width: 10,
        height: 10,
        warehouse_id: '119176',
      }),
    ).rejects.toMatchObject({ statusCode: 400, message: 'Order already exists' })
  })

  it('handles upstream failure', async () => {
    nock(base).post('/app/api/v1/rate-calculator').times(3).reply(503, { message: 'Service unavailable' })

    const service = new ShipmozoService()
    await expect(
      service.rateCalculator({
        pickup_pincode: '560001',
        delivery_pincode: '400001',
        payment_type: 'PREPAID',
        shipment_type: 'Forward',
        order_amount: 500,
        type_of_package: 'Box',
        rov_type: 'none',
        weight: 0.8,
        dimensions: [{ no_of_box: 1, length: 10, width: 8, height: 5 }],
      }),
    ).rejects.toThrow('Service unavailable')
  })

  it('handles timeout responses', async () => {
    nock(base)
      .post('/app/api/v1/rate-calculator')
      .times(3)
      .delay(31000)
      .reply(200, { result: 1, data: [] })

    const service = new ShipmozoService()
    await expect(
      service.rateCalculator({
        pickup_pincode: '560001',
        delivery_pincode: '400001',
        payment_type: 'PREPAID',
        shipment_type: 'Forward',
        order_amount: 500,
        type_of_package: 'Box',
        rov_type: 'none',
        weight: 0.8,
        dimensions: [{ no_of_box: 1, length: 10, width: 8, height: 5 }],
      }),
    ).rejects.toThrow()
  })
})
