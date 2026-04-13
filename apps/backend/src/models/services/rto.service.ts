import { and, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm'
import { db } from '../client'
import { rto_events } from '../schema/rto'
import { b2c_orders } from '../schema/b2cOrders'
import { sendWebhookEvent } from '../../services/webhookDelivery.service'
import { buildCsv } from '../../utils/csv'

export async function recordRtoEvent(params: {
  orderId: string
  userId: string
  awbNumber?: string | null
  status: string
  reason?: string | null
  remarks?: string | null
  rtoCharges?: number | null
  payload?: any
  tx?: any
}) {
  const { orderId, userId, awbNumber, status, reason, remarks, rtoCharges, payload, tx } = params
  const runner = tx ?? db

  const [inserted] = await runner
    .insert(rto_events)
    .values({
      order_id: orderId,
      user_id: userId,
      awb_number: awbNumber || null,
      status,
      reason: reason || null,
      remarks: remarks || null,
      rto_charges: rtoCharges || null,
      payload: payload || null,
    })
    .returning()

  // 🔔 Send webhook event for RTO
  sendWebhookEvent(userId, 'order.rto', {
    order_id: orderId,
    awb_number: awbNumber,
    status,
    reason,
    remarks,
    rto_charges: rtoCharges,
    created_at: inserted.created_at?.toISOString() || new Date().toISOString(),
  }).catch((err) => {
    console.error('Failed to send RTO webhook event:', err)
    // Don't fail the main flow if webhook fails
  })

  return inserted
}

export async function listRtoEvents(
  userId: string,
  orderId?: string,
  params?: { page?: number; limit?: number; search?: string; fromDate?: string; toDate?: string },
) {
  const { page = 1, limit = 20, search = '', fromDate, toDate } = params || {}
  const whereBase = orderId
    ? and(eq(rto_events.user_id, userId), eq(rto_events.order_id, orderId))
    : eq(rto_events.user_id, userId)

  const searchWhere = search
    ? or(
        ilike(rto_events.awb_number, `%${search}%`),
        sql`(${rto_events.order_id}::text) ILIKE ${`%${search}%`}`,
        ilike(rto_events.reason, `%${search}%`),
        ilike(rto_events.remarks, `%${search}%`),
      )
    : undefined

  const dateWhere = fromDate || toDate
    ? and(
        fromDate ? gte(rto_events.created_at, new Date(fromDate)) : sql`true`,
        toDate ? lte(rto_events.created_at, new Date(toDate)) : sql`true`,
      )
    : undefined

  const where = searchWhere || dateWhere ? and(whereBase, searchWhere || sql`true`, dateWhere || sql`true`) : whereBase

  const offset = (page - 1) * limit

  const rows = await db
    .select()
    .from(rto_events)
    .where(where)
    .orderBy(desc(rto_events.created_at))
    .limit(limit)
    .offset(offset)

  const [{ count }] = (await db
    .select({ count: sql<number>`count(*)` })
    .from(rto_events)
    .where(where)) as unknown as Array<{ count: number }>

  return { rows, totalCount: Number(count) || 0 }
}

export async function listRtoEventsAdmin(
  orderId?: string,
  params?: { page?: number; limit?: number; search?: string; fromDate?: string; toDate?: string },
) {
  const { page = 1, limit = 20, search = '', fromDate, toDate } = params || {}

  const whereBase = orderId ? eq(rto_events.order_id, orderId) : sql`true`
  const searchWhere = search
    ? or(
        ilike(rto_events.awb_number, `%${search}%`),
        sql`(${rto_events.order_id}::text) ILIKE ${`%${search}%`}`,
        ilike(rto_events.reason, `%${search}%`),
        ilike(rto_events.remarks, `%${search}%`),
      )
    : undefined

  const dateWhere = fromDate || toDate
    ? and(
        fromDate ? gte(rto_events.created_at, new Date(fromDate)) : sql`true`,
        toDate ? lte(rto_events.created_at, new Date(toDate)) : sql`true`,
      )
    : undefined

  const where = searchWhere || dateWhere ? and(whereBase, searchWhere || sql`true`, dateWhere || sql`true`) : whereBase

  const rawRows = await db
    .select({
      id: rto_events.id,
      order_id: rto_events.order_id,
      user_id: rto_events.user_id,
      awb_number: rto_events.awb_number,
      status: rto_events.status,
      reason: rto_events.reason,
      remarks: rto_events.remarks,
      rto_charges: rto_events.rto_charges,
      payload: rto_events.payload,
      created_at: rto_events.created_at,
      courier_partner: b2c_orders.courier_partner,
      order_number: b2c_orders.order_number,
    })
    .from(rto_events)
    .leftJoin(b2c_orders, eq(b2c_orders.id, rto_events.order_id))
    .where(where)
    .orderBy(desc(rto_events.created_at))

  const grouped = rawRows.reduce<Array<any>>((acc, row) => {
    const groupKey = row.awb_number || row.order_id || row.id
    const existing = acc.find((item) => item.group_key === groupKey)

    const timelineEvent = {
      id: row.id,
      status: row.status,
      reason: row.reason,
      remarks: row.remarks,
      rto_charges: row.rto_charges,
      created_at: row.created_at,
      payload: row.payload,
    }

    if (!existing) {
      acc.push({
        id: String(groupKey),
        group_key: groupKey,
        awb_number: row.awb_number,
        order_id: row.order_id,
        order_number: row.order_number,
        user_id: row.user_id,
        courier_partner: row.courier_partner,
        status: row.status,
        reason: row.reason,
        remarks: row.remarks,
        rto_charges: row.rto_charges,
        created_at: row.created_at,
        timeline: [timelineEvent],
      })
      return acc
    }

    existing.timeline.push(timelineEvent)
    return acc
  }, [])

  const offset = (page - 1) * limit
  const rows = grouped.slice(offset, offset + limit)

  return { rows, totalCount: grouped.length }
}

export async function adminRtoKpis(params?: {
  search?: string
  fromDate?: string
  toDate?: string
}) {
  const { search = '', fromDate, toDate } = params || {}

  const searchWhere = search
    ? or(
        ilike(rto_events.awb_number, `%${search}%`),
        sql`(${rto_events.order_id}::text) ILIKE ${`%${search}%`}`,
        ilike(rto_events.reason, `%${search}%`),
        ilike(rto_events.remarks, `%${search}%`),
      )
    : sql`true`

  const dateWhere = fromDate || toDate
    ? and(
        fromDate ? gte(rto_events.created_at, new Date(fromDate)) : sql`true`,
        toDate ? lte(rto_events.created_at, new Date(toDate)) : sql`true`,
      )
    : sql`true`

  // Totals
  const [{ total }] = (await db
    .select({ total: sql<number>`count(*)` })
    .from(rto_events)
    .where(and(searchWhere, dateWhere))) as unknown as Array<{ total: number }>

  // By status
  const byStatus = await db
    .select({ status: rto_events.status, count: sql<number>`count(*)` })
    .from(rto_events)
    .where(and(searchWhere, dateWhere))
    .groupBy(rto_events.status)

  // Sum charges
  const [{ sumCharges }] = (await db
    .select({ sumCharges: sql<number>`coalesce(sum(${rto_events.rto_charges}), 0)` })
    .from(rto_events)
    .where(and(searchWhere, dateWhere))) as unknown as Array<{ sumCharges: number }>

  // By courier (join orders)
  const byCourier = await db
    .select({
      courier: b2c_orders.courier_partner,
      count: sql<number>`count(*)`,
    })
    .from(rto_events)
    .leftJoin(b2c_orders, eq(b2c_orders.id, rto_events.order_id))
    .where(and(searchWhere, dateWhere))
    .groupBy(b2c_orders.courier_partner)

  return {
    total: Number(total) || 0,
    totalCharges: Number(sumCharges) || 0,
    byStatus: byStatus.map((r: any) => ({ status: r.status, count: Number(r.count) || 0 })),
    byCourier: byCourier.map((r: any) => ({ courier: r.courier || 'Unknown', count: Number(r.count) || 0 })),
  }
}

export async function adminRtoExport(params?: {
  search?: string
  fromDate?: string
  toDate?: string
}) {
  const { search = '', fromDate, toDate } = params || {}

  const searchWhere = search
    ? or(
        ilike(rto_events.awb_number, `%${search}%`),
        sql`(${rto_events.order_id}::text) ILIKE ${`%${search}%`}`,
        ilike(rto_events.reason, `%${search}%`),
        ilike(rto_events.remarks, `%${search}%`),
      )
    : sql`true`

  const dateWhere = fromDate || toDate
    ? and(
        fromDate ? gte(rto_events.created_at, new Date(fromDate)) : sql`true`,
        toDate ? lte(rto_events.created_at, new Date(toDate)) : sql`true`,
      )
    : sql`true`

  const rows = await db
    .select({
      created_at: rto_events.created_at,
      awb_number: rto_events.awb_number,
      order_id: rto_events.order_id,
      status: rto_events.status,
      reason: rto_events.reason,
      remarks: rto_events.remarks,
      rto_charges: rto_events.rto_charges,
      courier_partner: b2c_orders.courier_partner,
    })
    .from(rto_events)
    .leftJoin(b2c_orders, eq(b2c_orders.id, rto_events.order_id))
    .where(and(searchWhere, dateWhere))
    .orderBy(desc(rto_events.created_at))

  // Build CSV
  const headers = [
    'Created At',
    'AWB',
    'Order ID',
    'Status',
    'Reason',
    'Remarks',
    'RTO Charges',
    'Courier',
  ]
  const rowsData = (rows as any[]).map((r) => [
    r.created_at ? new Date(r.created_at).toISOString() : '',
    r.awb_number || '',
    r.order_id || '',
    r.status || '',
    r.reason || '',
    r.remarks || '',
    r.rto_charges != null ? Number(r.rto_charges) : '',
    r.courier_partner || '',
  ])

  return buildCsv(headers, rowsData)
}
