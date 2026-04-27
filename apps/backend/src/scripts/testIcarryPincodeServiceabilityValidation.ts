import assert from 'assert'
import { IcarryService } from '../models/services/couriers/icarry.service'

async function testInvalidPincode() {
  const service = new IcarryService()
  let failed = false
  try {
    await service.checkPincodeServiceability({ pincode: '' })
  } catch (err: any) {
    failed = true
    assert.match(String(err?.message || ''), /pincode/i)
  }
  assert.equal(failed, true, 'Expected pincode validation to fail')
}

async function testEndpointAndPayload() {
  const service = new IcarryService()
  let endpoint = ''
  let payload: any = null

  ;(service as any).requestWithToken = async (e: string, p: any) => {
    endpoint = e
    payload = p
    return { success: 1 }
  }

  const response = await service.checkPincodeServiceability({ pincode: 560068 })
  assert.equal(response?.success, 1)
  assert.equal(endpoint, '/api_check_pincode')
  assert.deepEqual(payload, { pincode: '560068' })
}

async function main() {
  await testInvalidPincode()
  await testEndpointAndPayload()
  console.log('[iCarry Pincode Serviceability Validation Test] Passed')
}

main().catch((error: any) => {
  console.error('[iCarry Pincode Serviceability Validation Test] Failed')
  console.error(error?.message || error)
  process.exit(1)
})
