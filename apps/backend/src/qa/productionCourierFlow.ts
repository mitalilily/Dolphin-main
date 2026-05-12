import * as dotenv from 'dotenv'
import path from 'path'
import axios from 'axios'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '../models/client'
import { b2c_orders } from '../models/schema/b2cOrders'
import { wallets, walletTransactions } from '../models/schema/wallet'
import { createPickupAddressService } from '../models/services/pickupAddresses.service'
import {
  createB2CShipmentService,
  fetchAvailableCouriersWithRates,
  generateManifestService,
  getB2COrdersByUserService,
  trackByAwbService,
} from '../models/services/shiprocket.service'
import { regenerateOrderDocumentsServiceAdmin, getAllOrdersServiceAdmin } from '../models/services/adminOrders.service'
import { applyCancellationRefundOnce } from '../models/services/webhookProcessor'
import { presignDownload } from '../models/services/upload.service'
import { ShiprocketCourierService } from '../models/services/couriers/shiprocket.service'
import { ShipmozoService } from '../models/services/couriers/shipmozo.service'
import { IcarryService } from '../models/services/couriers/icarry.service'
import { TruxcargoService } from '../models/services/couriers/truxcargo.service'
import { getEffectiveCourierConfig, IcarryConfig } from '../models/services/courierCredentials.service'

const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

process.env.SHIPMOZO_ALLOW_LIVE_BOOKING_NON_PROD =
  process.env.SHIPMOZO_ALLOW_LIVE_BOOKING_NON_PROD || 'true'

type ProviderKey = 'shiprocket' | 'shipmozo' | 'icarry' | 'truxcargo'

type CheckResult = {
  provider: ProviderKey
  step: string
  ok: boolean
  message: string
  data?: Record<string, unknown>
}

const allProviders: ProviderKey[] = ['shiprocket', 'shipmozo', 'icarry', 'truxcargo']
const money = (value: unknown) => Number(Number(value ?? 0).toFixed(2))

const getProvidersToRun = (): ProviderKey[] => {
  const requested = String(process.env.COURIER_QA_PROVIDERS || '').trim()
  if (!requested) return allProviders

  const selected = requested
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean) as ProviderKey[]

  const invalid = selected.filter((provider) => !allProviders.includes(provider))
  if (invalid.length) {
    throw new Error(`Invalid COURIER_QA_PROVIDERS value(s): ${invalid.join(', ')}`)
  }

  return Array.from(new Set(selected))
}

const redact = (value: any): any => {
  if (value == null) return value
  if (Array.isArray(value)) return value.map(redact)
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => {
        const lowered = key.toLowerCase()
        if (
          lowered.includes('token') ||
          lowered.includes('key') ||
          lowered.includes('password') ||
          lowered.includes('authorization')
        ) {
          return [key, nested ? '[redacted]' : nested]
        }
        return [key, redact(nested)]
      }),
    )
  }
  if (typeof value === 'string' && value.length > 240) return `${value.slice(0, 240)}...`
  return value
}

const alphaSuffix = () => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  return Array.from({ length: 6 }, (_, index) => letters[(Date.now() + index * 7) % letters.length]).join('')
}

const pushResult = (
  results: CheckResult[],
  provider: ProviderKey,
  step: string,
  ok: boolean,
  message: string,
  data?: Record<string, unknown>,
) => {
  const result = { provider, step, ok, message, ...(data ? { data: redact(data) } : {}) }
  results.push(result)
  console.log(`[Courier QA] ${provider}.${step}: ${ok ? 'PASS' : 'FAIL'} - ${message}`)
  if (data) console.log(JSON.stringify(redact(data), null, 2))
}

const runStep = async (
  results: CheckResult[],
  provider: ProviderKey,
  step: string,
  fn: () => Promise<Record<string, unknown> | void>,
) => {
  try {
    const data = (await fn()) || {}
    pushResult(results, provider, step, true, 'OK', data)
    return data
  } catch (error: any) {
    pushResult(results, provider, step, false, error?.message || String(error))
    return null
  }
}

const getQaUserId = async () => {
  const explicit = String(process.env.COURIER_QA_USER_ID || '').trim()
  if (explicit) return explicit

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.currency, 'INR'))
    .orderBy(desc(wallets.balance))
    .limit(1)

  if (!wallet?.userId) throw new Error('No wallet user found for courier QA')
  if (Number(wallet.balance ?? 0) < 300) {
    throw new Error(`Courier QA needs a wallet with at least INR 300. Highest balance is ${wallet.balance}.`)
  }
  return wallet.userId
}

const getWalletSnapshot = async (userId: string) => {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1)
  if (!wallet) throw new Error(`Wallet not found for ${userId}`)
  return { id: wallet.id, balance: Number(wallet.balance ?? 0), currency: wallet.currency || 'INR' }
}

const getOrder = async (orderNumber: string) => {
  const [order] = await db
    .select()
    .from(b2c_orders)
    .where(eq(b2c_orders.order_number, orderNumber))
    .limit(1)
  if (!order) throw new Error(`Order not found locally: ${orderNumber}`)
  return order
}

const getOrderWalletSummary = async (walletId: string, orderId: string) => {
  const txns = await db
    .select()
    .from(walletTransactions)
    .where(and(eq(walletTransactions.wallet_id, walletId), eq(walletTransactions.ref, orderId)))
  return {
    debit: txns.filter((txn) => txn.type === 'debit').reduce((sum, txn) => sum + Number(txn.amount), 0),
    credit: txns.filter((txn) => txn.type === 'credit').reduce((sum, txn) => sum + Number(txn.amount), 0),
    transactions: txns.map((txn) => ({
      type: txn.type,
      amount: Number(txn.amount),
      reason: txn.reason,
    })),
  }
}

const assertPdf = async (value: string | null | undefined, label: string) => {
  const raw = String(value || '').trim()
  if (!raw) throw new Error(`${label} is empty`)
  if (/^data:application\/pdf;base64,/i.test(raw)) {
    const buffer = Buffer.from(raw.split(',')[1] || '', 'base64')
    if (!buffer.subarray(0, 4).equals(Buffer.from('%PDF'))) throw new Error(`${label} is not a PDF`)
    return { mode: 'inline', bytes: buffer.length }
  }
  if (/^https?:\/\//i.test(raw)) {
    return { mode: 'url', bytes: 0 }
  }
  const signed = await presignDownload(raw, {
    contentType: 'application/pdf',
    disposition: 'inline',
    downloadName: `${label}.pdf`,
  })
  const url = Array.isArray(signed) ? signed[0] : signed
  if (!url) throw new Error(`${label} signed download URL is empty`)
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
  const buffer = Buffer.from(response.data)
  if (!buffer.subarray(0, 4).equals(Buffer.from('%PDF'))) throw new Error(`${label} download is not a PDF`)
  return { mode: 'r2', bytes: buffer.length }
}

const pickCourier = async (provider: ProviderKey, userId: string) => {
  const rateResponse = await fetchAvailableCouriersWithRates(
    {
      origin: 122003,
      source_pincode: 122003,
      destination: 110001,
      destination_pincode: 110001,
      payment_type: 'prepaid',
      order_amount: 100,
      weight: 500,
      length: 10,
      breadth: 10,
      height: 10,
      shipment_type: 'b2c',
      service_providers: [provider],
      isCalculator: true,
    },
    userId,
  )

  const couriers = Array.isArray((rateResponse as any)?.couriers)
    ? (rateResponse as any).couriers
    : Array.isArray(rateResponse)
      ? rateResponse
      : []

  const exact = couriers.filter((courier: any) => {
    const serviceProvider = String(courier.serviceProvider || courier.service_provider || courier.integration_type || '')
      .trim()
      .toLowerCase()
    return serviceProvider === provider
  })
  const selected =
    exact.find((courier: any) => courier?.localRates?.forward) ||
    couriers.find((courier: any) => courier?.localRates?.forward) ||
    exact[0] ||
    couriers[0]
  if (!selected?.id) throw new Error(`No serviceable courier returned for ${provider}`)

  const localForwardRate = selected?.localRates?.forward
  if (!localForwardRate) {
    throw new Error(`No Dolphin forward rate card returned for ${provider} courier ${selected.id}`)
  }

  const charge = money(localForwardRate.rate ?? selected.rate)
  if (!Number.isFinite(charge) || charge <= 0) {
    throw new Error(`Invalid Dolphin forward rate for ${provider} courier ${selected.id}`)
  }

  const selectedRate = money(selected.rate)
  if (selectedRate > 0 && Math.abs(selectedRate - charge) > 0.01) {
    throw new Error(
      `Selectable courier rate does not match Dolphin rate card for ${provider}: card=${charge}, selected=${selectedRate}`,
    )
  }

  const providerCost = await resolveProviderCost(provider)
  const otherCharges = money(localForwardRate.other_charges)
  const codCharges = money(localForwardRate.cod_charges)

  return {
    id: Number(selected.id),
    name: String(selected.name || selected.courier_name || selected.courier_partner || provider),
    charge,
    otherCharges,
    codCharges,
    providerCost,
    rawCount: couriers.length,
    rateCard: {
      rate: charge,
      otherCharges,
      codCharges,
      maxSlabWeight: selected.max_slab_weight ?? localForwardRate.max_slab_weight ?? null,
    },
  }
}

const resolveProviderCost = async (provider: ProviderKey) => {
  if (provider === 'icarry') {
    const estimate = await new IcarryService().getEstimateSingleShipment({
      length: 10,
      breadth: 10,
      height: 10,
      weight: 500,
      destination_pincode: '110001',
      origin_pincode: '122003',
      destination_country_code: 'IN',
      origin_country_code: 'IN',
      shipment_mode: 'S',
      shipment_type: 'P',
      shipment_value: 100,
    })
    const row = Array.isArray((estimate as any)?.estimate) ? (estimate as any).estimate[0] : null
    return Number(row?.courier_cost ?? 0) || 0
  }
  if (provider === 'shipmozo') return 33.04
  if (provider === 'truxcargo') return 10
  return 0
}

const buildShipmentPayload = ({
  provider,
  orderNumber,
  pickupName,
  courier,
  appPickupAddressId,
  icarryPickupAddressId,
}: {
  provider: ProviderKey
  orderNumber: string
  pickupName: string
  courier: { id: number; name: string; charge: number; otherCharges: number; codCharges: number; providerCost: number }
  appPickupAddressId: string
  icarryPickupAddressId?: number | null
}) => ({
  order_number: orderNumber,
  payment_type: 'prepaid',
  integration_type: provider,
  courier_id: courier.id,
  courier_partner: courier.name,
  courier_cost: courier.providerCost,
  freight_charges: courier.charge,
  shipping_charges: courier.charge,
  other_charges: courier.otherCharges,
  cod_charges: 0,
  order_amount: 100,
  prepaid_amount: '0',
  package_weight: 500,
  weight: 500,
  package_length: 10,
  package_breadth: 10,
  package_height: 10,
  length: 10,
  breadth: 10,
  height: 10,
  order_date: new Date().toISOString().slice(0, 10),
  invoice_number: `${orderNumber}-INV`,
  invoice_date: new Date().toISOString().slice(0, 10),
  invoice_amount: 100,
  pickup_location_alias: pickupName,
  pickup_location_id: appPickupAddressId,
  pickup_address_id: provider === 'icarry' && icarryPickupAddressId ? icarryPickupAddressId : undefined,
  origin: 122003,
  source_pincode: 122003,
  pickup_pincode: 122003,
  destination: 110001,
  destination_pincode: 110001,
  consignee: {
    name: 'Courier QA Buyer',
    address: 'Connaught Place',
    address_2: 'Near Block A',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    pincode: '110001',
    phone: '9876543210',
    email: 'qa.buyer@example.com',
  },
  pickup: {
    warehouse_name: pickupName,
    name: 'Courier QA Pickup',
    address: '1900 GF, Sector 45',
    address_2: 'Near Huda City Centre',
    city: 'Gurgaon',
    state: 'Haryana',
    country: 'India',
    pincode: '122003',
    phone: '9876543210',
    addressNickname: pickupName,
  },
  rto: {
    warehouse_name: pickupName,
    name: 'Courier QA Pickup',
    address: '1900 GF, Sector 45',
    address_2: 'Near Huda City Centre',
    city: 'Gurgaon',
    state: 'Haryana',
    country: 'India',
    pincode: '122003',
    phone: '9876543210',
    addressNickname: pickupName,
  },
  company: { name: 'Dolphin QA', gst: '' },
  order_items: [
    {
      name: 'QA Test Product',
      sku: `QA-${provider}`,
      qty: 1,
      quantity: 1,
      price: 100,
      hsn: '6201',
      hsnCode: '6201',
      discount: 0,
      tax_rate: 0,
    },
  ],
})

const createAppPickupAddress = async (userId: string, pickupName: string) => {
  return createPickupAddressService(
    {
      isPrimary: false,
      isPickupEnabled: true,
      pickup: {
        contactName: 'Courier QA Pickup',
        contactPhone: '9876543210',
        contactEmail: 'qa.pickup@example.com',
        addressLine1: '1900 GF, Sector 45',
        addressLine2: 'Near Huda City Centre',
        landmark: 'Sector 45',
        addressNickname: pickupName,
        city: 'Gurgaon',
        state: 'Haryana',
        country: 'India',
        pincode: '122003',
        latitude: '0',
        longitude: '0',
      },
    },
    userId,
  )
}

const verifyWarehouse = async (provider: ProviderKey, pickupName: string) => {
  if (provider === 'shiprocket') {
    const response = await new ShiprocketCourierService().getPickupLocations()
    const rows = response?.data?.shipping_address || response?.shipping_address || []
    return { exists: rows.some((row: any) => String(row.pickup_location || '').toLowerCase() === pickupName.toLowerCase()) }
  }
  if (provider === 'shipmozo') {
    const response = await new ShipmozoService().getWarehouses()
    const rows = Array.isArray(response?.data) ? response.data : []
    return {
      exists: rows.some((row: any) =>
        [row?.address_title, row?.name].some(
          (value) => String(value || '').trim().toLowerCase() === pickupName.toLowerCase(),
        ),
      ),
    }
  }
  if (provider === 'truxcargo') {
    const response = await new TruxcargoService().getWarehousePoints({})
    const rows = Array.isArray(response?.data?.info) ? response.data.info : []
    return {
      exists: rows.some((row: any) =>
        [row?.warehouse, row?.name].some(
          (value) => String(value || '').trim().toLowerCase() === pickupName.toLowerCase(),
        ),
      ),
    }
  }
  return { exists: true, note: 'iCarry does not expose a pickup-address listing in this integration' }
}

const resolveIcarryPickupAddressId = async (pickupName: string) => {
  const cfg = await getEffectiveCourierConfig<IcarryConfig>('icarry', 'b2c')
  const configured = Number(cfg?.clientId || process.env.ICARRY_PICKUP_ADDRESS_ID || 0)
  if (Number.isFinite(configured) && configured > 0) return configured

  const response = await new IcarryService().addPickupAddress({
    nickname: `${pickupName}I`.replace(/[^A-Za-z]/g, '').slice(0, 24),
    name: 'Courier QA Pickup',
    email: 'qa.pickup@example.com',
    phone: '9876543210',
    street1: '1900 GF, Sector 45',
    street2: 'Near Huda City Centre',
    locality: 'Sector 45',
    city: 'Gurgaon',
    pincode: '122003',
    zone_id: Number(process.env.ICARRY_PICKUP_ZONE_ID || process.env.ICARRY_TEST_PICKUP_ZONE_ID || 1489),
    country_id: '99',
  })
  const id = Number((response as any)?.warehouse_id || (response as any)?.data?.warehouse_id || 0)
  if (!Number.isFinite(id) || id <= 0) throw new Error('iCarry pickup address id could not be resolved')
  return id
}

const runOrderFlow = async ({
  provider,
  userId,
  pickupName,
  appPickupAddressId,
  role,
  icarryPickupAddressId,
}: {
  provider: ProviderKey
  userId: string
  pickupName: string
  appPickupAddressId: string
  role: 'main' | 'cancel'
  icarryPickupAddressId?: number | null
}) => {
  const courier = await pickCourier(provider, userId)
  const orderNumber = `QA-${provider.toUpperCase()}-${role.toUpperCase()}-${Date.now()}`
  await createB2CShipmentService(
    buildShipmentPayload({
      provider,
      orderNumber,
      pickupName,
      courier,
      appPickupAddressId,
      icarryPickupAddressId,
    }) as any,
    userId,
    false,
  )
  const order = await getOrder(orderNumber)
  return { order, courier }
}

const manifestAndRefresh = async (order: any, userId: string) => {
  const ref = String(order.awb_number || order.order_number || '').trim()
  const manifest = await generateManifestService({ awbs: [ref], type: 'b2c', userId })
  const fresh = await getOrder(order.order_number)
  if (!String(fresh.awb_number || '').trim()) {
    throw new Error(`Manifest completed but AWB is still missing for ${fresh.order_number}`)
  }
  return { manifest, order: fresh }
}

const verifyAppSync = async (userId: string, orderNumber: string) => {
  const clientResult = await getB2COrdersByUserService(userId, 1, 5, { search: orderNumber })
  const adminResult = await getAllOrdersServiceAdmin({ page: 1, limit: 5, filters: { search: orderNumber } as any })
  return {
    clientFound: (clientResult.orders || []).some((order: any) => order.order_number === orderNumber),
    adminFound: (adminResult.orders || []).some((order: any) => order.order_number === orderNumber),
  }
}

const cancelProviderOrder = async (provider: ProviderKey, order: any) => {
  if (provider === 'shiprocket') {
    return new ShiprocketCourierService().cancelShipmentByAwbs({ awbs: [order.awb_number] })
  }
  if (provider === 'shipmozo') {
    return new ShipmozoService().cancelOrder({
      order_id: order.shipment_id || order.order_number,
      awb_number: order.awb_number,
    })
  }
  if (provider === 'truxcargo') {
    return new TruxcargoService().cancelOrder({ waybill: order.awb_number })
  }
  return new IcarryService().cancelShipment({ shipment_id: Number(order.shipment_id || order.awb_number) })
}

const cancelAndRefund = async (provider: ProviderKey, order: any) => {
  const providerResponse = await cancelProviderOrder(provider, order)
  let refunded = 0
  await db.transaction(async (tx) => {
    const [fresh] = await tx.select().from(b2c_orders).where(eq(b2c_orders.id, order.id)).limit(1)
    await tx
      .update(b2c_orders)
      .set({ order_status: 'cancelled', updated_at: new Date() })
      .where(eq(b2c_orders.id, order.id))
    refunded = await applyCancellationRefundOnce(tx, fresh || order, 'courier_qa')
  })
  return { providerResponse, refunded }
}

async function main() {
  const results: CheckResult[] = []
  const providers = getProvidersToRun()
  const userId = await getQaUserId()
  const beforeWallet = await getWalletSnapshot(userId)
  const pickupName = `QAPickup${alphaSuffix()}`
  const icarryPickupAddressId = await resolveIcarryPickupAddressId(pickupName)
  let appPickupAddressId = ''

  console.log('[Courier QA] Starting production courier flow')
  console.log(JSON.stringify({ userId, walletBefore: beforeWallet.balance, pickupName }, null, 2))

  await runStep(results, 'shiprocket', 'credentials', async () => ({ walletUser: userId }))
  await runStep(results, 'shiprocket', 'create-pickup-address', async () => {
    const created = await createAppPickupAddress(userId, pickupName)
    appPickupAddressId = created.id
    return { pickupName, appPickupAddressId }
  })

  if (!appPickupAddressId) throw new Error('App pickup address was not created')

  for (const provider of providers) {
    await runStep(results, provider, 'warehouse-exists', async () => {
      const verification = await verifyWarehouse(provider, pickupName)
      if (!verification.exists) throw new Error(`${provider} warehouse/pickup was not found`)
      return verification
    })

    let mainOrder: any = null
    let mainCourier: any = null
    await runStep(results, provider, 'rate-calculator', async () => {
      const courier = await pickCourier(provider, userId)
      return courier
    })

    const booked = await runStep(results, provider, 'book-prepaid-order', async () => {
      const created = await runOrderFlow({
        provider,
        userId,
        pickupName,
        appPickupAddressId,
        role: 'main',
        icarryPickupAddressId,
      })
      mainOrder = created.order
      mainCourier = created.courier
      return {
        orderNumber: mainOrder.order_number,
        orderId: mainOrder.id,
        awb: mainOrder.awb_number || null,
        shipmentId: mainOrder.shipment_id || null,
        status: mainOrder.order_status,
        dolphinRate: mainCourier.charge,
        dolphinOtherCharges: mainCourier.otherCharges,
      }
    })
    if (!booked || !mainOrder) continue

    await runStep(results, provider, 'manifest', async () => {
      const manifested = await manifestAndRefresh(mainOrder, userId)
      mainOrder = manifested.order
      return {
        manifestKey: manifested.manifest.manifest_key,
        awb: mainOrder.awb_number,
        status: mainOrder.order_status,
      }
    })

    await runStep(results, provider, 'client-admin-sync', async () => {
      const sync = await verifyAppSync(userId, mainOrder.order_number)
      if (!sync.clientFound || !sync.adminFound) throw new Error('Order missing from client or admin query')
      return sync
    })

    await runStep(results, provider, 'label-invoice-download', async () => {
      const docs = await regenerateOrderDocumentsServiceAdmin({
        orderId: mainOrder.id,
        regenerateLabel: true,
        regenerateInvoice: true,
      })
      const label = await assertPdf(docs.label, `${provider}-label`)
      const invoice = await assertPdf(docs.invoice_link, `${provider}-invoice`)
      return { label, invoice }
    })

    await runStep(results, provider, 'tracking', async () => {
      const fresh = await getOrder(mainOrder.order_number)
      const tracking = await trackByAwbService(String(fresh.awb_number || ''))
      return {
        awb: fresh.awb_number,
        status: (tracking as any)?.status || (tracking as any)?.current_status || 'tracked',
      }
    })

    await runStep(results, provider, 'wallet-debit', async () => {
      const freshOrder = await getOrder(mainOrder.order_number)
      mainOrder = freshOrder
      const freightCharges = money(freshOrder.freight_charges)
      const otherCharges = money(freshOrder.other_charges)
      const expectedDebit = money(freightCharges + otherCharges)
      if (Math.abs(freightCharges - money(mainCourier.charge)) > 0.01) {
        throw new Error(
          `Order freight ${freightCharges} does not match Dolphin rate card ${mainCourier.charge}`,
        )
      }
      if (Math.abs(otherCharges - money(mainCourier.otherCharges)) > 0.01) {
        throw new Error(
          `Order other_charges ${otherCharges} does not match Dolphin rate card ${mainCourier.otherCharges}`,
        )
      }
      const walletSummary = await getOrderWalletSummary(beforeWallet.id, mainOrder.id)
      if (walletSummary.debit <= 0) throw new Error('No wallet debit found for order')
      if (Math.abs(money(walletSummary.debit) - expectedDebit) > 0.01) {
        throw new Error(`Wallet debit ${walletSummary.debit} does not match Dolphin bill ${expectedDebit}`)
      }
      if (
        money(mainCourier.providerCost) > 0 &&
        Math.abs(money(walletSummary.debit) - money(mainCourier.providerCost)) <= 0.01 &&
        Math.abs(expectedDebit - money(mainCourier.providerCost)) > 0.01
      ) {
        throw new Error('Wallet debit matched provider cost instead of Dolphin rate card bill')
      }
      return {
        ...walletSummary,
        expectedDebit,
        freightCharges,
        otherCharges,
        providerCost: money(mainCourier.providerCost),
      }
    })

    let cancelOrder: any = null
    await runStep(results, provider, 'book-cancel-test-order', async () => {
      const created = await runOrderFlow({
        provider,
        userId,
        pickupName,
        appPickupAddressId,
        role: 'cancel',
        icarryPickupAddressId,
      })
      cancelOrder = created.order
      const manifested = await manifestAndRefresh(cancelOrder, userId)
      cancelOrder = manifested.order
      return {
        orderNumber: cancelOrder.order_number,
        orderId: cancelOrder.id,
        awb: cancelOrder.awb_number,
        status: cancelOrder.order_status,
      }
    })

    if (cancelOrder) {
      await runStep(results, provider, 'cancel-before-pickup-and-refund', async () => {
        const cancelled = await cancelAndRefund(provider, cancelOrder)
        const walletSummary = await getOrderWalletSummary(beforeWallet.id, cancelOrder.id)
        if (walletSummary.credit <= 0) throw new Error('Cancellation did not create a wallet refund')
        return {
          refunded: cancelled.refunded,
          walletSummary,
        }
      })
    }
  }

  const afterWallet = await getWalletSnapshot(userId)
  const failures = results.filter((result) => !result.ok)
  console.log('\n[Courier QA] Summary')
  console.log(JSON.stringify({ walletBefore: beforeWallet.balance, walletAfter: afterWallet.balance, results }, null, 2))

  if (failures.length) {
    throw new Error(`Courier QA failed ${failures.length} checks`)
  }
}

main().catch((error: any) => {
  console.error('[Courier QA] Fatal:', error?.message || error)
  process.exit(1)
})
