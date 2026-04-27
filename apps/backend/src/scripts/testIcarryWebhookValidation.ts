import assert from 'assert'
import { icarryWebhookHandler } from '../controllers/webhooks/icarry.webhook'

const runWebhook = async (body: any) => {
  const result: { statusCode: number; jsonBody: any } = { statusCode: 200, jsonBody: null }
  const req: any = { body, headers: {}, ip: '127.0.0.1', socket: { remoteAddress: '127.0.0.1' } }
  const res: any = {
    status(code: number) {
      result.statusCode = code
      return this
    },
    json(payload: any) {
      result.jsonBody = payload
      return this
    },
  }

  await icarryWebhookHandler(req, res)
  return result
}

async function main() {
  process.env.ICARRY_WEBHOOK_TOKEN = 'test-token'

  const syncOk = await runWebhook({
    client_name: 'icarry',
    callback_type: 'sync_status',
    awb: '14100040123332',
    status: 3,
    token: 'test-token',
  })
  assert.equal(syncOk.statusCode, 200)
  assert.equal(syncOk.jsonBody?.success, true)

  const ndrOk = await runWebhook({
    client_name: 'icarry',
    callback_type: 'ndr_status',
    token: 'test-token',
    ndr_data: [{ shipment_id: 249772, awb: '162419608174', type: 'REATTEMPT-CONTACT' }],
  })
  assert.equal(ndrOk.statusCode, 200)
  assert.equal(ndrOk.jsonBody?.success, true)

  const badToken = await runWebhook({
    client_name: 'icarry',
    callback_type: 'sync_status',
    awb: '14100040123332',
    status: 3,
    token: 'wrong-token',
  })
  assert.equal(badToken.statusCode, 401)

  const badType = await runWebhook({
    client_name: 'icarry',
    callback_type: 'unknown',
  })
  assert.equal(badType.statusCode, 400)

  console.log('[iCarry Webhook Validation Test] Passed')
}

main().catch((error: any) => {
  console.error('[iCarry Webhook Validation Test] Failed')
  console.error(error?.message || error)
  process.exit(1)
})
