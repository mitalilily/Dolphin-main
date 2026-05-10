import { randomUUID } from 'crypto'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { KNOWN_COURIER_PROVIDERS, type KnownCourierProvider } from '../constants/courierProviders'
import { db, pool } from '../models/client'
import {
  courierCredentials,
  couriers,
  plans,
  shippingRateSlabs,
  shippingRates,
  zones,
} from '../schema/schema'

const RATE = '10.00'
const COD_CHARGE = '20.00'
const EXTRA_RATE = '10.00'
const EXTRA_WEIGHT_UNIT = '1.000'
const MIN_WEIGHT = '0.50'

const zoneDefinitions = [
  { code: 'A', name: 'Zone A', description: 'Primary metro cities' },
  { code: 'B', name: 'Zone B', description: 'Major regional cities' },
  { code: 'C', name: 'Zone C', description: 'Tier 2 and regional coverage' },
  { code: 'D', name: 'Zone D', description: 'Remote and extended coverage' },
  { code: 'E', name: 'Zone E', description: 'Special handling and extended areas' },
  { code: 'SPECIAL', name: 'Special Zone', description: 'Custom rules and exceptions' },
]

const normalize = (value?: string | null) => String(value || '').trim()
const hasAny = (record: Record<string, string>) => Object.values(record).some((value) => value)

function envCredentials(provider: KnownCourierProvider) {
  const env = process.env
  const base: Record<string, string> = {
    provider,
    apiBase: '',
    clientName: '',
    apiKey: '',
    clientId: '',
    username: '',
    password: '',
    webhookSecret: '',
  }

  if (provider === 'delhivery') {
    return {
      ...base,
      apiBase: normalize(env.DELHIVERY_API_BASE),
      clientName: normalize(env.DELHIVERY_CLIENT_NAME),
      apiKey: normalize(env.DELHIVERY_API_KEY),
      username: normalize(env.DELHIVERY_LTL_USERNAME || env.DELHIVERY_LTL_EMAIL),
      password: normalize(env.DELHIVERY_LTL_PASSWORD),
    }
  }

  if (provider === 'ekart') {
    return {
      ...base,
      apiBase: normalize(env.EKART_BASE_API || env.EKART_BASE_AUTH),
      clientId: normalize(env.EKART_CLIENT_ID),
      username: normalize(env.EKART_USERNAME),
      password: normalize(env.EKART_PASSWORD),
    }
  }

  if (provider === 'xpressbees') {
    return {
      ...base,
      apiBase: normalize(env.XPRESSBEES_API_BASE),
      apiKey: normalize(env.XPRESSBEES_API_TOKEN),
      username: normalize(env.XPRESSBEES_USERNAME || env.XPRESSBEES_EMAIL),
      password: normalize(env.XPRESSBEES_PASSWORD),
    }
  }

  if (provider === 'shipmozo') {
    return {
      ...base,
      apiBase: normalize(env.SHIPMOZO_API_BASE),
      clientName: normalize(env.SHIPMOZO_DEFAULT_WAREHOUSE_ID),
      apiKey: normalize(env.SHIPMOZO_PRIVATE_KEY),
      clientId: normalize(env.SHIPMOZO_PUBLIC_KEY),
      username: normalize(env.SHIPMOZO_USERNAME),
      password: normalize(env.SHIPMOZO_PASSWORD),
    }
  }

  if (provider === 'shiprocket') {
    return {
      ...base,
      apiBase: normalize(env.SHIPROCKET_API_BASE),
      clientName: normalize(env.SHIPROCKET_DEFAULT_PICKUP_LOCATION),
      apiKey: normalize(env.SHIPROCKET_AUTH_TOKEN || env.SHIPROCKET_API_KEY),
      clientId: normalize(env.SHIPROCKET_DEFAULT_CHANNEL_ID),
      username: normalize(env.SHIPROCKET_EMAIL || env.SHIPROCKET_USERNAME),
      password: normalize(env.SHIPROCKET_PASSWORD),
    }
  }

  if (provider === 'icarry') {
    return {
      ...base,
      apiBase: normalize(env.ICARRY_API_BASE),
      apiKey: normalize(env.ICARRY_API_KEY),
      clientId: normalize(env.ICARRY_CLIENT_ID),
      username: normalize(env.ICARRY_USERNAME),
      password: normalize(env.ICARRY_PASSWORD),
    }
  }

  if (provider === 'truxcargo') {
    return {
      ...base,
      apiBase: normalize(env.TRUXCARGO_API_BASE),
      apiKey: normalize(env.TRUXCARGO_API_KEY),
      clientId: normalize(env.TRUXCARGO_USER_ID),
      password: normalize(env.TRUXCARGO_PASSWORD),
    }
  }

  if (provider === 'shipway') {
    return {
      ...base,
      username: normalize(env.SHIPWAY_USERNAME),
      password: normalize(env.SHIPWAY_PASSWORD),
    }
  }

  return base
}

async function ensureZones() {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`)
  await db.execute(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS zones_code_business_type_unique ON meracourierwala_zones (code, business_type)`,
  )

  for (const businessType of ['b2c', 'b2b'] as const) {
    for (const zone of zoneDefinitions) {
      await db
        .insert(zones)
        .values({
          code: zone.code,
          name: zone.name,
          description: zone.description,
          business_type: businessType,
          updated_at: new Date(),
        } as any)
        .onConflictDoUpdate({
          target: [zones.code, zones.business_type],
          set: {
            name: zone.name,
            description: zone.description,
            updated_at: new Date(),
          } as any,
        })
    }
  }
}

async function upsertCredentials() {
  let configured = 0
  for (const provider of KNOWN_COURIER_PROVIDERS) {
    const values = envCredentials(provider)
    if (!hasAny({ ...values, provider: '' })) continue

    await db
      .insert(courierCredentials)
      .values({ ...values, updatedAt: new Date() } as any)
      .onConflictDoUpdate({
        target: courierCredentials.provider,
        set: { ...values, updatedAt: new Date() } as any,
      })
    configured += 1
  }

  return configured
}

async function seedB2cRateCards() {
  const targetPlans = await db
    .select({ id: plans.id, name: plans.name })
    .from(plans)
    .where(eq(plans.is_active, true))

  const allPlans = targetPlans.length
    ? targetPlans
    : await db.select({ id: plans.id, name: plans.name }).from(plans)
  if (!allPlans.length) throw new Error('No plans exist. Create a plan before seeding rate cards.')

  const b2cZones = await db
    .select({ id: zones.id, code: zones.code })
    .from(zones)
    .where(sql`LOWER(${zones.business_type}) = 'b2c'`)
  if (!b2cZones.length) throw new Error('No B2C zones exist after zone seed.')

  const courierRows = await db
    .select({
      id: couriers.id,
      name: couriers.name,
      serviceProvider: couriers.serviceProvider,
      businessType: couriers.businessType,
    })
    .from(couriers)
    .where(eq(couriers.isEnabled, true))

  const b2cCouriers = courierRows.filter((courier) => {
    const types = Array.isArray(courier.businessType) ? courier.businessType : []
    return !types.length || types.map((type) => String(type).toLowerCase()).includes('b2c')
  })
  if (!b2cCouriers.length) throw new Error('No enabled B2C couriers exist.')

  const planIds = allPlans.map((plan) => plan.id)
  await db.delete(shippingRates).where(and(eq(shippingRates.business_type, 'b2c'), inArray(shippingRates.plan_id, planIds)))

  const rateRows: (typeof shippingRates.$inferInsert)[] = []
  for (const plan of allPlans) {
    for (const courier of b2cCouriers) {
      for (const zone of b2cZones) {
        for (const type of ['forward', 'rto'] as const) {
          rateRows.push({
            id: randomUUID(),
            plan_id: plan.id,
            service_provider: courier.serviceProvider,
            cod_charges: COD_CHARGE,
            cod_percent: '0.00',
            other_charges: '0.00',
            rate: RATE,
            last_updated: new Date(),
            courier_id: courier.id,
            courier_name: courier.name,
            mode: 'surface',
            business_type: 'b2c',
            min_weight: MIN_WEIGHT,
            zone_id: zone.id,
            type,
            created_at: new Date(),
          } as any)
        }
      }
    }
  }

  for (let i = 0; i < rateRows.length; i += 500) {
    await db.insert(shippingRates).values(rateRows.slice(i, i + 500) as any)
  }

  const slabRows = rateRows.map((rate) => ({
    shipping_rate_id: rate.id!,
    weight_from: '0.000',
    weight_to: '0.500',
    rate: RATE,
    extra_rate: EXTRA_RATE,
    extra_weight_unit: EXTRA_WEIGHT_UNIT,
    updated_at: new Date(),
  }))

  for (let i = 0; i < slabRows.length; i += 1000) {
    await db.insert(shippingRateSlabs).values(slabRows.slice(i, i + 1000) as any)
  }

  return {
    plans: allPlans.length,
    couriers: b2cCouriers.length,
    zones: b2cZones.length,
    rates: rateRows.length,
    slabs: slabRows.length,
  }
}

async function main() {
  await ensureZones()
  const credentials = await upsertCredentials()
  const rateSummary = await seedB2cRateCards()

  console.log(
    JSON.stringify({
      ok: true,
      credentials,
      ...rateSummary,
      codCharge: COD_CHARGE,
      firstSlab: RATE,
      firstSlabWeight: '0-0.5kg',
      extraRate: EXTRA_RATE,
      extraWeightUnit: '1kg',
    }),
  )
}

main()
  .catch((error) => {
    console.error('[repair-production-courier-setup] failed:', error?.message || error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
