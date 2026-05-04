/**
 * Reconcile missed Razorpay wallet top-ups.
 */

import { eq } from 'drizzle-orm'
import crypto from 'node:crypto'
import { db } from '../models/client'
import { confirmSuccess, walletOfUser } from '../models/services/walletTopupService'
import { createWalletTransaction } from '../models/services/wallet.service'
import { walletTopups } from '../schema/schema'
import { razorpayApi, razorpayKeyId, razorpayMode, razorpayWalletTopupsEnabled } from '../utils/razorpay'

interface RazorpayOrder {
  id: string
  amount: number
  currency: string
  status: string
  receipt?: string
  notes?: Record<string, string>
}

interface RazorpayPayment {
  id: string
  status: string
  amount: number
  currency: string
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
  if (!razorpayWalletTopupsEnabled) {
    console.warn('[Cron] Wallet reconciliation skipped because Razorpay wallet top-ups require live mode.')
    return
  }

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
    const walletId = order.notes?.walletId as string | undefined
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

    if (Math.round(Number(payment.amount)) !== Math.round(Number(order.amount))) {
      console.warn(`[Cron] Skipping Razorpay order ${order.id}: captured amount mismatch`)
      continue
    }

    if (String(payment.currency || '').toUpperCase() !== String(order.currency || '').toUpperCase()) {
      console.warn(`[Cron] Skipping Razorpay order ${order.id}: captured currency mismatch`)
      continue
    }

    if (existingTopup) {
      await confirmSuccess({
        orderId: order.id,
        paymentId: payment.id,
        amountPaise: order.amount,
        currency: order.currency,
        source: 'reconciliation',
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
      })
      continue
    }

    if (!String(order.receipt || '').startsWith('wallet_') || !walletId) {
      console.warn(`[Cron] Skipping Razorpay order ${order.id}: missing wallet receipt metadata`)
      continue
    }

    await db.transaction(async (tx) => {
      const wallet = await walletOfUser(userId, tx)
      if (wallet.id !== walletId) {
        console.warn(`[Cron] Skipping Razorpay order ${order.id}: wallet metadata mismatch`)
        return
      }

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
        meta: {
          email: payment.email,
          contact: payment.contact,
          razorpayMode,
          razorpay: {
            mode: razorpayMode,
            keyId: razorpayKeyId,
            source: 'reconciliation',
            creditedAt: new Date().toISOString(),
          },
        },
      })

      await createWalletTransaction({
        walletId: wallet.id,
        amount,
        currency: order.currency,
        type: 'credit',
        ref: payment.id,
        reason: 'Wallet Recharge',
        meta: {
          topupId,
          method: payment.method,
          email: payment.email,
          gateway: 'razorpay',
          razorpayMode,
          source: 'reconciliation',
        },
        tx,
      })
    })

    console.log(`[Cron] Credited INR ${order.amount / 100} to user ${userId} (order ${order.id})`)
  }

  console.log('[Cron] Wallet reconciliation complete')
}
