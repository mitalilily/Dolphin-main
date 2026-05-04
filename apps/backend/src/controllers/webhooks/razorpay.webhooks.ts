import { Request, Response } from 'express'
import { markBankRejected, markBankVerified } from '../../models/services/bankAccount.service'
import { confirmFailure, confirmSuccess } from '../../models/services/walletTopupService'
import { isRazorpayLiveMode, isValidSig } from '../../utils/razorpay'

const getRawBody = (body: unknown) => {
  if (Buffer.isBuffer(body)) return body.toString('utf8')
  if (typeof body === 'string') return body
  return JSON.stringify(body || {})
}

export const razorpayWebhook = async (req: Request, res: Response): Promise<any> => {
  const timestamp = new Date().toISOString()
  const sig = req.headers['x-razorpay-signature'] as string | undefined
  const rawBody = getRawBody(req.body)

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return res.status(400).send('Invalid JSON payload')
  }

  const event = payload.event
  const entityId =
    payload?.payload?.payment?.entity?.id ||
    payload?.payload?.fund_account_validation?.entity?.id ||
    'n/a'

  console.log('='.repeat(80))
  console.log(`[${timestamp}] Razorpay webhook received`)
  console.log(`   Event: ${event || 'unknown'}`)
  console.log(`   Entity ID: ${entityId}`)
  console.log(`   IP: ${req.ip || req.socket.remoteAddress || 'unknown'}`)
  console.log(`   Signature Present: ${Boolean(sig)}`)
  console.log('='.repeat(80))

  if (!sig || !isValidSig(rawBody, sig)) {
    console.error('Razorpay webhook rejected: invalid signature')
    return res.status(400).send('Invalid signature')
  }

  try {
    switch (event) {
      case 'payment.captured': {
        const pay = payload.payload.payment.entity
        const result = await confirmSuccess({
          orderId: pay.order_id,
          paymentId: pay.id,
          amountPaise: Number(pay.amount),
          currency: pay.currency,
          source: 'webhook',
          method: pay.method,
          email: pay.email,
          contact: pay.contact,
        })
        console.log(
          `Payment captured for Razorpay order ${pay.order_id}; credited=${result.credited}${
            result.reason ? ` reason=${result.reason}` : ''
          }`,
        )
        break
      }

      case 'payment.failed': {
        const pay = payload.payload.payment.entity
        await confirmFailure(pay.order_id, pay.id, pay.error_description || 'Payment failed')
        console.log(`Payment failure recorded for Razorpay order: ${pay.order_id}`)
        break
      }

      case 'fund.account.validation.completed': {
        if (!isRazorpayLiveMode) {
          console.warn('Razorpay bank validation webhook ignored because Razorpay is not in live mode')
          break
        }

        const validation = payload.payload.fund_account_validation.entity
        if (validation.status === 'success') {
          await markBankVerified(validation.fund_account_id)
          console.log(`Bank account verified: ${validation.fund_account_id}`)
        } else {
          const reason =
            validation.results?.reason_description ||
            validation.results?.reason ||
            'Unknown failure'
          await markBankRejected(validation.fund_account_id, reason)
          console.log(`Bank account rejected: ${validation.fund_account_id}, reason: ${reason}`)
        }
        break
      }

      default:
        console.warn(`Unhandled Razorpay webhook event: ${event}`)
    }

    res.json({ received: true })
  } catch (error: any) {
    console.error('='.repeat(80))
    console.error(`[${timestamp}] Razorpay webhook error for event: ${event || 'unknown'}`)
    console.error(`   Error Message: ${error?.message || error}`)
    console.error(`   Error Stack:`, error?.stack)
    console.error('='.repeat(80))
    res.status(500).json({ error: 'Internal webhook handler error' })
  }
}
