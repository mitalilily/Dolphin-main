import { and, eq, inArray, sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { db, pool } from '../models/client'
import { couriers, plans, shippingRateSlabs, shippingRates, zones } from '../schema/schema'

const TARGET_PROVIDERS = ['shiprocket', 'icarry'] as const
const BASE_RATE = '20.00'
const COD_CHARGES = '20.00'
const COD_PERCENT = '2.00'
const EXTRA_RATE = '10.00'
const EXTRA_WEIGHT_UNIT = '1.000'
const MIN_WEIGHT = '0.50'

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

async function main() {
  const providerCouriers = await db
    .select({
      id: couriers.id,
      name: couriers.name,
      serviceProvider: couriers.serviceProvider,
      isEnabled: couriers.isEnabled,
    })
    .from(couriers)
    .where(inArray(couriers.serviceProvider, [...TARGET_PROVIDERS]))

  if (!providerCouriers.length) {
    throw new Error('No Shiprocket/iCarry couriers found. Sync couriers first.')
  }

  const b2cZones = await db
    .select({ id: zones.id, name: zones.name, code: zones.code, businessType: zones.business_type })
    .from(zones)
    .where(sql`LOWER(${zones.business_type}) = 'b2c'`)

  if (!b2cZones.length) {
    throw new Error('No B2C zones found. Create zones first.')
  }

  const activePlans = await db
    .select({ id: plans.id, name: plans.name })
    .from(plans)
    .where(eq(plans.is_active, true))

  const targetPlans = activePlans.length
    ? activePlans
    : await db.select({ id: plans.id, name: plans.name }).from(plans)

  if (!targetPlans.length) {
    throw new Error('No plans found. Create at least one plan first.')
  }

  const planIds = targetPlans.map((p) => p.id)
  const providerCourierIds = providerCouriers.map((c) => c.id)

  await db
    .delete(shippingRates)
    .where(
      and(
        eq(shippingRates.business_type, 'b2c'),
        inArray(shippingRates.plan_id, planIds),
        inArray(shippingRates.service_provider, [...TARGET_PROVIDERS]),
        inArray(shippingRates.courier_id, providerCourierIds),
      ),
    )

  const rows: any[] = []
  for (const plan of targetPlans) {
    for (const courier of providerCouriers) {
      for (const zone of b2cZones) {
        for (const type of ['forward', 'rto'] as const) {
          rows.push({
            id: randomUUID(),
            plan_id: plan.id,
            service_provider: courier.serviceProvider,
            cod_charges: COD_CHARGES,
            cod_percent: COD_PERCENT,
            other_charges: '0.00',
            rate: BASE_RATE,
            last_updated: new Date(),
            courier_id: courier.id,
            courier_name: courier.name,
            mode: 'surface',
            business_type: 'b2c',
            min_weight: MIN_WEIGHT,
            zone_id: zone.id,
            type,
            created_at: new Date(),
          })
        }
      }
    }
  }

  for (const part of chunk(rows, 500)) {
    await db.insert(shippingRates).values(part as any)
  }

  const insertedRates = await db
    .select({ id: shippingRates.id })
    .from(shippingRates)
    .where(
      and(
        eq(shippingRates.business_type, 'b2c'),
        inArray(shippingRates.plan_id, planIds),
        inArray(shippingRates.service_provider, [...TARGET_PROVIDERS]),
        inArray(shippingRates.courier_id, providerCourierIds),
      ),
    )

  const slabRows = insertedRates.map((rate) => ({
    shipping_rate_id: rate.id,
    weight_from: '0.000',
    weight_to: '0.500',
    rate: BASE_RATE,
    extra_rate: EXTRA_RATE,
    extra_weight_unit: EXTRA_WEIGHT_UNIT,
  }))

  for (const part of chunk(slabRows, 1000)) {
    await db.insert(shippingRateSlabs).values(part as any)
  }

  console.log(
    `[seed] completed: plans=${targetPlans.length}, couriers=${providerCouriers.length}, zones=${b2cZones.length}, rates=${rows.length}, slabs=${slabRows.length}`,
  )
}

main()
  .then(async () => {
    await pool.end()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('[seed] failed', error?.message || error)
    await pool.end()
    process.exit(1)
  })
