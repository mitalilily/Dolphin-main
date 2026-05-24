jest.mock('../../src/models/client', () => ({ db: {} }))

jest.mock('../../src/models/services/courierCredentials.service', () => ({
  getEffectiveCourierConfig: jest.fn().mockResolvedValue(null),
}))

import {
  getAllCourierCapabilities,
  getCourierCapabilities,
  getUnifiedCourierClient,
} from '../../src/models/services/couriers/unifiedCourierClient'
import { TruxcargoService } from '../../src/models/services/couriers/truxcargo.service'

describe('unified courier workflow capabilities', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('publishes workflow capabilities for the four active providers', () => {
    const providers = getAllCourierCapabilities().map((item) => item.provider).sort()

    expect(providers).toEqual(['icarry', 'shipmozo', 'shiprocket', 'truxcargo'])
    expect(getCourierCapabilities('icarry')).toMatchObject({
      flowType: 'TYPE_C_MANIFEST_OR_BOOKING_BEFORE_PICKUP',
      trackingKey: 'shipment_id',
      requiresManifestBeforePickup: true,
      autoPickupOnCreate: true,
    })
    expect(getCourierCapabilities('shipmozo')).toMatchObject({
      flowType: 'TYPE_B_CREATE_PLUS_PICKUP',
      requiresAwbBeforePickup: true,
    })
  })

  it('keeps deferred-manifest providers local until the manifest action', async () => {
    const icarry = getUnifiedCourierClient('icarry')
    const result = await icarry.createShipment({ deferBookingUntilManifest: true })

    expect(result).toMatchObject({
      success: true,
      provider: 'icarry',
      deferred_manifest: true,
      booking_state: 'pending_manifest',
      next_action: 'generateManifest',
    })
  })

  it('keeps Truxcargo shipment creation local until manifest by default', async () => {
    const createOrder = jest.spyOn(TruxcargoService.prototype, 'createOrder')
    const truxcargo = getUnifiedCourierClient('truxcargo')

    const result = await truxcargo.createShipment({ courier_id: '702' })

    expect(result).toMatchObject({
      success: true,
      provider: 'truxcargo',
      deferred_manifest: true,
      booking_state: 'pending_manifest',
      next_action: 'generateManifest',
      courier_id: '702',
    })
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('turns Truxcargo manifest into order creation plus packaging slip', async () => {
    const createOrder = jest
      .spyOn(TruxcargoService.prototype, 'createOrder')
      .mockResolvedValue({ status: true, data: { waybill: 'TRUX123', shipment_id: 'SHIP123' } })
    const createPackagingSlip = jest
      .spyOn(TruxcargoService.prototype, 'createPackagingSlip')
      .mockResolvedValue({ status: true, label: 'label-image' })
    const truxcargo = getUnifiedCourierClient('truxcargo')

    const result = await truxcargo.generateManifest({ order_id: 'ORD-1', courier_id: '702' })

    expect(createOrder).toHaveBeenCalledWith({ order_id: 'ORD-1', courier_id: '702' })
    expect(createPackagingSlip).toHaveBeenCalledWith({
      order_id: 'ORD-1',
      courier_id: '702',
      waybill: 'TRUX123',
    })
    expect(result).toMatchObject({
      success: true,
      provider: 'truxcargo',
      action: 'generateManifest',
      booking_state: 'manifested',
      waybill: 'TRUX123',
      awb_number: 'TRUX123',
      shipment_id: 'SHIP123',
      schedule_pickup: 'implicit',
    })
  })

  it('normalizes Truxcargo rate payloads to the provider contract', async () => {
    const getShippingCharge = jest
      .spyOn(TruxcargoService.prototype, 'getShippingCharge')
      .mockResolvedValue({ status: true, data: { total: 100 } })
    const truxcargo = getUnifiedCourierClient('truxcargo')

    await truxcargo.getRates({
      courier_id: 702,
      source_pincode: '122003',
      destination_pincode: '110001',
      payment_type: 'prepaid',
      order_amount: 200,
      weight: 500,
      length: 10,
      breadth: 8,
      height: 6,
      order_items: [{ qty: 2, price: 100, sku: 'SKU-1', hsn: '6201', name: 'Shirt' }],
    })

    expect(getShippingCharge).toHaveBeenCalledWith(
      expect.objectContaining({
        partner: '702',
        courier_id: '702',
        origin: '122003',
        destination: '110001',
        payment_type: 'PREPAID',
        payment_mode: 'PREPAID',
        mode: 'PREPAID',
        insurance: 'NO',
        weight: 0.5,
        qty: 2,
        product_quantity: 2,
        product_description: 'Shirt',
      }),
    )
    expect(getShippingCharge).toHaveBeenCalledWith(
      expect.objectContaining({
        length: [10],
        breadth: [8],
        width: [8],
        height: [6],
        quantity: [2],
        count: [2],
        product_price: [100],
        sku: ['SKU-1'],
        hsn_code: ['6201'],
      }),
    )
  })

  it('tracks Truxcargo by order_id without inventing a waybill placeholder', async () => {
    const trackShipment = jest
      .spyOn(TruxcargoService.prototype, 'trackShipment')
      .mockResolvedValue({ status: true })
    const truxcargo = getUnifiedCourierClient('truxcargo')

    await truxcargo.trackShipment({ order_id: 'ORD-1' })

    expect(trackShipment).toHaveBeenCalledWith({ order_id: 'ORD-1' })
  })

  it('treats unsupported separate manifests as a safe no-op for Shipmozo', async () => {
    const shipmozo = getUnifiedCourierClient('shipmozo')
    const result = await shipmozo.generateManifest({ order_id: 'ORD-1' })

    expect(result).toMatchObject({
      success: true,
      provider: 'shipmozo',
      action: 'generateManifest',
      skipped: true,
    })
  })
})
