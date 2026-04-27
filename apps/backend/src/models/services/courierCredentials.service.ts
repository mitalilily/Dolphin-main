import { eq } from 'drizzle-orm'
import { db } from '../client'
import { courierCredentials } from '../schema/courierCredentials'
import { KNOWN_COURIER_PROVIDERS, type KnownCourierProvider } from '../../constants/courierProviders'

export type BusinessType = 'b2b' | 'b2c'
export type ServiceProviderId = KnownCourierProvider

export type DelhiveryConfig = {
  apiKey?: string
  clientName?: string
  ltlToken?: string
  ltlUsername?: string
  ltlEmail?: string
  ltlPassword?: string
}

export type XpressbeesConfig = {
  apiBase?: string
  apiToken?: string
  email?: string
  password?: string
}

export type EkartConfig = {
  clientId?: string
  username?: string
  password?: string
  baseApi?: string
  baseAuth?: string
}

export type ShipmozoConfig = {
  apiBase?: string
  publicKey?: string
  privateKey?: string
  username?: string
  password?: string
  defaultWarehouseId?: string
}

export type ShiprocketConfig = {
  apiBase?: string
  username?: string
  password?: string
  defaultPickupLocation?: string
  defaultChannelId?: string
}

export type JuxcargoConfig = {
  apiBase?: string
  apiBaseB2C?: string
  apiBaseB2B?: string
  username?: string
  password?: string
  apiKey?: string
  clientId?: string
}

export type IcarryConfig = {
  apiBase?: string
  username?: string
  apiKey?: string
  password?: string
  clientId?: string
}

export type SmartshipConfig = {
  username?: string
  password?: string
  clientId?: string
  clientSecret?: string
}

export type NimbuspostConfig = {
  email?: string
  password?: string
}

export type ShipwayConfig = {
  username?: string
  password?: string
}

export type CourierConfig =
  | DelhiveryConfig
  | SmartshipConfig
  | NimbuspostConfig
  | ShipwayConfig
  | XpressbeesConfig
  | EkartConfig
  | ShipmozoConfig
  | ShiprocketConfig
  | JuxcargoConfig
  | IcarryConfig

export interface CourierCredentialsUpsertPayload {
  serviceProvider: ServiceProviderId
  b2c?: {
    config?: CourierConfig | null
    sameAsB2b?: boolean
  }
  b2b?: {
    config?: CourierConfig | null
    sameAsB2c?: boolean
  }
}

export interface CourierCredentialsMeta {
  serviceProvider: ServiceProviderId
  b2c: {
    configured: boolean
    sameAsB2b: boolean
    usingEnvFallback: boolean
  }
  b2b: {
    configured: boolean
    sameAsB2c: boolean
    usingEnvFallback: boolean
  }
}

const KNOWN_PROVIDERS: ServiceProviderId[] = [...KNOWN_COURIER_PROVIDERS]
export const DEFAULT_EKART_BASE_URL = 'https://app.elite.ekartlogistics.in'

const hasEnvForProviderAndType = (provider: ServiceProviderId, _type: BusinessType): boolean => {
  if (provider === 'delhivery') {
    return !!(process.env.DELHIVERY_API_KEY || process.env.DELHIVERY_CLIENT_NAME)
  }
  if (provider === 'shipway') {
    return !!(process.env.SHIPWAY_USERNAME || process.env.SHIPWAY_PASSWORD)
  }
  if (provider === 'xpressbees') {
    return !!(
      process.env.XPRESSBEES_API_TOKEN ||
      (process.env.XPRESSBEES_USERNAME && process.env.XPRESSBEES_PASSWORD)
    )
  }
  if (provider === 'ekart') {
    return !!(
      process.env.EKART_CLIENT_ID ||
      process.env.EKART_USERNAME ||
      process.env.EKART_PASSWORD ||
      process.env.EKART_BASE_API ||
      process.env.EKART_BASE_AUTH
    )
  }
  if (provider === 'shipmozo') {
    return !!(
      process.env.SHIPMOZO_PUBLIC_KEY ||
      process.env.SHIPMOZO_PRIVATE_KEY ||
      process.env.SHIPMOZO_USERNAME ||
      process.env.SHIPMOZO_PASSWORD ||
      process.env.SHIPMOZO_API_BASE ||
      process.env.SHIPMOZO_DEFAULT_WAREHOUSE_ID
    )
  }
  if (provider === 'shiprocket') {
    return !!(
      process.env.SHIPROCKET_API_BASE ||
      process.env.SHIPROCKET_EMAIL ||
      process.env.SHIPROCKET_PASSWORD
    )
  }
  if (provider === 'juxcargo') {
    return !!(
      process.env.JUXCARGO_API_BASE ||
      process.env.JUXCARGO_API_BASE_B2C ||
      process.env.JUXCARGO_API_BASE_B2B ||
      process.env.JUXCARGO_USERNAME ||
      process.env.JUXCARGO_PASSWORD ||
      process.env.JUXCARGO_API_KEY ||
      process.env.JUXCARGO_CLIENT_ID
    )
  }
  if (provider === 'icarry') {
    return !!(
      process.env.ICARRY_API_BASE ||
      process.env.ICARRY_USERNAME ||
      process.env.ICARRY_API_KEY ||
      process.env.ICARRY_PASSWORD ||
      process.env.ICARRY_CLIENT_ID
    )
  }
  return false
}

const normalize = (val?: string | null) => String(val || '').trim()

export const normalizeEkartBaseUrl = (value?: string | null) => {
  const normalized = normalize(value).replace(/\/+$/, '')
  if (!normalized) return ''

  if (/^https?:\/\/api\.ekartlogistics\.com$/i.test(normalized)) {
    return DEFAULT_EKART_BASE_URL
  }

  return normalized
}

const buildConfigFromRow = (provider: ServiceProviderId, row: typeof courierCredentials.$inferSelect) => {
  if (provider === 'ekart') {
    const ekartBaseUrl = normalizeEkartBaseUrl(row.apiBase)
    const cfg: EkartConfig = {
      clientId: normalize(row.clientId),
      username: normalize(row.username),
      password: normalize(row.password),
      baseApi: ekartBaseUrl,
      baseAuth: ekartBaseUrl,
    }
    return cfg
  }

  if (provider === 'delhivery') {
    const cfg: DelhiveryConfig = {
      apiKey: normalize(row.apiKey),
      clientName: normalize(row.clientName),
    }
    return cfg
  }

  if (provider === 'shipway') {
    const cfg: ShipwayConfig = {
      username: normalize(row.username),
      password: normalize(row.password),
    }
    return cfg
  }

  if (provider === 'shipmozo') {
    const cfg: ShipmozoConfig = {
      apiBase: normalize(row.apiBase),
      publicKey: normalize(row.clientId),
      privateKey: normalize(row.apiKey),
      username: normalize(row.username),
      password: normalize(row.password),
      defaultWarehouseId: normalize(row.clientName),
    }
    return cfg
  }

  if (provider === 'shiprocket') {
    const cfg: ShiprocketConfig = {
      apiBase: normalize(row.apiBase),
      username: normalize(row.username),
      password: normalize(row.password),
      defaultPickupLocation: normalize(row.clientName),
      defaultChannelId: normalize(row.clientId),
    }
    return cfg
  }

  if (provider === 'juxcargo') {
    const cfg: JuxcargoConfig = {
      apiBase: normalize(row.apiBase),
      username: normalize(row.username),
      password: normalize(row.password),
      apiKey: normalize(row.apiKey),
      clientId: normalize(row.clientId),
    }
    return cfg
  }

  if (provider === 'icarry') {
    const cfg: IcarryConfig = {
      apiBase: normalize(row.apiBase),
      username: normalize(row.username),
      apiKey: normalize(row.apiKey),
      password: normalize(row.password),
      clientId: normalize(row.clientId),
    }
    return cfg
  }

  const cfg: XpressbeesConfig = {
    apiBase: normalize(row.apiBase),
    apiToken: normalize(row.apiKey),
    email: normalize(row.username),
    password: normalize(row.password),
  }
  return cfg
}

const rowHasUsableCredentials = (
  provider: ServiceProviderId,
  row: typeof courierCredentials.$inferSelect,
) => {
  const username = normalize(row.username)
  const password = normalize(row.password)
  const apiKey = normalize(row.apiKey)
  const clientId = normalize(row.clientId)
  const apiBase = normalize(row.apiBase)

  if (provider === 'shiprocket') {
    return Boolean(username && password)
  }

  if (provider === 'shipmozo') {
    return Boolean((clientId && apiKey) || (username && password))
  }

  return Boolean(apiBase || apiKey || clientId || username || password)
}

export const getEffectiveCourierConfig = async <T extends CourierConfig>(
  provider: ServiceProviderId,
  _type: BusinessType,
): Promise<T | null> => {
  let row
  try {
    ;[row] = await db.select().from(courierCredentials).where(eq(courierCredentials.provider, provider))
  } catch (err: any) {
    if (err?.message?.includes('does not exist') || err?.message?.includes('relation') || err?.code === '42P01') {
      console.warn('[getEffectiveCourierConfig] courier_credentials table does not exist, using env fallback', provider)
      return null
    }
    throw err
  }

  if (!row) return null
  if (!rowHasUsableCredentials(provider, row)) return null
  return buildConfigFromRow(provider, row) as T
}

export const upsertCourierCredentials = async (
  payload: CourierCredentialsUpsertPayload,
): Promise<void> => {
  const { serviceProvider, b2c, b2b } = payload
  const mergedConfig = (b2c?.config ?? b2b?.config ?? null) as Record<string, any> | null
  const rawApiBase = (mergedConfig?.baseApi as string) || (mergedConfig?.apiBase as string) || ''
  const normalizedApiBase =
    serviceProvider === 'ekart' ? normalizeEkartBaseUrl(rawApiBase) : normalize(rawApiBase)

  const values: Partial<typeof courierCredentials.$inferInsert> = {
    provider: serviceProvider,
    apiBase: normalizedApiBase,
    clientName: normalize(
      (mergedConfig?.clientName as string) || (mergedConfig?.defaultWarehouseId as string) || '',
    ),
    apiKey: normalize(
      (mergedConfig?.apiKey as string) ||
        (mergedConfig?.apiToken as string) ||
        (mergedConfig?.privateKey as string) ||
        '',
    ),
    clientId: normalize(
      (mergedConfig?.clientId as string) || (mergedConfig?.publicKey as string) || '',
    ),
    username: normalize((mergedConfig?.username as string) || (mergedConfig?.email as string) || ''),
    password: normalize((mergedConfig?.password as string) || ''),
    webhookSecret: normalize((mergedConfig?.webhookSecret as string) || ''),
    updatedAt: new Date(),
  }

  await db
    .insert(courierCredentials)
    .values(values as any)
    .onConflictDoUpdate({
      target: courierCredentials.provider,
      set: {
        ...values,
        updatedAt: new Date(),
      } as any,
    })
}

export const listCourierCredentialsMeta = async (): Promise<CourierCredentialsMeta[]> => {
  let rows: (typeof courierCredentials.$inferSelect)[] = []
  try {
    rows = await db.select().from(courierCredentials)
  } catch (err: any) {
    if (err?.message?.includes('does not exist') || err?.message?.includes('relation') || err?.code === '42P01') {
      return KNOWN_PROVIDERS.map((provider) => ({
        serviceProvider: provider,
        b2c: { configured: false, sameAsB2b: false, usingEnvFallback: hasEnvForProviderAndType(provider, 'b2c') },
        b2b: { configured: false, sameAsB2c: false, usingEnvFallback: hasEnvForProviderAndType(provider, 'b2b') },
      }))
    }
    throw err
  }

  const byProvider = new Map<string, (typeof rows)[number]>()
  for (const row of rows) byProvider.set(row.provider, row)

  return KNOWN_PROVIDERS.map((provider) => {
    const row = byProvider.get(provider)
    const configured = !!row && [row.apiBase, row.clientName, row.apiKey, row.clientId, row.username, row.password].some((v) => normalize(v).length > 0)

    return {
      serviceProvider: provider,
      b2c: {
        configured,
        sameAsB2b: false,
        usingEnvFallback: !configured && hasEnvForProviderAndType(provider, 'b2c'),
      },
      b2b: {
        configured,
        sameAsB2c: false,
        usingEnvFallback: !configured && hasEnvForProviderAndType(provider, 'b2b'),
      },
    }
  })
}
