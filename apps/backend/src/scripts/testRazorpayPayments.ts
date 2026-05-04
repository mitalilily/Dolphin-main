import * as dotenv from 'dotenv'
import path from 'path'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })
dotenv.config()

type CheckResult = {
  check: string
  ok: boolean
  skipped?: boolean
  message: string
}

const safeText = (value: unknown) => String(value ?? '').trim()

async function runCheck(name: string, fn: () => Promise<any>): Promise<CheckResult> {
  try {
    const result = await fn()
    console.log(`[Razorpay Payments] ${name}: OK`)
    if (result) console.log(JSON.stringify(result, null, 2))
    return { check: name, ok: true, message: 'OK' }
  } catch (error: any) {
    const message = error?.response?.data?.error?.description || error?.message || String(error)
    console.log(`[Razorpay Payments] ${name}: FAILED`)
    console.log(message)
    return { check: name, ok: false, message }
  }
}

async function main() {
  const {
    isRazorpayConfigured,
    razorpay,
    razorpayMode,
    RazorpayWalletTopupUnavailableError,
    isValidSig,
    verifyRazorpayPaymentSignature,
  } = require('../utils/razorpay')
  const {
    validateRazorpayWalletCredit,
  } = require('../utils/razorpayWalletSafety')
  const crypto = require('crypto') as typeof import('crypto')

  const summary: CheckResult[] = []

  summary.push(
    await runCheck('config.loaded', async () => {
      if (!isRazorpayConfigured) throw new Error(`Razorpay is not configured for ${razorpayMode} mode`)
      return { mode: razorpayMode, configured: true }
    }),
  )

  let directOrderId = ''
  summary.push(
    await runCheck('api.orders.create', async () => {
      const order = await razorpay.orders.create({
        amount: 100,
        currency: 'INR',
        receipt: `codex_rzp_${Date.now()}`,
        notes: { type: 'codex_validation' },
      })
      directOrderId = order.id
      if (!safeText(order.id).startsWith('order_')) throw new Error('Razorpay order id missing')
      if (Number(order.amount) !== 100) throw new Error('Razorpay order amount mismatch')
      return { id: order.id, amount: order.amount, currency: order.currency, status: order.status }
    }),
  )

  summary.push(
    await runCheck('checkout.signature.verify', async () => {
      const orderId = directOrderId || 'order_test_signature'
      const paymentId = 'pay_test_signature'
      const secret =
        razorpayMode === 'live'
          ? process.env.RAZORPAY_KEY_SECRET_PROD || ''
          : process.env.RAZORPAY_KEY_SECRET || ''
      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex')
      if (!verifyRazorpayPaymentSignature({ orderId, paymentId, signature })) {
        throw new Error('Valid checkout signature was rejected')
      }
      if (
        verifyRazorpayPaymentSignature({
          orderId,
          paymentId,
          signature: 'bad-signature',
        })
      ) {
        throw new Error('Invalid checkout signature was accepted')
      }
      return { validAccepted: true, invalidRejected: true }
    }),
  )

  summary.push(
    await runCheck('webhook.signature.verify', async () => {
      const secret =
        razorpayMode === 'live'
          ? process.env.RAZORPAY_WEBHOOK_SECRET_PROD || ''
          : process.env.RAZORPAY_WEBHOOK_SECRET || ''
      if (!secret) throw new Error('Razorpay webhook secret is missing')
      const body = JSON.stringify({
        event: 'payment.failed',
        payload: { payment: { entity: { id: 'pay_test', order_id: directOrderId || 'order_test' } } },
      })
      const signature = crypto.createHmac('sha256', secret).update(body).digest('hex')
      if (!isValidSig(body, signature)) throw new Error('Valid webhook signature was rejected')
      if (isValidSig(body, 'bad-signature')) throw new Error('Invalid webhook signature was accepted')
      return { validAccepted: true, invalidRejected: true }
    }),
  )

  summary.push(
    await runCheck('wallet.live-mode-safety', async () => {
      const testModeCheck = validateRazorpayWalletCredit({
        currentMode: 'test',
        topupMeta: { razorpayMode: 'test' },
        topupAmount: 100,
        capturedAmountPaise: 10000,
        topupCurrency: 'INR',
        capturedCurrency: 'INR',
      })
      if (testModeCheck.allowed || testModeCheck.reason !== 'razorpay_live_mode_required') {
        throw new Error('Test mode wallet credit was not blocked')
      }

      const testTopupCheck = validateRazorpayWalletCredit({
        currentMode: 'live',
        topupMeta: { razorpayMode: 'test' },
        topupAmount: 100,
        capturedAmountPaise: 10000,
        topupCurrency: 'INR',
        capturedCurrency: 'INR',
      })
      if (testTopupCheck.allowed || testTopupCheck.reason !== 'topup_created_in_test_mode') {
        throw new Error('Test-mode top-up was not blocked in live runtime')
      }

      const liveCheck = validateRazorpayWalletCredit({
        currentMode: 'live',
        topupMeta: { razorpayMode: 'live' },
        topupAmount: 100,
        capturedAmountPaise: 10000,
        topupCurrency: 'INR',
        capturedCurrency: 'INR',
      })
      if (!liveCheck.allowed) throw new Error('Valid live wallet credit was rejected')

      const amountMismatch = validateRazorpayWalletCredit({
        currentMode: 'live',
        topupMeta: { razorpayMode: 'live' },
        topupAmount: 100,
        capturedAmountPaise: 9900,
        topupCurrency: 'INR',
        capturedCurrency: 'INR',
      })
      if (amountMismatch.allowed || amountMismatch.reason !== 'amount_mismatch') {
        throw new Error('Amount mismatch was not blocked')
      }

      return { testModeBlocked: true, liveMatched: true, amountMismatchBlocked: true }
    }),
  )

  const testUserId = safeText(process.env.TEST_RAZORPAY_USER_ID || process.env.TEST_PAYMENT_USER_ID)
  if (testUserId) {
    summary.push(
      await runCheck('app.wallet-topup.create', async () => {
        const { createWalletOrder } = require('../models/services/walletTopupService')
        const { pool } = require('../models/client')
        try {
          if (razorpayMode !== 'live') {
            try {
              await createWalletOrder(testUserId, 1, {
                name: 'Razorpay Test',
                email: 'razorpay-test@example.com',
                phone: '9999999999',
              })
            } catch (error) {
              if (error instanceof RazorpayWalletTopupUnavailableError) {
                return { blockedInMode: razorpayMode }
              }
              throw error
            }
            throw new Error('Wallet top-up order was created outside Razorpay live mode')
          }

          const order = await createWalletOrder(testUserId, 1, {
            name: 'Razorpay Test',
            email: 'razorpay-test@example.com',
            phone: '9999999999',
          })
          if (!safeText(order.orderId).startsWith('order_')) throw new Error('App order id missing')
          if (!safeText(order.key).startsWith(razorpayMode === 'live' ? 'rzp_live_' : 'rzp_test_')) {
            throw new Error('Frontend key does not match Razorpay mode')
          }
          return { orderId: order.orderId, amount: order.amount, currency: order.currency }
        } finally {
          await pool.end().catch(() => undefined)
        }
      }),
    )
  } else {
    console.log('[Razorpay Payments] app.wallet-topup.create: SKIPPED (TEST_RAZORPAY_USER_ID missing)')
    summary.push({
      check: 'app.wallet-topup.create',
      ok: true,
      skipped: true,
      message: 'TEST_RAZORPAY_USER_ID missing',
    })
  }

  console.log('[Razorpay Payments] Summary')
  console.log(JSON.stringify(summary, null, 2))

  const failures = summary.filter((row) => !row.ok)
  if (failures.length) {
    throw new Error(`Razorpay payment verification failed: ${failures.map((row) => row.check).join(', ')}`)
  }
}

main().catch((error) => {
  console.error('[Razorpay Payments] Fatal:', error?.message || error)
  process.exit(1)
})
