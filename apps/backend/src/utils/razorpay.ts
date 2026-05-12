import axios from 'axios'
import crypto from 'crypto'
import dotenv from 'dotenv'
import path from 'path'
import Razorpay from 'razorpay'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })
dotenv.config()

type RazorpayMode = 'test' | 'live'
type RazorpayCredentialMode = RazorpayMode | 'unknown'
type RazorpayCredentials = {
  key_id: string
  key_secret: string
  webhook_secret: string
  key_id_source: string | null
  key_secret_source: string | null
  webhook_secret_source: string | null
  key_id_mode: RazorpayCredentialMode
}

const cleanEnv = (value: unknown) => String(value ?? '').trim()

export const detectRazorpayKeyMode = (keyId: string): RazorpayCredentialMode => {
  if (keyId.startsWith('rzp_live_')) return 'live'
  if (keyId.startsWith('rzp_test_')) return 'test'
  return keyId ? 'unknown' : 'unknown'
}

export const maskRazorpayKey = (keyId: string) => {
  if (!keyId) return 'missing'
  if (keyId.length <= 12) return `${keyId.slice(0, 4)}...`
  return `${keyId.slice(0, 8)}...${keyId.slice(-4)}`
}

export const readRazorpayMode = (envVars: NodeJS.ProcessEnv = process.env): RazorpayMode => {
  const requestedMode = cleanEnv(envVars.RAZORPAY_MODE).toLowerCase()
  const isProduction = cleanEnv(envVars.NODE_ENV).toLowerCase() === 'production'
  const allowProductionTestMode = cleanEnv(envVars.ALLOW_RAZORPAY_TEST_IN_PRODUCTION).toLowerCase()

  if (isProduction && requestedMode === 'test' && allowProductionTestMode !== 'true') {
    console.warn(
      '[Razorpay] Ignoring RAZORPAY_MODE=test because NODE_ENV=production. Set ALLOW_RAZORPAY_TEST_IN_PRODUCTION=true only for an intentional dry run.',
    )
    return 'live'
  }

  return requestedMode === 'live' || requestedMode === 'test'
    ? requestedMode
    : isProduction
      ? 'live'
      : 'test'
}

const readFirstEnv = (envVars: NodeJS.ProcessEnv, names: string[]) => {
  for (const name of names) {
    const value = cleanEnv(envVars[name])
    if (value) return { value, source: name }
  }
  return { value: '', source: null }
}

export const resolveRazorpayCredentials = (
  mode: RazorpayMode,
  envVars: NodeJS.ProcessEnv = process.env,
): RazorpayCredentials => {
  const keyId = readFirstEnv(
    envVars,
    mode === 'live'
      ? ['RAZORPAY_KEY_ID_PROD', 'RAZORPAY_KEY_ID_LIVE', 'RAZORPAY_KEY_ID']
      : ['RAZORPAY_KEY_ID_TEST', 'RAZORPAY_KEY_ID'],
  )
  const keySecret = readFirstEnv(
    envVars,
    mode === 'live'
      ? ['RAZORPAY_KEY_SECRET_PROD', 'RAZORPAY_KEY_SECRET_LIVE', 'RAZORPAY_KEY_SECRET']
      : ['RAZORPAY_KEY_SECRET_TEST', 'RAZORPAY_KEY_SECRET'],
  )
  const webhookSecret = readFirstEnv(
    envVars,
    mode === 'live'
      ? ['RAZORPAY_WEBHOOK_SECRET_PROD', 'RAZORPAY_WEBHOOK_SECRET_LIVE', 'RAZORPAY_WEBHOOK_SECRET']
      : ['RAZORPAY_WEBHOOK_SECRET_TEST', 'RAZORPAY_WEBHOOK_SECRET'],
  )

  return {
    key_id: keyId.value,
    key_secret: keySecret.value,
    webhook_secret: webhookSecret.value,
    key_id_source: keyId.source,
    key_secret_source: keySecret.source,
    webhook_secret_source: webhookSecret.source,
    key_id_mode: detectRazorpayKeyMode(keyId.value),
  }
}

const MODE = readRazorpayMode(process.env)

const CREDENTIALS = resolveRazorpayCredentials(MODE)

export const getRazorpayConfigurationError = (
  mode: RazorpayMode,
  credentials: RazorpayCredentials,
) => {
  if (!credentials.key_id || !credentials.key_secret) {
    return `Missing Razorpay ${mode} credentials. Set ${
      mode === 'live'
        ? 'RAZORPAY_KEY_ID_PROD and RAZORPAY_KEY_SECRET_PROD'
        : 'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET'
    }.`
  }

  if (credentials.key_id_mode !== mode) {
    return `Razorpay is configured for ${mode} mode, but ${
      credentials.key_id_source || 'the selected key'
    } is a ${credentials.key_id_mode} key (${maskRazorpayKey(credentials.key_id)}).`
  }

  return null
}

const razorpayConfigurationError = getRazorpayConfigurationError(MODE, CREDENTIALS)

export const isRazorpayConfigured = !razorpayConfigurationError
export const razorpayMode = MODE
export const razorpayKeyId = CREDENTIALS.key_id
export const isRazorpayLiveMode = MODE === 'live'
export const razorpayWalletTopupsEnabled = isRazorpayConfigured && isRazorpayLiveMode
export const razorpayCredentialSources = {
  keyId: CREDENTIALS.key_id_source,
  keySecret: CREDENTIALS.key_secret_source,
  webhookSecret: CREDENTIALS.webhook_secret_source,
  keyMode: CREDENTIALS.key_id_mode,
}

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
      `${operationName} is not configured for ${MODE} mode. ${razorpayConfigurationError}`,
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
    `[Razorpay] ${razorpayConfigurationError} Wallet topups are disabled until env vars are corrected.`,
  )
}

export const razorpay = new Razorpay({
  key_id: CREDENTIALS.key_id || 'disabled',
  key_secret: CREDENTIALS.key_secret || 'disabled',
})

if (isRazorpayConfigured) {
  console.info(
    `[Razorpay] Initialised in ${MODE.toUpperCase()} mode with key ${maskRazorpayKey(CREDENTIALS.key_id)} from ${CREDENTIALS.key_id_source}.`,
  )
}

export const razorpayApi = axios.create({
  baseURL: 'https://api.razorpay.com/v1',
  auth: {
    username: CREDENTIALS.key_id || 'disabled',
    password: CREDENTIALS.key_secret || 'disabled',
  },
})

export function isValidSig(body: string, sig: string) {
  const secret = CREDENTIALS.webhook_secret
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
  const keySecret = CREDENTIALS.key_secret
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
