import { and, eq, isNotNull, isNull, notInArray, or } from 'drizzle-orm'
import { db } from '../models/client'
import { b2c_orders } from '../models/schema/b2cOrders'
import { TruxcargoService } from '../models/services/couriers/truxcargo.service'
import { processTruxcargoWebhook } from '../models/services/webhookProcessor'

const TERMINAL_STATUSES = ['delivered', 'cancelled', 'rto_delivered']
const FAST_BUCKET_STATUSES = new Set([
  'out_for_delivery',
  'ndr',
  'undelivered',
  'rto_in_transit',
  'rto_initiated',
])

const mapStatus = (status: string): string => {
  const s = String(status || '')
    .trim()
    .toLowerCase()
  if (!s) return 'in_transit'
  if (s.includes('cancel')) return 'cancelled'
  if (s.includes('ndr') || s.includes('undelivered') || s.includes('attempt')) return 'ndr'
  if (s.includes('rto') && s.includes('deliver')) return 'rto_delivered'
  if (s.includes('rto')) return 'rto_in_transit'
  if (s.includes('deliver')) return 'delivered'
  if (s.includes('out for delivery') || s.includes('ofd')) return 'out_for_delivery'
  if (s.includes('pickup')) return 'pickup_initiated'
  if (s.includes('manifest') || s.includes('booked') || s.includes('created')) return 'booked'
  return 'in_transit'
}

const normalizeText = (value: unknown) => String(value || '').trim().toLowerCase()

const parseTruxcargoTracking = (trackingResponse: any) => {
  const shipment =
    trackingResponse?.data?.ShipmentData?.[0]?.Shipment ||
    trackingResponse?.ShipmentData?.[0]?.Shipment ||
    null
  if (!shipment) return null

  const statusObj = shipment?.Status || {}
  const scans = Array.isArray(shipment?.Scans) ? shipment.Scans : []
  const lastScan = scans.length ? scans[scans.length - 1]?.ScanDetail || {} : {}
  const statusText =
    lastScan?.Scan ||
    lastScan?.ScanType ||
    statusObj?.Status ||
    statusObj?.StatusType ||
    'in_transit'
  const remarks = lastScan?.Instructions || statusObj?.Instructions || ''
  const location = lastScan?.ScannedLocation || statusObj?.StatusLocation || ''

  return {
    statusText: String(statusText || ''),
    location: String(location || ''),
    remarks: String(remarks || ''),
    chargedWeight: Number(shipment?.ChargedWeight ?? 0) || undefined,
    actualWeight: Number(shipment?.ActualWeight ?? shipment?.ChargedWeight ?? 0) || undefined,
    volumetricWeight: Number(shipment?.VolumetricWeight ?? 0) || undefined,
    courierCost: Number(shipment?.InvoiceAmount ?? 0) || undefined,
    shipment,
  }
}

type PollBucket = 'fast' | 'normal' | 'all'

export type TruxcargoPollStats = {
  polled: number
  updated: number
  unchanged: number
  failed: number
}

export async function pollTruxcargoTracking(opts?: {
  bucket?: PollBucket
  batchSize?: number
  awb?: string
}): Promise<TruxcargoPollStats> {
  const bucket = opts?.bucket || 'all'
  const batchSize = Number(opts?.batchSize || 75)
  const targetAwb = String(opts?.awb || '').trim()
  const stats: TruxcargoPollStats = { polled: 0, updated: 0, unchanged: 0, failed: 0 }

  const baseQuery = db
    .select({
      id: b2c_orders.id,
      user_id: b2c_orders.user_id,
      awb_number: b2c_orders.awb_number,
      order_status: b2c_orders.order_status,
      delivery_location: b2c_orders.delivery_location,
      delivery_message: b2c_orders.delivery_message,
    })
    .from(b2c_orders)
    .where(
      and(
        eq(b2c_orders.integration_type, 'truxcargo'),
        isNotNull(b2c_orders.awb_number),
        or(notInArray(b2c_orders.order_status, TERMINAL_STATUSES), isNull(b2c_orders.order_status)),
      ),
    )
    .limit(batchSize)

  let pending = await baseQuery
  if (targetAwb) {
    pending = pending.filter((order) => String(order.awb_number || '').trim() === targetAwb)
  } else if (bucket !== 'all') {
    pending = pending.filter((order) => {
      const status = String(order.order_status || '').trim().toLowerCase()
      const isFast = FAST_BUCKET_STATUSES.has(status)
      return bucket === 'fast' ? isFast : !isFast
    })
  }

  if (!pending.length) return stats

  const truxcargo = new TruxcargoService()

  for (const order of pending) {
    const awb = String(order.awb_number || '').trim()
    if (!awb) continue
    stats.polled += 1
    try {
      const trackingResponse = await truxcargo.trackShipment({ waybill: awb })
      const parsed = parseTruxcargoTracking(trackingResponse)
      if (!parsed) {
        stats.unchanged += 1
        continue
      }

      const mapped = mapStatus(parsed.statusText)
      const sameStatus = normalizeText(order.order_status) === normalizeText(mapped)
      const sameLocation = normalizeText(order.delivery_location) === normalizeText(parsed.location)
      const sameMessage = normalizeText(order.delivery_message) === normalizeText(parsed.remarks)

      if (sameStatus && sameLocation && sameMessage) {
        stats.unchanged += 1
        continue
      }

      const normalizedPayload = {
        awb,
        status: parsed.statusText,
        current_status: parsed.statusText,
        remarks: parsed.remarks,
        location: parsed.location,
        charged_weight: parsed.chargedWeight,
        actual_weight: parsed.actualWeight,
        volumetric_weight: parsed.volumetricWeight,
        courier_cost: parsed.courierCost,
        __provider: 'truxcargo_poll',
        raw_tracking: trackingResponse,
      }

      const result = await processTruxcargoWebhook(normalizedPayload)
      if (result?.success) {
        stats.updated += 1
      } else {
        stats.failed += 1
      }
    } catch (err: any) {
      stats.failed += 1
      console.error(`[Cron] Truxcargo tracking failed for AWB ${awb}:`, err?.message || err)
    }
  }

  return stats
}
