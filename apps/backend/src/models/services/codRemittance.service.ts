import { and, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../client'
import { codRemittances } from '../schema/codRemittance'

/**
 * Create a COD remittance entry when an order is delivered with COD
 * DOES NOT automatically credit wallet - waits for actual courier settlement
 * Real-world flow: Order delivered → Create pending remittance → Wait for courier to settle
 */
export async function createCodRemittance(params: {
  orderId: string
  orderType: 'b2c' | 'b2b'
  userId: string
  orderNumber: string
  awbNumber?: string
  courierPartner?: string
  codAmount: number
  codCharges: number
  freightCharges: number
  collectedAt?: Date
}): Promise<{ remittance: any; created: boolean }> {
  const {
    orderId,
    orderType,
    userId,
    orderNumber,
    awbNumber,
    courierPartner,
    codAmount,
    codCharges,
    freightCharges,
    collectedAt,
  } = params

  // COD remittance should default to full COD payable.
  // Sellers already recharge wallet separately, so we do not auto-deduct platform charges here.
  const normalizedFreightCharges = 0
  const normalizedCodCharges = 0
  const deductions = 0
  const remittableAmount = Number(codAmount)

  // Idempotency guard: delivered webhooks can be retried.
  const [existingRemittance] = await db
    .select()
    .from(codRemittances)
    .where(
      and(
        eq(codRemittances.userId, userId),
        eq(codRemittances.orderId, orderId),
        eq(codRemittances.orderType, orderType),
      ),
    )
    .limit(1)

  if (existingRemittance) {
    console.log(
      `ℹ️ COD remittance already exists for order ${orderNumber} (status: ${existingRemittance.status})`,
    )
    return { remittance: existingRemittance, created: false }
  }

  // Create remittance entry with PENDING status
  const [remittance] = await db
    .insert(codRemittances)
    .values({
      userId,
      orderId,
      orderType,
      orderNumber,
      awbNumber: awbNumber || null,
      courierPartner: courierPartner || null,
      codAmount: codAmount.toString(),
      codCharges: normalizedCodCharges.toString(),
      // Legacy column name retained for compatibility; defaulted to zero for COD remittance flow.
      shippingCharges: normalizedFreightCharges.toString(),
      deductions: deductions.toString(),
      remittableAmount: remittableAmount.toString(),
      status: 'pending', // ✅ PENDING - waiting for courier settlement
      collectedAt: collectedAt || new Date(),
      notes: `COD collected by ${
        courierPartner || 'courier'
      }. No deduction applied by default. Awaiting settlement from courier partner.`,
    })
    .returning()

  console.log(
    `📦 COD Remittance created (PENDING): ₹${remittableAmount} for order ${orderNumber}. Waiting for courier settlement.`,
  )

  return { remittance, created: true }
}

/**
 * Mark COD remittance as settled once the courier remits funds offline.
 * This does not touch the merchant wallet or invoices.
 */
export async function creditCodRemittanceToWallet(params: {
  remittanceId: string
  settledDate?: Date
  utrNumber?: string
  settledAmount?: number
  notes?: string
  creditedBy?: string // admin user ID
}) {
  const { remittanceId, settledDate, utrNumber, settledAmount, notes, creditedBy } = params

  return await db
    .transaction(async (tx) => {
      // 1. Get the remittance
      const [remittance] = await tx
        .select()
        .from(codRemittances)
        .where(eq(codRemittances.id, remittanceId))

      if (!remittance) {
        throw new Error(`Remittance not found: ${remittanceId}`)
      }

      if (remittance.status === 'credited') {
        throw new Error(`Remittance already credited: ${remittance.orderNumber}`)
      }

      // 2. Determine settled amount (use courier-settled amount if different from original)
      const amountToCredit =
        settledAmount !== undefined ? Number(settledAmount) : Number(remittance.remittableAmount)

      if (!Number.isFinite(amountToCredit) || amountToCredit <= 0) {
        throw new Error('Invalid settled amount. Amount must be greater than 0.')
      }

      // 3. Update remittance status only in COD settlement records.
      const adminNote = creditedBy
        ? `Marked as settled offline by admin (ID: ${creditedBy}). `
        : 'Marked as settled offline via settlement reconciliation. '
      const fullNotes = `${adminNote}${notes || ''} ${utrNumber ? `UTR: ${utrNumber}` : ''}`

      const [updatedRemittance] = await tx
        .update(codRemittances)
        .set({
          status: 'credited',
          creditedAt: settledDate || new Date(),
          remittableAmount: amountToCredit.toString(),
          walletTransactionId: null,
          notes: fullNotes.trim(),
          updatedAt: new Date(),
        })
        .where(eq(codRemittances.id, remittance.id))
        .returning()

      console.log(
        `✅ COD remittance marked settled offline: ₹${amountToCredit} for order ${remittance.orderNumber}`,
      )

      return updatedRemittance
    })
}

/**
 * Get all COD remittances for a user with filters
 */
export async function getCodRemittances(
  userId: string,
  filters: {
    status?: string
    fromDate?: Date
    toDate?: Date
    page?: number
    limit?: number
  } = {},
) {
  const { status, fromDate, toDate, page = 1, limit = 20 } = filters
  const offset = (page - 1) * limit

  const conditions = [eq(codRemittances.userId, userId)]

  if (status) {
    conditions.push(eq(codRemittances.status, status as any))
  }

  if (fromDate) {
    conditions.push(gte(codRemittances.collectedAt, fromDate))
  }

  if (toDate) {
    conditions.push(lte(codRemittances.collectedAt, toDate))
  }

  const remittances = await db
    .select()
    .from(codRemittances)
    .where(and(...conditions))
    .orderBy(desc(codRemittances.createdAt))
    .limit(limit)
    .offset(offset)

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(codRemittances)
    .where(and(...conditions))

  return {
    remittances,
    totalCount: Number(countResult?.count || 0),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult?.count || 0) / limit),
  }
}

/**
 * Get COD remittance statistics for a user
 */
export async function getCodRemittanceStats(userId: string) {
  // Total credited remittances (Remitted Till Date)
  const [creditedStats] = await db
    .select({
      count: sql<number>`count(*)`,
      totalAmount: sql<number>`COALESCE(SUM(${codRemittances.remittableAmount}), 0)`,
    })
    .from(codRemittances)
    .where(and(eq(codRemittances.userId, userId), eq(codRemittances.status, 'credited')))

  // Total pending remittances (Next Remittance/Total Due)
  const [pendingStats] = await db
    .select({
      count: sql<number>`count(*)`,
      totalAmount: sql<number>`COALESCE(SUM(${codRemittances.remittableAmount}), 0)`,
    })
    .from(codRemittances)
    .where(and(eq(codRemittances.userId, userId), eq(codRemittances.status, 'pending')))

  // Get last credited remittance
  const [lastRemittance] = await db
    .select()
    .from(codRemittances)
    .where(and(eq(codRemittances.userId, userId), eq(codRemittances.status, 'credited')))
    .orderBy(desc(codRemittances.creditedAt))
    .limit(1)

  return {
    remittedTillDate: Number(creditedStats?.totalAmount || 0),
    lastRemittance: lastRemittance ? Number(lastRemittance.remittableAmount) : 0,
    nextRemittance: Number(pendingStats?.totalAmount || 0),
    totalDue: Number(pendingStats?.totalAmount || 0),
    // Additional info
    creditedCount: Number(creditedStats?.count || 0),
    pendingCount: Number(pendingStats?.count || 0),
  }
}

/**
 * Update remittance notes (status is auto-managed)
 */
export async function updateCodRemittanceNotes(remittanceId: string, notes: string) {
  const [updated] = await db
    .update(codRemittances)
    .set({
      notes,
      updatedAt: new Date(),
    })
    .where(eq(codRemittances.id, remittanceId))
    .returning()

  return updated
}

/**
 * Get COD dashboard summary
 */
export async function getCodDashboardSummary(userId: string) {
  const stats = await getCodRemittanceStats(userId)

  // Get recent remittances
  const recentRemittances = await db
    .select()
    .from(codRemittances)
    .where(eq(codRemittances.userId, userId))
    .orderBy(desc(codRemittances.createdAt))
    .limit(10)

  return {
    stats,
    recentRemittances,
  }
}
