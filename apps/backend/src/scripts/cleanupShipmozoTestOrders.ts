import { and, eq, gte, ilike, isNotNull, lt, sql } from 'drizzle-orm'
import { db } from '../models/client'
import { b2c_orders } from '../models/schema/b2cOrders'
import { ShipmozoService } from '../models/services/couriers/shipmozo.service'

type CleanupCandidate = {
  id: string
  order_number: string | null
  awb_number: string | null
  shipment_id: string | null
  created_at: Date | null
}

type CleanupConfig = {
  fromDate: string
  toDate: string
  orderPrefix: string
  confirm: boolean
}

const parseDateInput = (value: string, label: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${label} is required (format: YYYY-MM-DD).`)
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error(`${label} must be in YYYY-MM-DD format.`)
  }
  const parsed = new Date(`${trimmed}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} is invalid.`)
  }
  return parsed
}

export const loadCleanupConfig = (): CleanupConfig => {
  const fromDate = String(process.env.SHIPMOZO_CLEANUP_FROM_DATE || '').trim()
  const toDate = String(process.env.SHIPMOZO_CLEANUP_TO_DATE || '').trim()
  const orderPrefix = String(process.env.SHIPMOZO_CLEANUP_ORDER_PREFIX || '').trim()
  const confirm =
    String(process.env.SHIPMOZO_CLEANUP_CONFIRM || '')
      .trim()
      .toLowerCase() === 'true'

  return { fromDate, toDate, orderPrefix, confirm }
}

export const buildDateRange = (config: CleanupConfig) => {
  const from = parseDateInput(config.fromDate, 'SHIPMOZO_CLEANUP_FROM_DATE')
  const to = parseDateInput(config.toDate, 'SHIPMOZO_CLEANUP_TO_DATE')
  if (from.getTime() > to.getTime()) {
    throw new Error('SHIPMOZO_CLEANUP_FROM_DATE cannot be after SHIPMOZO_CLEANUP_TO_DATE.')
  }

  const toExclusive = new Date(to)
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1)
  return { from, to, toExclusive }
}

export const getCleanupCandidates = async (config: CleanupConfig): Promise<CleanupCandidate[]> => {
  const { from, toExclusive } = buildDateRange(config)
  const filters = [
    eq(b2c_orders.integration_type, 'shipmozo'),
    isNotNull(b2c_orders.awb_number),
    gte(b2c_orders.created_at, from),
    lt(b2c_orders.created_at, toExclusive),
  ]

  if (config.orderPrefix) {
    filters.push(ilike(b2c_orders.order_number, `${config.orderPrefix}%`))
  }

  return db
    .select({
      id: b2c_orders.id,
      order_number: b2c_orders.order_number,
      awb_number: b2c_orders.awb_number,
      shipment_id: b2c_orders.shipment_id,
      created_at: b2c_orders.created_at,
    })
    .from(b2c_orders)
    .where(and(...filters))
    .orderBy(sql`${b2c_orders.created_at} asc`)
}

const printDryRun = (config: CleanupConfig, candidates: CleanupCandidate[]) => {
  const { fromDate, toDate, orderPrefix } = config
  console.log(
    `[Shipmozo Cleanup] Dry run mode. Range: ${fromDate} to ${toDate}, prefix: ${
      orderPrefix || '(none)'
    }`,
  )
  console.log(`[Shipmozo Cleanup] Candidate count: ${candidates.length}`)

  if (!candidates.length) return

  console.log(
    JSON.stringify(
      candidates.map((row) => ({
        id: row.id,
        order_number: row.order_number,
        awb_number: row.awb_number,
        shipment_id: row.shipment_id,
        created_at: row.created_at?.toISOString() || null,
      })),
      null,
      2,
    ),
  )
}

export const runCleanup = async (config: CleanupConfig) => {
  const candidates = await getCleanupCandidates(config)

  if (!config.confirm) {
    printDryRun(config, candidates)
    console.log(
      '[Shipmozo Cleanup] Set SHIPMOZO_CLEANUP_CONFIRM=true to execute cancellation calls.',
    )
    return
  }

  if (!candidates.length) {
    console.log('[Shipmozo Cleanup] No matching orders found. Nothing to cancel.')
    return
  }

  const service = new ShipmozoService()
  console.log(`[Shipmozo Cleanup] Executing cancellations for ${candidates.length} orders...`)

  for (const candidate of candidates) {
    const orderId = String(candidate.order_number || candidate.shipment_id || '').trim()
    const awbNumber = String(candidate.awb_number || '').trim()

    if (!orderId || !awbNumber) {
      console.warn('[Shipmozo Cleanup] Skipped invalid candidate:', {
        id: candidate.id,
        order_number: candidate.order_number,
        shipment_id: candidate.shipment_id,
        awb_number: candidate.awb_number,
      })
      continue
    }

    try {
      const resp = await service.cancelOrder({ order_id: orderId, awb_number: awbNumber })
      console.log('[Shipmozo Cleanup] ✅ Cancelled', {
        id: candidate.id,
        order_id: orderId,
        awb_number: awbNumber,
        result: resp?.result ?? null,
        message: resp?.message ?? null,
      })
    } catch (error: any) {
      console.error('[Shipmozo Cleanup] ❌ Failed', {
        id: candidate.id,
        order_id: orderId,
        awb_number: awbNumber,
        message: error?.message || error,
      })
    }
  }
}

if (require.main === module) {
  runCleanup(loadCleanupConfig())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('[Shipmozo Cleanup] Script failed:', error)
      process.exit(1)
    })
}

