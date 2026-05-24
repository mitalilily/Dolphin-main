import { HttpError } from '../../../utils/classes'
import { IcarryService } from './icarry.service'
import { ShipmozoService } from './shipmozo.service'
import { ShiprocketCourierService } from './shiprocket.service'
import { TruxcargoService } from './truxcargo.service'

export type UnifiedCourierProvider = 'shiprocket' | 'shipmozo' | 'icarry' | 'truxcargo'

export type UnifiedCourierFlowType =
  | 'TYPE_A_AUTO_PICKUP_ON_CREATE'
  | 'TYPE_B_CREATE_PLUS_PICKUP'
  | 'TYPE_C_MANIFEST_OR_BOOKING_BEFORE_PICKUP'
  | 'TYPE_D_BATCH_OR_BAGGING'

export type UnifiedCourierAction =
  | 'createShipment'
  | 'generateAwb'
  | 'generateManifest'
  | 'schedulePickup'
  | 'generateLabel'
  | 'trackShipment'
  | 'cancelShipment'
  | 'getRates'

export type UnifiedCourierActionSupport =
  | 'provider_api'
  | 'implicit'
  | 'local_deferred'
  | 'not_supported'

export type UnifiedTrackingKey = 'awb' | 'shipment_id' | 'order_id' | 'waybill'

export type UnifiedCourierCapabilities = {
  provider: UnifiedCourierProvider
  displayName: string
  flowType: UnifiedCourierFlowType
  trackingKey: UnifiedTrackingKey
  primaryExternalId: UnifiedTrackingKey
  actions: Record<UnifiedCourierAction, UnifiedCourierActionSupport>
  bookingSequence: UnifiedCourierAction[]
  autoPickupOnCreate: boolean
  requiresAwbBeforePickup: boolean
  requiresManifestBeforePickup: boolean
  labelAvailableAfter: 'createShipment' | 'generateAwb' | 'generateManifest' | 'schedulePickup'
  cancellationKey: UnifiedTrackingKey | 'order_id_plus_awb'
}

export type UnifiedCourierIdentifier = string | number | Record<string, any>

export interface UnifiedCourierClient {
  readonly provider: UnifiedCourierProvider
  readonly capabilities: UnifiedCourierCapabilities
  createShipment(orderData: Record<string, any>): Promise<any>
  generateAwb(input: Record<string, any>): Promise<any>
  generateManifest(input: Record<string, any>): Promise<any>
  schedulePickup(input: Record<string, any>): Promise<any>
  generateLabel(input: Record<string, any>): Promise<any>
  trackShipment(trackingId: UnifiedCourierIdentifier): Promise<any>
  cancelShipment(input: UnifiedCourierIdentifier): Promise<any>
  getRates(input: Record<string, any>): Promise<any>
}

const COURIER_CAPABILITIES: Record<UnifiedCourierProvider, UnifiedCourierCapabilities> = {
  shiprocket: {
    provider: 'shiprocket',
    displayName: 'Shiprocket',
    flowType: 'TYPE_B_CREATE_PLUS_PICKUP',
    trackingKey: 'awb',
    primaryExternalId: 'order_id',
    actions: {
      createShipment: 'provider_api',
      generateAwb: 'provider_api',
      generateManifest: 'provider_api',
      schedulePickup: 'provider_api',
      generateLabel: 'provider_api',
      trackShipment: 'provider_api',
      cancelShipment: 'provider_api',
      getRates: 'provider_api',
    },
    bookingSequence: ['createShipment', 'generateAwb', 'schedulePickup', 'generateManifest', 'generateLabel'],
    autoPickupOnCreate: false,
    requiresAwbBeforePickup: true,
    requiresManifestBeforePickup: false,
    labelAvailableAfter: 'generateAwb',
    cancellationKey: 'order_id',
  },
  shipmozo: {
    provider: 'shipmozo',
    displayName: 'Shipmozo',
    flowType: 'TYPE_B_CREATE_PLUS_PICKUP',
    trackingKey: 'awb',
    primaryExternalId: 'order_id',
    actions: {
      createShipment: 'provider_api',
      generateAwb: 'provider_api',
      generateManifest: 'not_supported',
      schedulePickup: 'provider_api',
      generateLabel: 'provider_api',
      trackShipment: 'provider_api',
      cancelShipment: 'provider_api',
      getRates: 'provider_api',
    },
    bookingSequence: ['createShipment', 'generateAwb', 'schedulePickup', 'generateLabel'],
    autoPickupOnCreate: false,
    requiresAwbBeforePickup: true,
    requiresManifestBeforePickup: false,
    labelAvailableAfter: 'schedulePickup',
    cancellationKey: 'order_id_plus_awb',
  },
  icarry: {
    provider: 'icarry',
    displayName: 'iCarry',
    flowType: 'TYPE_C_MANIFEST_OR_BOOKING_BEFORE_PICKUP',
    trackingKey: 'shipment_id',
    primaryExternalId: 'shipment_id',
    actions: {
      createShipment: 'local_deferred',
      generateAwb: 'implicit',
      generateManifest: 'provider_api',
      schedulePickup: 'implicit',
      generateLabel: 'provider_api',
      trackShipment: 'provider_api',
      cancelShipment: 'provider_api',
      getRates: 'provider_api',
    },
    bookingSequence: ['createShipment', 'generateManifest', 'generateLabel'],
    autoPickupOnCreate: true,
    requiresAwbBeforePickup: false,
    requiresManifestBeforePickup: true,
    labelAvailableAfter: 'generateManifest',
    cancellationKey: 'shipment_id',
  },
  truxcargo: {
    provider: 'truxcargo',
    displayName: 'Truxcargo',
    flowType: 'TYPE_C_MANIFEST_OR_BOOKING_BEFORE_PICKUP',
    trackingKey: 'waybill',
    primaryExternalId: 'waybill',
    actions: {
      createShipment: 'local_deferred',
      generateAwb: 'implicit',
      generateManifest: 'provider_api',
      schedulePickup: 'implicit',
      generateLabel: 'provider_api',
      trackShipment: 'provider_api',
      cancelShipment: 'provider_api',
      getRates: 'provider_api',
    },
    bookingSequence: ['createShipment', 'generateManifest', 'generateLabel'],
    autoPickupOnCreate: true,
    requiresAwbBeforePickup: false,
    requiresManifestBeforePickup: true,
    labelAvailableAfter: 'generateManifest',
    cancellationKey: 'waybill',
  },
}

const cloneCapabilities = (
  capabilities: UnifiedCourierCapabilities,
): UnifiedCourierCapabilities => ({
  ...capabilities,
  actions: { ...capabilities.actions },
  bookingSequence: [...capabilities.bookingSequence],
})

export const getCourierCapabilities = (
  provider: UnifiedCourierProvider,
): UnifiedCourierCapabilities => cloneCapabilities(COURIER_CAPABILITIES[provider])

export const getAllCourierCapabilities = () =>
  (Object.keys(COURIER_CAPABILITIES) as UnifiedCourierProvider[]).map((provider) =>
    getCourierCapabilities(provider),
  )

const toPayload = (value: UnifiedCourierIdentifier | Record<string, any>) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {}

const toText = (value: unknown) => {
  const normalized = String(value ?? '').trim()
  return normalized || ''
}

const firstText = (source: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = toText(source[key])
    if (value) return value
  }
  return ''
}

const requireText = (source: Record<string, any>, keys: string[], message: string) => {
  const value = firstText(source, keys)
  if (!value) throw new HttpError(400, message)
  return value
}

const implicitSuccess = (
  provider: UnifiedCourierProvider,
  action: UnifiedCourierAction,
  details: Record<string, any> = {},
) =>
  Promise.resolve({
    success: true,
    provider,
    action,
    handledBy: 'unified_adapter',
    ...details,
  })

const isTruthyFlag = (value: unknown) => {
  const normalized = toText(value).toLowerCase()
  return ['1', 'true', 'yes', 'y'].includes(normalized)
}

const isIcarryInternationalPayload = (payload: Record<string, any>) => {
  const mode = toText(payload.mode || payload.shipment_mode || payload.shipmentMode).toLowerCase()
  if (mode === 'international') return true

  const country =
    firstText(payload, ['destination_country_code', 'destinationCountryCode']) ||
    toText(payload.consignee?.country_code || payload.consignee?.country || payload.destination_country)

  return Boolean(country && country.toUpperCase() !== 'IN')
}

const resolveIcarryDomesticEndpoint = (payload: Record<string, any>) => {
  const explicit = toText(payload.endpoint).toLowerCase()
  if (explicit === 'air') return 'air'
  if (explicit === 'surface') return 'surface'

  const shipmentMode = toText(payload.shipment_mode || payload.shipmentMode).toUpperCase()
  return shipmentMode === 'E' ? 'air' : 'surface'
}

class ShiprocketUnifiedClient implements UnifiedCourierClient {
  readonly provider = 'shiprocket' as const
  readonly capabilities = getCourierCapabilities(this.provider)
  private readonly service = new ShiprocketCourierService()

  createShipment(orderData: Record<string, any>) {
    return this.service.createCustomOrder(orderData || {})
  }

  generateAwb(input: Record<string, any>) {
    return this.service.assignAwb(input || {})
  }

  generateManifest(input: Record<string, any>) {
    return this.service.generateManifest(input || {})
  }

  schedulePickup(input: Record<string, any>) {
    return this.service.generatePickup(input || {})
  }

  generateLabel(input: Record<string, any>) {
    return this.service.generateLabel(input || {})
  }

  trackShipment(trackingId: UnifiedCourierIdentifier) {
    const payload = toPayload(trackingId)
    const shipmentId = firstText(payload, ['shipment_id', 'shipmentId'])
    if (shipmentId) return this.service.trackByShipmentId(shipmentId)

    const orderId = firstText(payload, ['order_id', 'orderId'])
    if (orderId) {
      return this.service.trackByOrderId({
        order_id: orderId,
        channel_id: firstText(payload, ['channel_id', 'channelId']) || undefined,
      })
    }

    const awb = firstText(payload, ['awb', 'awb_number', 'awbNumber']) || toText(trackingId)
    return this.service.trackByAwb(awb)
  }

  cancelShipment(input: UnifiedCourierIdentifier) {
    const payload = toPayload(input)
    const awb = firstText(payload, ['awb', 'awb_number', 'awbNumber'])
    if (awb) return this.service.cancelShipmentByAwbs({ awbs: [awb] })

    const id = firstText(payload, ['order_id', 'orderId', 'shipment_id', 'shipmentId', 'id']) || toText(input)
    return this.service.cancelOrders({ ids: [id] })
  }

  getRates(input: Record<string, any>) {
    return this.service.checkCourierServiceability(input || {})
  }
}

class ShipmozoUnifiedClient implements UnifiedCourierClient {
  readonly provider = 'shipmozo' as const
  readonly capabilities = getCourierCapabilities(this.provider)
  private readonly service = new ShipmozoService()

  createShipment(orderData: Record<string, any>) {
    return this.service.pushOrder(orderData as any)
  }

  generateAwb(input: Record<string, any>) {
    const payload = input || {}
    const orderId = requireText(payload, ['order_id', 'orderId'], 'Shipmozo AWB generation requires order_id')
    const courierId = firstText(payload, ['courier_id', 'courierId'])
    if (courierId) return this.service.assignCourier({ order_id: orderId, courier_id: courierId })
    return this.service.autoAssignOrder({ order_id: orderId })
  }

  generateManifest(input: Record<string, any>) {
    return implicitSuccess(this.provider, 'generateManifest', {
      skipped: true,
      message: 'Shipmozo does not expose a separate manifest API in the integrated flow.',
      order_id: firstText(input || {}, ['order_id', 'orderId']) || undefined,
    })
  }

  schedulePickup(input: Record<string, any>) {
    return this.service.schedulePickup(input as any)
  }

  generateLabel(input: Record<string, any>) {
    const awb = requireText(input || {}, ['awb', 'awb_number', 'awbNumber'], 'Shipmozo label requires AWB number')
    return this.service.getOrderLabel(awb)
  }

  trackShipment(trackingId: UnifiedCourierIdentifier) {
    const payload = toPayload(trackingId)
    const awb = firstText(payload, ['awb', 'awb_number', 'awbNumber']) || toText(trackingId)
    return this.service.trackOrder(awb)
  }

  cancelShipment(input: UnifiedCourierIdentifier) {
    const payload = toPayload(input)
    const orderId = requireText(payload, ['order_id', 'orderId'], 'Shipmozo cancellation requires order_id')
    const awb = requireText(payload, ['awb', 'awb_number', 'awbNumber'], 'Shipmozo cancellation requires AWB number')
    return this.service.cancelOrder({ order_id: orderId, awb_number: awb })
  }

  getRates(input: Record<string, any>) {
    return this.service.rateCalculator(input as any)
  }
}

class IcarryUnifiedClient implements UnifiedCourierClient {
  readonly provider = 'icarry' as const
  readonly capabilities = getCourierCapabilities(this.provider)
  private readonly service = new IcarryService()

  private bookShipment(payload: Record<string, any>) {
    if (isIcarryInternationalPayload(payload)) {
      return this.service.bookInternationalShipment(payload as any)
    }
    return this.service.bookDomesticShipment({
      ...payload,
      endpoint: resolveIcarryDomesticEndpoint(payload),
    } as any)
  }

  createShipment(orderData: Record<string, any>) {
    const payload = orderData || {}
    if (
      isTruthyFlag(payload.deferBookingUntilManifest) ||
      isTruthyFlag(payload.deferred_manifest) ||
      isTruthyFlag(payload.localOnly)
    ) {
      return implicitSuccess(this.provider, 'createShipment', {
        deferred_manifest: true,
        booking_state: 'pending_manifest',
        next_action: 'generateManifest',
      })
    }
    return this.bookShipment(payload)
  }

  generateAwb(input: Record<string, any>) {
    const payload = input || {}
    const existingAwb = firstText(payload, ['awb', 'awb_number', 'awbNumber'])
    if (existingAwb) {
      return implicitSuccess(this.provider, 'generateAwb', {
        awb_number: existingAwb,
        message: 'iCarry AWB is generated by shipment booking.',
      })
    }

    const shipmentId = firstText(payload, ['shipment_id', 'shipmentId'])
    if (shipmentId) return this.service.printShipmentLabel({ shipment_id: shipmentId })
    return this.generateManifest(payload)
  }

  generateManifest(input: Record<string, any>) {
    return this.bookShipment(input || {})
  }

  schedulePickup(input: Record<string, any>) {
    const payload = input || {}
    const shipmentId = firstText(payload, ['shipment_id', 'shipmentId'])
    if (shipmentId) {
      return implicitSuccess(this.provider, 'schedulePickup', {
        shipment_id: shipmentId,
        message: 'iCarry creates the pickup request during shipment booking.',
      })
    }
    return this.generateManifest(payload)
  }

  generateLabel(input: Record<string, any>) {
    const shipmentId = requireText(input || {}, ['shipment_id', 'shipmentId'], 'iCarry label requires shipment_id')
    return this.service.printShipmentLabel({ shipment_id: shipmentId })
  }

  trackShipment(trackingId: UnifiedCourierIdentifier) {
    const payload = toPayload(trackingId)
    const shipmentId = firstText(payload, ['shipment_id', 'shipmentId']) || toText(trackingId)
    return this.service.trackShipment({ shipment_id: shipmentId })
  }

  cancelShipment(input: UnifiedCourierIdentifier) {
    const payload = toPayload(input)
    const shipmentId = firstText(payload, ['shipment_id', 'shipmentId']) || toText(input)
    return this.service.cancelShipment({ shipment_id: shipmentId })
  }

  getRates(input: Record<string, any>) {
    const payload = input || {}
    if (isIcarryInternationalPayload(payload)) {
      return this.service.getEstimateInternationalShipment(payload as any)
    }
    if (Array.isArray(payload.boxes) && payload.boxes.length > 0) {
      return this.service.getEstimateMultiBoxShipment(payload as any)
    }
    return this.service.getEstimateSingleShipment(payload as any)
  }
}

class TruxcargoUnifiedClient implements UnifiedCourierClient {
  readonly provider = 'truxcargo' as const
  readonly capabilities = getCourierCapabilities(this.provider)
  private readonly service = new TruxcargoService()

  createShipment(orderData: Record<string, any>) {
    const payload = orderData || {}
    if (
      isTruthyFlag(payload.deferBookingUntilManifest) ||
      isTruthyFlag(payload.deferred_manifest) ||
      isTruthyFlag(payload.localOnly)
    ) {
      return implicitSuccess(this.provider, 'createShipment', {
        deferred_manifest: true,
        booking_state: 'pending_manifest',
        next_action: 'generateManifest',
      })
    }
    return this.service.createOrder(payload)
  }

  generateAwb(input: Record<string, any>) {
    const payload = input || {}
    const waybill = firstText(payload, ['waybill', 'waybill_number', 'awb', 'awb_number', 'awbNumber'])
    if (waybill) {
      return implicitSuccess(this.provider, 'generateAwb', {
        waybill,
        message: 'Truxcargo returns waybill during order creation.',
      })
    }
    return this.service.createOrder(payload)
  }

  generateManifest(input: Record<string, any>) {
    const payload = input || {}
    const waybill = firstText(payload, ['waybill', 'waybill_number', 'awb', 'awb_number', 'awbNumber'])
    if (waybill) return this.service.createPackagingSlip({ ...payload, waybill })
    return this.service.createOrder(payload)
  }

  schedulePickup(input: Record<string, any>) {
    const payload = input || {}
    const waybill = firstText(payload, ['waybill', 'waybill_number', 'awb', 'awb_number', 'awbNumber'])
    if (waybill) {
      return implicitSuccess(this.provider, 'schedulePickup', {
        waybill,
        message: 'Truxcargo pickup is handled by the provider after manifest/order creation.',
      })
    }
    return this.generateManifest(payload)
  }

  generateLabel(input: Record<string, any>) {
    const payload = input || {}
    const waybill = requireText(payload, ['waybill', 'waybill_number', 'awb', 'awb_number', 'awbNumber'], 'Truxcargo label requires waybill/AWB')
    return this.service.createPackagingSlip({ ...payload, waybill })
  }

  trackShipment(trackingId: UnifiedCourierIdentifier) {
    const payload = toPayload(trackingId)
    const waybill = firstText(payload, ['waybill', 'waybill_number', 'awb', 'awb_number', 'awbNumber']) || toText(trackingId)
    const orderId = firstText(payload, ['order_id', 'orderId'])
    return this.service.trackShipment({ waybill, order_id: orderId || undefined })
  }

  cancelShipment(input: UnifiedCourierIdentifier) {
    const payload = toPayload(input)
    const waybill = firstText(payload, ['waybill', 'waybill_number', 'awb', 'awb_number', 'awbNumber']) || toText(input)
    return this.service.cancelOrder({ ...payload, waybill })
  }

  getRates(input: Record<string, any>) {
    return this.service.getShippingCharge(input || {})
  }
}

export const getUnifiedCourierClient = (provider: UnifiedCourierProvider): UnifiedCourierClient => {
  if (provider === 'shiprocket') return new ShiprocketUnifiedClient()
  if (provider === 'shipmozo') return new ShipmozoUnifiedClient()
  if (provider === 'truxcargo') return new TruxcargoUnifiedClient()
  return new IcarryUnifiedClient()
}
