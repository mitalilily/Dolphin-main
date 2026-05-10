import dotenv from 'dotenv'
import path from 'path'

const envPath = process.env.QA_ENV_FILE
  ? path.resolve(process.cwd(), process.env.QA_ENV_FILE)
  : path.resolve(process.cwd(), 'tests/.env')

dotenv.config({ path: envPath })

const asBool = (value: string | undefined, fallback = false) => {
  if (value === undefined) return fallback
  return value.toLowerCase() === 'true'
}

const asNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const qaEnv = {
  envPath,
  apiBaseUrl: process.env.QA_API_BASE_URL || 'http://localhost:5002',
  adminEmail: process.env.QA_ADMIN_EMAIL || '',
  adminPassword: process.env.QA_ADMIN_PASSWORD || '',
  testClientEmail: process.env.QA_TEST_CLIENT_EMAIL || `qa-client-${Date.now()}@example.com`,
  blockedClientEmail: process.env.QA_BLOCKED_CLIENT_EMAIL || '',
  blockedClientPassword: process.env.QA_BLOCKED_CLIENT_PASSWORD || '',
  runLiveE2E: asBool(process.env.QA_RUN_LIVE_E2E, false),
  runLoad: asBool(process.env.QA_RUN_LOAD, false),
  exposeAuthCodes: asBool(process.env.QA_EXPECT_INLINE_OTP, true),
  defaultTimeoutMs: asNumber(process.env.QA_DEFAULT_TIMEOUT_MS, 30000),
  longTimeoutMs: asNumber(process.env.QA_LONG_TIMEOUT_MS, 120000),
  validWarehousePayloadPath: process.env.QA_VALID_WAREHOUSE_PAYLOAD_PATH || 'tests/data/payloads/warehouse.valid.json',
  validOrderPayloadPath: process.env.QA_VALID_ORDER_PAYLOAD_PATH || 'tests/data/payloads/order.b2c.valid.json',
  validManifestPayloadPath: process.env.QA_VALID_MANIFEST_PAYLOAD_PATH || 'tests/data/payloads/manifest.valid.json',
  shiprocketMockBase: process.env.QA_SHIPROCKET_MOCK_BASE || 'https://apiv2.shiprocket.in',
  shipmozoMockBase: process.env.QA_SHIPMOZO_MOCK_BASE || 'https://shipping-api.com',
  icarryMockBase: process.env.QA_ICARRY_MOCK_BASE || 'https://www.icarry.in',
}

export const hasAdminCreds = () => Boolean(qaEnv.adminEmail && qaEnv.adminPassword)
