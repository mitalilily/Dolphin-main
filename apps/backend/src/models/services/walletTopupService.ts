import { and, eq, or } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import path from 'path'
import {
  assertRazorpayWalletTopupsEnabled,
  razorpay,
  razorpayApi,
  razorpayKeyId,
  razorpayMode,
} from '../../utils/razorpay'
import { validateRazorpayWalletCredit } from '../../utils/razorpayWalletSafety'
import { db } from '../client'
import { wallets, walletTopups } from '../schema/wallet'
import { createWalletTransaction } from './wallet.service'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

export async function walletOfUser(userId: string, tx: any = db) {
  const wallet = await tx?.query.wallets.findFirst({
    where: eq(wallets.userId, userId),
  })
  if (!wallet) throw new Error('Wallet not found')
  return wallet
}

const asRecord = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {}

const mergeRazorpayMeta = (meta: unknown, patch: Record<string, any>) => {
  const current = asRecord(meta)
  return {
    ...current,
    razorpay: {
      ...asRecord(current.razorpay),
      ...patch,
    },
  }
}

const topupOwnerSelect = {
  id: walletTopups.id,
  walletId: walletTopups.walletId,
  amount: walletTopups.amount,
  currency: walletTopups.currency,
  status: walletTopups.status,
  meta: walletTopups.meta,
  userId: wallets.userId,
}

async function getTopupForOrder(orderId: string, tx: any = db) {
  const [row] = await tx
    .select(topupOwnerSelect)
    .from(walletTopups)
    .innerJoin(wallets, eq(walletTopups.walletId, wallets.id))
    .where(eq(walletTopups.gatewayOrderId, orderId))
    .limit(1)

  return row
}

async function markTopupBlocked(
  orderId: string,
  paymentId: string | null,
  reason: string,
  message: string,
  meta: unknown,
  tx: any = db,
) {
  await tx
    .update(walletTopups)
    .set({
      status: 'failed',
      gatewayPaymentId: paymentId,
      meta: mergeRazorpayMeta(meta, {
        blockedReason: reason,
        blockedMessage: message,
        checkedAt: new Date().toISOString(),
      }),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(walletTopups.gatewayOrderId, orderId),
        or(eq(walletTopups.status, 'created'), eq(walletTopups.status, 'processing')),
      ),
    )
}

export async function createWalletOrder(
  userId: string,
  amount: number,
  details: { name: string; email: string; phone: string },
) {
  assertRazorpayWalletTopupsEnabled()

  const wallet = await walletOfUser(userId)
  const receipt = `wallet_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  const amountPaise = Math.round(amount * 100)

  const razorpayOrder = await razorpay.orders.create({
    amount: amountPaise,
    currency: wallet.currency ?? 'INR',
    receipt,
    notes: {
      userId,
      walletId: wallet.id,
      type: 'wallet_recharge',
      razorpayMode,
    },
  })

  await db.insert(walletTopups).values({
    walletId: wallet.id,
    amount,
    currency: wallet.currency ?? 'INR',
    gatewayOrderId: razorpayOrder.id,
    status: 'created',
    meta: {
      receipt,
      amountPaise,
      razorpayMode,
      razorpay: {
        mode: razorpayMode,
        keyId: razorpayKeyId,
        orderStatus: razorpayOrder.status,
        createdAt: new Date().toISOString(),
      },
    },
  })

  return {
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key: razorpayKeyId,
    name: 'Dolphin',
    description: 'Wallet Recharge',
    prefill: {
      name: details.name,
      email: details.email,
      contact: details.phone,
    },
    theme: {
      color: '#4b8e40',
    },
  }
}

type ConfirmSuccessParams = {
  orderId: string
  paymentId: string
  amountPaise: number
  currency?: string | null
  source?: 'client_verify' | 'webhook' | 'reconciliation'
  method?: string | null
  email?: string | null
  contact?: string | null
  userId?: string
}

type ConfirmSuccessResult = {
  credited: boolean
  reason?: string
  status?: string
}

export async function confirmSuccess({
  orderId,
  paymentId,
  amountPaise,
  currency,
  source = 'webhook',
  method,
  email,
  contact,
  userId,
}: ConfirmSuccessParams): Promise<ConfirmSuccessResult> {
  return db.transaction(async (tx) => {
    const row = await getTopupForOrder(orderId, tx)

    if (!row) {
      console.error('Top-up not found for Razorpay order:', orderId)
      return { credited: false, reason: 'topup_not_found' }
    }

    if (userId && row.userId !== userId) {
      await markTopupBlocked(
        orderId,
        paymentId,
        'user_mismatch',
        'Razorpay payment confirmation does not belong to the authenticated user.',
        row.meta,
        tx,
      )
      return { credited: false, reason: 'user_mismatch' }
    }

    if (row.status === 'success') {
      return { credited: false, reason: 'already_credited', status: row.status ?? undefined }
    }

    if (row.status === 'failed') {
      return { credited: false, reason: 'already_failed', status: row.status ?? undefined }
    }

    const creditCheck = validateRazorpayWalletCredit({
      currentMode: razorpayMode,
      topupMeta: row.meta,
      topupAmount: row.amount,
      capturedAmountPaise: amountPaise,
      topupCurrency: row.currency,
      capturedCurrency: currency,
    })

    if (!creditCheck.allowed) {
      await markTopupBlocked(
        orderId,
        paymentId,
        creditCheck.reason,
        creditCheck.message,
        row.meta,
        tx,
      )
      console.warn(`[Razorpay] Wallet credit blocked for order ${orderId}: ${creditCheck.reason}`)
      return { credited: false, reason: creditCheck.reason }
    }

    const successMeta = mergeRazorpayMeta(row.meta, {
      mode: razorpayMode,
      keyId: razorpayKeyId,
      paymentId,
      capturedAmountPaise: amountPaise,
      capturedCurrency: currency || row.currency || 'INR',
      source,
      method,
      email,
      contact,
      creditedAt: new Date().toISOString(),
    })

    const [updated] = await tx
      .update(walletTopups)
      .set({
        status: 'success',
        gatewayPaymentId: paymentId,
        meta: successMeta,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(walletTopups.gatewayOrderId, orderId),
          or(eq(walletTopups.status, 'created'), eq(walletTopups.status, 'processing')),
        ),
      )
      .returning()

    if (!updated) {
      return { credited: false, reason: 'not_creditable_status' }
    }

    await createWalletTransaction({
      walletId: row.walletId,
      amount: row.amount,
      currency: row.currency ?? 'INR',
      type: 'credit',
      ref: paymentId,
      reason: 'Wallet Recharge',
      meta: {
        orderId,
        gateway: 'razorpay',
        razorpayMode,
        source,
        method,
      },
      tx,
    })

    return { credited: true, status: 'success' }
  })
}

export async function confirmFailure(orderId: string, paymentId: string | null, reason: string) {
  const row = await getTopupForOrder(orderId)

  await db
    .update(walletTopups)
    .set({
      status: 'failed',
      gatewayPaymentId: paymentId,
      meta: mergeRazorpayMeta(row?.meta ?? null, {
        failedReason: reason,
        failedAt: new Date().toISOString(),
      }),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(walletTopups.gatewayOrderId, orderId),
        or(eq(walletTopups.status, 'created'), eq(walletTopups.status, 'processing')),
      ),
    )
    .returning()
}

export async function markTopupProcessing(orderId: string, paymentId: string, userId?: string) {
  assertRazorpayWalletTopupsEnabled()

  const row = await getTopupForOrder(orderId)
  if (!row) throw new Error('Wallet top-up not found')
  if (userId && row.userId !== userId) throw new Error('Wallet top-up does not belong to this user')

  await db
    .update(walletTopups)
    .set({
      status: 'processing',
      gatewayPaymentId: paymentId,
      meta: mergeRazorpayMeta(row.meta, {
        mode: razorpayMode,
        paymentId,
        processingAt: new Date().toISOString(),
      }),
      updatedAt: new Date(),
    })
    .where(and(eq(walletTopups.gatewayOrderId, orderId), eq(walletTopups.status, 'created')))
}

export async function confirmCapturedPaymentFromClient(
  orderId: string,
  paymentId: string,
  userId: string,
) {
  assertRazorpayWalletTopupsEnabled()

  await markTopupProcessing(orderId, paymentId, userId)

  const { data: payment } = await razorpayApi.get(`/payments/${paymentId}`)

  if (payment?.order_id !== orderId) {
    await markTopupBlocked(
      orderId,
      paymentId,
      'payment_order_mismatch',
      'Fetched Razorpay payment does not belong to the submitted order.',
      null,
    )
    return { credited: false, reason: 'payment_order_mismatch' }
  }

  if (payment?.status !== 'captured') {
    return {
      credited: false,
      reason: 'payment_not_captured',
      status: payment?.status || 'unknown',
    }
  }

  return confirmSuccess({
    orderId,
    paymentId,
    amountPaise: Number(payment.amount),
    currency: payment.currency,
    source: 'client_verify',
    method: payment.method,
    email: payment.email,
    contact: payment.contact,
    userId,
  })
}
