import axios, { AxiosInstance } from 'axios'
import { HttpError } from '../../../utils/classes'
import { IcarryConfig, getEffectiveCourierConfig } from '../courierCredentials.service'

export type IcarryLoginResponse = {
  success?: string
  api_token?: string
  [key: string]: any
}

export type IcarryEstimateSingleRequest = {
  length: number
  breadth: number
  height: number
  weight: number
  destination_pincode: number | string
  origin_pincode: number | string
  destination_country_code: string
  origin_country_code: string
  shipment_mode: 'E' | 'S' | 'H'
  shipment_type: 'C' | 'P'
  shipment_value: number
  sender_address?: string
  sender_city?: string
  consignee_address?: string
  consignee_city?: string
}

export type IcarryEstimateBox = {
  quantity: number
  length: number
  breadth: number
  height: number
  dimension_unit: 'cm'
  weight: number
  weight_unit: 'gm' | 'kg'
}

export type IcarryEstimateMultiBoxRequest = {
  destination_pincode: number | string
  origin_pincode: number | string
  destination_country_code: string
  origin_country_code: string
  shipment_mode: 'E' | 'S'
  shipment_type: 'C' | 'P'
  shipment_value: number
  boxes: IcarryEstimateBox[]
}

export type IcarryEstimateInternationalRequest = {
  weight: number
  length: number
  breadth: number
  height: number
  origin_pincode: number | string
  destination_country_code: string
  origin_country_code?: string
}

export type IcarryEstimateResponse = {
  success?: number | string
  error?: string
  estimate?: any
  [key: string]: any
}

export type IcarryInternationalShipmentParcelDimensions = {
  length: number
  breadth: number
  height: number
  unit?: 'cm'
}

export type IcarryInternationalShipmentParcelWeight = {
  weight: number
  unit?: 'gm'
}

export type IcarryInternationalShipmentParcel = {
  type: 'Prepaid'
  value: number
  currency?: 'INR'
  contents: string
  dimensions: IcarryInternationalShipmentParcelDimensions
  weight: IcarryInternationalShipmentParcelWeight
}

export type IcarryInternationalShipmentConsignee = {
  name: string
  mobile: string
  address: string
  city: string
  pincode: string | number
  state: string
  country_code: string
}

export type IcarryBookInternationalShipmentRequest = {
  pickup_address_id: number
  courier_id: string | number
  return_address_id?: number | null
  rto_address_id?: number | null
  client_order_id?: string
  parcel: IcarryInternationalShipmentParcel
  consignee: IcarryInternationalShipmentConsignee
}

export type IcarryShipmentByIdRequest = {
  shipment_id: number | string
}

export type IcarryShipmentSyncRequest = {
  shipment_ids: Array<number | string>
}

export type IcarryPincodeServiceabilityRequest = {
  pincode: string | number
}

export type IcarryAddPickupAddressRequest = {
  nickname: string
  name: string
  email: string
  phone: string | number
  alt_phone?: string | number
  street1: string
  street2?: string
  locality?: string
  city: string
  pincode: string | number
  zone_id: number | string
  country_id: string | number
}

export type IcarryEditPickupAddressRequest = {
  warehouse_id: string | number
  name: string
  email: string
  phone: string | number
  alt_phone?: string | number
  street1: string
  street2?: string
  locality?: string
  city: string
  pincode: string | number
  zone_id: number | string
  country_id: string | number
}

export class IcarryService {
  private baseApi = process.env.ICARRY_API_BASE || 'https://www.icarry.in'
  private username = process.env.ICARRY_USERNAME || ''
  private apiKey = process.env.ICARRY_API_KEY || ''

  private static cachedConfig: IcarryConfig | null | undefined
  private static apiToken: string | null = null

  static clearCachedConfig() {
    IcarryService.cachedConfig = undefined
    IcarryService.apiToken = null
  }

  private normalizeBaseApi(value?: string | null) {
    const normalized = String(value || '').trim().replace(/\/+$/, '')
    return normalized || 'https://www.icarry.in'
  }

  private sanitizeForLogs(value: any): any {
    if (value == null) return value
    if (Array.isArray(value)) return value.map((item) => this.sanitizeForLogs(item))
    if (typeof value === 'object') {
      const result: Record<string, any> = {}
      for (const [key, nested] of Object.entries(value)) {
        const lowered = key.toLowerCase()
        if (
          [
            'key',
            'api_key',
            'apikey',
            'password',
            'token',
            'api_token',
            'authorization',
          ].includes(lowered)
        ) {
          result[key] = nested ? '[redacted]' : nested
          continue
        }
        result[key] = this.sanitizeForLogs(nested)
      }
      return result
    }
    return value
  }

  private log(prefix: string, details: any) {
    console.log(`[iCarry] ${prefix}`, details)
  }

  private async ensureConfigLoaded() {
    if (IcarryService.cachedConfig === undefined) {
      try {
        IcarryService.cachedConfig = await getEffectiveCourierConfig<IcarryConfig>('icarry', 'b2c')
      } catch (err: any) {
        this.log('Config lookup failed, using env fallback', {
          message: err?.message || err,
        })
        IcarryService.cachedConfig = null
      }
    }

    const cfg = IcarryService.cachedConfig
    if (cfg) {
      this.baseApi = cfg.apiBase || this.baseApi
      this.username = cfg.username || this.username
      this.apiKey = cfg.apiKey || this.apiKey
    }

    this.baseApi = this.normalizeBaseApi(this.baseApi)
  }

  private getHttp(): AxiosInstance {
    return axios.create({
      baseURL: this.baseApi,
      timeout: 30000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
  }

  private extractErrorMessage(err: any, fallback: string): string {
    const candidates = [
      err?.response?.data?.message,
      err?.response?.data?.error,
      err?.response?.data?.success,
      err?.message,
    ]

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim()
      }
    }

    return fallback
  }

  private async requestWithToken<T>(
    endpoint:
      | '/api_get_estimate'
      | '/api_get_estimate_b2b'
      | '/api_get_estimate_international'
      | '/api_add_shipment_international'
      | '/api_cancel_shipment'
      | '/api_add_reverse_shipment'
      | '/api_track_shipment'
      | '/api_print_shipment_label'
      | '/api_shipment_billing_sync'
      | '/api_shipment_status_sync'
      | '/api_check_pincode'
      | '/api_add_pickup_address'
      | '/api_edit_pickup_address',
    payload: Record<string, any>,
  ): Promise<T> {
    const { apiToken } = await this.login()
    const urlWithToken = `${endpoint}?api_token=${encodeURIComponent(apiToken)}`

    try {
      this.log('API request', {
        url: `${this.baseApi}${endpoint}`,
        payload: this.sanitizeForLogs(payload),
        hasApiToken: Boolean(apiToken),
      })

      const response = await this.getHttp().post<T>(urlWithToken, payload)
      this.log('API response', {
        url: `${this.baseApi}${endpoint}`,
        response: this.sanitizeForLogs(response?.data),
      })
      return response.data
    } catch (err: any) {
      this.log('API request failed', {
        url: `${this.baseApi}${endpoint}`,
        payload: this.sanitizeForLogs(payload),
        status: err?.response?.status || null,
        statusText: err?.response?.statusText || null,
        response:
          typeof err?.response?.data === 'string'
            ? err.response.data.slice(0, 500)
            : this.sanitizeForLogs(err?.response?.data) || null,
        message: err?.message || err,
      })
      throw new HttpError(
        Number(err?.response?.status || 502),
        this.extractErrorMessage(err, `iCarry request failed for ${endpoint}`),
      )
    }
  }

  async login(forceRefresh = false): Promise<{ apiToken: string; raw: IcarryLoginResponse }> {
    await this.ensureConfigLoaded()

    if (!forceRefresh && IcarryService.apiToken) {
      return { apiToken: IcarryService.apiToken, raw: { success: 'Cached token' } }
    }

    if (!this.username || !this.apiKey) {
      throw new HttpError(400, 'iCarry username/api key are missing')
    }

    const payload = {
      username: this.username,
      Key: this.apiKey,
    }

    try {
      this.log('Login request', {
        url: `${this.baseApi}/api_login`,
        payload: this.sanitizeForLogs(payload),
      })

      const response = await this.getHttp().post<IcarryLoginResponse>('/api_login', payload)
      const responseData = response?.data || {}

      this.log('Login response', {
        response: this.sanitizeForLogs(responseData),
      })

      const explicitErrorMessage =
        typeof responseData?.error === 'string' ? responseData.error.trim() : ''
      if (explicitErrorMessage) {
        throw new HttpError(403, explicitErrorMessage)
      }

      const apiToken = String(responseData.api_token || '').trim()
      if (!apiToken) {
        throw new HttpError(502, 'iCarry login did not return api_token')
      }

      IcarryService.apiToken = apiToken
      return { apiToken, raw: responseData }
    } catch (err: any) {
      this.log('Login failed', {
        status: err?.response?.status || null,
        statusText: err?.response?.statusText || null,
        response:
          typeof err?.response?.data === 'string'
            ? err.response.data.slice(0, 500)
            : this.sanitizeForLogs(err?.response?.data) || null,
        message: err?.message || err,
      })
      throw new HttpError(
        Number(err?.response?.status || 502),
        this.extractErrorMessage(err, 'iCarry login failed'),
      )
    }
  }

  async getEstimateSingleShipment(
    payload: IcarryEstimateSingleRequest,
  ): Promise<IcarryEstimateResponse> {
    if (!payload || typeof payload !== 'object') {
      throw new HttpError(400, 'Payload is required for iCarry single estimate')
    }
    if (payload.shipment_mode === 'H') {
      for (const key of ['sender_address', 'sender_city', 'consignee_address', 'consignee_city']) {
        if (!String((payload as any)[key] || '').trim()) {
          throw new HttpError(400, `${key} is required for shipment_mode "H"`)
        }
      }
    }
    return this.requestWithToken<IcarryEstimateResponse>('/api_get_estimate', payload as any)
  }

  async getEstimateMultiBoxShipment(
    payload: IcarryEstimateMultiBoxRequest,
  ): Promise<IcarryEstimateResponse> {
    if (!payload || typeof payload !== 'object') {
      throw new HttpError(400, 'Payload is required for iCarry multi-box estimate')
    }
    if (!Array.isArray(payload.boxes) || payload.boxes.length === 0) {
      throw new HttpError(400, 'boxes array is required for iCarry multi-box estimate')
    }

    const requestPayload = {
      ...payload,
      parcel: {
        boxes: payload.boxes,
      },
    } as Record<string, any>
    delete requestPayload.boxes

    return this.requestWithToken<IcarryEstimateResponse>('/api_get_estimate_b2b', requestPayload)
  }

  async getEstimateInternationalShipment(
    payload: IcarryEstimateInternationalRequest,
  ): Promise<IcarryEstimateResponse> {
    if (!payload || typeof payload !== 'object') {
      throw new HttpError(400, 'Payload is required for iCarry international estimate')
    }
    return this.requestWithToken<IcarryEstimateResponse>('/api_get_estimate_international', {
      ...payload,
      origin_country_code: payload.origin_country_code || 'IN',
    })
  }

  async bookInternationalShipment(
    payload: IcarryBookInternationalShipmentRequest,
  ): Promise<IcarryEstimateResponse> {
    if (!payload || typeof payload !== 'object') {
      throw new HttpError(400, 'Payload is required for iCarry international shipment booking')
    }

    const pickupAddressId = Number(payload.pickup_address_id)
    if (!Number.isFinite(pickupAddressId) || pickupAddressId <= 0) {
      throw new HttpError(400, 'pickup_address_id must be a positive number')
    }

    const courierId = String(payload.courier_id || '').trim()
    if (!courierId) {
      throw new HttpError(400, 'courier_id is required')
    }

    const parcel = payload.parcel
    if (!parcel || typeof parcel !== 'object') {
      throw new HttpError(400, 'parcel object is required')
    }

    const parcelType = String(parcel.type || '').trim()
    if (parcelType !== 'Prepaid') {
      throw new HttpError(400, "parcel.type must be 'Prepaid'")
    }

    const parcelValue = Number(parcel.value)
    if (!Number.isFinite(parcelValue) || parcelValue <= 0) {
      throw new HttpError(400, 'parcel.value must be a positive number')
    }

    const parcelContents = String(parcel.contents || '').trim()
    if (!parcelContents) {
      throw new HttpError(400, 'parcel.contents is required')
    }

    const dimensions = parcel.dimensions
    if (!dimensions || typeof dimensions !== 'object') {
      throw new HttpError(400, 'parcel.dimensions object is required')
    }
    for (const key of ['length', 'breadth', 'height'] as const) {
      const val = Number((dimensions as any)[key])
      if (!Number.isFinite(val) || val <= 0) {
        throw new HttpError(400, `parcel.dimensions.${key} must be a positive number`)
      }
    }

    const weight = parcel.weight
    if (!weight || typeof weight !== 'object') {
      throw new HttpError(400, 'parcel.weight object is required')
    }
    const weightValue = Number(weight.weight)
    if (!Number.isFinite(weightValue) || weightValue <= 0) {
      throw new HttpError(400, 'parcel.weight.weight must be a positive number')
    }

    const consignee = payload.consignee
    if (!consignee || typeof consignee !== 'object') {
      throw new HttpError(400, 'consignee object is required')
    }
    for (const key of ['name', 'mobile', 'address', 'city', 'state', 'country_code'] as const) {
      if (!String((consignee as any)[key] || '').trim()) {
        throw new HttpError(400, `consignee.${key} is required`)
      }
    }
    if (!String(consignee.pincode || '').trim()) {
      throw new HttpError(400, 'consignee.pincode is required')
    }

    const countryCode = String(consignee.country_code || '').trim().toUpperCase()
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      throw new HttpError(400, 'consignee.country_code must be a valid ISO2 code (e.g. US)')
    }

    const requestPayload: Record<string, any> = {
      ...payload,
      pickup_address_id: pickupAddressId,
      courier_id: courierId,
      parcel: {
        ...parcel,
        currency: 'INR',
        dimensions: {
          ...dimensions,
          unit: 'cm',
        },
        weight: {
          ...weight,
          unit: 'gm',
        },
      },
      consignee: {
        ...consignee,
        country_code: countryCode,
      },
    }

    const normalizeOptionalAddressId = (value: any) => {
      if (value === undefined || value === null || value === '') return undefined
      const normalized = Number(value)
      return Number.isFinite(normalized) && normalized > 0 ? normalized : undefined
    }

    const returnAddressId = normalizeOptionalAddressId(payload.return_address_id)
    const rtoAddressId = normalizeOptionalAddressId(payload.rto_address_id)
    if (returnAddressId !== undefined) requestPayload.return_address_id = returnAddressId
    else delete requestPayload.return_address_id
    if (rtoAddressId !== undefined) requestPayload.rto_address_id = rtoAddressId
    else delete requestPayload.rto_address_id

    if (!String(payload.client_order_id || '').trim()) {
      delete requestPayload.client_order_id
    }

    return this.requestWithToken<IcarryEstimateResponse>('/api_add_shipment_international', requestPayload)
  }

  private normalizeShipmentId(value: number | string, fieldName = 'shipment_id'): number {
    const normalized = Number(value)
    if (!Number.isFinite(normalized) || normalized <= 0) {
      throw new HttpError(400, `${fieldName} must be a positive number`)
    }
    return Math.trunc(normalized)
  }

  private normalizeShipmentIds(value: Array<number | string>): number[] {
    if (!Array.isArray(value) || value.length === 0) {
      throw new HttpError(400, 'shipment_ids must be a non-empty array')
    }

    const normalized = value.map((id, idx) => this.normalizeShipmentId(id, `shipment_ids[${idx}]`))
    const unique = Array.from(new Set(normalized))
    if (!unique.length) {
      throw new HttpError(400, 'shipment_ids must contain at least one valid shipment id')
    }
    return unique
  }

  async cancelShipment(payload: IcarryShipmentByIdRequest): Promise<IcarryEstimateResponse> {
    if (!payload || typeof payload !== 'object') {
      throw new HttpError(400, 'Payload is required for iCarry shipment cancellation')
    }

    const shipmentId = this.normalizeShipmentId(payload.shipment_id)
    return this.requestWithToken<IcarryEstimateResponse>('/api_cancel_shipment', {
      shipment_id: shipmentId,
    })
  }

  async createReverseShipment(payload: IcarryShipmentByIdRequest): Promise<IcarryEstimateResponse> {
    if (!payload || typeof payload !== 'object') {
      throw new HttpError(400, 'Payload is required for iCarry reverse shipment')
    }

    const shipmentId = this.normalizeShipmentId(payload.shipment_id)
    return this.requestWithToken<IcarryEstimateResponse>('/api_add_reverse_shipment', {
      shipment_id: shipmentId,
    })
  }

  async trackShipment(payload: IcarryShipmentByIdRequest): Promise<IcarryEstimateResponse> {
    if (!payload || typeof payload !== 'object') {
      throw new HttpError(400, 'Payload is required for iCarry shipment tracking')
    }

    const shipmentId = this.normalizeShipmentId(payload.shipment_id)
    return this.requestWithToken<IcarryEstimateResponse>('/api_track_shipment', {
      shipment_id: shipmentId,
    })
  }

  async printShipmentLabel(payload: IcarryShipmentByIdRequest): Promise<IcarryEstimateResponse> {
    if (!payload || typeof payload !== 'object') {
      throw new HttpError(400, 'Payload is required for iCarry shipment label')
    }

    const shipmentId = this.normalizeShipmentId(payload.shipment_id)
    return this.requestWithToken<IcarryEstimateResponse>('/api_print_shipment_label', {
      shipment_id: shipmentId,
    })
  }

  async syncShipmentCharges(payload: IcarryShipmentSyncRequest): Promise<IcarryEstimateResponse> {
    if (!payload || typeof payload !== 'object') {
      throw new HttpError(400, 'Payload is required for iCarry shipment billing sync')
    }

    const shipmentIds = this.normalizeShipmentIds(payload.shipment_ids)
    return this.requestWithToken<IcarryEstimateResponse>('/api_shipment_billing_sync', {
      shipment_ids: shipmentIds,
    })
  }

  async syncShipmentStatus(payload: IcarryShipmentSyncRequest): Promise<IcarryEstimateResponse> {
    if (!payload || typeof payload !== 'object') {
      throw new HttpError(400, 'Payload is required for iCarry shipment status sync')
    }

    const shipmentIds = this.normalizeShipmentIds(payload.shipment_ids)
    return this.requestWithToken<IcarryEstimateResponse>('/api_shipment_status_sync', {
      shipment_ids: shipmentIds,
    })
  }

  async checkPincodeServiceability(
    payload: IcarryPincodeServiceabilityRequest,
  ): Promise<IcarryEstimateResponse> {
    if (!payload || typeof payload !== 'object') {
      throw new HttpError(400, 'Payload is required for iCarry pincode serviceability')
    }

    const pincode = String(payload.pincode || '').trim()
    if (!pincode) {
      throw new HttpError(400, 'pincode is required')
    }

    return this.requestWithToken<IcarryEstimateResponse>('/api_check_pincode', {
      pincode,
    })
  }

  async addPickupAddress(payload: IcarryAddPickupAddressRequest): Promise<IcarryEstimateResponse> {
    if (!payload || typeof payload !== 'object') {
      throw new HttpError(400, 'Payload is required for iCarry pickup address creation')
    }

    const nickname = String(payload.nickname || '').trim()
    if (!nickname) throw new HttpError(400, 'nickname is required')
    if (!/^[A-Za-z]+$/.test(nickname)) {
      throw new HttpError(400, 'nickname must contain only alphabets and no spaces')
    }

    const name = String(payload.name || '').trim()
    if (!name) throw new HttpError(400, 'name is required')

    const email = String(payload.email || '').trim()
    if (!email) throw new HttpError(400, 'email is required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(400, 'email must be a valid email address')
    }

    const normalizePhone = (value: any, field: 'phone' | 'alt_phone', required: boolean) => {
      const cleaned = String(value ?? '')
        .trim()
        .replace(/\D/g, '')
      if (!cleaned) {
        if (required) throw new HttpError(400, `${field} is required`)
        return ''
      }
      if (!/^\d{10}$/.test(cleaned)) {
        throw new HttpError(400, `${field} must be a 10 digit mobile number without +91 or leading 0`)
      }
      return cleaned
    }

    const phone = normalizePhone(payload.phone, 'phone', true)
    const altPhone = normalizePhone(payload.alt_phone, 'alt_phone', false)

    const street1 = String(payload.street1 || '').trim()
    if (!street1) throw new HttpError(400, 'street1 is required')

    const city = String(payload.city || '').trim()
    if (!city) throw new HttpError(400, 'city is required')

    const pincode = String(payload.pincode || '').trim()
    if (!pincode) throw new HttpError(400, 'pincode is required')

    const zoneId = Number(payload.zone_id)
    if (!Number.isFinite(zoneId) || zoneId <= 0) {
      throw new HttpError(400, 'zone_id must be a positive integer')
    }

    const countryId = String(payload.country_id || '').trim()
    if (countryId !== '99') {
      throw new HttpError(400, "country_id must be '99' for India")
    }

    const requestPayload: Record<string, any> = {
      nickname,
      name,
      email,
      phone,
      street1,
      city,
      pincode,
      zone_id: Math.trunc(zoneId),
      country_id: '99',
    }

    const street2 = String(payload.street2 || '').trim()
    const locality = String(payload.locality || '').trim()
    if (altPhone) requestPayload.alt_phone = altPhone
    if (street2) requestPayload.street2 = street2
    if (locality) requestPayload.locality = locality

    return this.requestWithToken<IcarryEstimateResponse>('/api_add_pickup_address', requestPayload)
  }

  async editPickupAddress(payload: IcarryEditPickupAddressRequest): Promise<IcarryEstimateResponse> {
    if (!payload || typeof payload !== 'object') {
      throw new HttpError(400, 'Payload is required for iCarry pickup address update')
    }

    const warehouseId = String(payload.warehouse_id || '').trim()
    if (!warehouseId) throw new HttpError(400, 'warehouse_id is required')

    const name = String(payload.name || '').trim()
    if (!name) throw new HttpError(400, 'name is required')

    const email = String(payload.email || '').trim()
    if (!email) throw new HttpError(400, 'email is required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(400, 'email must be a valid email address')
    }

    const normalizePhone = (value: any, field: 'phone' | 'alt_phone', required: boolean) => {
      const cleaned = String(value ?? '')
        .trim()
        .replace(/\D/g, '')
      if (!cleaned) {
        if (required) throw new HttpError(400, `${field} is required`)
        return ''
      }
      if (!/^\d{10}$/.test(cleaned)) {
        throw new HttpError(400, `${field} must be a 10 digit mobile number without +91 or leading 0`)
      }
      return cleaned
    }

    const phone = normalizePhone(payload.phone, 'phone', true)
    const altPhone = normalizePhone(payload.alt_phone, 'alt_phone', false)

    const street1 = String(payload.street1 || '').trim()
    if (!street1) throw new HttpError(400, 'street1 is required')

    const city = String(payload.city || '').trim()
    if (!city) throw new HttpError(400, 'city is required')

    const pincode = String(payload.pincode || '').trim()
    if (!pincode) throw new HttpError(400, 'pincode is required')

    const zoneId = Number(payload.zone_id)
    if (!Number.isFinite(zoneId) || zoneId <= 0) {
      throw new HttpError(400, 'zone_id must be a positive integer')
    }

    const countryId = String(payload.country_id || '').trim()
    if (countryId !== '99') {
      throw new HttpError(400, "country_id must be '99' for India")
    }

    const requestPayload: Record<string, any> = {
      warehouse_id: warehouseId,
      name,
      email,
      phone,
      street1,
      city,
      pincode,
      zone_id: Math.trunc(zoneId),
      country_id: '99',
    }

    const street2 = String(payload.street2 || '').trim()
    const locality = String(payload.locality || '').trim()
    if (altPhone) requestPayload.alt_phone = altPhone
    if (street2) requestPayload.street2 = street2
    if (locality) requestPayload.locality = locality

    return this.requestWithToken<IcarryEstimateResponse>('/api_edit_pickup_address', requestPayload)
  }
}
