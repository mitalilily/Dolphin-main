import { IcarryService } from '../models/services/couriers/icarry.service'
import { ShiprocketCourierService } from '../models/services/couriers/shiprocket.service'
import { ShipmozoService } from '../models/services/couriers/shipmozo.service'

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
  const shiprocket = new ShiprocketCourierService()
  const icarry = new IcarryService()
  const shipmozo = new ShipmozoService()

  const shipmentId = toText(process.env.TEST_SHIPROCKET_SHIPMENT_ID || process.env.SHIPROCKET_TEST_SHIPMENT_ID)
  const orderId = toText(process.env.TEST_SHIPROCKET_ORDER_ID || process.env.SHIPROCKET_TEST_EXISTING_ORDER_ID)
  const icarryShipmentId = toText(process.env.TEST_ICARRY_SHIPMENT_ID)
  const shipmozoAwb = toText(process.env.TEST_SHIPMOZO_AWB || process.env.SHIPMOZO_TEST_AWB)

  if (shipmentId) {
    summary.push(
      await runCase('shiprocket.generate-label', () =>
        shiprocket.generateLabel({ shipment_id: [Number(shipmentId)] }),
      ),
    )
  } else {
    summary.push({
      api: 'shiprocket.generate-label',
      ok: false,
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
      ok: false,
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
      ok: false,
      message: 'Skipped: TEST_ICARRY_SHIPMENT_ID missing',
    })
  }

  // iCarry has no dedicated invoice generation API in current provider integration.
  summary.push({
    api: 'icarry.generate-invoice',
    ok: false,
    message: 'Skipped: provider invoice API not available in current iCarry integration',
  })

  if (shipmozoAwb) {
    summary.push(await runCase('shipmozo.get-order-label', () => shipmozo.getOrderLabel(shipmozoAwb)))
  } else {
    summary.push({
      api: 'shipmozo.get-order-label',
      ok: false,
      message: 'Skipped: TEST_SHIPMOZO_AWB missing',
    })
  }

  // Shipmozo has no dedicated invoice generation API in current provider integration.
  summary.push({
    api: 'shipmozo.generate-invoice',
    ok: false,
    message: 'Skipped: provider invoice API not available in current Shipmozo integration',
  })

  console.log('\n[Courier Label/Invoice Test] Summary')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('[Courier Label/Invoice Test] Fatal', error?.message || error)
  process.exit(1)
})
