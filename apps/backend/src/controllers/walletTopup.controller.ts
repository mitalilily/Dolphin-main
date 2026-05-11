import { Request, Response } from 'express'
import {
  confirmCapturedPaymentFromClient,
  createWalletOrder,
} from '../models/services/walletTopupService'
import { getPaymentOptions } from '../models/services/paymentOptions.service'
import {
  RazorpayWalletTopupUnavailableError,
  verifyRazorpayPaymentSignature,
} from '../utils/razorpay'

const sendTopupError = (res: Response, err: any) => {
  const status =
    err instanceof RazorpayWalletTopupUnavailableError ? err.statusCode : err?.statusCode || 500
  const message =
    err instanceof RazorpayWalletTopupUnavailableError
      ? err.message
      : status >= 500
        ? 'Top-up failed'
        : err?.message || 'Top-up failed'

  return res.status(status).json({
    error: message,
    ...(err?.code ? { code: err.code } : {}),
  })
}

export const createTopup = async (req: Request, res: Response): Promise<any> => {
  const amt = Number(req.body.amount)
  const { name, email, phone } = req.body

  if (!Number.isFinite(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Invalid amount' })
  }
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Missing customer details' })
  }

  try {
    // Enforce minimum wallet recharge amount (if configured)
    const paymentSettings = await getPaymentOptions()
    const minWalletRecharge = paymentSettings.minWalletRecharge ?? 0
    const rechargeAmount = Math.round(amt * 100) / 100

    if (minWalletRecharge > 0 && rechargeAmount < minWalletRecharge) {
      return res.status(400).json({
        error: `Minimum wallet recharge amount is INR ${minWalletRecharge}`,
        minWalletRecharge,
      })
    }

    const userId = (req as any).user?.sub
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const data = await createWalletOrder(userId, rechargeAmount, { name, email, phone })

    res.status(201).json(data)
  } catch (err: any) {
    console.error('Razorpay top-up error:', err)
    return sendTopupError(res, err)
  }
}

export const confirmFromClient = async (req: Request, res: Response) => {
  const { orderId, paymentId, signature } = req.body
  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ error: 'Missing Razorpay payment confirmation details' })
  }

  if (!verifyRazorpayPaymentSignature({ orderId, paymentId, signature })) {
    return res.status(400).json({ error: 'Invalid Razorpay payment signature' })
  }

  const userId = (req as any).user?.sub
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const result = await confirmCapturedPaymentFromClient(orderId, paymentId, userId)
    return res.status(result.credited ? 200 : 202).json({
      ok: true,
      ...result,
    })
  } catch (err: any) {
    console.error('Razorpay confirmation error:', err)
    return sendTopupError(res, err)
  }
}
