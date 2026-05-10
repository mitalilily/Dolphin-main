import axiosInstance from './axiosInstance'

export interface TrackingHistory {
  status_code: string // CAN, PP, IT, OFD, DL, RT, etc.
  location: string
  event_time: string
  message: string
}

export interface TrackingResponse {
  id: string
  order_id: string | null
  order_number: string
  awb_number: string
  courier_name: string
  provider?: string
  status: string // cancelled, in-transit, delivered, etc.
  status_code?: string
  edd: string | null
  history: TrackingHistory[]
  payment_type: string
  shipment_info: string | null
  source?: 'courier_api' | 'local_cache'
  stale?: boolean
  warning?: string
  last_updated_at?: string
  consignee?: { name?: string; city?: string; pincode?: string }
  weight?: string | number
  dimensions?: string
}

export interface TrackingParams {
  awb?: string
  orderNumber?: string
  contact?: string
}

interface ApiResponse {
  success: boolean
  data: TrackingResponse
  message?: string
}

export const normalizeAwbParam = (value?: string | null) =>
  (value || '').trim().replace(/\s+/g, '').toUpperCase()

export const normalizeContactParam = (value?: string | null) => {
  const raw = (value || '').trim()
  if (!raw) return ''
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return raw.toLowerCase()

  const digits = raw.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

export const isValidTrackingContact = (value?: string | null) => {
  const raw = (value || '').trim()
  if (!raw) return false
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return true
  const digits = normalizeContactParam(raw)
  return digits.length >= 7 && digits.length <= 15
}

export const normalizeTrackingParams = (params: TrackingParams): TrackingParams => {
  const awb = normalizeAwbParam(params.awb)
  if (awb) return { awb }

  const orderNumber = (params.orderNumber || '').trim()
  const contact = normalizeContactParam(params.contact)
  if (orderNumber && contact) return { orderNumber, contact }

  return {}
}

export async function fetchTracking(params: TrackingParams): Promise<TrackingResponse> {
  try {
    const normalizedParams = normalizeTrackingParams(params)
    const { data } = await axiosInstance.get<ApiResponse>('/orders/track', {
      params: normalizedParams,
    })

    if (!data.success || !data.data) {
      throw new Error(data.message || 'No shipment found!')
    }

    return data.data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch tracking')
  }
}
