import * as dotenv from 'dotenv'
import path from 'path'
import { IcarryService } from '../models/services/couriers/icarry.service'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const safePayload = (value: any): any => {
  if (value == null) return value
  if (Array.isArray(value)) return value.map((entry) => safePayload(entry))
  if (typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const [key, nested] of Object.entries(value)) {
      const lowered = key.toLowerCase()
      if (lowered.includes('token') || lowered.includes('key')) out[key] = '[redacted]'
      else out[key] = safePayload(nested)
    }
    return out
  }
  return value
}

const asBool = (value: string | undefined) => String(value || '').trim() === '1'

async function runCase(name: string, fn: () => Promise<any>) {
  try {
    const response = await fn()
    console.log(`\n[iCarry Shipment Ops Test] ${name} - SUCCESS`)
    console.log(JSON.stringify(safePayload(response), null, 2))
    return { api: name, ok: true, message: String(response?.error || response?.success || 'OK') }
  } catch (error: any) {
    console.log(`\n[iCarry Shipment Ops Test] ${name} - FAILED`)
    console.log(
      JSON.stringify(
        {
          message: error?.message || String(error),
          response: safePayload(error?.response?.data || null),
        },
        null,
        2,
      ),
    )
    return { api: name, ok: false, message: String(error?.message || error) }
  }
}

async function main() {
  const shipmentId = Number(process.env.ICARRY_TEST_SHIPMENT_ID || 0)
  if (!Number.isFinite(shipmentId) || shipmentId <= 0) {
    throw new Error('Set ICARRY_TEST_SHIPMENT_ID with a valid shipment id')
  }

  const service = new IcarryService()
  const allowReverse = asBool(process.env.ICARRY_TEST_ALLOW_REVERSE)
  const allowCancel = asBool(process.env.ICARRY_TEST_ALLOW_CANCEL)
  const summary = []

  summary.push(await runCase('track-shipment', async () => service.trackShipment({ shipment_id: shipmentId })))
  summary.push(
    await runCase('print-shipment-label', async () => service.printShipmentLabel({ shipment_id: shipmentId })),
  )
  summary.push(
    await runCase('sync-shipment-status', async () =>
      service.syncShipmentStatus({ shipment_ids: [shipmentId] }),
    ),
  )
  summary.push(
    await runCase('sync-shipment-charges', async () =>
      service.syncShipmentCharges({ shipment_ids: [shipmentId] }),
    ),
  )

  if (allowReverse) {
    summary.push(
      await runCase('create-reverse-shipment', async () =>
        service.createReverseShipment({ shipment_id: shipmentId }),
      ),
    )
  } else {
    summary.push({
      api: 'create-reverse-shipment',
      ok: true,
      message: 'SKIPPED (set ICARRY_TEST_ALLOW_REVERSE=1 to run)',
    })
  }

  if (allowCancel) {
    summary.push(
      await runCase('cancel-shipment', async () => service.cancelShipment({ shipment_id: shipmentId })),
    )
  } else {
    summary.push({
      api: 'cancel-shipment',
      ok: true,
      message: 'SKIPPED (set ICARRY_TEST_ALLOW_CANCEL=1 to run)',
    })
  }

  console.log('\n[iCarry Shipment Ops Test] Summary')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error: any) => {
  console.error('[iCarry Shipment Ops Test] Failed')
  console.error(error?.message || error)
  process.exit(1)
})
