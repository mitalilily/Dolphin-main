import assert from 'assert'
import { IcarryService } from '../models/services/couriers/icarry.service'

const buildPayload = () => ({
  nickname: 'Warehouse',
  name: 'Pickup Contact',
  email: 'pickup@example.com',
  phone: '9876543210',
  alt_phone: '',
  street1: 'D1003 Purva Skywood, Silver County Road',
  street2: 'Near Shobha Cinnamon',
  locality: 'HSR Layout',
  city: 'Bengaluru',
  pincode: '560068',
  zone_id: 1489,
  country_id: '99',
})

async function testValidation() {
  const service = new IcarryService()
  let failed = false
  try {
    await service.addPickupAddress({
      ...buildPayload(),
      nickname: 'Bad Nick',
    } as any)
  } catch (err: any) {
    failed = true
    assert.match(String(err?.message || ''), /nickname/i)
  }
  assert.equal(failed, true, 'Expected nickname validation failure')
}

async function testEndpointAndPayload() {
  const service = new IcarryService()
  let endpoint = ''
  let payload: any = null

  ;(service as any).requestWithToken = async (e: string, p: any) => {
    endpoint = e
    payload = p
    return { success: 1, id: 999 }
  }

  const response = await service.addPickupAddress(buildPayload() as any)
  assert.equal(response?.success, 1)
  assert.equal(endpoint, '/api_add_pickup_address')
  assert.equal(payload.nickname, 'Warehouse')
  assert.equal(payload.phone, '9876543210')
  assert.equal(payload.zone_id, 1489)
  assert.equal(payload.country_id, '99')
  assert.equal('alt_phone' in payload, false)
}

async function main() {
  await testValidation()
  await testEndpointAndPayload()
  console.log('[iCarry Add Pickup Address Validation Test] Passed')
}

main().catch((error: any) => {
  console.error('[iCarry Add Pickup Address Validation Test] Failed')
  console.error(error?.message || error)
  process.exit(1)
})
