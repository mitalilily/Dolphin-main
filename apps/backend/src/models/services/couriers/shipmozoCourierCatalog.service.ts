import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../../client'
import { couriers } from '../../schema/couriers'
import { ShipmozoService } from './shipmozo.service'
import { withRetry } from '../../../utils/httpRetry'

export type CourierApiFilter = {
  pickup_pincode: number
  delivery_pincode: number
  payment_type?: 'PREPAID' | 'COD'
  shipment_type?: 'FORWARD' | 'REVERSE'
  order_amount?: number
  weight?: number
}

export type StructuredCourierResponse = {
  courier_id: number
  courier_name: string
  provider: string
  cost: number
  delivery_time: string
}

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toNonEmptyString = (value: unknown, fallback = ''): string => {
  const text = String(value ?? '').trim()
  return text || fallback
}

const mapRateRecordToStructured = (row: any): StructuredCourierResponse | null => {
  const courierId = toNumber(row?.id ?? row?.courier_id, NaN)
  const courierName = toNonEmptyString(row?.name ?? row?.courier_name ?? row?.courier, '')
  if (!Number.isFinite(courierId) || !courierName) return null

  return {
    courier_id: courierId,
    courier_name: courierName,
    provider: 'shipmozo',
    cost: toNumber(row?.total_charges ?? row?.amount ?? row?.shipping_charges, 0),
    delivery_time: toNonEmptyString(
      row?.estimated_delivery ?? row?.expected_delivery_date ?? row?.estimated_delivery_days,
      'N/A',
    ),
  }
}

const defaultDimensions = [{ no_of_box: '1', length: '22', width: '10', height: '10' }]

const buildRatePayload = (filter: CourierApiFilter) => ({
  order_id: '',
  pickup_pincode: filter.pickup_pincode,
  delivery_pincode: filter.delivery_pincode,
  payment_type: filter.payment_type || 'PREPAID',
  shipment_type: filter.shipment_type || 'FORWARD',
  order_amount: filter.order_amount ?? 1000,
  type_of_package: 'SPS',
  rov_type: 'ROV_OWNER',
  cod_amount: filter.payment_type === 'COD' ? String(filter.order_amount ?? 1000) : '',
  weight: filter.weight ?? 500,
  dimensions: defaultDimensions,
})

export const fetchCouriersFromShipmozo = async (
  filter: CourierApiFilter,
): Promise<StructuredCourierResponse[]> => {
  const service = new ShipmozoService()
  const response = await withRetry(() => service.rateCalculator(buildRatePayload(filter)), {
    attempts: 4,
    baseDelayMs: 300,
    maxDelayMs: 2000,
  })

  const records = Array.isArray(response?.data)
    ? response.data
    : response?.data
      ? [response.data]
      : []

  return records.map(mapRateRecordToStructured).filter((row): row is StructuredCourierResponse => Boolean(row))
}

export const fetchCouriersFromMultipleCalls = async (
  filters: CourierApiFilter[],
): Promise<StructuredCourierResponse[]> => {
  const all = await Promise.all(filters.map((filter) => fetchCouriersFromShipmozo(filter)))
  const dedup = new Map<number, StructuredCourierResponse>()

  for (const rows of all) {
    for (const row of rows) {
      // courier_id is treated as unique key per user requirement.
      dedup.set(row.courier_id, row)
    }
  }

  return Array.from(dedup.values()).sort((a, b) => a.courier_id - b.courier_id)
}

export const seedCouriersToDb = async (
  rows: StructuredCourierResponse[],
  businessType: Array<'b2c' | 'b2b'> = ['b2c', 'b2b'],
) => {
  if (!rows.length) {
    return { insertedOrUpdated: 0 }
  }

  const values = rows.map((row) => ({
    id: row.courier_id,
    name: row.courier_name,
    serviceProvider: row.provider,
    isEnabled: true,
    businessType,
    updatedAt: new Date(),
  }))

  await db
    .insert(couriers)
    .values(values as any)
    .onConflictDoUpdate({
      target: [couriers.id, couriers.serviceProvider],
      set: {
        name: sql`excluded.name`,
        isEnabled: true,
        businessType: sql`excluded.business_type`,
        updatedAt: new Date(),
      },
    })

  return { insertedOrUpdated: values.length }
}

export const findCourierProviderInDb = async (courierIds: number[]) => {
  if (!courierIds.length) return []
  return db
    .select({
      courier_id: couriers.id,
      courier_name: couriers.name,
      provider: couriers.serviceProvider,
      isEnabled: couriers.isEnabled,
    })
    .from(couriers)
    .where(and(inArray(couriers.id, courierIds), eq(couriers.serviceProvider, 'shipmozo')))
}
