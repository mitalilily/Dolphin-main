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
      generateManifest: 'provider_api',
      schedulePickup: 'provider_api',
      generateLabel: 'provider_api',
      trackShipment: 'provider_api',
      cancelShipment: 'provider_api',
      getRates: 'provider_api',
    },
    bookingSequence: ['createShipment', 'generateManifest', 'generateLabel'],
    autoPickupOnCreate: false,
    requiresAwbBeforePickup: true,
    requiresManifestBeforePickup: false,
    labelAvailableAfter: 'generateManifest',
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
  if (value == null || typeof value === 'object') return ''
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

const firstNestedValue = (
  source: unknown,
  keys: string[],
  depth = 0,
): unknown => {
  if (source == null || depth > 5) return undefined

  if (Array.isArray(source)) {
    for (const item of source) {
      const found = firstNestedValue(item, keys, depth + 1)
      if (found !== undefined && found !== null && found !== '') return found
    }
    return undefined
  }

  if (typeof source !== 'object') return undefined

  const normalizedKeys = new Set(keys.map((key) => key.toLowerCase()))
  for (const [key, value] of Object.entries(source as Record<string, any>)) {
    if (normalizedKeys.has(key.toLowerCase())) return value
  }

  for (const value of Object.values(source as Record<string, any>)) {
    const found = firstNestedValue(value, keys, depth + 1)
    if (found !== undefined && found !== null && found !== '') return found
  }

  return undefined
}

const firstNestedText = (source: unknown, keys: string[]) => toText(firstNestedValue(source, keys))

const firstNestedItem = (source: unknown) => {
  if (Array.isArray(source)) return source[0] || null
  if (source && typeof source === 'object') {
    const data = (source as Record<string, any>).data
    if (Array.isArray(data)) return data[0] || null
    if (data && typeof data === 'object') return data
  }
  return null
}

const resolveIcarryDomesticEndpoint = (payload: Record<string, any>) => {
  const explicit = toText(payload.endpoint).toLowerCase()
  if (explicit === 'air') return 'air'
  if (explicit === 'surface') return 'surface'

  const shipmentMode = toText(payload.shipment_mode || payload.shipmentMode).toUpperCase()
  return shipmentMode === 'E' ? 'air' : 'surface'
}

const SHIPMOZO_AWB_KEYS = [
  'awb',
  'awb_number',
  'awbNumber',
  'lr',
  'lr_number',
  'lrNumber',
  'waybill',
  'tracking_number',
  'trackingNumber',
  'docket_number',
  'docketNumber',
]

const SHIPMOZO_ORDER_ID_KEYS = [
  'order_id',
  'orderId',
  'shipment_id',
  'shipmentId',
  'reference_id',
  'referenceId',
  'refrence_id',
]

const SHIPMOZO_COURIER_NAME_KEYS = [
  'courier',
  'courier_name',
  'courierName',
  'courier_company',
  'courier_company_service',
  'carrier',
  'carrier_name',
]

const SHIPMOZO_LABEL_KEYS = ['label', 'label_url', 'label_link']
const SHIPMOZO_INVOICE_KEYS = ['invoice', 'invoice_url', 'invoice_link', 'invoiceLabel']

const isShipmozoAlreadyAssignedMessage = (value: unknown) =>
  /already\s+(assigned|allocated)|courier\s+already|awb\s+already|waybill\s+already/i.test(
    toText(value),
  )

const isShipmozoPickupAlreadyScheduledMessage = (value: unknown) =>
  /already\s+(scheduled|manifested|picked|pickup)|pickup\s+already|manifest\s+already/i.test(
    toText(value),
  )

const normalizeShipmozoPaymentType = (value: unknown) => {
  const normalized = toText(value).toUpperCase()
  return normalized === 'COD' ? 'COD' : 'PREPAID'
}

const normalizeShipmozoPositiveNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const normalizeShipmozoDimensions = (input: Record<string, any>) => {
  if (Array.isArray(input.dimensions) && input.dimensions.length) return input.dimensions
  return [
    {
      no_of_box: normalizeShipmozoPositiveNumber(input.no_of_box ?? input.boxes, 1),
      length: normalizeShipmozoPositiveNumber(input.length ?? input.package_length, 1),
      width: normalizeShipmozoPositiveNumber(input.width ?? input.breadth ?? input.package_breadth, 1),
      height: normalizeShipmozoPositiveNumber(input.height ?? input.package_height, 1),
    },
  ]
}

const normalizeShipmozoRatePayload = (input: Record<string, any>) => {
  const payload = input || {}
  const pickupPincode =
    firstText(payload, ['pickup_pincode', 'source_pincode', 'origin_pincode', 'origin']) ||
    toText(payload.pickup?.pincode || payload.pickupAddress?.pincode)
  const deliveryPincode =
    firstText(payload, ['delivery_pincode', 'destination_pincode', 'destination', 'pincode']) ||
    toText(payload.consignee?.pincode || payload.deliveryAddress?.pincode)

  if (!pickupPincode || !deliveryPincode) {
    throw new HttpError(400, 'Shipmozo rates require pickup and delivery pincodes.')
  }

  const paymentType = normalizeShipmozoPaymentType(
    payload.payment_type || payload.paymentType || payload.mode,
  )
  const orderAmount = normalizeShipmozoPositiveNumber(
    payload.order_amount ?? payload.orderAmount ?? payload.invoice_value,
    1,
  )

  return {
    ...payload,
    pickup_pincode: pickupPincode,
    delivery_pincode: deliveryPincode,
    payment_type: paymentType,
    shipment_type: firstText(payload, ['shipment_type', 'shipmentType']) || 'FORWARD',
    order_amount: orderAmount,
    type_of_package: firstText(payload, ['type_of_package', 'typeOfPackage']) || 'SPS',
    rov_type: firstText(payload, ['rov_type', 'rovType']) || 'ROV_OWNER',
    cod_amount:
      paymentType === 'COD'
        ? String(normalizeShipmozoPositiveNumber(payload.cod_amount ?? orderAmount, orderAmount))
        : '',
    weight: normalizeShipmozoPositiveNumber(payload.weight ?? payload.package_weight, 500),
    dimensions: normalizeShipmozoDimensions(payload),
  }
}

const TRUXCARGO_WAYBILL_KEYS = [
  'waybill',
  'waybill_number',
  'waybillNumber',
  'awb',
  'awb_number',
  'awbNumber',
  'tracking_number',
  'trackingNumber',
]

const TRUXCARGO_SHIPMENT_ID_KEYS = [
  'shipment_id',
  'shipmentId',
  'shipment',
  'order_id',
  'orderId',
]

const normalizeTruxcargoPaymentMode = (value: unknown) => {
  const normalized = toText(value).toUpperCase()
  if (normalized === 'COD') return 'COD'
  if (normalized === 'PREPAID' || normalized === 'PPD') return 'PREPAID'
  return ''
}

const toFiniteNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeTruxcargoWeightKg = (value: unknown) => {
  const parsed = toFiniteNumber(value)
  if (!parsed || parsed <= 0) return 0.5
  return parsed > 50 ? parsed / 1000 : parsed
}

const numericOrFallback = (value: unknown, fallback: number) => {
  const parsed = toFiniteNumber(value)
  return parsed && parsed > 0 ? parsed : fallback
}

const normalizeTruxcargoDimension = (value: unknown) => {
  if (Array.isArray(value) && value.length) return value
  return [numericOrFallback(value, 1)]
}

const firstOrderItem = (payload: Record<string, any>) =>
  Array.isArray(payload.order_items) && payload.order_items.length
    ? payload.order_items[0]
    : Array.isArray(payload.products) && payload.products.length
      ? payload.products[0]
      : {}

const normalizeTruxcargoRatePayload = (input: Record<string, any>) => {
  const payload = input || {}
  const item = firstOrderItem(payload)
  const partner = firstText(payload, ['partner', 'courier_id', 'courierId'])
  if (!partner) {
    throw new HttpError(400, 'Truxcargo rates require courier_id/partner.')
  }

  const origin =
    firstText(payload, ['origin', 'source_pincode', 'origin_pincode', 'pickup_pincode']) ||
    toText(payload.pickup?.pincode || payload.pickupAddress?.pincode)
  const destination =
    firstText(payload, ['destination', 'destination_pincode', 'delivery_pincode', 'pincode']) ||
    toText(payload.consignee?.pincode || payload.deliveryAddress?.pincode)
  if (!origin || !destination) {
    throw new HttpError(400, 'Truxcargo rates require origin and destination pincodes.')
  }

  const paymentMode =
    normalizeTruxcargoPaymentMode(
      payload.payment_type || payload.payment_mode || payload.paymentMode || payload.mode,
    ) || 'PREPAID'
  const orderAmount =
    numericOrFallback(
      payload.order_amount ?? payload.orderAmount ?? payload.invoice_value ?? payload.total_amount,
      1,
    )
  const qty = numericOrFallback(payload.qty ?? item?.qty ?? item?.quantity, 1)
  const unitPrice = numericOrFallback(
    Array.isArray(payload.product_price)
      ? payload.product_price[0]
      : payload.product_price ?? item?.price ?? item?.selling_price,
    orderAmount,
  )
  const hsn =
    firstText(payload, ['hsn', 'hsnCode', 'product_hsn']) ||
    toText(item?.hsn || item?.hsnCode) ||
    '6201'
  const sku =
    firstText(payload, ['sku']) ||
    toText(item?.sku || payload.order_id || payload.order_number || 'TRUXCARGO-RATE')
  const productDescription =
    firstText(payload, ['product_description', 'productDescription', 'description']) ||
    toText(item?.name || item?.productName || item?.description) ||
    'Product'
  const isInsured = isTruthyFlag(payload.is_insurance) || isTruthyFlag(payload.isInsurance)
  const insurance = firstText(payload, ['insurance']) || (isInsured ? 'YES' : 'NO')
  const codAmount =
    paymentMode === 'COD'
      ? numericOrFallback(payload.cod_amount ?? payload.codAmount ?? orderAmount, orderAmount)
      : 0

  return {
    ...payload,
    partner,
    courier_id: partner,
    origin,
    destination,
    pickup_pincode: firstText(payload, ['pickup_pincode']) || origin,
    delivery_pincode: firstText(payload, ['delivery_pincode']) || destination,
    pincode: firstText(payload, ['pincode']) || destination,
    pin: firstText(payload, ['pin']) || destination,
    pin_code: firstText(payload, ['pin_code']) || destination,
    payment_type: paymentMode,
    payment_mode: paymentMode,
    paymentmode: paymentMode,
    paymentMode,
    mode: paymentMode,
    invoice_value: orderAmount,
    order_amount: orderAmount,
    total_amount: numericOrFallback(payload.total_amount, orderAmount),
    cod_amount: codAmount,
    insurance,
    weight: normalizeTruxcargoWeightKg(payload.weight ?? payload.package_weight),
    length: normalizeTruxcargoDimension(payload.length ?? payload.package_length),
    breadth: normalizeTruxcargoDimension(payload.breadth ?? payload.package_breadth),
    width: normalizeTruxcargoDimension(payload.width ?? payload.package_breadth ?? payload.breadth),
    height: normalizeTruxcargoDimension(payload.height ?? payload.package_height),
    qty,
    quantity: Array.isArray(payload.quantity) && payload.quantity.length ? payload.quantity : [qty],
    count: Array.isArray(payload.count) && payload.count.length ? payload.count : [qty],
    product_quantity: numericOrFallback(payload.product_quantity, qty),
    product_price:
      Array.isArray(payload.product_price) && payload.product_price.length
        ? payload.product_price
        : [unitPrice],
    sku: Array.isArray(payload.sku) && payload.sku.length ? payload.sku : [sku],
    hsn,
    hsn_code: Array.isArray(payload.hsn_code) && payload.hsn_code.length ? payload.hsn_code : [hsn],
    hsnCode: hsn,
    product_hsn: hsn,
    product_description: productDescription,
  }
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

  private resolveOrderId(...sources: unknown[]) {
    for (const source of sources) {
      const found = firstNestedText(source, SHIPMOZO_ORDER_ID_KEYS)
      if (found) return found
    }
    return ''
  }

  private resolveAwb(...sources: unknown[]) {
    for (const source of sources) {
      const found = firstNestedText(source, SHIPMOZO_AWB_KEYS)
      if (found) return found
    }
    return ''
  }

  private resolveCourierName(...sources: unknown[]) {
    for (const source of sources) {
      const found = firstNestedText(source, SHIPMOZO_COURIER_NAME_KEYS)
      if (found) return found
    }
    return ''
  }

  private buildLabelSummary(labelResponse: any) {
    const labelRow = firstNestedItem(labelResponse)
    return {
      label: firstNestedText(labelRow, SHIPMOZO_LABEL_KEYS) || undefined,
      invoice: firstNestedText(labelRow, SHIPMOZO_INVOICE_KEYS) || undefined,
      raw: labelResponse,
    }
  }

  async createShipment(orderData: Record<string, any>) {
    const payload = orderData || {}
    const response = await this.service.pushOrder(payload as any)
    const orderId = this.resolveOrderId(response, payload)
    return {
      success: true,
      provider: this.provider,
      action: 'createShipment',
      booking_state: 'pending_manifest',
      remote_order_created: true,
      order_id: orderId || undefined,
      shipment_id: orderId || undefined,
      next_action: 'generateManifest',
      raw: response,
      ...response,
    }
  }

  async generateAwb(input: Record<string, any>) {
    const payload = input || {}
    const orderId = requireText(payload, ['order_id', 'orderId'], 'Shipmozo AWB generation requires order_id')
    const courierId = firstText(payload, ['courier_id', 'courierId'])
    const response = courierId
      ? await this.service.assignCourier({ order_id: orderId, courier_id: courierId })
      : await this.service.autoAssignOrder({ order_id: orderId })
    const awb = this.resolveAwb(response)
    return {
      success: true,
      provider: this.provider,
      action: 'generateAwb',
      order_id: orderId,
      shipment_id: orderId,
      awb_number: awb || undefined,
      courier_partner: this.resolveCourierName(response) || undefined,
      assignment_mode: courierId ? 'manual' : 'auto',
      raw: response,
      ...response,
    }
  }

  async generateManifest(input: Record<string, any>) {
    const payload = input || {}
    const orderId = requireText(payload, ['order_id', 'orderId'], 'Shipmozo manifest requires order_id')
    const courierId = firstText(payload, ['courier_id', 'courierId'])

    let assignResponse: any = null
    let autoAssignResponse: any = null
    let assignmentSkipped = false
    try {
      if (courierId) {
        assignResponse = await this.service.assignCourier({ order_id: orderId, courier_id: courierId })
      } else {
        autoAssignResponse = await this.service.autoAssignOrder({ order_id: orderId })
      }
    } catch (err: any) {
      if (!isShipmozoAlreadyAssignedMessage(err?.message)) throw err
      assignmentSkipped = true
    }

    let scheduleResponse: any = null
    let pickupAlreadyScheduled = false
    try {
      scheduleResponse = await this.service.schedulePickup({ order_id: orderId })
    } catch (err: any) {
      if (!isShipmozoPickupAlreadyScheduledMessage(err?.message)) throw err
      pickupAlreadyScheduled = true
    }

    const detailResponse = await this.service.getOrderDetail(orderId)
    const awb = this.resolveAwb(payload, assignResponse, autoAssignResponse, scheduleResponse, detailResponse)
    if (!awb) {
      throw new HttpError(
        502,
        'Shipmozo manifest did not return an AWB/LR number. Please retry after checking the Shipmozo order.',
      )
    }

    let labelResponse: any = null
    let labelError = ''
    try {
      labelResponse = await this.service.getOrderLabel(awb)
    } catch (err: any) {
      labelError = toText(err?.message || err)
    }
    const labelSummary = this.buildLabelSummary(labelResponse)

    return {
      success: true,
      provider: this.provider,
      action: 'generateManifest',
      booking_state: 'manifested',
      order_id: orderId,
      shipment_id: orderId,
      awb_number: awb,
      courier_partner:
        this.resolveCourierName(assignResponse, autoAssignResponse, scheduleResponse, detailResponse) ||
        undefined,
      assignment_mode: courierId ? 'manual' : 'auto',
      assignment_skipped: assignmentSkipped,
      pickup_status: pickupAlreadyScheduled ? 'already_scheduled' : 'scheduled',
      label: labelSummary.label,
      invoice: labelSummary.invoice,
      label_pending: Boolean(labelError),
      label_error: labelError || undefined,
      assign_courier: assignResponse,
      auto_assign: autoAssignResponse,
      schedule_pickup: scheduleResponse,
      order_detail: detailResponse,
      label_response: labelSummary.raw,
    }
  }

  async schedulePickup(input: Record<string, any>) {
    const payload = input || {}
    const orderId = requireText(payload, ['order_id', 'orderId'], 'Shipmozo pickup requires order_id')
    const response = await this.service.schedulePickup({ ...payload, order_id: orderId } as any)
    const awb = this.resolveAwb(response)
    return {
      success: true,
      provider: this.provider,
      action: 'schedulePickup',
      order_id: orderId,
      shipment_id: orderId,
      awb_number: awb || undefined,
      raw: response,
      ...response,
    }
  }

  async generateLabel(input: Record<string, any>) {
    const awb = requireText(input || {}, ['awb', 'awb_number', 'awbNumber'], 'Shipmozo label requires AWB number')
    const response = await this.service.getOrderLabel(awb)
    const summary = this.buildLabelSummary(response)
    return {
      success: true,
      provider: this.provider,
      action: 'generateLabel',
      awb_number: awb,
      label: summary.label,
      invoice: summary.invoice,
      raw: response,
      ...response,
    }
  }

  trackShipment(trackingId: UnifiedCourierIdentifier) {
    const payload = toPayload(trackingId)
    const awb = firstText(payload, ['awb', 'awb_number', 'awbNumber']) || toText(trackingId)
    if (!awb) throw new HttpError(400, 'Shipmozo tracking requires AWB number')
    return this.service.trackOrder(awb)
  }

  cancelShipment(input: UnifiedCourierIdentifier) {
    const payload = toPayload(input)
    const orderId = requireText(payload, ['order_id', 'orderId'], 'Shipmozo cancellation requires order_id')
    const awb = requireText(payload, ['awb', 'awb_number', 'awbNumber'], 'Shipmozo cancellation requires AWB number')
    return this.service.cancelOrder({ order_id: orderId, awb_number: awb })
  }

  getRates(input: Record<string, any>) {
    return this.service.rateCalculator(normalizeShipmozoRatePayload(input || {}) as any)
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

  private resolveWaybill(source: unknown) {
    return firstNestedText(source, TRUXCARGO_WAYBILL_KEYS)
  }

  private buildManifestResult(
    waybill: string,
    createOrderResponse: any,
    packagingSlipResponse: any,
    packagingSlipError?: unknown,
  ) {
    const shipmentId =
      firstNestedText(createOrderResponse, TRUXCARGO_SHIPMENT_ID_KEYS) ||
      firstNestedText(packagingSlipResponse, TRUXCARGO_SHIPMENT_ID_KEYS) ||
      waybill

    return {
      success: true,
      provider: this.provider,
      action: 'generateManifest',
      booking_state: 'manifested',
      waybill,
      awb_number: waybill,
      shipment_id: shipmentId,
      schedule_pickup: 'implicit',
      next_action: 'schedulePickup',
      create_order: createOrderResponse,
      packaging_slip: packagingSlipResponse,
      label_pending: Boolean(packagingSlipError),
      label_error:
        packagingSlipError instanceof Error
          ? packagingSlipError.message
          : toText(packagingSlipError),
    }
  }

  createShipment(orderData: Record<string, any>) {
    const payload = orderData || {}
    if (isTruthyFlag(payload.forceProviderBooking) || isTruthyFlag(payload.bookImmediately)) {
      return this.service.createOrder(payload)
    }

    return implicitSuccess(this.provider, 'createShipment', {
      deferred_manifest: true,
      booking_state: 'pending_manifest',
      next_action: 'generateManifest',
      courier_id: firstText(payload, ['courier_id', 'courierId']) || undefined,
    })
  }

  async generateAwb(input: Record<string, any>) {
    const payload = input || {}
    const waybill = this.resolveWaybill(payload)
    if (waybill) {
      return implicitSuccess(this.provider, 'generateAwb', {
        waybill,
        awb_number: waybill,
        message: 'Truxcargo returns waybill during order creation.',
      })
    }

    const createOrderResponse = await this.service.createOrder(payload)
    const createdWaybill = this.resolveWaybill(createOrderResponse)
    if (!createdWaybill) return createOrderResponse

    return {
      success: true,
      provider: this.provider,
      action: 'generateAwb',
      waybill: createdWaybill,
      awb_number: createdWaybill,
      shipment_id: firstNestedText(createOrderResponse, TRUXCARGO_SHIPMENT_ID_KEYS) || createdWaybill,
      create_order: createOrderResponse,
    }
  }

  async generateManifest(input: Record<string, any>) {
    const payload = input || {}
    const existingWaybill = this.resolveWaybill(payload)
    if (existingWaybill) {
      const packagingSlipResponse = await this.service.createPackagingSlip({
        ...payload,
        waybill: existingWaybill,
      })
      return this.buildManifestResult(existingWaybill, null, packagingSlipResponse)
    }

    const createOrderResponse = await this.service.createOrder(payload)
    const waybill = this.resolveWaybill(createOrderResponse)
    if (!waybill) {
      throw new HttpError(502, 'Truxcargo order creation did not return waybill/AWB.')
    }

    try {
      const packagingSlipResponse = await this.service.createPackagingSlip({ ...payload, waybill })
      return this.buildManifestResult(waybill, createOrderResponse, packagingSlipResponse)
    } catch (err) {
      return this.buildManifestResult(waybill, createOrderResponse, null, err)
    }
  }

  schedulePickup(input: Record<string, any>) {
    const payload = input || {}
    const waybill = this.resolveWaybill(payload)
    if (waybill) {
      return implicitSuccess(this.provider, 'schedulePickup', {
        waybill,
        awb_number: waybill,
        message: 'Truxcargo pickup is handled by the provider after manifest/order creation.',
      })
    }
    return this.generateManifest(payload)
  }

  generateLabel(input: Record<string, any>) {
    const payload = input || {}
    const waybill = this.resolveWaybill(payload)
    if (!waybill) throw new HttpError(400, 'Truxcargo label requires waybill/AWB')
    return this.service.createPackagingSlip({ ...payload, waybill })
  }

  trackShipment(trackingId: UnifiedCourierIdentifier) {
    const payload = toPayload(trackingId)
    const waybill = this.resolveWaybill(payload) || toText(trackingId)
    const orderId = firstText(payload, ['order_id', 'orderId'])
    if (!waybill && !orderId) {
      throw new HttpError(400, 'Truxcargo tracking requires waybill/AWB or order_id.')
    }
    return this.service.trackShipment({
      ...(waybill ? { waybill } : {}),
      ...(orderId ? { order_id: orderId } : {}),
    })
  }

  cancelShipment(input: UnifiedCourierIdentifier) {
    const payload = toPayload(input)
    const waybill = this.resolveWaybill(payload) || toText(input)
    if (!waybill) throw new HttpError(400, 'Truxcargo cancellation requires waybill/AWB.')
    return this.service.cancelOrder({ ...payload, waybill })
  }

  getRates(input: Record<string, any>) {
    return this.service.getShippingCharge(normalizeTruxcargoRatePayload(input || {}))
  }
}

export const getUnifiedCourierClient = (provider: UnifiedCourierProvider): UnifiedCourierClient => {
  if (provider === 'shiprocket') return new ShiprocketUnifiedClient()
  if (provider === 'shipmozo') return new ShipmozoUnifiedClient()
  if (provider === 'truxcargo') return new TruxcargoUnifiedClient()
  return new IcarryUnifiedClient()
}
