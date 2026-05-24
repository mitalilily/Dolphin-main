import axios, { AxiosInstance } from 'axios'
import { HttpError } from '../../../utils/classes'
import { withRetry } from '../../../utils/httpRetry'
import {
  TruxcargoConfig,
  getEffectiveCourierConfig,
} from '../courierCredentials.service'

export type TruxcargoApiResponse<T = any> = {
  success?: boolean | number | string
  status?: boolean | number | string
  message?: string
  data?: T
  [key: string]: any
}

type TruxcargoHttpMethod = 'get' | 'post'

export class TruxcargoService {
  private baseApi = process.env.TRUXCARGO_API_BASE || 'https://b2b.truxcargo.com'
  private userId = process.env.TRUXCARGO_USER_ID || ''
  private apiKey = process.env.TRUXCARGO_API_KEY || ''

  private static cachedConfig: TruxcargoConfig | null | undefined

  static clearCachedConfig() {
    TruxcargoService.cachedConfig = undefined
  }

  private normalizeBaseApi(value?: string | null) {
    const normalized = String(value || '').trim().replace(/\/+$/, '')
    return normalized || 'https://b2b.truxcargo.com'
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
            'api_key',
            'apikey',
            'key',
            'password',
            'authorization',
            'token',
            'x-api-key',
            'user_id',
            'userid',
            'client_id',
            'clientid',
            'label',
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
    console.log(`[Truxcargo] ${prefix}`, details)
  }

  private async ensureConfigLoaded() {
    if (TruxcargoService.cachedConfig === undefined) {
      try {
        TruxcargoService.cachedConfig = await getEffectiveCourierConfig<TruxcargoConfig>(
          'truxcargo',
          'b2c',
        )
      } catch (err: any) {
        this.log('Config lookup failed, using env fallback', {
          message: err?.message || err,
        })
        TruxcargoService.cachedConfig = null
      }
    }

    const cfg = TruxcargoService.cachedConfig
    if (cfg) {
      this.baseApi = cfg.apiBase || this.baseApi
      this.userId = cfg.userId || this.userId
      this.apiKey = cfg.apiKey || this.apiKey
    }

    this.baseApi = this.normalizeBaseApi(this.baseApi)
  }

  private extractErrorMessage(err: any, fallback: string) {
    const stripHtml = (value: string) =>
      value
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    const candidates = [
      err?.response?.data?.message,
      err?.response?.data?.error,
      typeof err?.response?.data === 'string' ? stripHtml(err.response.data) : undefined,
      err?.message,
    ]
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim().slice(0, 500)
    }
    return fallback
  }

  private async getHttp(): Promise<AxiosInstance> {
    await this.ensureConfigLoaded()
    if (!this.apiKey) {
      throw new HttpError(400, 'Truxcargo api key is missing')
    }

    return axios.create({
      baseURL: this.baseApi,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': this.apiKey,
        'x-api-key': this.apiKey,
      },
    })
  }

  private async request<T = any>(
    method: TruxcargoHttpMethod,
    path: string,
    data?: any,
    params?: Record<string, any>,
  ): Promise<TruxcargoApiResponse<T>> {
    const http = await this.getHttp()
    const payload = { ...(data || {}) }
    if (!payload.key) payload.key = this.apiKey
    if (!payload.user_id && this.userId) payload.user_id = this.userId

    try {
      this.log('API request', {
        method,
        url: `${this.baseApi}/${path.replace(/^\/+/, '')}`,
        payload: this.sanitizeForLogs(payload),
        params,
      })
      const response = await withRetry(
        () =>
          http.request<TruxcargoApiResponse<T>>({
            method,
            url: `/${path.replace(/^\/+/, '')}`,
            data: method === 'get' ? undefined : payload,
            params,
        }),
        { attempts: 3, baseDelayMs: 250, maxDelayMs: 1500 },
      )
      let responseData: any = response.data
      if (typeof responseData === 'string') {
        const jsonMatch = responseData.match(/\{[\s\S]*\}\s*$/)
        if (jsonMatch) {
          try {
            responseData = JSON.parse(jsonMatch[0])
          } catch {
            // Keep the original provider response if it cannot be parsed safely.
          }
        }
      }
      this.log('API response', {
        method,
        url: `${this.baseApi}/${path.replace(/^\/+/, '')}`,
        response: this.sanitizeForLogs(responseData),
      })
      return responseData
    } catch (err: any) {
      this.log('API request failed', {
        method,
        url: `${this.baseApi}/${path.replace(/^\/+/, '')}`,
        payload: this.sanitizeForLogs(payload),
        params,
        status: err?.response?.status || null,
        response: this.sanitizeForLogs(err?.response?.data) || null,
        message: err?.message || err,
      })
      throw new HttpError(
        Number(err?.response?.status || 502),
        this.extractErrorMessage(err, `Truxcargo API request failed for ${path}`),
      )
    }
  }

  async checkPincodeServiceability(payload: Record<string, any>) {
    return this.request('post', '/api/orderb2c/serviceability', payload || {})
  }

  async createWarehouse(payload: Record<string, any>) {
    return this.request('post', '/api/b2cwarehouse', payload || {})
  }

  async getWarehousePoints(payload?: Record<string, any>) {
    return this.request('post', '/api/warehouse/point', payload || {})
  }

  async createOrder(payload: Record<string, any>) {
    return this.request('post', '/api/orderb2c/creation', payload || {})
  }

  async createPackagingSlip(payload: Record<string, any>) {
    return this.request('post', '/api/orderb2c/packagingslip', payload || {})
  }

  async trackShipment(payload: { waybill?: string | number; order_id?: string | number }) {
    return this.request('post', '/api/orderb2c/tracking', payload || {})
  }

  async cancelOrder(payload: Record<string, any>) {
    return this.request('post', '/api/orderb2c/cancel', payload || {})
  }

  async getShippingCharge(payload: Record<string, any>) {
    return this.request('post', '/api/orderb2c/shippingcharge', payload || {})
  }

  async fetchAllWaybills(payload?: Record<string, any>) {
    return this.request('post', '/api/orderb2c/order', payload || {})
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
    const allowedMethods: TruxcargoHttpMethod[] = ['get', 'post']
    if (!allowedMethods.includes(normalizedMethod as TruxcargoHttpMethod)) {
      throw new HttpError(400, 'Invalid Truxcargo proxy method. Allowed: GET, POST')
    }
    const normalizedPath = String(path || '').trim()
    if (!normalizedPath) throw new HttpError(400, 'Truxcargo proxy path is required')
    return this.request(normalizedMethod as TruxcargoHttpMethod, normalizedPath, data, params)
  }
}
