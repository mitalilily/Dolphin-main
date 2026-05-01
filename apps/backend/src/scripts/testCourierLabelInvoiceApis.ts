import { IcarryService } from '../models/services/couriers/icarry.service'
import { DelhiveryService } from '../models/services/couriers/delhivery.service'
import { ShiprocketCourierService } from '../models/services/couriers/shiprocket.service'
import { ShipmozoService } from '../models/services/couriers/shipmozo.service'
import { TruxcargoService } from '../models/services/couriers/truxcargo.service'

const toText = (value: unknown) => String(value ?? '').trim()

async function runCase(name: string, fn: () => Promise<any>) {
  try {
    const result = await fn()
    console.log(`[${name}] SUCCESS`)
    console.log(
      JSON.stringify(
        result,
        (_k, v) => (typeof v === 'string' && v.length > 400 ? `${v.slice(0, 400)}...` : v),
        2,
      ),
    )
    return { api: name, ok: true, message: 'OK' }
  } catch (error: any) {
    console.log(`[${name}] FAILED`)
    console.log(error?.message || error)
    return { api: name, ok: false, message: String(error?.message || error) }
  }
}

async function main() {
  const summary: Array<{ api: string; ok: boolean; message: string }> = []
  const delhivery = new DelhiveryService()
  const shiprocket = new ShiprocketCourierService()
  const icarry = new IcarryService()
  const shipmozo = new ShipmozoService()
  const truxcargo = new TruxcargoService()

  const delhiveryAwb = toText(process.env.TEST_DELHIVERY_AWB || process.env.DELHIVERY_TEST_AWB)
  const shipmentId = toText(process.env.TEST_SHIPROCKET_SHIPMENT_ID || process.env.SHIPROCKET_TEST_SHIPMENT_ID)
  const orderId = toText(process.env.TEST_SHIPROCKET_ORDER_ID || process.env.SHIPROCKET_TEST_EXISTING_ORDER_ID)
  const icarryShipmentId = toText(process.env.TEST_ICARRY_SHIPMENT_ID)
  const shipmozoAwb = toText(process.env.TEST_SHIPMOZO_AWB || process.env.SHIPMOZO_TEST_AWB)
  const truxcargoWaybill = toText(process.env.TEST_TRUXCARGO_WAYBILL || process.env.TRUXCARGO_TEST_WAYBILL)

  if (delhiveryAwb) {
    summary.push(await runCase('delhivery.generate-label', () => delhivery.generateLabel(delhiveryAwb)))
  } else {
    summary.push({
      api: 'delhivery.generate-label',
      ok: true,
      message: 'Skipped: TEST_DELHIVERY_AWB missing',
    })
  }

  // Delhivery has no dedicated invoice generation API in current provider integration.
  summary.push({
    api: 'delhivery.generate-invoice',
    ok: true,
    message: 'Skipped: provider invoice API not available in current Delhivery integration',
  })

  if (shipmentId) {
    summary.push(
      await runCase('shiprocket.generate-label', () =>
        shiprocket.generateLabel({ shipment_id: [Number(shipmentId)] }),
      ),
    )
  } else {
    summary.push({
      api: 'shiprocket.generate-label',
      ok: true,
      message: 'Skipped: TEST_SHIPROCKET_SHIPMENT_ID missing',
    })
  }

  if (orderId) {
    summary.push(
      await runCase('shiprocket.generate-invoice', () =>
        shiprocket.generateInvoice({ ids: [Number(orderId)] }),
      ),
    )
  } else {
    summary.push({
      api: 'shiprocket.generate-invoice',
      ok: true,
      message: 'Skipped: TEST_SHIPROCKET_ORDER_ID missing',
    })
  }

  if (icarryShipmentId) {
    summary.push(
      await runCase('icarry.print-shipment-label', () =>
        icarry.printShipmentLabel({ shipment_id: Number(icarryShipmentId) }),
      ),
    )
  } else {
    summary.push({
      api: 'icarry.print-shipment-label',
      ok: true,
      message: 'Skipped: TEST_ICARRY_SHIPMENT_ID missing',
    })
  }

  // iCarry has no dedicated invoice generation API in current provider integration.
  summary.push({
    api: 'icarry.generate-invoice',
    ok: true,
    message: 'Skipped: provider invoice API not available in current iCarry integration',
  })

  if (shipmozoAwb) {
    summary.push(await runCase('shipmozo.get-order-label', () => shipmozo.getOrderLabel(shipmozoAwb)))
  } else {
    summary.push({
      api: 'shipmozo.get-order-label',
      ok: true,
      message: 'Skipped: TEST_SHIPMOZO_AWB missing',
    })
  }

  // Shipmozo has no dedicated invoice generation API in current provider integration.
  summary.push({
    api: 'shipmozo.generate-invoice',
    ok: true,
    message: 'Skipped: provider invoice API not available in current Shipmozo integration',
  })

  if (truxcargoWaybill) {
    summary.push(
      await runCase('truxcargo.create-packaging-slip', () =>
        truxcargo.createPackagingSlip({ waybill: truxcargoWaybill }),
      ),
    )
  } else {
    summary.push({
      api: 'truxcargo.create-packaging-slip',
      ok: true,
      message: 'Skipped: TEST_TRUXCARGO_WAYBILL missing',
    })
  }

  // Truxcargo has no dedicated invoice generation API in current provider integration.
  summary.push({
    api: 'truxcargo.generate-invoice',
    ok: true,
    message: 'Skipped: provider invoice API not available in current Truxcargo integration',
  })

  console.log('\n[Courier Label/Invoice Test] Summary')
  console.log(JSON.stringify(summary, null, 2))

  const failed = summary.filter((item) => !item.ok)
  if (failed.length) {
    throw new Error(
      `Strict verification failed for ${failed.length} API checks: ${failed
        .map((item) => item.api)
        .join(', ')}`,
    )
  }
}

main().catch((error) => {
  console.error('[Courier Label/Invoice Test] Fatal', error?.message || error)
  process.exit(1)
})
