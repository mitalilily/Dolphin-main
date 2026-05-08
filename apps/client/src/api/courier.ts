// src/services/courierService.ts
import axiosInstance from './axiosInstance'

export interface Courier {
  id: number
  name: string
  displayName?: string | null
  courier_option_key?: string | null
  max_slab_weight?: number | null
  edd?: string | null
  tag?: string | null
  baseCourierId?: number | null
  masterCompany?: string | null
  realtimeTracking?: string | null
  deliveryBoyContact?: string | null
  podAvailable?: string | null
  callBeforeDelivery?: string | null
  activatedDate?: string | null
  mode?: number | null
  minWeight?: number | null
  courierType?: number | null
  isHyperlocal?: boolean
  isOwnKeyCourier?: boolean
  ownkeyCourierId?: number | null
  useSrPostcodes?: boolean
  serviceType?: number | null
  // Slabbed pricing fields returned by backend
  rate?: number | null
  chargeable_weight?: number | null
  volumetric_weight?: number | null
  slabs?: number | null
  courier_cost_estimate?: number | null
  localRates?: Record<string, unknown>
  approxZone?: { id?: string; code?: string; name?: string } | null
}

export interface CourierSummary {
  totalCourierCount: number
  serviceablePincodesCount: number
  pickupPincodesCount: number
  totalRtoCount: number
  totalOdaCount: number
  updatedAt?: string
}

// src/api/courier.ts

export interface CourierListResponse {
  summary: CourierSummary
  couriers: Courier[]
  totalCount: number
  page: number
  limit: number
}

interface GetCouriersParams {
  page?: number
  limit?: number
  filters?: Record<string, string | boolean | number | string[]>
}

export const getCouriers = async ({
  page,
  limit,
  filters = {},
}: GetCouriersParams): Promise<CourierListResponse> => {
  const params = new URLSearchParams()

  // ✅ Only add pagination if provided
  if (page !== undefined) params.set('page', String(page))
  if (limit !== undefined) params.set('limit', String(limit))

  // ✅ Add filters safely
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== '' && val !== undefined && val !== null) {
      params.set(key, String(val))
    }
  })

  const queryString = params.toString()
  const url = queryString ? `/couriers?${queryString}` : '/couriers'

  const res = await axiosInstance.get<{ status: string; data: CourierListResponse }>(url)

  return res.data.data
}

export const getCourierById = async (id: number): Promise<Courier> => {
  const res = await axiosInstance.get<{ status: string; data: Courier }>(`/couriers/${id}`)
  return res.data.data
}

interface FetchCouriersResponse {
  success: boolean
  data: Courier[]
  error?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchAvailableCouriers = async (params: any): Promise<any[]> => {
  try {
    const res = await axiosInstance.post<FetchCouriersResponse>('/couriers/available-to-user', {
      ...params,
    })

    if (!res.data.success) {
      throw new Error(res.data.error || 'Failed to fetch couriers')
    }

    return res.data.data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('fetchAvailableCouriers error:', error.response?.data || error.message)
    throw new Error(error.response?.data?.error || error.message || 'Failed to fetch couriers')
  }
}

interface ShippingRatesFilters {
  courier?: string | string[]
  mode?: string
  min_weight?: number | string
  businessType?: 'b2b' | 'b2c'
  // add more fields if needed
}

export const fetchShippingRates = async (filters: ShippingRatesFilters = {}) => {
  const params = new URLSearchParams()

  const courierNames = Array.isArray(filters.courier)
    ? filters.courier
    : filters.courier
      ? [filters.courier]
      : []

  courierNames
    .map((name) => String(name || '').trim())
    .filter(Boolean)
    .forEach((name) => params.append('courier_name[]', name))

  if (filters.mode) params.set('mode', filters.mode)
  if (filters.min_weight !== undefined && filters.min_weight !== '') {
    params.set('min_weight', String(filters.min_weight))
  }
  if (filters.businessType) params.set('businessType', filters.businessType)

  const response = await axiosInstance.get('/couriers/shipping-rates', { params })
  return response.data.data
}

export const fetchAllCouriers = async () => {
  const res = await axiosInstance.get(`/couriers/list`)
  if (!res.data?.success) throw new Error('Failed to fetch couriers')
  const rows: Array<string | { name?: string | null }> = Array.isArray(res.data.data)
    ? res.data.data
    : []
  const names = rows
    .map((row) => (typeof row === 'string' ? row : row?.name))
    .map((name) => String(name || '').trim())
    .filter(Boolean)

  return Array.from(new Set<string>(names)).sort((a, b) => a.localeCompare(b))
}

export const fetchCouriersWithDetails = async () => {
  const res = await axiosInstance.get(`/couriers/full-list`)
  if (!res.data?.success) throw new Error('Failed to fetch couriers')
  return res.data.data // returns an array of courier names
}
export const getZones = async () => {
  const res = await axiosInstance.get('/admin/zones')
  return res.data
}

export const getZonesFiltered = async (
  businessType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: any,
) => {
  const params = new URLSearchParams()
  if (businessType) params.append('business_type', businessType)

  // Only include courier filter if B2B
  if (businessType === 'B2B' && filters.courier_id) {
    params.append('courier_id', String(filters.courier_id))
  }

  const res = await axiosInstance.get(`/admin/zones?${params.toString()}`)
  return res.data
}
