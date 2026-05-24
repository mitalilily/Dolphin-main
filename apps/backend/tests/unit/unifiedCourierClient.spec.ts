jest.mock('../../src/models/client', () => ({ db: {} }))

jest.mock('../../src/models/services/courierCredentials.service', () => ({
  getEffectiveCourierConfig: jest.fn().mockResolvedValue(null),
}))

import {
  getAllCourierCapabilities,
  getCourierCapabilities,
  getUnifiedCourierClient,
} from '../../src/models/services/couriers/unifiedCourierClient'
import { ShiprocketCourierService } from '../../src/models/services/couriers/shiprocket.service'
import { ShipmozoService } from '../../src/models/services/couriers/shipmozo.service'
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
      actions: expect.objectContaining({ generateManifest: 'provider_api' }),
      requiresAwbBeforePickup: true,
      labelAvailableAfter: 'generateManifest',
    })
    expect(getCourierCapabilities('shiprocket')).toMatchObject({
      flowType: 'TYPE_B_CREATE_PLUS_PICKUP',
      requiresAwbBeforePickup: true,
      requiresManifestBeforePickup: false,
      labelAvailableAfter: 'generateManifest',
      cancellationKey: 'order_id_plus_awb',
    })
  })

  it('turns Shiprocket shipment creation into a pending-AWB provider order', async () => {
    const createCustomOrder = jest
      .spyOn(ShiprocketCourierService.prototype, 'createCustomOrder')
      .mockResolvedValue({ order_id: 101, shipment_id: 202 })
    const shiprocket = getUnifiedCourierClient('shiprocket')

    const result = await shiprocket.createShipment({ order_id: 'ORD-1' })

    expect(createCustomOrder).toHaveBeenCalledWith({ order_id: 'ORD-1' })
    expect(result).toMatchObject({
      success: true,
      provider: 'shiprocket',
      action: 'createShipment',
      booking_state: 'pending_awb',
      remote_order_created: true,
      order_id: '101',
      shipment_id: '202',
      next_action: 'generateAwb',
    })
  })

  it('assigns a Shiprocket AWB before pickup or manifest', async () => {
    const assignAwb = jest
      .spyOn(ShiprocketCourierService.prototype, 'assignAwb')
      .mockResolvedValue({ response: { data: { awb_code: 'SR-AWB-1', courier_name: 'Delhivery' } } })
    const shiprocket = getUnifiedCourierClient('shiprocket')

    const result = await shiprocket.generateAwb({ shipment_id: 202, courier_id: 10 })

    expect(assignAwb).toHaveBeenCalledWith({ shipment_id: 202, courier_id: 10 })
    expect(result).toMatchObject({
      success: true,
      provider: 'shiprocket',
      action: 'generateAwb',
      booking_state: 'awb_assigned',
      shipment_id: '202',
      awb_number: 'SR-AWB-1',
      courier_partner: 'Delhivery',
    })
  })

  it('turns Shiprocket manifest into AWB, pickup, manifest, documents sequence', async () => {
    const assignAwb = jest
      .spyOn(ShiprocketCourierService.prototype, 'assignAwb')
      .mockResolvedValue({ response: { data: { awb_code: 'SR-AWB-1', courier_name: 'Delhivery' } } })
    const generatePickup = jest
      .spyOn(ShiprocketCourierService.prototype, 'generatePickup')
      .mockResolvedValue({ pickup_status: 1 })
    const generateManifest = jest
      .spyOn(ShiprocketCourierService.prototype, 'generateManifest')
      .mockResolvedValue({ status: 1, manifest_url: 'https://docs.example/manifest.pdf' })
    const printManifest = jest
      .spyOn(ShiprocketCourierService.prototype, 'printManifest')
      .mockResolvedValue({ manifest_url: 'https://docs.example/print-manifest.pdf' })
    const generateLabel = jest
      .spyOn(ShiprocketCourierService.prototype, 'generateLabel')
      .mockResolvedValue({ label_url: 'https://docs.example/label.pdf' })
    const generateInvoice = jest
      .spyOn(ShiprocketCourierService.prototype, 'generateInvoice')
      .mockResolvedValue({ invoice_url: 'https://docs.example/invoice.pdf' })
    const shiprocket = getUnifiedCourierClient('shiprocket')

    const result = await shiprocket.generateManifest({
      shipment_id: [202, 203],
      order_ids: [101],
      courier_id: 10,
    })

    expect(assignAwb).toHaveBeenCalledWith({ shipment_id: 202, courier_id: 10 })
    expect(assignAwb).toHaveBeenCalledWith({ shipment_id: 203, courier_id: 10 })
    expect(generatePickup).toHaveBeenCalledWith({ shipment_id: [202] })
    expect(generatePickup).toHaveBeenCalledWith({ shipment_id: [203] })
    expect(generateManifest).toHaveBeenCalledWith({ shipment_id: [202, 203] })
    expect(printManifest).toHaveBeenCalledWith({ order_ids: [101] })
    expect(generateLabel).toHaveBeenCalledWith({ shipment_id: [202, 203] })
    expect(generateInvoice).toHaveBeenCalledWith({ ids: [101] })
    expect(result).toMatchObject({
      success: true,
      provider: 'shiprocket',
      action: 'generateManifest',
      booking_state: 'manifested',
      shipment_ids: [202, 203],
      order_ids: [101],
      awb_number: 'SR-AWB-1',
      courier_partner: 'Delhivery',
      pickup_status: 'scheduled',
      manifest: 'https://docs.example/print-manifest.pdf',
      label: 'https://docs.example/label.pdf',
      invoice: 'https://docs.example/invoice.pdf',
    })
  })

  it('normalizes Shiprocket rate payloads to serviceability params', async () => {
    const checkCourierServiceability = jest
      .spyOn(ShiprocketCourierService.prototype, 'checkCourierServiceability')
      .mockResolvedValue({ status: 200, data: { available_courier_companies: [] } })
    const shiprocket = getUnifiedCourierClient('shiprocket')

    await shiprocket.getRates({
      source_pincode: '122001',
      destination_pincode: '110001',
      payment_type: 'cod',
      order_amount: 999,
      weight: 500,
      length: 12,
      breadth: 9,
      height: 6,
    })

    expect(checkCourierServiceability).toHaveBeenCalledWith(
      expect.objectContaining({
        pickup_postcode: 122001,
        delivery_postcode: 110001,
        cod: 1,
        weight: 0.5,
        length: 12,
        breadth: 9,
        height: 6,
        declared_value: 999,
      }),
    )
  })

  it('rejects Shiprocket tracking without any identifier', async () => {
    const trackByAwb = jest.spyOn(ShiprocketCourierService.prototype, 'trackByAwb')
    const shiprocket = getUnifiedCourierClient('shiprocket')

    expect(() => shiprocket.trackShipment({})).toThrow(
      'Shiprocket tracking requires AWB, shipment_id, or order_id.',
    )
    expect(trackByAwb).not.toHaveBeenCalled()
  })

  it('cancels Shiprocket scalar identifiers as AWBs', async () => {
    const cancelShipmentByAwbs = jest
      .spyOn(ShiprocketCourierService.prototype, 'cancelShipmentByAwbs')
      .mockResolvedValue({ success: true })
    const shiprocket = getUnifiedCourierClient('shiprocket')

    await shiprocket.cancelShipment('SR-AWB-1')

    expect(cancelShipmentByAwbs).toHaveBeenCalledWith({ awbs: ['SR-AWB-1'] })
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

  it('turns Shipmozo shipment creation into a pending-manifest provider order', async () => {
    const pushOrder = jest
      .spyOn(ShipmozoService.prototype, 'pushOrder')
      .mockResolvedValue({ result: 1, data: { order_id: 'SMZ-1', reference_id: 'REF-1' } })
    const shipmozo = getUnifiedCourierClient('shipmozo')

    const result = await shipmozo.createShipment({ order_id: 'SMZ-1' })

    expect(pushOrder).toHaveBeenCalledWith({ order_id: 'SMZ-1' })
    expect(result).toMatchObject({
      success: true,
      provider: 'shipmozo',
      action: 'createShipment',
      booking_state: 'pending_manifest',
      remote_order_created: true,
      order_id: 'SMZ-1',
      shipment_id: 'SMZ-1',
      next_action: 'generateManifest',
    })
  })

  it('turns Shipmozo manifest into assign, pickup, detail, and label calls', async () => {
    const assignCourier = jest
      .spyOn(ShipmozoService.prototype, 'assignCourier')
      .mockResolvedValue({ result: 1, data: { order_id: 'SMZ-1', awb_number: 'AWB-1', courier: 'Amazon ATS' } })
    const schedulePickup = jest
      .spyOn(ShipmozoService.prototype, 'schedulePickup')
      .mockResolvedValue({ result: 1, data: { order_id: 'SMZ-1', awb_number: 'AWB-1' } })
    const getOrderDetail = jest
      .spyOn(ShipmozoService.prototype, 'getOrderDetail')
      .mockResolvedValue({ result: 1, data: [{ order_id: 'SMZ-1', awb_number: 'AWB-1' }] })
    const getOrderLabel = jest
      .spyOn(ShipmozoService.prototype, 'getOrderLabel')
      .mockResolvedValue({ result: 1, data: [{ label: 'https://label.example/awb-1.pdf' }] })
    const shipmozo = getUnifiedCourierClient('shipmozo')

    const result = await shipmozo.generateManifest({ order_id: 'SMZ-1', courier_id: 55 })

    expect(assignCourier).toHaveBeenCalledWith({ order_id: 'SMZ-1', courier_id: '55' })
    expect(schedulePickup).toHaveBeenCalledWith({ order_id: 'SMZ-1' })
    expect(getOrderDetail).toHaveBeenCalledWith('SMZ-1')
    expect(getOrderLabel).toHaveBeenCalledWith('AWB-1')
    expect(result).toMatchObject({
      success: true,
      provider: 'shipmozo',
      action: 'generateManifest',
      booking_state: 'manifested',
      order_id: 'SMZ-1',
      shipment_id: 'SMZ-1',
      awb_number: 'AWB-1',
      courier_partner: 'Amazon ATS',
      assignment_mode: 'manual',
      pickup_status: 'scheduled',
      label: 'https://label.example/awb-1.pdf',
    })
  })

  it('auto-assigns Shipmozo when no courier_id is supplied', async () => {
    const autoAssignOrder = jest
      .spyOn(ShipmozoService.prototype, 'autoAssignOrder')
      .mockResolvedValue({ result: 1, data: { order_id: 'SMZ-1', awb_number: 'AWB-2' } })
    jest
      .spyOn(ShipmozoService.prototype, 'schedulePickup')
      .mockResolvedValue({ result: 1, data: { order_id: 'SMZ-1' } })
    jest
      .spyOn(ShipmozoService.prototype, 'getOrderDetail')
      .mockResolvedValue({ result: 1, data: [{ order_id: 'SMZ-1', awb_number: 'AWB-2' }] })
    jest
      .spyOn(ShipmozoService.prototype, 'getOrderLabel')
      .mockResolvedValue({ result: 1, data: [{ label: 'label' }] })
    const shipmozo = getUnifiedCourierClient('shipmozo')

    const result = await shipmozo.generateManifest({ order_id: 'SMZ-1' })

    expect(autoAssignOrder).toHaveBeenCalledWith({ order_id: 'SMZ-1' })
    expect(result).toMatchObject({
      awb_number: 'AWB-2',
      assignment_mode: 'auto',
    })
  })

  it('normalizes Shipmozo rate payloads to provider required fields', async () => {
    const rateCalculator = jest
      .spyOn(ShipmozoService.prototype, 'rateCalculator')
      .mockResolvedValue({ result: 1, data: [] })
    const shipmozo = getUnifiedCourierClient('shipmozo')

    await shipmozo.getRates({
      source_pincode: '122001',
      destination_pincode: '110001',
      payment_type: 'cod',
      order_amount: 1000,
      weight: 500,
      length: 22,
      breadth: 10,
      height: 10,
    })

    expect(rateCalculator).toHaveBeenCalledWith(
      expect.objectContaining({
        pickup_pincode: '122001',
        delivery_pincode: '110001',
        payment_type: 'COD',
        shipment_type: 'FORWARD',
        order_amount: 1000,
        type_of_package: 'SPS',
        rov_type: 'ROV_OWNER',
        cod_amount: '1000',
        weight: 500,
        dimensions: [{ no_of_box: 1, length: 22, width: 10, height: 10 }],
      }),
    )
  })

  it('rejects Shipmozo tracking without AWB instead of sending an empty request', async () => {
    const trackOrder = jest.spyOn(ShipmozoService.prototype, 'trackOrder')
    const shipmozo = getUnifiedCourierClient('shipmozo')

    expect(() => shipmozo.trackShipment({ order_id: 'SMZ-1' })).toThrow(
      'Shipmozo tracking requires AWB number',
    )
    expect(trackOrder).not.toHaveBeenCalled()
  })
})
