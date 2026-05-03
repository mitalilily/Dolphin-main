import * as dotenv from 'dotenv'
import path from 'path'
import axios from 'axios'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const { pool } = require('../models/client')
const {
  regenerateOrderDocumentsServiceAdmin,
} = require('../models/services/adminOrders.service')
const { presignDownload } = require('../models/services/upload.service')
const { DelhiveryService } = require('../models/services/couriers/delhivery.service')
const { EkartService } = require('../models/services/couriers/ekart.service')
const { IcarryService } = require('../models/services/couriers/icarry.service')
const { ShipmozoService } = require('../models/services/couriers/shipmozo.service')
const { ShiprocketCourierService } = require('../models/services/couriers/shiprocket.service')
const { TruxcargoService } = require('../models/services/couriers/truxcargo.service')

type CourierKey =
  | 'delhivery'
  | 'shiprocket'
  | 'shipmozo'
  | 'truxcargo'
  | 'icarry'
  | 'ekart'
  | 'xpressbees'

type CandidateOrder = {
  id: string
  source: 'b2c' | 'b2b'
  courier: CourierKey
  awb_number: string | null
  shipment_id: string | null
  order_id: string | null
  order_number: string | null
}

const providerDocs: Record<CourierKey, { label: string; invoice: string }> = {
  delhivery: {
    label: 'GET /api/p/packing_slip?wbns={awb}&pdf=true',
    invoice: 'No separate provider invoice endpoint in current integration; platform invoice PDF is authoritative.',
  },
  shiprocket: {
    label: 'POST /courier/generate/label with { shipment_id: number[] }',
    invoice: 'POST /orders/print/invoice with { ids: number[] }',
  },
  shipmozo: {
    label: 'GET /get-order-label/{awb_number}',
    invoice: 'No separate provider invoice endpoint in current integration; platform invoice PDF is authoritative.',
  },
  truxcargo: {
    label: 'POST /api/orderb2c/packagingslip with { waybill }',
    invoice: 'No separate provider invoice endpoint in current integration; platform invoice PDF is authoritative.',
  },
  icarry: {
    label: 'POST /api_print_shipment_label with { shipment_id }',
    invoice: 'No separate provider invoice endpoint in current integration; platform invoice PDF is authoritative.',
  },
  ekart: {
    label: 'POST /api/v1/package/label with { ids }',
    invoice: 'No separate provider invoice endpoint in current integration; platform invoice PDF is authoritative.',
  },
  xpressbees: {
    label: 'Current integration stores label from shipment response; no standalone label endpoint is configured.',
    invoice: 'No separate provider invoice endpoint in current integration; platform invoice PDF is authoritative.',
  },
}

const couriers: CourierKey[] = [
  'delhivery',
  'shiprocket',
  'shipmozo',
  'truxcargo',
  'icarry',
  'ekart',
  'xpressbees',
]

const normalizeCourier = (value: unknown): CourierKey | null => {
  const raw = String(value || '').toLowerCase()
  if (raw.includes('delhivery')) return 'delhivery'
  if (raw.includes('shiprocket')) return 'shiprocket'
  if (raw.includes('shipmozo')) return 'shipmozo'
  if (raw.includes('truxcargo') || raw.includes('trux')) return 'truxcargo'
  if (raw.includes('icarry')) return 'icarry'
  if (raw.includes('ekart')) return 'ekart'
  if (raw.includes('xpress')) return 'xpressbees'
  return null
}

const assertPdfDownload = async (keyOrDataUrl: string | null, label: string) => {
  if (!keyOrDataUrl) throw new Error(`${label} did not return a storage key or inline PDF`)
  if (/^data:application\/pdf;base64,/i.test(keyOrDataUrl)) {
    const buffer = Buffer.from(keyOrDataUrl.split(',')[1] || '', 'base64')
    if (!buffer.subarray(0, 4).equals(Buffer.from('%PDF'))) {
      throw new Error(`${label} inline data is not a PDF`)
    }
    return { bytes: buffer.length, mode: 'inline' }
  }

  const signed = await presignDownload(keyOrDataUrl, {
    contentType: 'application/pdf',
    disposition: 'inline',
    downloadName: `${label}.pdf`,
  })
  const url = Array.isArray(signed) ? signed[0] : signed
  if (!url || !/^https?:\/\//i.test(url)) throw new Error(`${label} could not be presigned`)

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
    validateStatus: (status) => status >= 200 && status < 300,
  })
  const buffer = Buffer.from(response.data)
  if (!buffer.subarray(0, 4).equals(Buffer.from('%PDF'))) {
    throw new Error(`${label} download is not a PDF`)
  }
  return { bytes: buffer.length, mode: 'r2' }
}

const sanitizeResult = (value: any): any => {
  if (typeof value === 'string') {
    return value.length > 220 ? `${value.slice(0, 220)}...` : value
  }
  if (Array.isArray(value)) return value.map(sanitizeResult)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, sanitizeResult(nested)]))
  }
  return value
}

const safeRun = async (name: string, fn: () => Promise<any>) => {
  try {
    const data = await fn()
    return { name, ok: true, data: sanitizeResult(data) }
  } catch (error: any) {
    return { name, ok: false, message: error?.message || String(error) }
  }
}

const fetchCandidateOrders = async (): Promise<CandidateOrder[]> => {
  const b2c = await pool.query(`
    select 'b2c' as source, id::text, integration_type as courier_name, awb_number, shipment_id, order_id, order_number, updated_at
    from b2c_orders
    where coalesce(integration_type, '') <> ''
      and coalesce(awb_number, '') <> ''
    order by updated_at desc nulls last
  `)
  const b2b = await pool.query(`
    select 'b2b' as source, id::text, courier_partner as courier_name, awb_number, shipment_id, order_id, order_number, updated_at
    from b2b_orders
    where coalesce(courier_partner, '') <> ''
      and coalesce(awb_number, '') <> ''
    order by updated_at desc nulls last
  `)

  const seen = new Set<CourierKey>()
  const candidates: CandidateOrder[] = []
  for (const row of [...b2c.rows, ...b2b.rows]) {
    const courier = normalizeCourier(row.courier_name)
    if (!courier || seen.has(courier)) continue
    seen.add(courier)
    candidates.push({
      id: row.id,
      source: row.source,
      courier,
      awb_number: row.awb_number,
      shipment_id: row.shipment_id,
      order_id: row.order_id,
      order_number: row.order_number,
    })
  }
  return candidates
}

const checkProviderLabel = async (order: CandidateOrder) => {
  if (order.courier === 'delhivery') {
    if (!order.awb_number) throw new Error('awb_number is required')
    const pdf = await new DelhiveryService().generateLabel(order.awb_number, { format: 'pdf' })
    return { bytes: Buffer.from(pdf).length }
  }
  if (order.courier === 'shiprocket') {
    if (!order.shipment_id) throw new Error('shipment_id is required')
    return new ShiprocketCourierService().generateLabel({
      shipment_id: [Number(order.shipment_id)],
    })
  }
  if (order.courier === 'shipmozo') {
    if (!order.awb_number) throw new Error('awb_number is required')
    return new ShipmozoService().getOrderLabel(order.awb_number)
  }
  if (order.courier === 'truxcargo') {
    if (!order.awb_number) throw new Error('waybill is required')
    return new TruxcargoService().createPackagingSlip({ waybill: order.awb_number })
  }
  if (order.courier === 'icarry') {
    if (!order.shipment_id) throw new Error('shipment_id is required')
    return new IcarryService().printShipmentLabel({ shipment_id: Number(order.shipment_id) })
  }
  if (order.courier === 'ekart') {
    const id = order.shipment_id || order.order_id || order.awb_number
    if (!id) throw new Error('shipment/order id is required')
    const pdf = await new EkartService().downloadLabels([String(id)])
    return { bytes: Buffer.from(pdf).length }
  }
  return { skipped: true, reason: providerDocs[order.courier].label }
}

const checkProviderInvoice = async (order: CandidateOrder) => {
  if (order.courier !== 'shiprocket') {
    return { skipped: true, reason: providerDocs[order.courier].invoice }
  }
  if (!order.order_id) throw new Error('Shiprocket order_id is required')
  return new ShiprocketCourierService().generateInvoice({ ids: [Number(order.order_id)] })
}

async function main() {
  console.log('[Production Courier Documents] Provider parameter map')
  console.log(JSON.stringify(providerDocs, null, 2))

  const candidates = await fetchCandidateOrders()
  const byCourier = new Map(candidates.map((order) => [order.courier, order]))
  const summary: any[] = []

  for (const courier of couriers) {
    const order = byCourier.get(courier)
    if (!order) {
      summary.push({
        courier,
        ok: true,
        skipped: true,
        reason: 'No real order found in database for this courier.',
      })
      continue
    }

    const providerLabel = await safeRun(`${courier}.provider-label`, () => checkProviderLabel(order))
    const providerInvoice = await safeRun(`${courier}.provider-invoice`, () => checkProviderInvoice(order))

    const labelOnly = await regenerateOrderDocumentsServiceAdmin({
      orderId: order.id,
      regenerateLabel: true,
      regenerateInvoice: false,
    })
    const labelDownload = await assertPdfDownload(labelOnly.label, `${courier}-label`)

    const invoiceOnly = await regenerateOrderDocumentsServiceAdmin({
      orderId: order.id,
      regenerateLabel: false,
      regenerateInvoice: true,
    })
    const invoiceDownload = await assertPdfDownload(invoiceOnly.invoice_link, `${courier}-invoice`)

    summary.push({
      courier,
      order,
      providerLabel,
      providerInvoice,
      platformLabel: { key: labelOnly.label, download: labelDownload },
      platformInvoice: { key: invoiceOnly.invoice_link, download: invoiceDownload },
      ok: providerLabel.ok && providerInvoice.ok,
    })
  }

  console.log('[Production Courier Documents] Summary')
  console.log(JSON.stringify(summary, null, 2))

  const failed = summary.filter((row) => !row.ok)
  if (failed.length) {
    throw new Error(`Production document verification failed for: ${failed.map((row) => row.courier).join(', ')}`)
  }
}

main()
  .catch((error) => {
    console.error('[Production Courier Documents] Fatal:', error?.message || error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end().catch(() => undefined)
  })
