import crypto from 'crypto'
import { and, eq, ilike, inArray, sql } from 'drizzle-orm'
import { db, pool } from '../models/client'
import { replaceShippingRateSlabs } from '../models/services/b2cRateCard.service'
import { couriers, plans, shippingRates, zones } from '../schema/schema'

const SHIPMOZO_PROVIDER = 'shipmozo'
const BASE_RATE = 20
const SLAB_FROM = 0
const SLAB_TO = 0.5
const EXTRA_RATE = 10
const EXTRA_WEIGHT_UNIT = 1

async function pickTargetPlanId() {
  const [basicPlan] = await db.select({ id: plans.id }).from(plans).where(ilike(plans.name, 'Basic')).limit(1)
  if (basicPlan?.id) return basicPlan.id

  const [firstPlan] = await db.select({ id: plans.id }).from(plans).limit(1)
  if (!firstPlan?.id) {
    throw new Error('No plan found. Create at least one plan before seeding Shipmozo slabs.')
  }
  return firstPlan.id
}

async function getShipmozoB2CCouriers() {
  return db
    .select({
      id: couriers.id,
      name: couriers.name,
      serviceProvider: couriers.serviceProvider,
      businessType: couriers.businessType,
    })
    .from(couriers)
    .where(eq(sql`LOWER(${couriers.serviceProvider})`, SHIPMOZO_PROVIDER))
}

function supportsB2C(businessType: unknown) {
  if (!Array.isArray(businessType)) return false
  return businessType.some((entry) => String(entry || '').toLowerCase() === 'b2c')
}

async function getB2CZones() {
  return db
    .select({ id: zones.id, code: zones.code, name: zones.name })
    .from(zones)
    .where(eq(sql`LOWER(${zones.business_type})`, 'b2c'))
}

async function upsertRateAndSlab(input: {
  planId: string
  courierId: number
  courierName: string
  zoneId: string
  type: 'forward' | 'rto'
}) {
  const [existing] = await db
    .select({ id: shippingRates.id })
    .from(shippingRates)
    .where(
      and(
        eq(shippingRates.plan_id, input.planId),
        eq(shippingRates.courier_id, input.courierId),
        eq(shippingRates.business_type, 'b2c'),
        eq(shippingRates.zone_id, input.zoneId),
        eq(shippingRates.type, input.type),
        eq(sql`LOWER(${shippingRates.service_provider})`, SHIPMOZO_PROVIDER),
      ),
    )
    .limit(1)

  const payload = {
    plan_id: input.planId,
    courier_id: input.courierId,
    courier_name: input.courierName,
    service_provider: SHIPMOZO_PROVIDER,
    mode: '',
    business_type: 'b2c',
    min_weight: SLAB_FROM.toFixed(2),
    zone_id: input.zoneId,
    type: input.type,
    rate: BASE_RATE.toFixed(2),
    cod_charges: '0.00',
    cod_percent: '0.00',
    other_charges: '0.00',
    last_updated: new Date(),
  }

  let shippingRateId = existing?.id
  if (shippingRateId) {
    await db.update(shippingRates).set(payload as any).where(eq(shippingRates.id, shippingRateId))
  } else {
    shippingRateId = crypto.randomUUID()
    await db.insert(shippingRates).values({ id: shippingRateId, ...payload } as any)
  }

  await replaceShippingRateSlabs(shippingRateId, [
    {
      weight_from: SLAB_FROM,
      weight_to: SLAB_TO,
      rate: BASE_RATE,
      extra_rate: EXTRA_RATE,
      extra_weight_unit: EXTRA_WEIGHT_UNIT,
    },
  ])
}

async function main() {
  const planId = await pickTargetPlanId()
  const [allCouriers, allZones] = await Promise.all([getShipmozoB2CCouriers(), getB2CZones()])
  const shipmozoB2CCouriers = allCouriers.filter((courier) => supportsB2C(courier.businessType))

  if (!shipmozoB2CCouriers.length) {
    throw new Error('No Shipmozo couriers with businessType including b2c were found.')
  }
  if (!allZones.length) {
    throw new Error('No B2C zones found.')
  }

  const zoneIds = allZones.map((zone) => zone.id)
  const courierIds = shipmozoB2CCouriers.map((courier) => courier.id)

  const staleRates = await db
    .select({ id: shippingRates.id })
    .from(shippingRates)
    .where(
      and(
        eq(shippingRates.plan_id, planId),
        eq(shippingRates.business_type, 'b2c'),
        eq(sql`LOWER(${shippingRates.service_provider})`, SHIPMOZO_PROVIDER),
        inArray(shippingRates.courier_id, courierIds),
        inArray(shippingRates.zone_id, zoneIds),
      ),
    )

  for (const stale of staleRates) {
    await replaceShippingRateSlabs(stale.id, [
      {
        weight_from: SLAB_FROM,
        weight_to: SLAB_TO,
        rate: BASE_RATE,
        extra_rate: EXTRA_RATE,
        extra_weight_unit: EXTRA_WEIGHT_UNIT,
      },
    ])
  }

  let touched = 0
  for (const courier of shipmozoB2CCouriers) {
    for (const zone of allZones) {
      for (const type of ['forward', 'rto'] as const) {
        await upsertRateAndSlab({
          planId,
          courierId: courier.id,
          courierName: courier.name,
          zoneId: zone.id,
          type,
        })
        touched += 1
      }
    }
  }

  console.log(
    `Seeded Shipmozo B2C slabs for plan ${planId}: ${shipmozoB2CCouriers.length} couriers x ${allZones.length} zones x 2 types = ${touched} rate entries.`,
  )
}

main()
  .then(async () => {
    await pool.end()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('Failed to seed Shipmozo B2C slabs:', error)
    await pool.end()
    process.exit(1)
  })
