jest.mock('../../src/models/client', () => ({ db: {} }))

jest.mock('../../src/models/services/courierCredentials.service', () => ({
  getEffectiveCourierConfig: jest.fn().mockResolvedValue(null),
}))

import {
  getAllCourierCapabilities,
  getCourierCapabilities,
  getUnifiedCourierClient,
} from '../../src/models/services/couriers/unifiedCourierClient'

describe('unified courier workflow capabilities', () => {
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
