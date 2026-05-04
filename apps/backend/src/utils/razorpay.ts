import axios from 'axios'
import crypto from 'crypto'
import dotenv from 'dotenv'
import path from 'path'
import Razorpay from 'razorpay'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })
dotenv.config()

type RazorpayMode = 'test' | 'live'

const requestedMode = String(process.env.RAZORPAY_MODE || '').trim().toLowerCase()
const MODE: RazorpayMode =
  requestedMode === 'live' || requestedMode === 'test'
    ? requestedMode
    : process.env.NODE_ENV === 'production'
      ? 'live'
      : 'test'

const CREDENTIALS: Record<RazorpayMode, { key_id: string; key_secret: string }> = {
  test: {
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
  },
  live: {
    key_id: process.env.RAZORPAY_KEY_ID_PROD || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET_PROD || '',
  },
}

export const isRazorpayConfigured = Boolean(CREDENTIALS[MODE].key_id && CREDENTIALS[MODE].key_secret)
export const razorpayMode = MODE
export const razorpayKeyId = CREDENTIALS[MODE].key_id
export const isRazorpayLiveMode = MODE === 'live'
export const razorpayWalletTopupsEnabled = isRazorpayConfigured && isRazorpayLiveMode

export class RazorpayWalletTopupUnavailableError extends Error {
  statusCode: number
  code: string

  constructor(message: string, statusCode = 403) {
    super(message)
    this.name = 'RazorpayWalletTopupUnavailableError'
    this.statusCode = statusCode
    this.code = 'RAZORPAY_LIVE_MODE_REQUIRED'
  }
}

export function assertRazorpayWalletTopupsEnabled() {
  assertRazorpayLiveMode('Wallet recharge')
}

export function assertRazorpayLiveMode(operationName = 'Razorpay operation') {
  if (!isRazorpayConfigured) {
    throw new RazorpayWalletTopupUnavailableError(
      `${operationName} is not configured. Please set live Razorpay credentials before accepting real payments.`,
      503,
    )
  }

  if (!isRazorpayLiveMode) {
    throw new RazorpayWalletTopupUnavailableError(
      `${operationName} is disabled while Razorpay is in test mode. Switch Razorpay to live mode before accepting real payment activity.`,
      403,
    )
  }
}

if (!isRazorpayConfigured) {
  console.warn(
    `[Razorpay] Missing credentials for ${MODE.toUpperCase()} mode. Wallet topups are disabled until env vars are set.`,
  )
}

export const razorpay = new Razorpay({
  key_id: CREDENTIALS[MODE].key_id || 'disabled',
  key_secret: CREDENTIALS[MODE].key_secret || 'disabled',
})

if (isRazorpayConfigured) {
  console.info(
    `[Razorpay] Initialised in ${MODE.toUpperCase()} mode with key ${CREDENTIALS[MODE].key_id}`,
  )
}

export const razorpayApi = axios.create({
  baseURL: 'https://api.razorpay.com/v1',
  auth: {
    username:
      MODE === 'live'
        ? process.env.RAZORPAY_KEY_ID_PROD || 'disabled'
        : process.env.RAZORPAY_KEY_ID || 'disabled',
    password:
      MODE === 'live'
        ? process.env.RAZORPAY_KEY_SECRET_PROD || 'disabled'
        : process.env.RAZORPAY_KEY_SECRET || 'disabled',
  },
})

export function isValidSig(body: string, sig: string) {
  const secret =
    MODE === 'live'
      ? process.env.RAZORPAY_WEBHOOK_SECRET_PROD || ''
      : process.env.RAZORPAY_WEBHOOK_SECRET || ''
  if (!secret || !sig) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  } catch {
    return false
  }
}

export function verifyRazorpayPaymentSignature(params: {
  orderId: string
  paymentId: string
  signature: string
}) {
  const keySecret = CREDENTIALS[MODE].key_secret
  if (!keySecret) return false

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(params.signature))
  } catch {
    return false
  }
}
