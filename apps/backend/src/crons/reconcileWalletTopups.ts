/**
 * Reconcile missed Razorpay wallet top-ups.
 */

import { eq, sql } from 'drizzle-orm'
import crypto from 'node:crypto'
import { db } from '../models/client'
import { confirmSuccess, walletOfUser } from '../models/services/walletTopupService'
import { wallets, walletTopups, walletTransactions } from '../schema/schema'
import { razorpayApi } from '../utils/razorpay'

interface RazorpayOrder {
  id: string
  amount: number
  currency: string
  status: string
  notes?: Record<string, string>
}

interface RazorpayPayment {
  id: string
  status: string
  method: string
  email?: string
  contact?: string
}

interface OrdersResponse {
  entity: 'collection'
  count: number
  items: RazorpayOrder[]
}

interface PaymentsResponse {
  entity: 'collection'
  count: number
  items: RazorpayPayment[]
}

export async function reconcileWalletTopups(): Promise<void> {
  const threeHoursAgo = Math.floor(Date.now() / 1000) - 3 * 60 * 60

  const { data: ordersRes } = await razorpayApi.get<OrdersResponse>('/orders', {
    params: {
      from: threeHoursAgo,
      count: 100,
    },
  })

  const orders = ordersRes.items
  console.log(`[Cron] Scanning ${orders.length} Razorpay orders`)

  for (const order of orders) {
    const userId = order.notes?.userId as string | undefined
    const topupType = order.notes?.type || order.notes?.description
    if (!userId || !['wallet_recharge', 'Wallet Top-up'].includes(String(topupType || ''))) {
      continue
    }

    const [existingTopup] = await db
      .select({ id: walletTopups.id, status: walletTopups.status })
      .from(walletTopups)
      .where(eq(walletTopups.gatewayOrderId, order.id))
      .limit(1)
    if (existingTopup?.status === 'success') continue

    const { data: paymentsRes } = await razorpayApi.get<PaymentsResponse>(
      `/orders/${order.id}/payments`,
    )
    const payment = paymentsRes.items.find((p) => p.status === 'captured')
    if (!payment) continue

    if (existingTopup) {
      await confirmSuccess(order.id, payment.id, order.amount)
      continue
    }

    await db.transaction(async (tx) => {
      const wallet = await walletOfUser(userId, tx)
      const amount = order.amount / 100
      const topupId = crypto.randomUUID()

      await tx.insert(walletTopups).values({
        id: topupId,
        walletId: wallet.id,
        amount,
        currency: order.currency,
        status: 'success',
        gateway: 'razorpay',
        gatewayOrderId: order.id,
        gatewayPaymentId: payment.id,
        meta: { email: payment.email, contact: payment.contact },
      })

      await tx
        .update(wallets)
        .set({ balance: sql`balance + ${amount}` })
        .where(eq(wallets.id, wallet.id))

      await tx.insert(walletTransactions).values({
        wallet_id: wallet.id,
        amount,
        currency: order.currency,
        type: 'credit',
        ref: payment.id,
        reason: 'wallet_topup',
        meta: { topupId, method: payment.method, email: payment.email },
      })
    })

    console.log(`[Cron] Credited INR ${order.amount / 100} to user ${userId} (order ${order.id})`)
  }

  console.log('[Cron] Wallet reconciliation complete')
}
