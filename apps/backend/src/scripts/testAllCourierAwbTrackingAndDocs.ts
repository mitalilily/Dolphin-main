import * as dotenv from 'dotenv'
import path from 'path'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

type CheckResult = {
  check: string
  ok: boolean
  skipped?: boolean
  message: string
}

const toText = (value: unknown) => String(value ?? '').trim()

const parseJsonEnv = (envKey: string): any | null => {
  const raw = toText(process.env[envKey])
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(`${envKey} must be valid JSON`)
  }
}

const safePrint = (value: any) =>
  JSON.stringify(
    value,
    (_k, v) => {
      if (typeof v === 'string' && v.length > 320) return `${v.slice(0, 320)}...`
      return v
    },
    2,
  )

async function runCheck(name: string, fn: () => Promise<any>): Promise<CheckResult> {
  try {
    const result = await fn()
    console.log(`\n[${name}] SUCCESS`)
    console.log(safePrint(result))
    return { check: name, ok: true, message: 'OK' }
  } catch (error: any) {
    const message = String(error?.message || error)
    console.log(`\n[${name}] FAILED`)
    console.log(message)
    return { check: name, ok: false, message }
  }
}

function skipCheck(name: string, reason: string): CheckResult {
  console.log(`\n[${name}] SKIPPED: ${reason}`)
  return { check: name, ok: true, skipped: true, message: reason }
}

async function main() {
  const summary: CheckResult[] = []

  const { regenerateOrderDocumentsServiceAdmin } = require('../models/services/adminOrders.service')
  const { DelhiveryService } = require('../models/services/couriers/delhivery.service')
  const { EkartService } = require('../models/services/couriers/ekart.service')
  const { IcarryService } = require('../models/services/couriers/icarry.service')
  const { ShipmozoService } = require('../models/services/couriers/shipmozo.service')
  const { ShiprocketCourierService } = require('../models/services/couriers/shiprocket.service')
  const { TruxcargoService } = require('../models/services/couriers/truxcargo.service')
  const { XpressbeesService } = require('../models/services/couriers/xpressbees.service')

  const delhivery = new DelhiveryService()
  const shiprocket = new ShiprocketCourierService()
  const shipmozo = new ShipmozoService()
  const truxcargo = new TruxcargoService()
  const ekart = new EkartService()
  const xpressbees = new XpressbeesService()
  const icarry = new IcarryService()

  // Tracking checks
  const delhiveryAwb = toText(process.env.TEST_DELHIVERY_AWB || process.env.DELHIVERY_TEST_AWB)
  summary.push(
    delhiveryAwb
      ? await runCheck('tracking.delhivery', () => delhivery.trackShipment(delhiveryAwb))
      : skipCheck('tracking.delhivery', 'TEST_DELHIVERY_AWB missing'),
  )

  const shiprocketAwb = toText(process.env.TEST_SHIPROCKET_AWB || process.env.SHIPROCKET_TEST_AWB)
  summary.push(
    shiprocketAwb
      ? await runCheck('tracking.shiprocket', () => shiprocket.trackByAwb(shiprocketAwb))
      : skipCheck('tracking.shiprocket', 'TEST_SHIPROCKET_AWB missing'),
  )

  const shipmozoAwb = toText(process.env.TEST_SHIPMOZO_AWB || process.env.SHIPMOZO_TEST_AWB)
  summary.push(
    shipmozoAwb
      ? await runCheck('tracking.shipmozo', () => shipmozo.trackOrder(shipmozoAwb))
      : skipCheck('tracking.shipmozo', 'TEST_SHIPMOZO_AWB missing'),
  )

  const truxcargoAwb = toText(process.env.TEST_TRUXCARGO_WAYBILL || process.env.TRUXCARGO_TEST_WAYBILL)
  summary.push(
    truxcargoAwb
      ? await runCheck('tracking.truxcargo', () => truxcargo.trackShipment({ waybill: truxcargoAwb }))
      : skipCheck('tracking.truxcargo', 'TEST_TRUXCARGO_WAYBILL missing'),
  )

  const ekartWbn = toText(process.env.TEST_EKART_WBN || process.env.EKART_TEST_WBN)
  summary.push(
    ekartWbn
      ? await runCheck('tracking.ekart', () => ekart.trackWbn(ekartWbn))
      : skipCheck('tracking.ekart', 'TEST_EKART_WBN missing'),
  )

  const xpressAwb = toText(process.env.TEST_XPRESSBEES_AWB || process.env.XPRESSBEES_TEST_AWB)
  summary.push(
    xpressAwb
      ? await runCheck('tracking.xpressbees', () => xpressbees.trackShipment(xpressAwb))
      : skipCheck('tracking.xpressbees', 'TEST_XPRESSBEES_AWB missing'),
  )

  const icarryShipmentId = Number(process.env.TEST_ICARRY_SHIPMENT_ID || process.env.ICARRY_TEST_SHIPMENT_ID || 0)
  summary.push(
    Number.isFinite(icarryShipmentId) && icarryShipmentId > 0
      ? await runCheck('tracking.icarry', () => icarry.trackShipment({ shipment_id: icarryShipmentId }))
      : skipCheck('tracking.icarry', 'TEST_ICARRY_SHIPMENT_ID missing'),
  )

  // AWB generation checks (payload-driven to avoid accidental live order creation)
  const delhiveryAwbPayload = parseJsonEnv('TEST_DELHIVERY_CREATE_SHIPMENT_PAYLOAD_JSON')
  summary.push(
    delhiveryAwbPayload
      ? await runCheck('awb.delhivery.create-shipment', () => delhivery.createShipment(delhiveryAwbPayload))
      : skipCheck('awb.delhivery.create-shipment', 'TEST_DELHIVERY_CREATE_SHIPMENT_PAYLOAD_JSON missing'),
  )

  const shiprocketAwbPayload = parseJsonEnv('TEST_SHIPROCKET_ASSIGN_AWB_PAYLOAD_JSON')
  summary.push(
    shiprocketAwbPayload
      ? await runCheck('awb.shiprocket.assign-awb', () => shiprocket.assignAwb(shiprocketAwbPayload))
      : skipCheck('awb.shiprocket.assign-awb', 'TEST_SHIPROCKET_ASSIGN_AWB_PAYLOAD_JSON missing'),
  )

  const shipmozoAwbPayload = parseJsonEnv('TEST_SHIPMOZO_AUTO_ASSIGN_PAYLOAD_JSON')
  summary.push(
    shipmozoAwbPayload
      ? await runCheck('awb.shipmozo.auto-assign', () => shipmozo.autoAssignOrder(shipmozoAwbPayload))
      : skipCheck('awb.shipmozo.auto-assign', 'TEST_SHIPMOZO_AUTO_ASSIGN_PAYLOAD_JSON missing'),
  )

  const truxcargoAwbPayload = parseJsonEnv('TEST_TRUXCARGO_CREATE_ORDER_PAYLOAD_JSON')
  summary.push(
    truxcargoAwbPayload
      ? await runCheck('awb.truxcargo.create-order', () => truxcargo.createOrder(truxcargoAwbPayload))
      : skipCheck('awb.truxcargo.create-order', 'TEST_TRUXCARGO_CREATE_ORDER_PAYLOAD_JSON missing'),
  )

  const ekartAwbPayload = parseJsonEnv('TEST_EKART_CREATE_SHIPMENT_PAYLOAD_JSON')
  summary.push(
    ekartAwbPayload
      ? await runCheck('awb.ekart.create-shipment', () => ekart.createShipment(ekartAwbPayload))
      : skipCheck('awb.ekart.create-shipment', 'TEST_EKART_CREATE_SHIPMENT_PAYLOAD_JSON missing'),
  )

  const xpressAwbPayload = parseJsonEnv('TEST_XPRESSBEES_CREATE_SHIPMENT_PAYLOAD_JSON')
  summary.push(
    xpressAwbPayload
      ? await runCheck('awb.xpressbees.create-shipment', () => xpressbees.createShipment(xpressAwbPayload))
      : skipCheck('awb.xpressbees.create-shipment', 'TEST_XPRESSBEES_CREATE_SHIPMENT_PAYLOAD_JSON missing'),
  )

  const icarryAwbPayload = parseJsonEnv('TEST_ICARRY_BOOK_INTL_PAYLOAD_JSON')
  summary.push(
    icarryAwbPayload
      ? await runCheck('awb.icarry.book-international', () => icarry.bookInternationalShipment(icarryAwbPayload))
      : skipCheck('awb.icarry.book-international', 'TEST_ICARRY_BOOK_INTL_PAYLOAD_JSON missing'),
  )

  // Admin-end label/invoice regeneration check
  const adminOrderId = toText(process.env.TEST_ADMIN_ORDER_ID)
  summary.push(
    adminOrderId
      ? await runCheck('admin.docs.regenerate', () =>
          regenerateOrderDocumentsServiceAdmin({
            orderId: adminOrderId,
            regenerateLabel: true,
            regenerateInvoice: true,
          }),
        )
      : skipCheck('admin.docs.regenerate', 'TEST_ADMIN_ORDER_ID missing'),
  )

  console.log('\n[ALL COURIER AWB/TRACKING/DOCS] SUMMARY')
  console.log(safePrint(summary))

  const failures = summary.filter((row) => !row.ok)
  if (failures.length) {
    throw new Error(`Verification failed for ${failures.length} checks: ${failures.map((f) => f.check).join(', ')}`)
  }
}

main().catch((error) => {
  console.error('[ALL COURIER AWB/TRACKING/DOCS] FATAL', error?.message || error)
  process.exit(1)
})
