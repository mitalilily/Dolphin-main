import * as dotenv from 'dotenv'
import path from 'path'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

type CourierApiFilter = {
  pickup_pincode: number
  delivery_pincode: number
  payment_type?: 'PREPAID' | 'COD'
  shipment_type?: 'FORWARD' | 'REVERSE'
  order_amount?: number
  weight?: number
}

const defaultFilters: CourierApiFilter[] = [
  { pickup_pincode: 122001, delivery_pincode: 110001, payment_type: 'PREPAID', weight: 500 },
  { pickup_pincode: 110001, delivery_pincode: 400001, payment_type: 'PREPAID', weight: 500 },
  { pickup_pincode: 560001, delivery_pincode: 500001, payment_type: 'COD', order_amount: 2000, weight: 800 },
  { pickup_pincode: 700001, delivery_pincode: 600001, payment_type: 'PREPAID', weight: 1000 },
]

const testMultipleCourierResponses = async () => {
  const {
    fetchCouriersFromMultipleCalls,
    findCourierProviderInDb,
    seedCouriersToDb,
  } = await import('../models/services/couriers/shipmozoCourierCatalog.service')

  const structured = await fetchCouriersFromMultipleCalls(defaultFilters)
  const seeded = await seedCouriersToDb(structured, ['b2c', 'b2b'])
  const dbRows = await findCourierProviderInDb(structured.map((row) => row.courier_id))

  // Logging helps track selected courier and provider.
  console.log('[Shipmozo Seeder] API calls:', defaultFilters.length)
  console.log('[Shipmozo Seeder] Unique couriers from API:', structured.length)
  console.log('[Shipmozo Seeder] Upserted rows:', seeded.insertedOrUpdated)

  // Return the exact structured format requested.
  const response = structured.map((row) => ({
    courier_id: row.courier_id,
    courier_name: row.courier_name,
    provider: row.provider,
    cost: row.cost,
    delivery_time: row.delivery_time,
  }))

  console.log('[Shipmozo Seeder] Structured response sample:')
  console.log(JSON.stringify(response.slice(0, 10), null, 2))

  console.log('[Shipmozo Seeder] Provider mapping from DB sample:')
  console.log(JSON.stringify(dbRows.slice(0, 10), null, 2))

  return { response, dbRows }
}

async function main() {
  try {
    await testMultipleCourierResponses()
  } catch (error: any) {
    console.error('[Shipmozo Seeder] Failed:', error?.message || error)
    process.exit(1)
  }
}

main()
