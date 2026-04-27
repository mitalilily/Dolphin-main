import assert from 'assert'
import { IcarryService } from '../models/services/couriers/icarry.service'

const buildPayload = () => ({
  warehouse_id: '456',
  name: 'Pickup Contact Updated',
  email: 'pickup.updated@example.com',
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
    await service.editPickupAddress({
      ...buildPayload(),
      warehouse_id: '',
    } as any)
  } catch (err: any) {
    failed = true
    assert.match(String(err?.message || ''), /warehouse_id/i)
  }
  assert.equal(failed, true, 'Expected warehouse_id validation failure')
}

async function testEndpointAndPayload() {
  const service = new IcarryService()
  let endpoint = ''
  let payload: any = null

  ;(service as any).requestWithToken = async (e: string, p: any) => {
    endpoint = e
    payload = p
    return { success: 1, warehouse_id: 456 }
  }

  const response = await service.editPickupAddress(buildPayload() as any)
  assert.equal(response?.success, 1)
  assert.equal(endpoint, '/api_edit_pickup_address')
  assert.equal(payload.warehouse_id, '456')
  assert.equal(payload.phone, '9876543210')
  assert.equal(payload.zone_id, 1489)
  assert.equal(payload.country_id, '99')
  assert.equal('alt_phone' in payload, false)
}

async function main() {
  await testValidation()
  await testEndpointAndPayload()
  console.log('[iCarry Edit Pickup Address Validation Test] Passed')
}

main().catch((error: any) => {
  console.error('[iCarry Edit Pickup Address Validation Test] Failed')
  console.error(error?.message || error)
  process.exit(1)
})
