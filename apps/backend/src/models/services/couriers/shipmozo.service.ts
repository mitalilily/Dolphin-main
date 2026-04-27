import axios, { AxiosInstance } from 'axios'
import { HttpError } from '../../../utils/classes'
import {
  ShipmozoConfig,
  getEffectiveCourierConfig,
} from '../courierCredentials.service'

export type ShipmozoResponse<T = any> = {
  result: string | number
  message?: string
  data?: T
}

export type ShipmozoLoginUser = {
  name?: string
  public_key?: string
  private_key?: string
  [key: string]: any
}

export type ShipmozoWarehouse = {
  id: number
  default?: string
  address_title?: string
  name?: string
  email?: string
  phone?: string
  alt_phone?: string
  address_line_one?: string
  address_line_two?: string
  pincode?: string
  city?: string
  state?: string
  country?: string
  status?: string
}

export type ShipmozoCreateWarehouseRequest = {
  address_title: string
  name?: string
  phone?: string | number
  alternate_phone?: string | number
  email?: string
  address_line_one: string
  address_line_two?: string
  pin_code: string | number
}

export type ShipmozoCreateWarehouseResponse = {
  warehouse_id?: string | number
}

export type ShipmozoUpdateWarehouseForOrderRequest = {
  order_id: string
  warehouse_id: string | number
}

export type ShipmozoUpdateWarehouseForOrderResponse = {
  order_id?: string
  reference_id?: string
}

export type ShipmozoRateRecord = {
  courier_id?: number | string
  courier?: string
  courier_name?: string
  courier_company?: string
  courier_company_service?: string
  amount?: number | string
  shipping_charges?: number | string
  freight_charges?: number | string
  cod_charges?: number | string
  total_charges?: number | string
  expected_delivery_date?: string | null
  estimated_delivery_days?: number | string | null
  pickups_automatically_scheduled?: string | boolean | null
  [key: string]: any
}

export type ShipmozoDimension = {
  no_of_box: string | number
  length: string | number
  width: string | number
  height: string | number
}

export type ShipmozoRateCalculatorRequest = {
  order_id?: string
  pickup_pincode: number | string
  delivery_pincode: number | string
  payment_type: 'PREPAID' | 'COD' | string
  shipment_type: string
  order_amount: number
  type_of_package: string
  rov_type: string
  cod_amount?: string | number
  weight: number
  dimensions: ShipmozoDimension[]
}

export type ShipmozoPincodeServiceabilityRequest = {
  pickup_pincode: string | number
  delivery_pincode: string | number
}

export type ShipmozoPincodeServiceabilityResponse = {
  serviceable?: boolean
}

export type ShipmozoReturnReason = {
  id: number
  title: string
}

export type ShipmozoOrderDetailResponse = Record<string, any>

export type ShipmozoOrderLabelRecord = {
  label?: string
  created_at?: string
}

export type ShipmozoTrackOrderResponse = {
  order_id?: string
  reference_id?: string
  awb_number?: string
  courier?: string
  expected_delivery_date?: string | null
  current_status?: string
  status_time?: string | null
  scan_detail?: any[]
  [key: string]: any
}

export type ShipmozoOrderProduct = {
  name: string
  sku_number?: string
  quantity: number
  discount?: string | number
  hsn?: string
  unit_price: number
  product_category?: string
}

export type ShipmozoPushOrderRequest = {
  order_id: string
  order_date: string
  order_type?: string
  consignee_name: string
  consignee_phone: number | string
  consignee_alternate_phone?: number | string
  consignee_email?: string
  consignee_address_line_one: string
  consignee_address_line_two?: string
  consignee_pin_code: number | string
  consignee_city: string
  consignee_state: string
  product_detail: ShipmozoOrderProduct[]
  payment_type: 'PREPAID' | 'COD' | string
  cod_amount?: string | number
  weight: number
  length: number
  width: number
  height: number
  warehouse_id: string | number
  gst_ewaybill_number?: string
  gstin_number?: string
}

export type ShipmozoPushReturnOrderRequest = {
  order_id: string
  order_date: string
  order_type?: string
  pickup_name: string
  pickup_phone: number | string
  pickup_email?: string
  pickup_address_line_one: string
  pickup_address_line_two?: string
  pickup_pin_code: number | string
  pickup_city: string
  pickup_state: string
  product_detail: ShipmozoOrderProduct[]
  payment_type: 'PREPAID' | 'COD' | string
  weight: number
  length: number
  width: number
  height: number
  warehouse_id?: string | number
  return_reason_id: number
  customer_request: string
  reason_comment?: string
}

export type ShipmozoPushOrderResponse = {
  Info?: string
  order_id?: string
  reference_id?: string
}

export type ShipmozoAssignCourierRequest = {
  order_id: string
  courier_id: number | string
}

export type ShipmozoAssignCourierResponse = {
  order_id?: string
  reference_id?: string
  courier?: string
}

export type ShipmozoSchedulePickupRequest = {
  order_id: string
}

export type ShipmozoSchedulePickupResponse = {
  order_id?: string
  reference_id?: string
  courier?: string
  awb_number?: string
  lr_number?: string
}

export type ShipmozoCancelOrderRequest = {
  order_id: string
  awb_number: number | string
}

export type ShipmozoCancelOrderResponse = {
  order_id?: string
  reference_id?: string
}

export type ShipmozoAutoAssignOrderRequest = {
  order_id: string
}

export type ShipmozoAutoAssignOrderResponse = {
  order_id?: string
  reference_id?: string
  awb_number?: string
  courier_company?: string
  courier_company_service?: string
  error?: string
}

export class ShipmozoService {
  private baseApi = process.env.SHIPMOZO_API_BASE || 'https://shipping-api.com/app/api/v1'
  private publicKey = process.env.SHIPMOZO_PUBLIC_KEY || ''
  private privateKey = process.env.SHIPMOZO_PRIVATE_KEY || ''
  private username = process.env.SHIPMOZO_USERNAME || ''
  private password = process.env.SHIPMOZO_PASSWORD || ''
  private defaultWarehouseId = process.env.SHIPMOZO_DEFAULT_WAREHOUSE_ID || ''

  private static cachedConfig: ShipmozoConfig | null | undefined

  static clearCachedConfig() {
    ShipmozoService.cachedConfig = undefined
  }

  private normalizeBaseApi(value?: string | null) {
    const normalized = String(value || '').trim().replace(/\/+$/, '')
    return normalized || 'https://shipping-api.com/app/api/v1'
  }

  private log(prefix: string, details: any) {
    console.log(`[Shipmozo] ${prefix}`, details)
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
            'public_key',
            'private_key',
            'password',
            'authorization',
            'token',
            'api_key',
            'apikey',
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

  private async ensureConfigLoaded() {
    if (ShipmozoService.cachedConfig === undefined) {
      try {
        ShipmozoService.cachedConfig = await getEffectiveCourierConfig<ShipmozoConfig>(
          'shipmozo',
          'b2c',
        )
      } catch (error) {
        this.log('Config fetch failed, falling back to env vars', {
          message: error instanceof Error ? error.message : String(error),
        })
        ShipmozoService.cachedConfig = null
      }
    }

    const cfg = ShipmozoService.cachedConfig
    if (cfg) {
      this.baseApi = cfg.apiBase || this.baseApi
      this.publicKey = cfg.publicKey || this.publicKey
      this.privateKey = cfg.privateKey || this.privateKey
      this.username = cfg.username || this.username
      this.password = cfg.password || this.password
      this.defaultWarehouseId = cfg.defaultWarehouseId || this.defaultWarehouseId
    }

    this.baseApi = this.normalizeBaseApi(this.baseApi)
  }

  private async getHttp(): Promise<AxiosInstance> {
    await this.ensureConfigLoaded()
    if (!this.publicKey || !this.privateKey) {
      throw new HttpError(
        500,
        'Shipmozo public/private keys are missing. Save them in courier credentials first.',
      )
    }

    return axios.create({
      baseURL: this.baseApi,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'public-key': this.publicKey,
        'private-key': this.privateKey,
      },
    })
  }

  private extractErrorMessage(err: any, fallback: string) {
    const candidates = [
      err?.response?.data?.message,
      err?.response?.data?.data?.error,
      err?.message,
    ]
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
    }
    return fallback
  }

  private assertRequiredFields(payload: Record<string, any>, fields: string[]) {
    const missing = fields.filter((field) => {
      const value = payload[field]
      if (value === null || value === undefined) return true
      if (typeof value === 'string' && !value.trim()) return true
      if (Array.isArray(value) && value.length === 0) return true
      return false
    })

    if (missing.length) {
      throw new HttpError(400, `Missing required fields: ${missing.join(', ')}`)
    }
  }

  private validateOrderDate(dateValue: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateValue || '').trim())) {
      throw new HttpError(400, 'order_date must be in YYYY-MM-DD format')
    }
  }

  private validateOrderProducts(products: ShipmozoOrderProduct[]) {
    if (!Array.isArray(products) || products.length === 0) {
      throw new HttpError(400, 'product_detail must be a non-empty array')
    }
  }

  private assertNonEmptyString(value: unknown, fieldName: string) {
    if (!String(value ?? '').trim()) {
      throw new HttpError(400, `${fieldName} is required`)
    }
  }

  private async request<T = any>(
    method: 'get' | 'post',
    path: string,
    data?: any,
    params?: Record<string, any>,
  ): Promise<ShipmozoResponse<T>> {
    const http = await this.getHttp()
    try {
      this.log('API request', {
        method,
        url: `${this.baseApi}/${path.replace(/^\/+/, '')}`,
        payload: this.sanitizeForLogs(data),
        params,
      })
      const response = await http.request<ShipmozoResponse<T>>({
        method,
        url: `/${path.replace(/^\/+/, '')}`,
        data,
        params,
      })
      this.log('API response', {
        method,
        url: `${this.baseApi}/${path.replace(/^\/+/, '')}`,
        response: this.sanitizeForLogs(response.data),
      })
      return response.data
    } catch (err: any) {
      this.log('API request failed', {
        method,
        url: `${this.baseApi}/${path.replace(/^\/+/, '')}`,
        payload: this.sanitizeForLogs(data),
        params,
        status: err?.response?.status || null,
        response: this.sanitizeForLogs(err?.response?.data) || null,
        message: err?.message || err,
      })
      throw new HttpError(
        Number(err?.response?.status || 502),
        this.extractErrorMessage(err, `Shipmozo API request failed for ${path}`),
      )
    }
  }

  getDefaultWarehouseId() {
    return String(this.defaultWarehouseId || '').trim() || null
  }

  async info() {
    return this.request<{ Info?: string }>('get', '/info')
  }

  async login() {
    await this.ensureConfigLoaded()
    if (!this.username || !this.password) {
      throw new HttpError(400, 'Shipmozo username/password are missing')
    }

    const http = axios.create({
      baseURL: this.baseApi,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    try {
      const response = await http.post<ShipmozoResponse<ShipmozoLoginUser[]>>('/login', {
        username: this.username,
        password: this.password,
      })
      return response.data
    } catch (err: any) {
      throw new HttpError(
        Number(err?.response?.status || 502),
        this.extractErrorMessage(err, 'Shipmozo login failed'),
      )
    }
  }

  async getWarehouses() {
    return this.request<ShipmozoWarehouse[]>('get', '/get-warehouses')
  }

  async createWarehouse(payload: ShipmozoCreateWarehouseRequest) {
    this.assertRequiredFields(payload as Record<string, any>, [
      'address_title',
      'address_line_one',
      'pin_code',
    ])
    return this.request<ShipmozoCreateWarehouseResponse>('post', '/create-warehouse', payload)
  }

  async updateWarehouseForOrder(payload: ShipmozoUpdateWarehouseForOrderRequest) {
    this.assertRequiredFields(payload as Record<string, any>, ['order_id', 'warehouse_id'])
    return this.request<ShipmozoUpdateWarehouseForOrderResponse>(
      'post',
      '/order/update-warehouse',
      payload,
    )
  }

  async getReturnReasons() {
    return this.request<ShipmozoReturnReason[]>('get', '/get-return-reason')
  }

  async checkPincodeServiceability(payload: ShipmozoPincodeServiceabilityRequest) {
    this.assertRequiredFields(payload as Record<string, any>, ['pickup_pincode', 'delivery_pincode'])
    return this.request<ShipmozoPincodeServiceabilityResponse>(
      'post',
      '/pincode-serviceability',
      payload,
    )
  }

  async rateCalculator(payload: ShipmozoRateCalculatorRequest) {
    this.assertRequiredFields(payload as Record<string, any>, [
      'pickup_pincode',
      'delivery_pincode',
      'payment_type',
      'shipment_type',
      'order_amount',
      'type_of_package',
      'rov_type',
      'weight',
      'dimensions',
    ])
    if (!Array.isArray(payload.dimensions) || payload.dimensions.length === 0) {
      throw new HttpError(400, 'dimensions must be a non-empty array')
    }
    return this.request<ShipmozoRateRecord[] | Record<string, any>>(
      'post',
      '/rate-calculator',
      payload,
    )
  }

  async pushOrder(payload: ShipmozoPushOrderRequest) {
    this.assertRequiredFields(payload as Record<string, any>, [
      'order_id',
      'order_date',
      'consignee_name',
      'consignee_phone',
      'consignee_address_line_one',
      'consignee_pin_code',
      'consignee_city',
      'consignee_state',
      'product_detail',
      'payment_type',
      'weight',
      'length',
      'width',
      'height',
      'warehouse_id',
    ])
    this.validateOrderDate(payload.order_date)
    this.validateOrderProducts(payload.product_detail)
    return this.request<ShipmozoPushOrderResponse>('post', '/push-order', payload)
  }

  async pushReturnOrder(payload: ShipmozoPushReturnOrderRequest) {
    this.assertRequiredFields(payload as Record<string, any>, [
      'order_id',
      'order_date',
      'pickup_name',
      'pickup_phone',
      'pickup_address_line_one',
      'pickup_pin_code',
      'pickup_city',
      'pickup_state',
      'product_detail',
      'payment_type',
      'weight',
      'length',
      'width',
      'height',
      'return_reason_id',
      'customer_request',
    ])
    this.validateOrderDate(payload.order_date)
    this.validateOrderProducts(payload.product_detail)
    return this.request<ShipmozoPushOrderResponse>('post', '/push-return-order', payload)
  }

  async assignCourier(payload: ShipmozoAssignCourierRequest) {
    this.assertRequiredFields(payload as Record<string, any>, ['order_id', 'courier_id'])
    return this.request<ShipmozoAssignCourierResponse>('post', '/assign-courier', payload)
  }

  async autoAssignOrder(payload: ShipmozoAutoAssignOrderRequest) {
    this.assertRequiredFields(payload as Record<string, any>, ['order_id'])
    return this.request<ShipmozoAutoAssignOrderResponse>('post', '/auto-assign-order', payload)
  }

  async schedulePickup(payload: ShipmozoSchedulePickupRequest) {
    this.assertRequiredFields(payload as Record<string, any>, ['order_id'])
    return this.request<ShipmozoSchedulePickupResponse>('post', '/schedule-pickup', payload)
  }

  async cancelOrder(payload: ShipmozoCancelOrderRequest) {
    this.assertRequiredFields(payload as Record<string, any>, ['order_id', 'awb_number'])
    return this.request<ShipmozoCancelOrderResponse>('post', '/cancel-order', payload)
  }

  async getOrderDetail(orderId: string) {
    this.assertNonEmptyString(orderId, 'order_id')
    return this.request<ShipmozoOrderDetailResponse>(
      'get',
      `/get-order-detail/${encodeURIComponent(orderId)}`,
    )
  }

  async getOrderLabel(awbNumber: string) {
    this.assertNonEmptyString(awbNumber, 'awb_number')
    return this.request<ShipmozoOrderLabelRecord[]>(
      'get',
      `/get-order-label/${encodeURIComponent(awbNumber)}`,
    )
  }

  async trackOrder(awbNumber: string) {
    this.assertNonEmptyString(awbNumber, 'awb_number')
    return this.request<ShipmozoTrackOrderResponse>('get', '/track-order', undefined, {
      awb_number: awbNumber,
    })
  }
}
