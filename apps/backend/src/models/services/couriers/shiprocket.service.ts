import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { HttpError } from '../../../utils/classes'
import {
  getEffectiveCourierConfig,
  ShiprocketConfig,
} from '../courierCredentials.service'

export type ShiprocketApiResponse<T = any> = T & {
  status?: number | string
  message?: string
}

export type ShiprocketRateRecord = {
  courier_company_id?: number | string
  courier_name?: string
  rate?: number | string
  freight_charge?: number | string
  cod_charges?: number | string
  etd?: string | null
  estimated_delivery_days?: string | number | null
  available_courier_company?: string
  [key: string]: any
}

type ShiprocketHttpMethod = 'get' | 'post' | 'patch' | 'put' | 'delete'

export class ShiprocketCourierService {
  private baseApi = process.env.SHIPROCKET_API_BASE || 'https://apiv2.shiprocket.in/v1/external'
  private username = process.env.SHIPROCKET_EMAIL || ''
  private password = process.env.SHIPROCKET_PASSWORD || ''
  private configuredAuthToken = process.env.SHIPROCKET_AUTH_TOKEN || ''
  private defaultPickupLocation = process.env.SHIPROCKET_DEFAULT_PICKUP_LOCATION || ''
  private defaultChannelId = process.env.SHIPROCKET_DEFAULT_CHANNEL_ID || ''

  private static cachedConfig: ShiprocketConfig | null | undefined
  private static authToken: string | null = null
  private static authTokenExpiresAt: number | null = null

  static clearCachedConfig() {
    ShiprocketCourierService.cachedConfig = undefined
    ShiprocketCourierService.authToken = null
    ShiprocketCourierService.authTokenExpiresAt = null
  }

  private normalizeBaseApi(value?: string | null) {
    const normalized = String(value || '').trim().replace(/\/+$/, '')
    return normalized || 'https://apiv2.shiprocket.in/v1/external'
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
            'password',
            'authorization',
            'token',
            'access_token',
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

  private log(prefix: string, details: any) {
    console.log(`[Shiprocket] ${prefix}`, details)
  }

  private async ensureConfigLoaded() {
    if (ShiprocketCourierService.cachedConfig === undefined) {
      try {
        ShiprocketCourierService.cachedConfig = await getEffectiveCourierConfig<ShiprocketConfig>(
          'shiprocket',
          'b2c',
        )
      } catch (err: any) {
        this.log('Config lookup failed, using env fallback', {
          message: err?.message || err,
        })
        ShiprocketCourierService.cachedConfig = null
      }
    }

    const cfg = ShiprocketCourierService.cachedConfig
    if (cfg) {
      this.baseApi = cfg.apiBase || this.baseApi
      this.username = cfg.username || this.username
      this.password = cfg.password || this.password
      this.defaultPickupLocation = cfg.defaultPickupLocation || this.defaultPickupLocation
      this.defaultChannelId = cfg.defaultChannelId || this.defaultChannelId
    }

    this.baseApi = this.normalizeBaseApi(this.baseApi)
    this.configuredAuthToken = String(this.configuredAuthToken || process.env.SHIPROCKET_AUTH_TOKEN || '').trim()
  }

  private extractErrorMessage(err: any, fallback: string) {
    const candidates = [
      err?.response?.data?.message,
      err?.response?.data?.error,
      err?.message,
    ]
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
    }
    return fallback
  }

  private async getToken(forceRefresh = false) {
    await this.ensureConfigLoaded()
    if (!forceRefresh && this.configuredAuthToken) return this.configuredAuthToken

    const now = Date.now()
    if (
      !forceRefresh &&
      ShiprocketCourierService.authToken &&
      ShiprocketCourierService.authTokenExpiresAt &&
      now < ShiprocketCourierService.authTokenExpiresAt
    ) {
      return ShiprocketCourierService.authToken
    }

    const authUrl = `${this.baseApi}/auth/login`
    try {
      if (!this.username || !this.password) {
        throw new HttpError(400, 'Shiprocket API user email/password are missing')
      }

      const response = await axios.post<{ token?: string }>(
        authUrl,
        {
          email: this.username,
          password: this.password,
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      )

      const token = String(response?.data?.token || '').trim()
      if (!token) {
        throw new HttpError(502, 'Shiprocket login did not return a token')
      }

      ShiprocketCourierService.authToken = token
      ShiprocketCourierService.authTokenExpiresAt = now + 23 * 60 * 60 * 1000
      return token
    } catch (err: any) {
      throw new HttpError(
        Number(err?.response?.status || 502),
        this.extractErrorMessage(err, 'Shiprocket login failed'),
      )
    }
  }

  private async getHttp(forceRefreshToken = false): Promise<AxiosInstance> {
    const token = await this.getToken(forceRefreshToken)
    return axios.create({
      baseURL: this.baseApi,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
  }

  private async request<T = any>(
    method: ShiprocketHttpMethod,
    path: string,
    data?: any,
    params?: Record<string, any>,
  ): Promise<ShiprocketApiResponse<T>> {
    let lastError: any = null

    for (const forceRefreshToken of [false, true]) {
      try {
        const http = await this.getHttp(forceRefreshToken)
        const requestConfig: AxiosRequestConfig = {
          method,
          url: `/${path.replace(/^\/+/, '')}`,
          params,
        }

        if (method !== 'get') {
          requestConfig.data = data
        }

        this.log('API request', {
          method,
          url: `${this.baseApi}/${path.replace(/^\/+/, '')}`,
          payload: this.sanitizeForLogs(data),
          params,
          forceRefreshToken,
        })

        const response = await http.request<ShiprocketApiResponse<T>>(requestConfig)
        this.log('API response', {
          method,
          url: `${this.baseApi}/${path.replace(/^\/+/, '')}`,
          response: this.sanitizeForLogs(response.data),
        })
        return response.data
      } catch (err: any) {
        lastError = err
        const status = Number(err?.response?.status || 0)
        if (status === 401 && !forceRefreshToken) {
          ShiprocketCourierService.authToken = null
          ShiprocketCourierService.authTokenExpiresAt = null
          continue
        }
        break
      }
    }

    this.log('API request failed', {
      method,
      url: `${this.baseApi}/${path.replace(/^\/+/, '')}`,
      payload: this.sanitizeForLogs(data),
      params,
      status: lastError?.response?.status || null,
      response: this.sanitizeForLogs(lastError?.response?.data) || null,
      message: lastError?.message || lastError,
    })

    const upstreamStatus = Number(lastError?.response?.status || 502)
    const extractedMessage = this.extractErrorMessage(
      lastError,
      `Shiprocket API request failed for ${path}`,
    )
    const normalizedMessage = String(extractedMessage || '').toLowerCase()
    const isKycBlocked = normalizedMessage.includes('kyc verification is mandated')

    const httpError: any = new HttpError(
      upstreamStatus,
      isKycBlocked
        ? 'Shiprocket account KYC is incomplete. Complete KYC in Shiprocket panel to create shipments.'
        : extractedMessage,
    )
    if (isKycBlocked) {
      httpError.code = 'SHIPROCKET_KYC_REQUIRED'
      httpError.integration_type = 'shiprocket'
    }
    httpError.response = lastError?.response?.data ?? null
    httpError.status = lastError?.response?.status ?? null
    httpError.requestMeta = {
      method,
      path,
      params,
      payload: this.sanitizeForLogs(data),
    }
    throw httpError
  }

  getDefaultPickupLocation() {
    return String(this.defaultPickupLocation || '').trim() || null
  }

  getDefaultChannelId() {
    return String(this.defaultChannelId || '').trim() || null
  }

  async login() {
    const token = await this.getToken(true)
    return { token }
  }

  async logout() {
    return this.request('post', '/auth/logout', {})
  }

  async getIntegratedChannels() {
    return this.request<any>('get', '/channels')
  }

  async getAllOrders(params?: Record<string, any>) {
    return this.request<any>('get', '/orders', undefined, params)
  }

  async getOrderDetail(orderId: string | number) {
    return this.request<any>('get', `/orders/show/${encodeURIComponent(String(orderId))}`)
  }

  async getProductDetail(productId: string | number) {
    const normalizedProductId = String(productId || '').trim()
    if (!normalizedProductId) {
      throw new HttpError(400, 'product_id is required')
    }
    return this.request<any>(
      'get',
      `/products/show/${encodeURIComponent(normalizedProductId)}`,
    )
  }

  async addProduct(payload: any) {
    return this.request<any>('post', '/products', payload || {})
  }

  async getProductsSampleCsv() {
    return this.request<any>('get', '/products/sample')
  }

  async exportOrders() {
    return this.request<any>('post', '/orders/export', {})
  }

  async getPickupLocations() {
    return this.request<any>('get', '/settings/company/pickup')
  }

  async addPickupLocation(payload: any) {
    return this.request<any>('post', '/settings/company/addpickup', payload)
  }

  async createCustomOrder(payload: any) {
    return this.request<any>('post', '/orders/create/adhoc', payload)
  }

  async createChannelSpecificOrder(payload: any) {
    return this.request<any>('post', '/orders/create', payload)
  }

  async createExchangeOrder(payload: any) {
    return this.request<any>('post', '/orders/create/exchange', payload)
  }

  async createReturnShipment(payload: any) {
    return this.request<any>('post', '/shipments/create/return-shipment', payload)
  }

  async updateOrder(payload: any) {
    return this.request<any>('post', '/orders/update/adhoc', payload)
  }

  async updateReturnOrder(payload: any) {
    return this.request<any>('post', '/orders/edit', payload)
  }

  async updateOrderPickupLocation(payload: any) {
    return this.request<any>('patch', '/orders/address/pickup', payload)
  }

  async updateCustomerDeliveryAddress(payload: any) {
    return this.request<any>('post', '/orders/address/update', payload)
  }

  async cancelOrders(payload: { ids: Array<string | number> }) {
    return this.request<any>('post', '/orders/cancel', payload)
  }

  async addInventoryForOrderedProduct(payload: any) {
    return this.request<any>('patch', '/orders/fulfill', payload)
  }

  async mapUnmappedProducts(payload: any) {
    return this.request<any>('patch', '/orders/mapping', payload)
  }

  async importOrdersInBulk(payload: any) {
    return this.request<any>('post', '/orders/import', payload)
  }

  async importOrdersInBulkFromFile(file: {
    buffer: Buffer
    originalname?: string
    mimetype?: string
  }) {
    await this.ensureConfigLoaded()

    if (!file?.buffer || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
      throw new HttpError(400, 'CSV file is required for Shiprocket bulk import')
    }

    let lastError: any = null
    for (const forceRefreshToken of [false, true]) {
      try {
        const token = await this.getToken(forceRefreshToken)
        const url = `${this.baseApi}/orders/import`
        const form = new FormData()
        const fileName = String(file.originalname || 'shiprocket-orders.csv').trim()
        const mimeType = String(file.mimetype || 'text/csv').trim() || 'text/csv'
        const blob = new Blob([file.buffer], { type: mimeType })
        form.append('file', blob, fileName)

        this.log('API request', {
          method: 'post',
          url,
          payload: { file: '[binary omitted]' },
          forceRefreshToken,
        })

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: form,
        })

        const responseText = await response.text()
        let responseBody: any = null
        try {
          responseBody = responseText ? JSON.parse(responseText) : null
        } catch {
          responseBody = responseText
        }

        if (response.status === 401 && !forceRefreshToken) {
          ShiprocketCourierService.authToken = null
          ShiprocketCourierService.authTokenExpiresAt = null
          continue
        }

        if (!response.ok) {
          throw new HttpError(
            response.status,
            this.extractErrorMessage({ response: { data: responseBody } }, 'Shiprocket import failed'),
          )
        }

        this.log('API response', {
          method: 'post',
          url,
          response: this.sanitizeForLogs(responseBody),
        })

        return responseBody
      } catch (err: any) {
        lastError = err
        if (Number(err?.statusCode || err?.response?.status || 0) === 401 && !forceRefreshToken) {
          ShiprocketCourierService.authToken = null
          ShiprocketCourierService.authTokenExpiresAt = null
          continue
        }
        break
      }
    }

    throw new HttpError(
      Number(lastError?.statusCode || lastError?.response?.status || 502),
      this.extractErrorMessage(lastError, 'Shiprocket import failed'),
    )
  }

  async checkCourierServiceability(params: Record<string, any>) {
    return this.request<any>('get', '/courier/serviceability', undefined, params)
  }

  async assignAwb(payload: any) {
    return this.request<any>('post', '/courier/assign/awb', payload)
  }

  async generateAwbForReturnShipment(payload: any) {
    return this.request<any>('post', '/courier/assign/awb', payload)
  }

  async generatePickup(payload: any) {
    return this.request<any>('post', '/courier/generate/pickup', payload)
  }

  async generateManifest(payload: any) {
    return this.request<any>('post', '/manifests/generate', payload)
  }

  async printManifest(payload: any) {
    return this.request<any>('post', '/manifests/print', payload)
  }

  async generateLabel(payload: any) {
    return this.request<any>('post', '/courier/generate/label', payload)
  }

  async generateInvoice(payload: any) {
    return this.request<any>('post', '/orders/print/invoice', payload)
  }

  async trackByAwb(awb: string) {
    return this.request<any>('get', `/courier/track/awb/${encodeURIComponent(awb)}`)
  }

  async trackByShipmentId(shipmentId: string | number) {
    return this.request<any>(
      'get',
      `/courier/track/shipment/${encodeURIComponent(String(shipmentId))}`,
    )
  }

  async trackByOrderId(params: { order_id: string; channel_id?: string | number }) {
    const query: Record<string, any> = {
      order_id: String(params?.order_id || '').trim(),
    }
    if (params?.channel_id !== undefined && params?.channel_id !== null && params?.channel_id !== '') {
      query.channel_id = params.channel_id
    }
    return this.request<any>('get', '/courier/track', undefined, query)
  }

  async trackByAwbs(payload: { awbs: string[] }) {
    return this.request<any>('post', '/courier/track/awbs', payload)
  }

  async updateInventory(
    productId: string | number,
    payload: { quantity: number; action: 'add' | 'replace' | 'remove' },
  ) {
    const normalizedProductId = String(productId || '').trim()
    if (!normalizedProductId) {
      throw new HttpError(400, 'product_id is required')
    }

    return this.request<any>(
      'put',
      `/inventory/${encodeURIComponent(normalizedProductId)}/update`,
      payload,
    )
  }

  async getAllZones(countryId: string | number) {
    const normalizedCountryId = String(countryId || '').trim()
    if (!normalizedCountryId) {
      throw new HttpError(400, 'country_id is required')
    }
    return this.request<any>(
      'get',
      `/countries/show/${encodeURIComponent(normalizedCountryId)}`,
    )
  }

  async getLocalityDetails(postcode: string | number) {
    const normalizedPostcode = String(postcode || '').trim()
    if (!normalizedPostcode) {
      throw new HttpError(400, 'postcode is required')
    }
    return this.request<any>('get', '/open/postcode/details', undefined, {
      postcode: normalizedPostcode,
    })
  }

  async cancelShipmentByAwbs(payload: any) {
    return this.request<any>('post', '/orders/cancel/shipment/awbs', payload)
  }

  async getNdrShipmentDetails(awb: string | number) {
    const normalizedAwb = String(awb || '').trim()
    if (!normalizedAwb) {
      throw new HttpError(400, 'awb is required')
    }
    return this.request<any>('get', `/ndr/${encodeURIComponent(normalizedAwb)}`)
  }

  async actionNdrShipment(awb: string | number, payload: any) {
    const normalizedAwb = String(awb || '').trim()
    if (!normalizedAwb) {
      throw new HttpError(400, 'awb is required')
    }
    return this.request<any>('post', `/ndr/${encodeURIComponent(normalizedAwb)}/action`, payload || {})
  }

  async getDiscrepancyData() {
    return this.request<any>('get', '/billing/discrepancy')
  }

  async checkFileImportStatus(importId: string | number) {
    return this.request<any>('get', `/errors/${encodeURIComponent(String(importId))}/check`)
  }

  async exportUnmappedProducts() {
    return this.request<any>('get', '/listings/export/unmapped')
  }

  async exportCatalogSample() {
    return this.request<any>('get', '/listings/sample')
  }

  async proxyRequest({
    method,
    path,
    data,
    params,
  }: {
    method?: string
    path: string
    data?: any
    params?: Record<string, any>
  }) {
    const normalizedMethod = String(method || 'get').trim().toLowerCase()
    const allowedMethods: ShiprocketHttpMethod[] = ['get', 'post', 'patch', 'put', 'delete']
    if (!allowedMethods.includes(normalizedMethod as ShiprocketHttpMethod)) {
      throw new HttpError(400, 'Invalid Shiprocket proxy method. Allowed: GET, POST, PATCH, PUT, DELETE')
    }

    const normalizedPath = String(path || '').trim()
    if (!normalizedPath) {
      throw new HttpError(400, 'Shiprocket proxy path is required')
    }

    return this.request<any>(normalizedMethod as ShiprocketHttpMethod, normalizedPath, data, params)
  }
}
