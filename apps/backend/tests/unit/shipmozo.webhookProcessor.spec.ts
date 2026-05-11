jest.mock('../../src/models/client', () => ({ db: {} }))

const { __webhookProcessorTestUtils: utils } = require('../../src/models/services/webhookProcessor')

const shipmozoPayload = {
  order_id: 'SMZ-ORDER-123',
  refrence_id: 'LOCAL-ORDER-99',
  awb_number: 'AWB123456789',
  carrier: 'Delhivery',
  delhivery_name: 'John',
  delhivery_phone: '9999999999',
  expected_delivery_date: '2025-07-15 18:29:59',
  shipment_type: 'Forward',
  current_status: 'Delivered',
  status_time: '2025-07-15 09:12:16',
  status_feed: {
    scan: [
      {
        date: '2025-07-14 09:12:16',
        status: 'Delivered to consignee',
        location: 'Mumbai_KurlaWest_R (Maharashtra)',
      },
      {
        date: '2025-07-14 06:08:36',
        status: 'Out for delivery',
        location: 'Mumbai_KurlaWest_R (Maharashtra)',
      },
      {
        date: '2025-07-14 06:03:42',
        status: 'Shipment Received at Facility',
        location: 'Mumbai_KurlaWest_R (Maharashtra)',
      },
      {
        date: '2025-07-11 05:10:59',
        status: 'Shipment picked up',
        location: 'Mumbai_KurlaWest_R (Maharashtra)',
      },
      {
        date: '2025-07-11 05:10:45',
        status: 'Out for Pickup',
        location: 'Mumbai_KurlaWest_P (Maharashtra)',
      },
      {
        date: '2025-07-10 20:36:38',
        status: 'Pickup scheduled',
        location: 'Mumbai_KurlaWest_P (Maharashtra)',
      },
    ],
  },
}

describe('Shipmozo webhook normalization', () => {
  it('normalizes Shipmozo callback references and status feed scans', () => {
    const normalized = utils.normalizeShipmozoWebhookEvent(shipmozoPayload)
    const scans = utils.getWebhookScanEvents(normalized)

    expect(normalized).toMatchObject({
      awb_number: 'AWB123456789',
      shipment_id: 'SMZ-ORDER-123',
      order_number: 'LOCAL-ORDER-99',
      reference_number: 'LOCAL-ORDER-99',
      current_status: 'Delivered',
      status_time: '2025-07-15 09:12:16',
      current_location: 'Mumbai_KurlaWest_R (Maharashtra)',
      carrier: 'Delhivery',
    })
    expect(scans).toHaveLength(6)
    expect(scans[0]).toMatchObject({
      status: 'Delivered to consignee',
      location: 'Mumbai_KurlaWest_R (Maharashtra)',
    })
    expect(scans[5]).toMatchObject({
      status: 'Pickup scheduled',
      location: 'Mumbai_KurlaWest_P (Maharashtra)',
    })
  })

  it('maps Shipmozo operational scan statuses for tracking, NDR and RTO flows', () => {
    expect(utils.mapGenericWebhookStatus('Delivered to consignee')).toBe('delivered')
    expect(utils.mapGenericWebhookStatus('Out for delivery')).toBe('out_for_delivery')
    expect(utils.mapGenericWebhookStatus('Delivery attempted - customer not available')).toBe('ndr')
    expect(utils.mapGenericWebhookStatus('Returned to Origin')).toBe('rto_delivered')
    expect(utils.mapGenericWebhookStatus('RTO in transit')).toBe('rto_in_transit')
    expect(utils.mapGenericWebhookStatus('RTO reattempt')).toBe('rto_in_transit')
  })

  it('reconciles Shipmozo charged weight aliases against declared order weight', () => {
    const weights = utils.resolveWebhookWeights(
      'shipmozo',
      {
        actual_wt: '0.72 kg',
        volumetric_wt: '1.1',
        chargeable_wt: '1.5',
      },
      { weight: 0.5 },
    )

    expect(weights).toMatchObject({
      declaredWeight: 0.5,
      actualWeight: 0.72,
      volumetricWeight: 1.1,
      chargedWeight: 1.5,
    })
  })
})
