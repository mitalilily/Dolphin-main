import { saveAs } from 'file-saver'

export type DocumentType = 'label' | 'invoice' | 'manifest'

export type BulkOrderDocumentShape = {
  id: string | number
  type?: 'b2c' | 'b2b'
  order_number?: string | null
  awb_number?: string | null
  order_status?: string | null
  integration_type?: string | null
  courier_partner?: string | null
  label?: string | null
  label_key?: string | null
  label_url?: string | null
  manifest?: string | null
  manifest_key?: string | null
  manifest_url?: string | null
  invoice_link?: string | null
  invoice_key?: string | null
  invoice_url?: string | null
}

export type DocumentEntry = {
  key?: string | null
  url?: string | null
  fileName: string
}

type ApiLikeError = {
  code?: string
  request?: unknown
  response?: {
    data?: {
      message?: string
      error?: string
    }
  }
  message?: string
}

export const BULK_MANIFEST_LIMIT = 5

const B2C_MANIFESTABLE_STATUSES = new Set([
  'pending',
  'booked',
  'shipment_created',
  'manifest_failed',
])

const B2C_MANIFEST_DONE_STATUSES = new Set([
  'pickup_initiated',
  'manifest_generated',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'ndr',
  'undelivered',
  'rto',
  'rto_in_transit',
  'rto_delivered',
])

const B2C_CANCELABLE_STATUSES = new Set([
  'pending',
  'booked',
  'shipment_created',
  'pickup_initiated',
  'manifest_failed',
])

const B2C_LOCAL_CANCEL_STATUSES = new Set(['pending', 'booked', 'manifest_failed'])

const B2C_TERMINAL_STATUSES = new Set(['delivered', 'cancelled', 'rto_delivered'])

const B2C_CANCEL_PROVIDERS = new Set([
  'delhivery',
  'ekart',
  'xpressbees',
  'shipmozo',
  'shiprocket',
  'truxcargo',
  'icarry',
])

export const isHttpUrl = (value?: string | null) => typeof value === 'string' && /^https?:\/\//i.test(value)
export const isDataUrl = (value?: string | null) =>
  typeof value === 'string' && /^data:application\/pdf;base64,/i.test(value)
export const isDirectDownloadUrl = (value?: string | null) => isHttpUrl(value) || isDataUrl(value)

export const getB2CManifestIdentifier = (order: BulkOrderDocumentShape) =>
  order.order_number || order.awb_number || null

export const getNormalizedOrderStatus = (order: BulkOrderDocumentShape) =>
  String(order.order_status || '').trim().toLowerCase()

export const hasManifestDocument = (order: BulkOrderDocumentShape) =>
  Boolean(String(order.manifest_url || order.manifest_key || order.manifest || '').trim())

export const getB2CManifestProvider = (order: BulkOrderDocumentShape) => {
  const integrationType = String(order.integration_type || '').trim().toLowerCase()
  const courierPartner = String(order.courier_partner || '').trim().toLowerCase()

  if (integrationType.includes('shiprocket') || courierPartner.includes('shiprocket')) {
    return 'shiprocket'
  }

  if (integrationType.includes('truxcargo') || courierPartner.includes('truxcargo')) {
    return 'truxcargo'
  }

  if (integrationType.includes('icarry') || courierPartner.includes('icarry')) {
    return 'icarry'
  }

  if (integrationType.includes('shipmozo') || courierPartner.includes('shipmozo')) {
    return 'shipmozo'
  }

  if (integrationType.includes('xpressbees') || courierPartner.includes('xpressbees')) {
    return 'xpressbees'
  }

  if (integrationType.includes('ekart') || courierPartner.includes('ekart')) {
    return 'ekart'
  }

  return 'delhivery'
}

export const isB2CManifestEligible = (order: BulkOrderDocumentShape) => {
  return getB2CManifestDisabledReason(order) === null
}

export const isB2CManifestComplete = (order: BulkOrderDocumentShape) => {
  const status = getNormalizedOrderStatus(order)
  return hasManifestDocument(order) || B2C_MANIFEST_DONE_STATUSES.has(status)
}

export const getB2CManifestDisabledReason = (order: BulkOrderDocumentShape) => {
  const status = getNormalizedOrderStatus(order)

  if (status === 'cancelled') return 'Cancelled orders cannot be manifested.'
  if (isB2CManifestComplete(order)) return 'Manifest is already generated for this order.'
  if (!getB2CManifestIdentifier(order)) return 'Order number or AWB is required before manifest.'
  if (!B2C_MANIFESTABLE_STATUSES.has(status)) {
    return 'Manifest is available after booking and before pickup starts.'
  }

  return null
}

export const getB2CCancelProvider = (order: BulkOrderDocumentShape) => {
  const integrationType = String(order.integration_type || '').trim().toLowerCase()
  const courierPartner = String(order.courier_partner || '').trim().toLowerCase()
  const providerText = `${integrationType} ${courierPartner}`

  if (providerText.includes('shiprocket')) return 'shiprocket'
  if (providerText.includes('truxcargo')) return 'truxcargo'
  if (providerText.includes('icarry')) return 'icarry'
  if (providerText.includes('shipmozo')) return 'shipmozo'
  if (providerText.includes('xpressbees')) return 'xpressbees'
  if (providerText.includes('ekart')) return 'ekart'
  if (providerText.includes('delhivery')) return 'delhivery'
  return integrationType || courierPartner
}

export const getB2CCancelDisabledReason = (order: BulkOrderDocumentShape) => {
  const status = getNormalizedOrderStatus(order)
  const provider = getB2CCancelProvider(order)
  const hasAwb = Boolean(String(order.awb_number || '').trim())

  if (status === 'cancelled') return 'Order is already cancelled.'
  if (status === 'cancellation_requested') return 'Cancellation has already been requested.'
  if (B2C_TERMINAL_STATUSES.has(status)) return 'This order is already in a terminal stage.'
  if (!B2C_CANCELABLE_STATUSES.has(status)) return 'Cancellation is not available at this stage.'
  if (provider && !B2C_CANCEL_PROVIDERS.has(provider)) {
    return `Cancellation is not supported for ${provider}.`
  }
  if (!hasAwb && !B2C_LOCAL_CANCEL_STATUSES.has(status)) {
    return 'Courier cancellation needs an AWB after pickup starts.'
  }

  return null
}

export const isB2CCancelEligible = (order: BulkOrderDocumentShape) =>
  getB2CCancelDisabledReason(order) === null

const sanitizeFileNameSegment = (value: string) =>
  value
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const getFileExtension = (value?: string | null) => {
  if (!value) return '.pdf'

  const path = isHttpUrl(value)
    ? (() => {
        try {
          return new URL(value).pathname
        } catch {
          return value
        }
      })()
    : value

  const match = path.match(/\.[a-z0-9]+$/i)
  return match?.[0] || '.pdf'
}

const triggerBrowserDownload = (url: string, fileName: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const downloadFile = async (url: string, fileName: string) => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`)
    }

    const blob = await response.blob()
    saveAs(blob, fileName)
  } catch (error) {
    console.warn('Falling back to browser download for bulk file:', error)
    triggerBrowserDownload(url, fileName)
  }
}

export const getDocumentReference = (order: BulkOrderDocumentShape, type: DocumentType) => {
  if (type === 'label') {
    return {
      key:
        typeof order.label_key === 'string'
          ? order.label_key
          : typeof order.label === 'string' && !isDirectDownloadUrl(order.label)
            ? order.label
            : null,
      url: isDirectDownloadUrl(order.label_url)
        ? order.label_url
        : isDirectDownloadUrl(order.label)
          ? order.label
          : null,
    }
  }

  if (type === 'manifest') {
    return {
      key:
        typeof order.manifest_key === 'string'
          ? order.manifest_key
          : typeof order.manifest === 'string' && !isDirectDownloadUrl(order.manifest)
            ? order.manifest
            : null,
      url: isDirectDownloadUrl(order.manifest_url)
        ? order.manifest_url
        : isDirectDownloadUrl(order.manifest)
          ? order.manifest
          : null,
    }
  }

  return {
    key:
      typeof order.invoice_key === 'string'
        ? order.invoice_key
        : typeof order.invoice_link === 'string' && !isDirectDownloadUrl(order.invoice_link)
          ? order.invoice_link
          : null,
    url: isDirectDownloadUrl(order.invoice_url)
      ? order.invoice_url
      : isDirectDownloadUrl(order.invoice_link)
        ? order.invoice_link
        : null,
  }
}

export const getDownloadFileName = (
  order: BulkOrderDocumentShape,
  type: DocumentType,
  source?: string | null,
) => {
  const baseName =
    sanitizeFileNameSegment(
      String(order.order_number || order.awb_number || `${order.type || 'order'}-${order.id}`),
    ) || `order-${order.id}`

  return `${baseName}-${type}${getFileExtension(source)}`
}

export const getActionableErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiLikeError
  const rawMessage = typeof apiError?.message === 'string' ? apiError.message.trim() : ''
  const responseMessage = apiError?.response?.data?.message
  const responseError = apiError?.response?.data?.error

  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage.trim()
  }

  if (typeof responseError === 'string' && responseError.trim()) {
    return responseError.trim()
  }

  if (apiError?.code === 'ECONNABORTED' || /timeout/i.test(rawMessage)) {
    return 'The request is taking longer than expected. Please try again shortly.'
  }

  if (!apiError?.response && (/network error/i.test(rawMessage) || /failed to fetch/i.test(rawMessage))) {
    return 'Could not reach the server. Please check your connection and try again.'
  }

  return (
    rawMessage ||
    fallback
  )
}

export const summarizeOrderNumbers = (
  values: Array<string | number>,
  maxVisible = 5,
) => {
  const normalized = values.map((value) => String(value)).filter(Boolean)
  if (normalized.length <= maxVisible) return normalized.join(', ')

  const visible = normalized.slice(0, maxVisible).join(', ')
  return `${visible} +${normalized.length - maxVisible} more`
}

export const summarizeMessages = (
  values: Array<string | number>,
  maxVisible = 2,
) => {
  const normalized = values.map((value) => String(value).trim()).filter(Boolean)
  if (normalized.length === 0) return ''
  if (normalized.length <= maxVisible) return normalized.join(' ')

  return `${normalized.slice(0, maxVisible).join(' ')} +${normalized.length - maxVisible} more issue(s).`
}
