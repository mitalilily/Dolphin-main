import https from 'https'
import axios from 'axios'
import { and, count, eq, ilike } from 'drizzle-orm'
import { db } from '../client'
import { locations } from '../schema/locations'

const PINCODE_REGEX = /^[1-9]\d{5}$/
const postalApiAgent = new https.Agent({ rejectUnauthorized: false })

const cleanText = (value: unknown) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()

const normalizePincode = (value: unknown) => cleanText(value).replace(/\D/g, '').slice(0, 6)

const lookupZippopotamPincode = async (pincode: string) => {
  if (!PINCODE_REGEX.test(pincode)) return null

  try {
    const response = await axios.get(`https://api.zippopotam.us/in/${encodeURIComponent(pincode)}`, {
      timeout: 5000,
      headers: { Accept: 'application/json' },
    })
    const place = Array.isArray(response.data?.places) ? response.data.places[0] : null
    const city = cleanText(place?.['place name'] || response.data?.place || response.data?.city)
    const state = cleanText(place?.state || response.data?.state)

    if (!city || !state) return null

    return {
      pincode,
      city,
      state,
      country: 'India',
      tags: ['external_lookup', 'zippopotam'],
    }
  } catch {
    return null
  }
}

const lookupPostalApiPincode = async (pincode: string) => {
  if (!PINCODE_REGEX.test(pincode)) return null

  try {
    const response = await axios.get(`https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`, {
      timeout: 5000,
      headers: { Accept: 'application/json' },
      // Keep this fallback server-side; the public API currently has TLS issues in browsers.
      httpsAgent: postalApiAgent,
    })
    const result = Array.isArray(response.data) ? response.data[0] : null
    const postOffice = Array.isArray(result?.PostOffice) ? result.PostOffice[0] : null
    const city = cleanText(postOffice?.District || postOffice?.Name)
    const state = cleanText(postOffice?.State)

    if (result?.Status !== 'Success' || !city || !state) return null

    return {
      pincode,
      city,
      state,
      country: 'India',
      tags: ['external_lookup', 'india_post'],
    }
  } catch {
    return null
  }
}

const lookupExternalIndianPincode = async (pincode: string) =>
  (await lookupZippopotamPincode(pincode)) ?? (await lookupPostalApiPincode(pincode))

const cacheExternalLocation = async (location: {
  pincode: string
  city: string
  state: string
  country: string
  tags: string[]
}) => {
  const [stored] = await db
    .insert(locations)
    .values(location)
    .onConflictDoUpdate({
      target: locations.pincode,
      set: {
        city: location.city,
        state: location.state,
        country: location.country,
        tags: location.tags,
      },
    })
    .returning()

  return stored
}

export const LocationService = {
  create: async (data: { pincode: string; city: string; state: string; country?: string }) => {
    // Check if a location with the same pincode and city already exists
    const existing = await db
      .select()
      .from(locations)
      .where(
        and(
          eq(locations.pincode, data.pincode),
          eq(locations.city, data.city),
          eq(locations.state, data.state),
          eq(locations.country, data?.country ?? 'India'),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      throw new Error(`Location with pincode ${data.pincode} and city ${data.city} already exists`)
    }

    // Insert new location
    const [location] = await db
      .insert(locations)
      .values({
        ...data,
        country: data.country || 'India',
      })
      .returning()

    return location
  },

  list: async (params: {
    page?: number
    limit?: number
    filters?: { pincode?: string; city?: string; state?: string }
  }) => {
    const page = params.page ?? 1
    const limit = params.limit ?? 20
    const offset = (page - 1) * limit

    const conditions = []
    if (params.filters) {
      const { pincode, city, state } = params.filters
      if (pincode) conditions.push(ilike(locations.pincode, `%${pincode}%`))
      if (city) conditions.push(ilike(locations.city, `%${city}%`))
      if (state) conditions.push(ilike(locations.state, `%${state}%`))
    }

    const data = await db
      .select()
      .from(locations)
      .where(conditions.length ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)

    if (
      data.length === 0 &&
      params.filters?.pincode &&
      !params.filters.city &&
      !params.filters.state
    ) {
      const normalizedPincode = normalizePincode(params.filters.pincode)
      const externalLocation = await lookupExternalIndianPincode(normalizedPincode)
      if (externalLocation) {
        const stored = await cacheExternalLocation(externalLocation)
        data.push(stored)
      }
    }

    const totalRes = await db
      .select({ count: count() })
      .from(locations)
      .where(conditions.length ? and(...conditions) : undefined)

    const total = Number(totalRes[0]?.count ?? 0)
    return { data, total: data.length > total ? data.length : total, page, limit }
  },

  getById: async (id: string) => {
    const [location] = await db.select().from(locations).where(eq(locations.id, id))
    return location
  },

  update: async (
    id: string,
    data: { pincode?: string; city?: string; state?: string; country?: string },
  ) => {
    const updated = await db.update(locations).set(data).where(eq(locations.id, id)).returning()
    return updated[0]
  },

  delete: async (id: string) => {
    const deleted = await db.delete(locations).where(eq(locations.id, id)).returning()
    return deleted[0]
  },
}
