import assert from 'assert'
import { IcarryService } from '../models/services/couriers/icarry.service'

const buildValidPayload = () => ({
  pickup_address_id: 10,
  courier_id: '12',
  return_address_id: '',
  rto_address_id: null,
  client_order_id: '146255',
  parcel: {
    type: 'Prepaid' as const,
    currency: 'INR' as const,
    value: 1200,
    contents: 'Fashion Jewellery',
    dimensions: {
      length: 10,
      breadth: 4,
      height: 20,
      unit: 'cm' as const,
    },
    weight: {
      weight: 1250,
      unit: 'gm' as const,
    },
  },
  consignee: {
    name: 'John Doe',
    mobile: '9876543210',
    address: '123 Main St, Manhattan',
    city: 'New York',
    pincode: '10001',
    state: 'New York',
    country_code: 'us',
  },
})

async function shouldFailValidation() {
  const service = new IcarryService()
  let failed = false
  try {
    await service.bookInternationalShipment({
      ...buildValidPayload(),
      pickup_address_id: 0,
    } as any)
  } catch (err: any) {
    failed = true
    assert.match(String(err?.message || ''), /pickup_address_id/i)
  }
  assert.equal(failed, true, 'Expected validation to fail for invalid pickup_address_id')
}

async function shouldMapPayloadAndEndpoint() {
  const service = new IcarryService()
  let capturedEndpoint = ''
  let capturedPayload: any = null

  ;(service as any).requestWithToken = async (endpoint: string, payload: any) => {
    capturedEndpoint = endpoint
    capturedPayload = payload
    return { success: 1, shipment_id: 'MOCK-123' }
  }

  const response = await service.bookInternationalShipment(buildValidPayload() as any)
  assert.equal(response?.success, 1)
  assert.equal(capturedEndpoint, '/api_add_shipment_international')
  assert.equal(capturedPayload.pickup_address_id, 10)
  assert.equal(capturedPayload.courier_id, '12')
  assert.equal(capturedPayload.parcel.currency, 'INR')
  assert.equal(capturedPayload.parcel.dimensions.unit, 'cm')
  assert.equal(capturedPayload.parcel.weight.unit, 'gm')
  assert.equal(capturedPayload.consignee.country_code, 'US')
  assert.equal('return_address_id' in capturedPayload, false)
  assert.equal('rto_address_id' in capturedPayload, false)
}

async function main() {
  await shouldFailValidation()
  await shouldMapPayloadAndEndpoint()
  console.log('[iCarry International Shipment Validation Test] Passed')
}

main().catch((error: any) => {
  console.error('[iCarry International Shipment Validation Test] Failed')
  console.error(error?.message || error)
  process.exit(1)
})
