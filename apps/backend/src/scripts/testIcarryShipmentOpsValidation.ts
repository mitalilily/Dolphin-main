import assert from 'assert'
import { IcarryService } from '../models/services/couriers/icarry.service'

async function testInvalidShipmentId() {
  const service = new IcarryService()
  let failed = false
  try {
    await service.trackShipment({ shipment_id: 0 })
  } catch (err: any) {
    failed = true
    assert.match(String(err?.message || ''), /shipment_id/i)
  }
  assert.equal(failed, true, 'Expected shipment_id validation to fail')
}

async function testEndpointMapping() {
  const service = new IcarryService()
  const calls: Array<{ endpoint: string; payload: any }> = []

  ;(service as any).requestWithToken = async (endpoint: string, payload: any) => {
    calls.push({ endpoint, payload })
    return { success: 1 }
  }

  await service.cancelShipment({ shipment_id: 10 })
  await service.createReverseShipment({ shipment_id: 10 })
  await service.trackShipment({ shipment_id: 10 })
  await service.printShipmentLabel({ shipment_id: 10 })
  await service.syncShipmentCharges({ shipment_ids: [10, '11', 10] })
  await service.syncShipmentStatus({ shipment_ids: [10, 11] })

  assert.equal(calls[0].endpoint, '/api_cancel_shipment')
  assert.deepEqual(calls[0].payload, { shipment_id: 10 })
  assert.equal(calls[1].endpoint, '/api_add_reverse_shipment')
  assert.equal(calls[2].endpoint, '/api_track_shipment')
  assert.equal(calls[3].endpoint, '/api_print_shipment_label')
  assert.equal(calls[4].endpoint, '/api_shipment_billing_sync')
  assert.deepEqual(calls[4].payload, { shipment_ids: [10, 11] })
  assert.equal(calls[5].endpoint, '/api_shipment_status_sync')
  assert.deepEqual(calls[5].payload, { shipment_ids: [10, 11] })
}

async function main() {
  await testInvalidShipmentId()
  await testEndpointMapping()
  console.log('[iCarry Shipment Ops Validation Test] Passed')
}

main().catch((error: any) => {
  console.error('[iCarry Shipment Ops Validation Test] Failed')
  console.error(error?.message || error)
  process.exit(1)
})
