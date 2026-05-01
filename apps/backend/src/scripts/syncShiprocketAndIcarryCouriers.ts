import { sql } from 'drizzle-orm'
import { SHIPROCKET_COURIER_SEEDS } from '../constants/shiprocketCouriers'
import { db } from '../models/client'
import { couriers } from '../models/schema/couriers'
import { IcarryService } from '../models/services/couriers/icarry.service'

const extractIcarryEstimateRows = (icarryResp: any) => {
  return Array.isArray(icarryResp?.estimate)
    ? icarryResp.estimate
    : Array.isArray(icarryResp?.data?.estimate)
      ? icarryResp.data.estimate
      : Array.isArray(icarryResp?.data)
        ? icarryResp.data
        : []
}

const normalizeIcarryCourierRows = (estimateRows: any[]) =>
  estimateRows
    .map((record: any) => {
      const courierId = Number(
        record?.courier_id ??
          record?.courierId ??
          record?.id ??
          record?.service_id ??
          record?.provider_id ??
          NaN,
      )
      const courierName = String(
        record?.courier_name ?? record?.courier ?? record?.provider_name ?? record?.name ?? '',
      ).trim()
      if (!Number.isFinite(courierId) || !courierName) return null
      return {
        id: courierId,
        name: courierName,
        serviceProvider: 'icarry',
        isEnabled: true,
        businessType: ['b2c'],
        updatedAt: new Date(),
      }
    })
    .filter((row: any) => Boolean(row))

async function main() {
  await db
    .insert(couriers)
    .values(
      SHIPROCKET_COURIER_SEEDS.map((row) => ({
        id: row.id,
        name: row.name,
        serviceProvider: 'shiprocket',
        isEnabled: true,
        businessType: row.businessType,
        updatedAt: new Date(),
      })) as any,
    )
    .onConflictDoUpdate({
      target: [couriers.id, couriers.serviceProvider],
      set: {
        name: sql`excluded.name`,
        isEnabled: sql`${couriers.isEnabled}`,
        businessType: sql`excluded.business_type`,
        updatedAt: new Date(),
      },
    })

  console.log(`[sync] Shiprocket couriers upserted: ${SHIPROCKET_COURIER_SEEDS.length}`)

  try {
    const icarry = new IcarryService()
    const icarryResp = await icarry.getEstimateSingleShipment({
      origin_pincode: 110001,
      destination_pincode: 400001,
      origin_country_code: 'IN',
      destination_country_code: 'IN',
      shipment_mode: 'S',
      shipment_type: 'P',
      shipment_value: 1000,
      weight: 0.5,
      length: 10,
      breadth: 10,
      height: 10,
    })

    const normalizedIcarryRows = normalizeIcarryCourierRows(extractIcarryEstimateRows(icarryResp))

    if (normalizedIcarryRows.length) {
      await db
        .insert(couriers)
        .values(normalizedIcarryRows as any)
        .onConflictDoUpdate({
          target: [couriers.id, couriers.serviceProvider],
          set: {
            name: sql`excluded.name`,
            isEnabled: sql`${couriers.isEnabled}`,
            businessType: sql`excluded.business_type`,
            updatedAt: new Date(),
          },
        })
    }

    console.log(`[sync] iCarry couriers upserted: ${normalizedIcarryRows.length}`)
  } catch (icarryErr: any) {
    console.warn(`[sync] iCarry sync skipped: ${String(icarryErr?.message || icarryErr)}`)
  }
}

main()
  .then(() => {
    console.log('[sync] completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('[sync] failed', error)
    process.exit(1)
  })
