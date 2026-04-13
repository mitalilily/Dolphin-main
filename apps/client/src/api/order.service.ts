import axiosInstance from './axiosInstance'

export interface CreateShipmentParams {
  order_number: string
  payment_type: 'cod' | 'prepaid' | 'reverse'
  package_weight?: number
  package_length?: number
  prepaid_amount?: number
  package_breadth?: number
  package_height?: number
  transaction_fee?: number
  integration_type?: 'delhivery' | 'xpressbees' | 'ekart' | 'icarry'
  request_auto_pickup?: 'Yes' | 'No'
  gift_wrap?: number
  shipping_charges?: number // What seller charges customer (customer-facing price)
  freight_charges?: number // What platform charges seller (based on rate card)
  courier_cost?: number // Estimated courier cost from serviceability (what platform pays courier - can be updated via webhook)
  cod_charges?: number
  discount?: number
  order_date: string
  order_amount: number
  consignee: {
    name: string
    company_name?: string
    address: string
    address_2?: string
    city: string
    state: string
    email?: string
    pincode: string
    phone: string
    gstin?: string
  }
  pickup: {
    warehouse_name: string
    address: string
    address_2?: string
    city: string
    state: string
    pincode: string
    phone: string
    gst_number?: string
    name?: string
    pickup_date?: string
    pickup_time?: string
  }
  pickup_location_id?: string
  is_rto_different?: 'yes' | 'no'
  rto?: {
    warehouse_name: string
    name: string
    address: string
    address_2?: string
    city: string
    state: string
    pincode: string
    phone: string
  }
  order_items: {
    name: string
    sku: string
    qty: number
    price: number
    hsn: string
    discount: number
    tax_rate: number
  }[]
  courier_id?: number
  is_insurance?: 0 | 1
  tags?: string
  pickup_date?: string
  pickup_time?: string
  delivery_location?: string
  zone_id?: string
  selected_max_slab_weight?: number
  courier_option_key?: string
}

export const createShipment = async (data: CreateShipmentParams) => {
  try {
    // Set longer timeout (3.5 minutes) for B2C order creation as external courier API calls can take time
    const res = await axiosInstance.post('/orders/b2c/create', data, {
      timeout: 210000, // 3.5 minutes (210 seconds)
    })
    return res.data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error creating shipment:', error.response?.data || error.message)
    throw error
  }
}

export type CreateB2BShipmentParams = {
  order_number: string
  order_date: string
  payment_type: 'prepaid' | 'cod'
  order_amount: number
  shipping_charges?: number
  freight_charges?: number // What platform charges seller (based on rate card)
  courier_cost?: number // Estimated courier cost from serviceability (what platform pays courier - can be updated via webhook)
  transaction_fee?: number
  discount?: number
  gift_wrap?: number
  prepaid_amount?: number

  consignee: {
    name: string
    phone: string
    email?: string
    address: string
    city: string
    state: string
    pincode: string
    company_name: string
    gstin?: string
  }

  pickup: {
    warehouse_name?: string
    address?: string
    name?: string
    city: string
    state: string
    pincode: string
    phone: string
  }
  pickup_location_id?: string

  // Boxes array
  boxes: Array<{
    lengthCm: number
    breadthCm: number
    heightCm: number
    weightKg: number
  }>

  // Invoices array
  invoices: Array<{
    invoiceNumber: string
    invoiceDate: string
    invoiceValue: number
    invoiceFileUrl?: string
  }>

  courier_id: number
  courier_partner?: string
  is_insurance?: boolean
  is_rto_different?: 'yes' | 'no'
  rto?: {
    warehouse_name: string
    name: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
  }
  request_auto_pickup?: 'yes' | 'no'
  pickup_date?: string
  pickup_time?: string
  integration_type?: string
  tags?: string
  delivery_location?: string
  zone_id?: string
}

export const createB2BShipment = async (data: CreateB2BShipmentParams) => {
  try {
    const res = await axiosInstance.post('/orders/b2b/create', data)
    return res.data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error creating B2B shipment:', error.response?.data || error.message)
    throw error
  }
}

export const checkOrderNumberAvailability = async (orderNumber: string) => {
  const res = await axiosInstance.get('/orders/check-order-number', {
    params: { orderNumber },
  })
  return res.data
}

interface FetchB2COrdersParams {
  page?: number
  limit?: number
  status?: string
  sortBy?: 'created_at'
  sortOrder?: 'asc' | 'desc'
  fromDate?: string
  toDate?: string
  search?: string
}

export const fetchB2COrdersByUser = async (params: FetchB2COrdersParams = {}) => {
  const res = await axiosInstance.get('/orders/b2c/list', {
    params,
  })
  return res.data // { success, orders, totalCount, totalPages }
}

export const fetchB2BOrdersByUser = async (params: FetchB2COrdersParams = {}) => {
  const res = await axiosInstance.get('/orders/b2b/list', {
    params,
  })
  return res.data // { success, orders, totalCount, totalPages }
}

export interface GenerateManifestParams {
  awbs: string[]
  type: 'b2c' | 'b2b'
}

export interface GenerateManifestResponse {
  manifest_id: string
  manifest_url: string
  warnings?: string[]
}

export const generateManifestService = async (params: GenerateManifestParams) => {
  const res = await axiosInstance.post<GenerateManifestResponse>('/orders/b2c/manifest', params, {
    timeout: 600000,
  })
  return res.data
}

export interface RetryManifestResponse extends GenerateManifestResponse {
  manifest_key?: string | null
  retry_count: number
  retries_remaining: number
  order_status: string | null
}

export const retryFailedManifestService = async (orderId: string) => {
  const res = await axiosInstance.post<RetryManifestResponse>(
    `/orders/b2c/${orderId}/retry-manifest`,
  )
  return res.data
}

export const regenerateOrderDocumentsService = async (
  orderId: string,
  { regenerateLabel = true, regenerateInvoice = true } = {},
) => {
  const res = await axiosInstance.post(`/orders/${orderId}/regenerate-documents`, {
    regenerateLabel,
    regenerateInvoice,
  })
  return res.data
}

interface FetchOrdersParams {
  page?: number
  limit?: number
}

export const fetchAllOrders = async (params: FetchOrdersParams = {}) => {
  try {
    const res = await axiosInstance.get('/orders/all', { params })
    return res.data // { success, orders, totalCount, totalPages }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error fetching orders:', error.response?.data || error.message)
    throw new Error(error.response?.data?.message || 'Failed to fetch orders')
  }
}
