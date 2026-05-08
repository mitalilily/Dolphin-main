// services/pickupAddresses.service.ts
import { and, asc, desc, eq, ilike, ne, or, sql } from 'drizzle-orm'
import { CreatePickupDto, HydratedPickupAddress, UpdatePickupDto } from '../../types/generic.types'
import { db } from '../client'
import { addresses, pickupAddresses } from '../schema/pickupAddresses'
import { DelhiveryService } from './couriers/delhivery.service'
import { EkartService } from './couriers/ekart.service'
import { IcarryService } from './couriers/icarry.service'
import { ShipmozoService } from './couriers/shipmozo.service'
import { ShiprocketCourierService } from './couriers/shiprocket.service'
import { TruxcargoService } from './couriers/truxcargo.service'
import {
  DelhiveryConfig,
  EkartConfig,
  getEffectiveCourierConfig,
} from './courierCredentials.service'

function parseCoordinate(value: string | null | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getDelhiveryErrorText(rawError: any): string {
  return String(rawError?.error?.[0] || rawError?.detail || rawError?.message || '').toLowerCase()
}

type AddressRow = typeof addresses.$inferSelect

type WarehouseSyncResult = {
  provider: string
  ok: boolean
  skipped?: boolean
  message?: string
  providerWarehouseId?: string | number | null
}

const toWarehouseName = (pickup: AddressRow) =>
  String(pickup.addressNickname || pickup.contactName || `warehouse-${pickup.id}`).trim()

const toPhoneDigits = (value?: string | null) => String(value || '').replace(/\D/g, '')

const toTenDigitPhone = (value?: string | null) => toPhoneDigits(value).slice(-10)

const toPositiveInteger = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null
}

const toAlphaNickname = (pickup: AddressRow) => {
  const base = toWarehouseName(pickup).replace(/[^A-Za-z]/g, '').slice(0, 24)
  if (base) return base

  const fallback = String(pickup.id || Date.now())
    .replace(/[^a-fA-F0-9]/g, '')
    .slice(0, 8)
  const letters = fallback
    .split('')
    .map((char) => String.fromCharCode(65 + (parseInt(char, 16) % 26)))
    .join('')
  return `Pickup${letters || 'Warehouse'}`
}

const getIcarryZoneId = () =>
  toPositiveInteger(process.env.ICARRY_PICKUP_ZONE_ID || process.env.ICARRY_TEST_PICKUP_ZONE_ID) ||
  1489

const extractShipmozoWarehouseId = (response: any) =>
  response?.data?.warehouse_id ?? response?.warehouse_id ?? response?.data?.id ?? response?.id ?? null

const extractIcarryWarehouseId = (response: any) =>
  response?.warehouse_id ??
  response?.data?.warehouse_id ??
  response?.id ??
  response?.data?.id ??
  null

const extractTruxcargoWarehouseId = (response: any) =>
  response?.data?.data?.warehouse_id ??
  response?.data?.data?.id ??
  response?.data?.id ??
  response?.data?.warehouse_id ??
  response?.warehouse_id ??
  response?.id ??
  null

const hasConfiguredDelhiveryWarehouse = async () => {
  try {
    const cfg = await getEffectiveCourierConfig<DelhiveryConfig>('delhivery', 'b2c')
    return Boolean(cfg?.apiKey || process.env.DELHIVERY_API_KEY)
  } catch (err: any) {
    console.warn('[PickupWarehouseSync] Delhivery credential lookup failed', err?.message || err)
    return Boolean(process.env.DELHIVERY_API_KEY)
  }
}

const hasConfiguredEkartWarehouse = async () => {
  try {
    const cfg = await getEffectiveCourierConfig<EkartConfig>('ekart', 'b2c')
    return Boolean(
      (cfg?.clientId || process.env.EKART_CLIENT_ID) &&
        (cfg?.username || process.env.EKART_USERNAME) &&
        (cfg?.password || process.env.EKART_PASSWORD),
    )
  } catch (err: any) {
    console.warn('[PickupWarehouseSync] Ekart credential lookup failed', err?.message || err)
    return Boolean(process.env.EKART_CLIENT_ID && process.env.EKART_USERNAME && process.env.EKART_PASSWORD)
  }
}

async function syncPickupWithCourierWarehouses(
  pickupAddr: AddressRow,
  rtoAddressData: AddressRow,
): Promise<WarehouseSyncResult[]> {
  const results: WarehouseSyncResult[] = []
  const warehouseName = toWarehouseName(pickupAddr)
  const phoneDigits = toTenDigitPhone(pickupAddr.contactPhone)
  const country = pickupAddr.country || 'India'
  const email = pickupAddr.contactEmail || 'warehouse@example.com'
  const geo = {
    lat: parseCoordinate(pickupAddr.latitude, 0),
    lon: parseCoordinate(pickupAddr.longitude, 0),
  }

  const runSync = async (
    provider: string,
    action: () => Promise<{ message?: string; providerWarehouseId?: string | number | null } | void>,
  ) => {
    try {
      const response = await action()
      const result: WarehouseSyncResult = {
        provider,
        ok: true,
        message: response?.message || 'Warehouse synced',
        providerWarehouseId: response?.providerWarehouseId ?? null,
      }
      results.push(result)
      console.log(`[PickupWarehouseSync] ${provider} synced`, result)
    } catch (err: any) {
      const rawError = err?.response?.data ?? err
      const errorText =
        rawError?.error?.[0] ||
        rawError?.detail ||
        rawError?.message ||
        rawError?.data?.message ||
        err?.message ||
        'Warehouse sync failed'

      results.push({
        provider,
        ok: false,
        message: String(errorText),
      })
      console.warn(`[PickupWarehouseSync] ${provider} sync failed`, rawError)

      if (provider === 'delhivery' && typeof errorText === 'string') {
        if (
          errorText.includes('client-warehouse of client') &&
          errorText.toLowerCase().includes('already exists')
        ) {
          const duplicateErr: any = new Error(
            'A pickup location with this nickname already exists. Please choose a different nickname.',
          )
          duplicateErr.code = 'DELHIVERY_WAREHOUSE_NAME_EXISTS'
          duplicateErr.field = 'pickup.addressNickname'
          throw duplicateErr
        }

        if (errorText.toLowerCase().includes('serviceability')) {
          const serviceabilityErr: any = new Error(
            'This pickup pincode is not serviceable for pickups. Please use a different pincode.',
          )
          serviceabilityErr.code = 'PICKUP_PIN_NOT_SERVICEABLE'
          serviceabilityErr.field = 'pickup.pincode'
          throw serviceabilityErr
        }
      }
    }
  }

  const skipSync = (provider: string, message: string) => {
    const result: WarehouseSyncResult = { provider, ok: true, skipped: true, message }
    results.push(result)
    console.log(`[PickupWarehouseSync] ${provider} skipped`, result)
  }

  if (await hasConfiguredDelhiveryWarehouse()) {
    await runSync('delhivery', async () => {
      const delhivery = new DelhiveryService()
      const response = await delhivery.createWarehouse({
        name: warehouseName,
        registered_name: 'Dolphin',
        phone: pickupAddr.contactPhone,
        email: pickupAddr.contactEmail ?? '',
        address: pickupAddr.addressLine1,
        city: pickupAddr.city,
        pin: pickupAddr.pincode.toString(),
        country,
        return_address: rtoAddressData.addressLine1 ?? pickupAddr.addressLine1,
        return_city: rtoAddressData.city ?? pickupAddr.city,
        return_pin: rtoAddressData.pincode?.toString() ?? pickupAddr.pincode?.toString(),
        return_state: rtoAddressData.state ?? pickupAddr.state,
        return_country: 'India',
      })

      if (!response || response.success === false) {
        const errorToThrow: any = new Error('Delhivery warehouse registration failed')
        errorToThrow.code = 'DELHIVERY_WAREHOUSE_GENERAL_ERROR'
        throw errorToThrow
      }

      return { message: 'Delhivery warehouse registered' }
    })
  } else {
    skipSync('delhivery', 'Delhivery credentials are not configured')
  }

  if (await hasConfiguredEkartWarehouse()) {
    await runSync('ekart', async () => {
      const ekart = new EkartService()
      await ekart.createWarehouse({
        alias: warehouseName,
        contactName: pickupAddr.contactName || 'Dolphin',
        phone: Number(phoneDigits) || 0,
        email,
        addressLine1: pickupAddr.addressLine1,
        addressLine2: pickupAddr.addressLine2 || '',
        city: pickupAddr.city,
        state: pickupAddr.state,
        pincode: Number(pickupAddr.pincode) || 0,
        country: country.toUpperCase(),
        geo,
        returnAddress: {
          contactName: rtoAddressData.contactName || pickupAddr.contactName || 'Dolphin',
          phone: Number(toTenDigitPhone(rtoAddressData.contactPhone) || phoneDigits) || 0,
          addressLine1: rtoAddressData.addressLine1 || pickupAddr.addressLine1,
          addressLine2: rtoAddressData.addressLine2 || pickupAddr.addressLine2 || '',
          city: rtoAddressData.city || pickupAddr.city,
          state: rtoAddressData.state || pickupAddr.state,
          pincode: Number(rtoAddressData.pincode || pickupAddr.pincode) || 0,
          country: (rtoAddressData.country || country).toUpperCase(),
          geo,
        },
      })
      return { message: 'Ekart warehouse registered' }
    })
  } else {
    skipSync('ekart', 'Ekart credentials are not configured')
  }

  await runSync('shiprocket', async () => {
    const shiprocket = new ShiprocketCourierService()
    const pickupLocations = await shiprocket.getPickupLocations()
    const existingLocations = Array.isArray(pickupLocations?.data?.shipping_address)
      ? pickupLocations.data.shipping_address
      : Array.isArray(pickupLocations?.shipping_address)
        ? pickupLocations.shipping_address
        : []

    const existing = existingLocations.find(
      (location: any) =>
        String(location?.pickup_location || '').trim().toLowerCase() ===
        warehouseName.toLowerCase(),
    )

    if (existing) {
      return {
        message: 'Shiprocket pickup location already exists',
        providerWarehouseId: existing.id ?? null,
      }
    }

    const response = await shiprocket.addPickupLocation({
      pickup_location: warehouseName,
      name: pickupAddr.contactName || 'Dolphin',
      email,
      phone: phoneDigits || pickupAddr.contactPhone,
      address: pickupAddr.addressLine1,
      address_2: pickupAddr.addressLine2 || '',
      city: pickupAddr.city,
      state: pickupAddr.state,
      country,
      pin_code: pickupAddr.pincode,
    })
    return {
      message: 'Shiprocket pickup location registered',
      providerWarehouseId:
        response?.pickup_id ?? response?.address?.id ?? response?.data?.id ?? response?.id ?? null,
    }
  })

  await runSync('shipmozo', async () => {
    const shipmozo = new ShipmozoService()
    const shipmozoAlternatePhone = toTenDigitPhone(rtoAddressData.contactPhone)
    let existingWarehouse: any = null
    try {
      const warehouseResponse = await shipmozo.getWarehouses()
      const warehouseRows = Array.isArray(warehouseResponse?.data)
        ? warehouseResponse.data
        : Array.isArray(warehouseResponse)
          ? warehouseResponse
          : []
      existingWarehouse = warehouseRows.find((warehouse: any) => {
        const title = String(warehouse?.address_title || '').trim().toLowerCase()
        const name = String(warehouse?.name || '').trim().toLowerCase()
        return title === warehouseName.toLowerCase() || name === warehouseName.toLowerCase()
      })
    } catch (err: any) {
      console.warn('[PickupWarehouseSync] Shipmozo warehouse lookup failed; trying create anyway', err?.message || err)
    }

    if (existingWarehouse) {
      return {
        message: 'Shipmozo warehouse already exists',
        providerWarehouseId: existingWarehouse.id ?? existingWarehouse.warehouse_id ?? null,
      }
    }

    const response = await shipmozo.createWarehouse({
      address_title: warehouseName,
      name: pickupAddr.contactName || warehouseName,
      phone: phoneDigits || pickupAddr.contactPhone,
      ...(shipmozoAlternatePhone && shipmozoAlternatePhone !== phoneDigits
        ? { alternate_phone: shipmozoAlternatePhone }
        : {}),
      email,
      address_line_one: pickupAddr.addressLine1,
      address_line_two: pickupAddr.addressLine2 || '',
      pin_code: Number(pickupAddr.pincode) || pickupAddr.pincode,
    })
    return {
      message: 'Shipmozo warehouse registered',
      providerWarehouseId: extractShipmozoWarehouseId(response),
    }
  })

  await runSync('icarry', async () => {
    const icarry = new IcarryService()
    const response = await icarry.addPickupAddress({
      nickname: toAlphaNickname(pickupAddr),
      name: pickupAddr.contactName || warehouseName,
      email,
      phone: phoneDigits || pickupAddr.contactPhone,
      alt_phone: '',
      street1: pickupAddr.addressLine1,
      street2: pickupAddr.addressLine2 || '',
      locality: pickupAddr.landmark || pickupAddr.city,
      city: pickupAddr.city,
      pincode: pickupAddr.pincode,
      zone_id: getIcarryZoneId(),
      country_id: '99',
    })
    return {
      message: 'iCarry pickup address registered',
      providerWarehouseId: extractIcarryWarehouseId(response),
    }
  })

  await runSync('truxcargo', async () => {
    const truxcargo = new TruxcargoService()
    let existingWarehouse: any = null
    try {
      const warehouseResponse = await truxcargo.getWarehousePoints({})
      const warehouseRows = Array.isArray(warehouseResponse?.data?.info)
        ? warehouseResponse.data.info
        : Array.isArray(warehouseResponse?.data)
          ? warehouseResponse.data
          : Array.isArray(warehouseResponse?.info)
            ? warehouseResponse.info
            : []
      existingWarehouse = warehouseRows.find((warehouse: any) => {
        const providerName = String(warehouse?.warehouse || warehouse?.name || '')
          .trim()
          .toLowerCase()
        return providerName === warehouseName.toLowerCase()
      })
    } catch (err: any) {
      console.warn('[PickupWarehouseSync] Truxcargo warehouse lookup failed; trying create anyway', err?.message || err)
    }

    if (existingWarehouse) {
      return {
        message: 'Truxcargo warehouse already exists',
        providerWarehouseId: existingWarehouse.id ?? existingWarehouse.warehouse_id ?? null,
      }
    }

    const response = await truxcargo.createWarehouse({
      warehouse: warehouseName,
      name: pickupAddr.contactName || warehouseName,
      phone: phoneDigits || pickupAddr.contactPhone,
      email,
      address: pickupAddr.addressLine1,
      address_2: pickupAddr.addressLine2 || '',
      city: pickupAddr.city,
      state: pickupAddr.state,
      pincode: pickupAddr.pincode,
      country,
    })
    return {
      message: 'Truxcargo warehouse registered',
      providerWarehouseId: extractTruxcargoWarehouseId(response),
    }
  })

  results.push({
    provider: 'xpressbees',
    ok: true,
    skipped: true,
    message: 'No warehouse creation API is implemented for Xpressbees in this codebase',
  })
  console.log('[PickupWarehouseSync] Summary', results)

  return results
}

/**
 * Create Pickup + optional RTO
 */

export async function createPickupAddressService(data: CreatePickupDto, userId: string) {
  return await db.transaction(async (txn) => {
    const existing = await txn.query.pickupAddresses.findFirst({
      where: eq(pickupAddresses.userId, userId),
    })

    const isPrimary = !existing

    // ðŸ”¹ Reset existing primary if new one is requested
    if (data.isPrimary && existing) {
      await txn
        .update(pickupAddresses)
        .set({ isPrimary: false })
        .where(eq(pickupAddresses.userId, userId))
    }

    // ðŸ”¹ Insert pickup address
    const [pickupAddr] = await txn
      .insert(addresses)
      .values({
        userId,
        type: 'pickup',
        ...data.pickup,
      })
      .returning()

    // ðŸ”¹ Insert optional RTO address
    let rtoAddressId: string | null = null
    let isRTOSame = true
    let rtoAddressData = pickupAddr

    if (data?.rtoAddress) {
      const [rtoAddr] = await txn
        .insert(addresses)
        .values({
          userId,
          type: 'rto',
          ...data.rtoAddress,
        })
        .returning()
      rtoAddressId = rtoAddr.id
      isRTOSame = false
      rtoAddressData = rtoAddr
    } else {
      rtoAddressId = pickupAddr.id
    }

    // ðŸ”¹ Link in pickup_addresses
    const [created] = await txn
      .insert(pickupAddresses)
      .values({
        userId,
        addressId: pickupAddr.id,
        rtoAddressId,
        isPrimary: data.isPrimary ?? isPrimary,
        isPickupEnabled: data.isPickupEnabled ?? true,
        isRTOSame,
      })
      .returning()

    await syncPickupWithCourierWarehouses(pickupAddr, rtoAddressData)
    return created
  })
}
/**
 * Update Pickup + optional RTO
 */

export async function updatePickupAddressService(
  pickupId: string | null,
  userId: string,
  data: UpdatePickupDto & { id?: string },
) {
  try {
    const targetPickupId = pickupId ?? data.id
    if (!targetPickupId) throw new Error('Pickup ID is required')

    // âœ… Handle primary switch (if making this the new primary)
    if (data.isPrimary) {
      await db
        .update(pickupAddresses)
        .set({ isPrimary: false })
        .where(and(eq(pickupAddresses.userId, userId), ne(pickupAddresses.id, targetPickupId)))
    }

    // âœ… Update pickup record (flags only)
    const [pickup] = await db
      .update(pickupAddresses)
      .set({
        isPrimary: data.isPrimary,
        isPickupEnabled: data.isPickupEnabled ?? true,
      })
      .where(and(eq(pickupAddresses.id, targetPickupId), eq(pickupAddresses.userId, userId)))
      .returning()

    if (!pickup) return null

    // ðŸŸ¡ If only flags are provided (no pickup or RTO details) â€” skip courier syncs
    const onlyFlagsChanged = !data.pickup && !data.rtoAddress
    if (onlyFlagsChanged) {
      console.log('âš™ï¸ Only flags updated (isPrimary/isPickupEnabled). Skipping courier syncs.')
      return pickup
    }

    // âœ… Start transaction for atomic updates
    return await db.transaction(async (txn) => {
      // âœ… Update pickup address itself
      let updatedPickup: any = null
      if (data.pickup && pickup.addressId) {
        const { createdAt, ...safeData } = data.pickup
        const [addr] = await txn
          .update(addresses)
          .set({
            ...safeData,
            updatedAt: new Date(),
          })
          .where(eq(addresses.id, pickup.addressId))
          .returning()
        updatedPickup = addr
      }

      // âœ… Update / Create RTO address
      if (data.rtoAddress) {
        if (pickup.rtoAddressId) {
          const { createdAt, ...safeData } = data?.rtoAddress
          await txn
            .update(addresses)
            .set({ ...safeData, updatedAt: new Date() })
            .where(eq(addresses.id, pickup.rtoAddressId))
        } else {
          const [newRto] = await txn
            .insert(addresses)
            .values({
              userId,
              type: 'rto',
              contactName: data.rtoAddress.contactName!,
              contactPhone: data.rtoAddress.contactPhone!,
              addressLine1: data.rtoAddress.addressLine1!,
              city: data.rtoAddress.city!,
              state: data.rtoAddress.state!,
              country: data.rtoAddress.country ?? 'India',
              pincode: data.rtoAddress.pincode!,
              contactEmail: data.rtoAddress.contactEmail,
              addressLine2: data.rtoAddress.addressLine2,
              landmark: data.rtoAddress.landmark,
              gstNumber: data.rtoAddress.gstNumber,
            })
            .returning()

          await txn
            .update(pickupAddresses)
            .set({ rtoAddressId: newRto.id, isRTOSame: false })
            .where(eq(pickupAddresses.id, targetPickupId))
        }
      }

      // ðŸŸ¢ Sync with Delhivery (only if pickup address actually changed)
      try {
        if (updatedPickup) {
          const delhivery = new DelhiveryService()
          const delhiveryResp = await delhivery.updateWarehouse({
            name:
              updatedPickup?.addressNickname ?? updatedPickup?.contactName ?? 'Default Warehouse',
            address: updatedPickup?.addressLine1,
            pin: updatedPickup?.pincode?.toString(),
            phone: updatedPickup?.contactPhone,
          })

          if (!delhiveryResp || delhiveryResp.success === false) {
            console.error('âŒ Failed to update warehouse in Delhivery:', delhiveryResp)
            throw new Error('Warehouse update failed')
          }

          console.log(`âœ… Warehouse updated in Delhivery: ${updatedPickup?.addressNickname}`)
        } else {
          console.log('â„¹ï¸ No pickup address change detected â€” skipped Delhivery update.')
        }
      } catch (err: any) {
        const rawError = err?.response?.data ?? err
        const errorText = getDelhiveryErrorText(rawError)

        if (
          errorText.includes('invalid token') ||
          errorText.includes('unauthorized') ||
          errorText.includes('forbidden') ||
          errorText.includes('token') ||
          errorText.includes('auth')
        ) {
          console.warn(
            'Delhivery warehouse update skipped due to auth/config issue; local pickup update saved.',
            rawError,
          )
        } else {
          console.warn('Delhivery warehouse update failed; local pickup update saved.', rawError)
        }
      }

      return pickup
    })
  } catch (error) {
    console.error('âŒ Failed to update pickup address:', error)
    throw new Error('Failed to update pickup address')
  }
}

/**
 * Get pickup addresses with hydrated pickup + rto
 */

export async function getPickupAddressesService(
  userId: string,
  filters: Record<string, any> = {},
  page = 1,
  limit = 10,
): Promise<{ data: HydratedPickupAddress[]; totalCount: number }> {
  const conditions: any[] = [eq(pickupAddresses.userId, userId)]

  // âœ… Pickup status filters
  if (filters.isPickupEnabled === 'active')
    conditions.push(eq(pickupAddresses.isPickupEnabled, true))
  if (filters.isPickupEnabled === 'inactive')
    conditions.push(eq(pickupAddresses.isPickupEnabled, false))
  if (filters.isPrimary !== undefined && filters.isPrimary !== '')
    conditions.push(eq(pickupAddresses.isPrimary, filters.isPrimary === 'true'))

  // âœ… Helper for pickup OR rto field
  const pickupOrRto = (field: string, value: string) => {
    const search = `%${value}%`
    return or(
      ilike((addresses as any)[field], search),
      sql<boolean>`EXISTS (
        SELECT 1 FROM addresses rto
        WHERE rto.id = ${pickupAddresses.rtoAddressId}
          AND rto.${sql.identifier(field)} ILIKE ${search}
      )`,
    )
  }

  // âœ… Field-specific filters
  if (filters.name) conditions.push(pickupOrRto('addressNickname', filters.name))
  if (filters.city) conditions.push(pickupOrRto('city', filters.city))
  if (filters.state) conditions.push(pickupOrRto('state', filters.state))
  if (filters.pincode) conditions.push(pickupOrRto('pincode', filters.pincode))

  // âœ… Sorting
  let sortByClause = desc(addresses.createdAt)
  switch (filters.sortBy) {
    case 'oldest':
      sortByClause = asc(addresses.createdAt)
      break
    case 'az':
      sortByClause = asc(addresses.contactName)
      break
    case 'za':
      sortByClause = desc(addresses.contactName)
      break
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // âœ… Count query
  const totalCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(pickupAddresses)
    .innerJoin(addresses, eq(pickupAddresses.addressId, addresses.id))
    .where(whereClause) // safe: Drizzle skips undefined

  const totalCount = Number(totalCountResult[0]?.count ?? 0)

  const offset = (page - 1) * limit

  // âœ… Data query
  const data = await db
    .select({
      pickupId: pickupAddresses.id,
      isPrimary: pickupAddresses.isPrimary,
      isPickupEnabled: pickupAddresses.isPickupEnabled,
      isRTOSame: pickupAddresses.isRTOSame,
      pickup: {
        id: addresses.id,
        userId: addresses.userId,
        type: addresses.type,
        contactName: addresses.contactName,
        contactPhone: addresses.contactPhone,
        addressNickname: addresses.addressNickname,
        contactEmail: addresses.contactEmail,
        addressLine1: addresses.addressLine1,
        addressLine2: addresses.addressLine2,
        landmark: addresses.landmark,
        city: addresses.city,
        state: addresses.state,
        country: addresses.country,
        pincode: addresses.pincode,
        latitude: addresses.latitude,
        longitude: addresses.longitude,
        gstNumber: addresses.gstNumber,
        createdAt: addresses.createdAt,
        updatedAt: addresses.updatedAt,
      },
      rto: sql/*sql*/ `
      CASE 
        WHEN ${pickupAddresses.isRTOSame} = false THEN (
          SELECT row_to_json(a)
          FROM addresses a
          WHERE a.id = ${pickupAddresses.rtoAddressId}
        )
        ELSE NULL
      END
    `.as('rto'),
    })
    .from(pickupAddresses)
    .innerJoin(addresses, eq(pickupAddresses.addressId, addresses.id))
    .where(whereClause)
    .orderBy(sortByClause)
    .limit(limit)
    .offset(offset)

  return { data: data as unknown as HydratedPickupAddress[], totalCount }
}
