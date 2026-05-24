// services/webhookProcessor.ts
import axios from 'axios'
import dayjs from 'dayjs'
import { and, eq, gt, isNotNull, sql } from 'drizzle-orm'
import { sendWebhookEvent } from '../../services/webhookDelivery.service'
import { db } from '../client'
import { b2c_orders } from '../schema/b2cOrders'
import { invoicePreferences } from '../schema/invoicePreferences'
import { ndr_events } from '../schema/ndr'
import { rto_events } from '../schema/rto'
import { userProfiles } from '../schema/userProfile'
import { wallets, walletTransactions } from '../schema/wallet'
import { createCodRemittance } from './codRemittance.service'
import { extractWeightProofFromWebhook } from './courierProofFetcher.service'
import { DelhiveryService } from './couriers/delhivery.service'
import {
  calculateChargedWeight,
  calculateVolumetricWeight,
} from './courierWeightCalculation.service'
import { generateInvoicePDF } from './invoice.service'
import { recordNdrEvent } from './ndr.service'
import { createNotificationService } from './notifications.service'
import { recordRtoEvent } from './rto.service'
import { logTrackingEvent } from './trackingEvents.service'
import { presignDownload, presignUpload } from './upload.service'
import {
  formatPickupAddress,
  loadInvoiceAssets,
  normalizePickupDetails,
} from './invoiceHelpers'
import { createWalletTransaction } from './wallet.service'
import { createWeightDiscrepancy } from './weightReconciliation.service'
import { resolveInvoiceNumber } from './invoiceNumber.service'
import { syncShopifyStatusForLocalOrder } from './shopify.service'
import { computeB2CFreightForOrder } from './shiprocket.service'
import { generateLabelForOrder } from './generateCustomLabelService'
import { isOrderManifestedForDocuments } from '../../utils/orderSanitizer'

const WEBHOOK_INVOICE_UPLOAD_TIMEOUT_MS = 60000

const normalizeWebhookText = (...parts: unknown[]) =>
  parts
    .map((part) => String(part || '').trim().toLowerCase())
    .filter(Boolean)
    .join(' | ')

const hasNdrSignal = (...parts: unknown[]) => {
  const text = normalizeWebhookText(...parts)
  if (!text) return false

  const ndrMarkers = [
    'ndr',
    'undelivered',
    'not delivered',
    'delivery attempted',
    'attempted',
    'attempt failed',
    'customer not available',
    'consignee not available',
    'future delivery request',
    'future delivery requested',
    'door locked',
    'premises closed',
    'address issue',
    'address incomplete',
    'incorrect address',
    'refused',
    'otp not shared',
    'otp failed',
    'misroute',
    'cod not ready',
    'future delivery date',
    'restricted entry',
    'outofstn',
    'open delivery',
  ]

  return ndrMarkers.some((marker) => text.includes(marker))
}

const normalizeComparableText = (value: unknown) => String(value || '').trim().toLowerCase()

const resolveNdrStatus = (status: unknown, ...signalParts: unknown[]) => {
  const normalizedStatus = normalizeComparableText(status)
  if (normalizedStatus === 'undelivered') return 'undelivered'
  if (normalizedStatus === 'ndr') return 'ndr'

  const signalText = normalizeWebhookText(...signalParts)
  if (signalText.includes('undelivered') || signalText.includes('not delivered')) {
    return 'undelivered'
  }

  return 'ndr'
}

const shouldSkipDuplicateNdrEvent = async (params: {
  orderId: string
  status: string
  reason?: string | null
  remarks?: string | null
  attemptNo?: string | null
  dedupeKey?: string | null
}) => {
  if (params.dedupeKey) {
    const [existingByDedupeKey] = await db
      .select({ id: ndr_events.id })
      .from(ndr_events)
      .where(
        and(
          eq(ndr_events.order_id, params.orderId),
          sql`${ndr_events.payload}->>'__dedupe_key' = ${params.dedupeKey}`,
        ),
      )
      .limit(1)

    if (existingByDedupeKey) return true
  }

  const [latest] = await db
    .select({
      id: ndr_events.id,
      created_at: ndr_events.created_at,
      status: ndr_events.status,
      reason: ndr_events.reason,
      remarks: ndr_events.remarks,
      attempt_no: ndr_events.attempt_no,
    })
    .from(ndr_events)
    .where(eq(ndr_events.order_id, params.orderId))
    .orderBy(sql`${ndr_events.created_at} desc`)
    .limit(1)

  if (!latest?.created_at) return false

  const ageMs = Date.now() - new Date(latest.created_at).getTime()
  const withinDuplicateWindow = ageMs >= 0 && ageMs <= 10 * 60 * 1000
  if (!withinDuplicateWindow) return false

  return (
    normalizeComparableText(latest.status) === normalizeComparableText(params.status) &&
    normalizeComparableText(latest.reason) === normalizeComparableText(params.reason) &&
    normalizeComparableText(latest.remarks) === normalizeComparableText(params.remarks) &&
    normalizeComparableText(latest.attempt_no) === normalizeComparableText(params.attemptNo)
  )
}

const shouldSkipDuplicateRtoEvent = async (params: {
  orderId: string
  status: string
  reason?: string | null
  remarks?: string | null
  dedupeKey?: string | null
}) => {
  if (params.dedupeKey) {
    const [existingByDedupeKey] = await db
      .select({ id: rto_events.id })
      .from(rto_events)
      .where(
        and(
          eq(rto_events.order_id, params.orderId),
          sql`${rto_events.payload}->>'__dedupe_key' = ${params.dedupeKey}`,
        ),
      )
      .limit(1)

    if (existingByDedupeKey) return true
  }

  const [latest] = await db
    .select({
      id: rto_events.id,
      created_at: rto_events.created_at,
      status: rto_events.status,
      reason: rto_events.reason,
      remarks: rto_events.remarks,
    })
    .from(rto_events)
    .where(eq(rto_events.order_id, params.orderId))
    .orderBy(sql`${rto_events.created_at} desc`)
    .limit(1)

  if (!latest?.created_at) return false

  const ageMs = Date.now() - new Date(latest.created_at).getTime()
  const withinDuplicateWindow = ageMs >= 0 && ageMs <= 10 * 60 * 1000
  if (!withinDuplicateWindow) return false

  return (
    normalizeComparableText(latest.status) === normalizeComparableText(params.status) &&
    normalizeComparableText(latest.reason) === normalizeComparableText(params.reason) &&
    normalizeComparableText(latest.remarks) === normalizeComparableText(params.remarks)
  )
}

const captureNdrEventFromWebhook = async (params: {
  order: any
  awbNumber?: string | null
  status?: string | null
  reason?: string | null
  remarks?: string | null
  attemptNo?: string | null
  dedupeKey?: string | null
  payload?: any
  courierLabel: string
  signalParts?: unknown[]
}) => {
  const {
    order,
    awbNumber,
    status,
    reason,
    remarks,
    attemptNo,
    dedupeKey,
    payload,
    courierLabel,
    signalParts = [],
  } = params

  const finalStatus = resolveNdrStatus(status, reason, remarks, ...signalParts)
  const duplicate = await shouldSkipDuplicateNdrEvent({
    orderId: order.id,
    status: finalStatus,
    reason,
    remarks,
    attemptNo,
    dedupeKey,
  })

  if (duplicate) {
    console.log(`ℹ️ Skipping duplicate NDR event for ${courierLabel}`, {
      order_number: order.order_number,
      awb_number: awbNumber || order.awb_number || null,
      status: finalStatus,
    })
    return { skipped: true, status: finalStatus }
  }

  await recordNdrEvent({
    orderId: order.id,
    userId: order.user_id,
    awbNumber: awbNumber || order.awb_number || undefined,
    status: finalStatus,
    reason: reason || null,
    remarks: remarks || null,
    attemptNo: attemptNo || null,
    payload:
      dedupeKey && payload && typeof payload === 'object' && !Array.isArray(payload)
        ? { ...payload, __dedupe_key: dedupeKey }
        : payload,
  })

  await createNotificationService({
    targetRole: 'user',
    userId: order.user_id,
    title: `Delivery attempt issue (${courierLabel})`,
    message: `Order ${order.order_number} marked as ${finalStatus}.`,
  })
  await createNotificationService({
    targetRole: 'admin',
    title: `NDR captured (${courierLabel})`,
    message: `User ${order.user_id} order ${order.order_number} status ${finalStatus}`,
  })

  return { skipped: false, status: finalStatus }
}

// Helper function to generate invoice for an order
const generateInvoiceForOrderWebhook = async (
  order: any,
  tx: any,
): Promise<
  | {
      key: string
      invoiceNumber: string
      invoiceDate: string
      invoiceAmount: number
    }
  | null
> => {
  try {
    // Check if invoice already exists
    if (order.invoice_link) {
      console.log(`ℹ️ Invoice already exists for order ${order.order_number}`)
      return order.invoice_link
    }

    const [prefs] = await tx
      .select()
      .from(invoicePreferences)
      .where(eq(invoicePreferences.userId, order.user_id))

    const [user] = await tx
      .select({
        companyName: sql<string>`(${userProfiles.companyInfo} ->> 'businessName')`,
        brandName: sql<string>`(${userProfiles.companyInfo} ->> 'brandName')`,
        companyGST: sql<string>`(${userProfiles.companyInfo} ->> 'companyGst')`,
        supportEmail: sql<string>`(${userProfiles.companyInfo} ->> 'companyEmail')`,
        supportPhone: sql<string>`(${userProfiles.companyInfo} ->> 'companyContactNumber')`,
        companyLogo: sql<string>`(${userProfiles.companyInfo} ->> 'companyLogoUrl')`,
        companyAddress: sql<string>`(${userProfiles.companyInfo} ->> 'companyAddress')`,
        companyState: sql<string>`(${userProfiles.companyInfo} ->> 'state')`,
        panNumber: sql<string>`(${userProfiles.companyInfo} ->> 'panNumber')`,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, order.user_id))

    const { logoBuffer, signatureBuffer } = await loadInvoiceAssets(
      {
        companyLogoKey: user?.companyLogo,
        includeSignature: prefs?.includeSignature,
        signatureFile: prefs?.signatureFile,
      },
      order.order_number || String(order.id),
    )

    const invoiceNumber = await resolveInvoiceNumber({
      userId: order.user_id,
      existingInvoiceNumber: (order as any)?.invoice_number,
      prefix: prefs?.prefix ?? undefined,
      suffix: prefs?.suffix ?? undefined,
      tx,
    })

    const invoiceDateDisplay = dayjs().format('DD MMM YYYY')
    const invoiceDateStored = dayjs().format('YYYY-MM-DD')

    const invoiceAmount =
      Number(order.order_amount ?? 0) +
      Number(order.shipping_charges ?? 0) + // Already includes other_charges
      Number(order.gift_wrap ?? 0) +
      Number(order.transaction_fee ?? 0) -
      (Number(order.discount ?? 0) + Number(order.prepaid_amount ?? 0))

    const pickupDetails = normalizePickupDetails(order.pickup_details)
    const pickupPincode = pickupDetails?.pincode

    const serviceType =
      order.service_type ||
      (order as any).serviceType ||
      order.integration_type ||
      order.courier_partner ||
      ''
    const pickupAddress = formatPickupAddress(pickupDetails)
    const sellerAddress = pickupAddress || user?.companyAddress || ''
    const sellerStateCode = pickupDetails?.state || user?.companyState || ''
    const sellerName =
      pickupDetails?.warehouse_name || user?.companyName || user?.brandName || 'Seller'
    const brandName =
      user?.brandName ||
      user?.companyName ||
      pickupDetails?.warehouse_name ||
      ''
    const gstNumber = user?.companyGST || ''
    const panNumber = user?.panNumber || ''
    const supportPhone = pickupDetails?.phone || user?.supportPhone || ''
    const supportEmail = user?.supportEmail || prefs?.supportEmail || ''

    const invoiceBuffer = await generateInvoicePDF({
      invoiceNumber,
      invoiceDate: invoiceDateDisplay,
      invoiceAmount,
      buyerName: order.buyer_name,
      buyerPhone: order.buyer_phone,
      buyerEmail: order.buyer_email ?? '',
      buyerAddress: order.address,
      buyerCity: order.city,
      buyerState: order.state,
      buyerPincode: order.pincode,
      products: order.products as any,
      shippingCharges: Number(order.shipping_charges ?? 0),
      giftWrap: Number(order.gift_wrap) ?? 0,
      transactionFee: Number(order.transaction_fee) ?? 0,
      discount: Number(order.discount) ?? 0,
      prepaidAmount: Number(order.prepaid_amount) ?? 0,
      courierName: order.courier_partner ?? '',
      courierId: order.courier_id?.toString() ?? '',
      logoBuffer,
      orderType: order?.order_type as 'prepaid' | 'cod',
      courierCod: order?.order_type === 'cod' ? Number(order?.cod_charges ?? 0) : 0,
      signatureBuffer,
      companyName: sellerName,
      supportEmail,
      supportPhone,
      companyGST: gstNumber,
      sellerName,
      brandName,
      sellerAddress,
      sellerStateCode,
      gstNumber,
      panNumber,
      invoiceNotes: prefs?.invoiceNotes ?? '',
      termsAndConditions: prefs?.termsAndConditions ?? '',
      orderId: order.order_number,
      awbNumber: order.awb_number ?? '',
      courierPartner: order.courier_partner ?? '',
      serviceType,
      pickupPincode: pickupPincode ?? '',
      deliveryPincode: order.pincode ?? '',
      orderDate: order.order_date ?? '',
      rtoCharges: Number((order as any).rto_charges ?? 0),
      layout: (prefs?.template as 'classic' | 'thermal') ?? 'classic',
    })

    const { uploadUrl, key } = await presignUpload({
      filename: `invoice-${order.id}.pdf`,
      contentType: 'application/pdf',
      userId: order.user_id,
      folderKey: 'invoices',
    })
    const finalUploadUrl = Array.isArray(uploadUrl) ? uploadUrl[0] : uploadUrl
    const uploadResponse = await axios.put(finalUploadUrl, invoiceBuffer, {
      headers: { 'Content-Type': 'application/pdf' },
      validateStatus: (status) => status >= 200 && status < 300, // Only accept 2xx status codes
    })

    // Verify upload succeeded
    if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
      throw new Error(`Invoice upload failed with status ${uploadResponse.status}`)
    }

    const finalKey = Array.isArray(key) ? key[0] : key

    // Validate key is not empty and is a string
    if (!finalKey || typeof finalKey !== 'string' || finalKey.trim().length === 0) {
      throw new Error('Invoice key is invalid or empty after upload')
    }

    const trimmedKey = finalKey.trim()
    console.log(
      `✅ Invoice uploaded successfully for order ${order.order_number}: ${trimmedKey} (status: ${uploadResponse.status})`,
    )

    return {
      key: trimmedKey,
      invoiceNumber,
      invoiceDate: invoiceDateStored,
      invoiceAmount,
    }
  } catch (err: any) {
    console.error(
      `⚠️ Failed to generate invoice for order ${order.order_number}:`,
      err?.message || err,
    )
    return null
  }
}

const ensureOrderDocumentsAfterWebhook = async (
  order: any,
  tx: any,
  courierLabel: string,
) => {
  if (!order) return
  if (!isOrderManifestedForDocuments(order)) return

  let nextLabelKey = typeof order.label === 'string' && order.label.trim() ? order.label.trim() : null
  let nextInvoiceKey =
    typeof order.invoice_link === 'string' && order.invoice_link.trim()
      ? order.invoice_link.trim()
      : null
  let invoiceNumberToStore = order.invoice_number
  let invoiceDateToStore = order.invoice_date
  let invoiceAmountToStore = order.invoice_amount

  if (!nextLabelKey && order.awb_number) {
    try {
      console.log(`🖨️ Recovering missing label for ${courierLabel} order ${order.order_number}`)
      const generatedLabelKey = await generateLabelForOrder(order, order.user_id, tx)
      if (generatedLabelKey && typeof generatedLabelKey === 'string' && generatedLabelKey.trim()) {
        nextLabelKey = generatedLabelKey.trim()
        console.log(`✅ Label recovered for ${courierLabel} order ${order.order_number}`)
      } else {
        console.warn(`⚠️ Label recovery returned empty key for ${courierLabel} order ${order.order_number}`)
      }
    } catch (labelErr: any) {
      console.error(
        `❌ Failed to recover label for ${courierLabel} order ${order.order_number}:`,
        labelErr?.message || labelErr,
      )
    }
  }

  if (!nextInvoiceKey) {
    try {
      const invoiceResult = await generateInvoiceForOrderWebhook(order, tx)
      if (invoiceResult && typeof invoiceResult === 'object' && 'key' in invoiceResult) {
        nextInvoiceKey = invoiceResult.key
        invoiceNumberToStore = invoiceResult.invoiceNumber
        invoiceDateToStore = invoiceResult.invoiceDate
        invoiceAmountToStore = invoiceResult.invoiceAmount
        console.log(`✅ Invoice recovered for ${courierLabel} order ${order.order_number}`)
      }
    } catch (invoiceErr: any) {
      console.error(
        `❌ Failed to recover invoice for ${courierLabel} order ${order.order_number}:`,
        invoiceErr?.message || invoiceErr,
      )
    }
  }

  if (
    nextLabelKey !== order.label ||
    nextInvoiceKey !== order.invoice_link ||
    invoiceNumberToStore !== order.invoice_number ||
    invoiceDateToStore !== order.invoice_date ||
    invoiceAmountToStore !== order.invoice_amount
  ) {
    await tx
      .update(b2c_orders)
      .set({
        label: nextLabelKey ?? undefined,
        invoice_link: nextInvoiceKey ?? undefined,
        invoice_number: invoiceNumberToStore ?? undefined,
        invoice_date: invoiceDateToStore ?? undefined,
        invoice_amount: invoiceAmountToStore ?? undefined,
        updated_at: new Date(),
      })
      .where(eq(b2c_orders.id, order.id))
  }
}

const getStoredRtoCharge = (order: any) =>
  Number(order.freight_charges ?? order.shipping_charges ?? 0) || 0

async function resolveRtoCharge(order: any): Promise<number> {
  const storedCharge = getStoredRtoCharge(order)
  if (storedCharge > 0) return storedCharge

  const courierId = Number(order.courier_id ?? 0)
  const originPincode = order.pickup_details?.pincode
  const destinationPincode = order.pincode
  const weightG = Math.round(Number(order.weight ?? 0) * 1000)
  const lengthCm = Number(order.length ?? 0)
  const breadthCm = Number(order.breadth ?? 0)
  const heightCm = Number(order.height ?? 0)

  if (
    !order.user_id ||
    !courierId ||
    !originPincode ||
    !destinationPincode ||
    weightG <= 0 ||
    lengthCm <= 0 ||
    breadthCm <= 0 ||
    heightCm <= 0
  ) {
    return 0
  }

  try {
    const rate = await computeB2CFreightForOrder({
      userId: order.user_id,
      courierId,
      serviceProvider: order.integration_type ?? null,
      mode: order.shipping_mode ?? null,
      selectedMaxSlabWeight: order.selected_max_slab_weight ?? null,
      originPincode,
      destinationPincode,
      weightG,
      lengthCm,
      breadthCm,
      heightCm,
      isReverse: true,
    })

    return Number(rate.freight ?? 0) || 0
  } catch (err) {
    console.error(`⚠️ Failed to resolve RTO rate from plan table for ${order.order_number}:`, err)
    return 0
  }
}

export async function applyRtoChargeOnce(
  tx: any,
  order: any,
  courierLabel: string,
): Promise<number | null> {
  const amount = await resolveRtoCharge(order)
  if (amount <= 0) return null

  const [existingChargedEvent] = await tx
    .select({ id: rto_events.id })
    .from(rto_events)
    .where(
      and(
        eq(rto_events.order_id, order.id),
        isNotNull(rto_events.rto_charges),
        gt(rto_events.rto_charges, 0),
      ),
    )
    .limit(1)

  if (existingChargedEvent) {
    return null
  }

  try {
    const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, order.user_id))
    if (!wallet) throw new Error(`Wallet not found for user ${order.user_id}`)

    await createWalletTransaction({
      walletId: wallet.id,
      amount,
      type: 'debit',
      currency: wallet.currency ?? 'INR',
      reason: `RTO freight - ${courierLabel} (${order.order_number})`,
      ref: order.id,
      meta: {
        awb: order.awb_number,
        order_number: order.order_number,
        courier_partner: order.courier_partner ?? courierLabel,
      },
      tx: tx as any,
    })
  } catch (err) {
    console.error(`⚠️ Failed RTO debit for ${courierLabel}:`, err)
    return null
  }

  return amount
}

export async function applyCancellationRefundOnce(
  tx: any,
  order: any,
  source: string,
): Promise<number> {
  const freightCharges = Number(order.freight_charges ?? 0)
  const otherCharges = Number(order.other_charges ?? 0)
  const codCharges = Number(order.cod_charges ?? 0)

  const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, order.user_id))
  if (!wallet) {
    throw new Error(`Wallet not found for user ${order.user_id}`)
  }

  const refundReason = `Refund for cancelled order #${order.order_number}`
  const [existingRefund] = await tx
    .select({ id: walletTransactions.id })
    .from(walletTransactions)
    .where(
      and(
        eq(walletTransactions.wallet_id, wallet.id),
        eq(walletTransactions.type, 'credit'),
        eq(walletTransactions.reason, refundReason),
      ),
    )
    .limit(1)

  if (existingRefund) {
    console.log(
      `ℹ️ Cancellation refund already exists for order ${order.order_number}; skipping duplicate refund`,
    )
    return 0
  }

  const debitTransactions = await tx
    .select({
      amount: walletTransactions.amount,
      reason: walletTransactions.reason,
      meta: walletTransactions.meta,
    })
    .from(walletTransactions)
    .where(
      and(
        eq(walletTransactions.wallet_id, wallet.id),
        eq(walletTransactions.type, 'debit'),
        eq(walletTransactions.ref, order.id),
      ),
    )

  const originalWalletDebit = debitTransactions.reduce(
    (sum: number, transaction: any) => sum + Number(transaction.amount ?? 0),
    0,
  )

  let refundAmount = originalWalletDebit
  if (refundAmount <= 0) {
    if (order.order_type === 'prepaid') {
      const orderAmount = Number(order.order_amount ?? 0)
      refundAmount = orderAmount + freightCharges + otherCharges
    } else {
      refundAmount = freightCharges + otherCharges + codCharges
    }
  }

  if (refundAmount <= 0) {
    console.warn(`⚠️ No refundable amount resolved for cancelled order ${order.order_number}`, {
      source,
      order_type: order.order_type,
      order_amount: Number(order.order_amount ?? 0),
      freight_charges: freightCharges,
      other_charges: otherCharges,
      cod_charges: codCharges,
      original_wallet_debit: originalWalletDebit,
      debit_transactions_found: debitTransactions.length,
      debit_reasons: debitTransactions.map((transaction: any) => transaction.reason),
    })
    return 0
  }

  console.log(`💰 Refunding ₹${refundAmount} for cancelled order ${order.order_number}`, {
    source,
    order_type: order.order_type,
    order_amount: order.order_type === 'prepaid' ? Number(order.order_amount ?? 0) : 0,
    freight_charges: freightCharges,
    other_charges: otherCharges,
    cod_charges: order.order_type === 'cod' ? codCharges : 0,
    original_wallet_debit: originalWalletDebit,
    debit_transactions_found: debitTransactions.length,
    debit_reasons: debitTransactions.map((transaction: any) => transaction.reason),
    total_refund: refundAmount,
  })

  await createWalletTransaction({
    walletId: wallet.id,
    amount: refundAmount,
    type: 'credit',
    ref: order.id,
    reason: refundReason,
    currency: wallet.currency ?? 'INR',
    meta: {
      source,
      order_id: order.id,
      order_number: order.order_number,
      order_type: order.order_type,
      freight_charges: freightCharges,
      other_charges: otherCharges,
      cod_charges: order.order_type === 'cod' ? codCharges : 0,
      original_wallet_debit: originalWalletDebit,
      debit_transactions_found: debitTransactions.length,
      debit_reasons: debitTransactions.map((transaction: any) => transaction.reason),
    },
    tx: tx as any,
  })

  console.log(`✅ Wallet refunded ₹${refundAmount} for ${order.user_id}`)
  return refundAmount
}

// Ekart webhook: supports track_updated, shipment_created, shipment_recreated
export async function processEkartWebhookV2(payload: any, tx = db) {
  const statusRaw = payload?.status || payload?.track_updated?.status || payload?.status_text
  const awb =
    payload?.wbn || payload?.id || payload?.tracking_id || payload?.track_updated?.wbn || null
  const orderRef = payload?.orderNumber || payload?.order_number || payload?.order_id || null

  const normalized = (statusRaw || '').toString().toLowerCase()
  const statusMap: Record<string, string> = {
    'order placed': 'booked',
    'pickup scheduled': 'pickup_scheduled',
    'in transit': 'in_transit',
    'out for delivery': 'out_for_delivery',
    delivered: 'delivered',
    'return to origin': 'rto_initiated',
    'rto initiated': 'rto_initiated',
    'rto in transit': 'rto_in_transit',
    'rto delivered': 'rto_delivered',
    'delivery attempted': 'ndr',
    ndr: 'ndr',
    'manifest generated': 'pickup_initiated',
  }

  let mapped = statusMap[normalized] || normalized || 'unknown'
  if (mapped === 'pickup_scheduled') mapped = 'pickup_initiated'
  if (mapped === 'unknown' && normalized.includes('delivery')) mapped = 'out_for_delivery'
  if (mapped === 'unknown' && normalized.includes('attempt')) mapped = 'ndr'
  if (mapped === 'unknown' && normalized.includes('rto')) mapped = 'rto_initiated'

  // find order by awb then order_number
  let order
  if (awb) {
    ;[order] = await tx.select().from(b2c_orders).where(eq(b2c_orders.awb_number, awb))
  }
  if (!order && orderRef) {
    ;[order] = await tx.select().from(b2c_orders).where(eq(b2c_orders.order_number, orderRef))
  }

  if (!order) {
    console.warn(`⚠️ Ekart webhook: order not found for AWB ${awb} or ref ${orderRef}`)
    return { success: false, reason: 'order_not_found' }
  }

  const update: any = {
    order_status: mapped,
    updated_at: new Date(),
  }

  const prevStatus = order.order_status || ''
  await tx.update(b2c_orders).set(update).where(eq(b2c_orders.id, order.id))
  await syncShopifyStatusForLocalOrder({ ...order, ...update }, tx).catch((err) => {
    console.warn('⚠️ Failed Shopify status sync for Ekart webhook:', err)
  })

  // emit tracking webhook
  await sendWebhookEvent(order.user_id, 'tracking.updated', {
    awb_number: awb || order.awb_number,
    order_id: order.id,
    order_number: order.order_number,
    status: mapped,
    raw_status: statusRaw,
    courier_partner: order.courier_partner,
  })

  return { success: true }
}

export async function processDelhiveryWebhook(payload: any, tx = db) {
  const shipment = payload?.Shipment
  const statusInfo = shipment?.Status || {}

  const waybill = shipment?.AWB
  const referenceNo =
    shipment?.ReferenceNo ||
    shipment?.ReferenceNumber ||
    payload?.ReferenceNo ||
    payload?.ReferenceNumber ||
    payload?.order_number ||
    payload?.orderNumber ||
    null
  const status = statusInfo?.Status
  const status_type = statusInfo?.StatusType
  const location = statusInfo?.StatusLocation
  const instructions = statusInfo?.Instructions
  const shouldRunManifestSideEffects = status === 'Manifested' || status === 'Scheduled'

  if (!waybill) return { success: false, reason: 'missing_awb' }

  let [order] = await tx.select().from(b2c_orders).where(eq(b2c_orders.awb_number, waybill))
  if (!order && referenceNo) {
    ;[order] = await tx
      .select()
      .from(b2c_orders)
      .where(eq(b2c_orders.order_number, String(referenceNo)))
  }
  if (!order) {
    console.warn(`⚠️ No local order found for AWB ${waybill}`)
    return { success: false, reason: 'order_not_found' }
  }

  // 🔹 Map Delhivery → internal status
  // Reference: Delhivery Webhook Documentation
  // Forward Shipment: UD (Manifested, Not Picked, In Transit, Pending, Dispatched) → DL (Delivered)
  // Return Shipment: RT (In Transit, Pending, Dispatched) → DL (RTO)
  // Reverse Shipment: PP (Open, Scheduled, Dispatched) → PU (In Transit, Pending, Dispatched) → DL (DTO)
  const mapStatus = (type: string, s: string, instructionText?: string): string => {
    const t = type?.toUpperCase()
    const st = s?.toLowerCase()
    const instruction = instructionText?.toLowerCase() || ''

    if (
      instruction.includes('seller cancelled') ||
      instruction.includes('seller canceled') ||
      instruction.includes('shipment has been cancelled') ||
      instruction.includes('shipment has been canceled')
    ) {
      return 'cancelled'
    }

    // Forward Shipment Statuses (UD)
    if (t === 'UD') {
      if (st === 'manifested') return 'booked'
      if (st === 'not picked') return 'pickup_initiated'
      if (st === 'in transit') return 'in_transit'
      if (st === 'pending') return 'in_transit' // Reached destination city, not yet dispatched
      if (st === 'dispatched') return 'out_for_delivery'
    }

    // Delivery Statuses (DL)
    if (t === 'DL') {
      if (st === 'delivered') return 'delivered' // Forward shipment delivered
      if (st === 'dto') return 'delivered' // Reverse shipment accepted (DTO = Delivered To Origin)
      if (st === 'rto') return 'rto_delivered' // Return shipment delivered to origin
    }

    // Return Shipment Statuses (RT)
    if (t === 'RT') {
      if (st === 'in transit') return 'rto_in_transit' // Forward shipment converted to return, in transit
      if (st === 'pending') return 'rto' // Reached DC nearest to origin
      if (st === 'dispatched') return 'rto_in_transit' // Dispatched for delivery to origin
    }

    // NDR handling for Delhivery
    if (t === 'ND') {
      return 'ndr'
    }

    // Reverse Shipment - Pickup Request Statuses (PP)
    if (t === 'PP') {
      if (st === 'open') return 'pickup_initiated' // Pickup request created
      if (st === 'scheduled') return 'pickup_initiated' // Pickup request scheduled
      if (st === 'dispatched') return 'out_for_delivery' // FE out in field to collect package
    }

    // Reverse Shipment - Pickup In Transit Statuses (PU)
    if (t === 'PU') {
      if (st === 'in transit') return 'in_transit' // In transit to RPC from DC after physical pickup
      if (st === 'pending') return 'in_transit' // Reached RPC but not yet dispatched
      if (st === 'dispatched') return 'out_for_delivery' // Dispatched for delivery to client from RPC
    }

    // Cancellation Statuses (CN)
    if (t === 'CN') {
      if (st === 'canceled' || st === 'cancelled') return 'cancelled' // Canceled before pickup
      if (st === 'closed') return 'cancelled' // Canceled and request closed
      return 'cancelled' // Default for any CN status
    }

    return 'in_transit' // Default fallback
  }

  let internalStatus = mapStatus(status_type, status, instructions)

  // Map any pending_pickup status to pickup_initiated
  if (internalStatus === 'pending_pickup') {
    internalStatus = 'pickup_initiated'
  }

  console.log(`📦 Delhivery Webhook: ${waybill} → ${status} (${status_type}) → ${internalStatus}`)

  const currentStatus = (order.order_status || '').toLowerCase()
  const currentManifestError = String(order.manifest_error || '').trim()
  if (
    currentStatus === 'cancelled' &&
    internalStatus !== 'cancelled' &&
    internalStatus !== 'rto' &&
    internalStatus !== 'rto_in_transit' &&
    internalStatus !== 'rto_delivered'
  ) {
    console.log(
      `⏭️ Ignoring Delhivery webhook status regression for cancelled order ${order.order_number}: ${status} (${status_type}) would map to ${internalStatus}`,
    )
    return {
      success: true,
      ignored: true,
      reason: 'cancelled_order_status_regression',
    }
  }

  if (
    currentStatus === 'manifest_failed' &&
    currentManifestError &&
    (internalStatus === 'booked' || internalStatus === 'pickup_initiated')
  ) {
    console.log(
      `⏭️ Ignoring Delhivery webhook status regression for manifest_failed order ${order.order_number}: ${status} (${status_type}) would map to ${internalStatus}`,
    )
    return {
      success: true,
      ignored: true,
      reason: 'manifest_failed_status_regression',
    }
  }

  await tx.transaction(async (innerTx) => {
    // 1️⃣ Update base order status
    const updateData: any = {
      order_status: internalStatus,
      delivery_location: location || null,
      delivery_message: instructions || null,
      updated_at: new Date(),
    }

    if (!order.awb_number && waybill) {
      updateData.awb_number = String(waybill)
    }

    // 🔹 Capture courier cost if available from Delhivery webhook (for revenue calculation)
    // Check various possible field names from Delhivery webhook
    if (
      shipment?.Charge !== undefined ||
      shipment?.Amount !== undefined ||
      shipment?.BillingAmount !== undefined ||
      shipment?.TotalCharge !== undefined ||
      shipment?.FreightCharges !== undefined ||
      shipment?.cost !== undefined
    ) {
      const courierCost =
        shipment?.Charge ||
        shipment?.Amount ||
        shipment?.BillingAmount ||
        shipment?.TotalCharge ||
        shipment?.FreightCharges ||
        shipment?.cost
      if (courierCost !== null && courierCost !== undefined) {
        updateData.courier_cost = Number(courierCost)
        console.log(
          `💰 Captured Delhivery courier cost ₹${courierCost} for order ${order.order_number}`,
        )
      }
    }

    // 🔹 Capture weight data from Delhivery webhook if available
    const scannedWeight = shipment?.Scans?.[0]?.ScanDetail?.ScannedWeight
    const chargedWeight = shipment?.ChargedWeight || scannedWeight
    const volumetricWeight = shipment?.VolumetricWeight

    if (chargedWeight || volumetricWeight) {
      if (chargedWeight) updateData.charged_weight = Number(chargedWeight)
      if (volumetricWeight) updateData.volumetric_weight = Number(volumetricWeight)
      if (scannedWeight && !updateData.actual_weight)
        updateData.actual_weight = Number(scannedWeight)

      // Check for weight discrepancy
      const finalChargedWeight = Number(chargedWeight)
      const declaredWeight = Number(order.weight)

      if (
        finalChargedWeight &&
        declaredWeight &&
        Math.abs(finalChargedWeight - declaredWeight) > 0.01
      ) {
        updateData.weight_discrepancy = true

        // Create weight discrepancy record
        try {
          await createWeightDiscrepancy({
            orderType: 'b2c',
            orderId: order.id,
            userId: order.user_id,
            orderNumber: order.order_number,
            awbNumber: order.awb_number || undefined,
            courierPartner: 'Delhivery',
            declaredWeight,
            actualWeight: scannedWeight ? Number(scannedWeight) : undefined,
            volumetricWeight: volumetricWeight ? Number(volumetricWeight) : undefined,
            chargedWeight: finalChargedWeight,
            declaredDimensions: {
              length: Number(order.length || 0),
              breadth: Number(order.breadth || 0),
              height: Number(order.height || 0),
            },
            originalShippingCharge: Number(order.freight_charges ?? order.shipping_charges ?? 0),
            courierRemarks: shipment?.Status?.Instructions,
          })
          console.log(
            `⚖️ Weight discrepancy detected for order ${order.order_number}: ${declaredWeight}kg → ${finalChargedWeight}kg`,
          )
        } catch (err) {
          console.error(`❌ Failed to create weight discrepancy record:`, err)
        }
      }
    }

    await innerTx.update(b2c_orders).set(updateData).where(eq(b2c_orders.id, order.id))
    await syncShopifyStatusForLocalOrder({ ...order, ...updateData }, innerTx).catch((err) => {
      console.warn('⚠️ Failed Shopify status sync for Delhivery webhook:', err)
    })
    // 🔔 NDR capture for Delhivery
    const statusLower = (internalStatus || '').toLowerCase()
    const isNdr =
      isNdrLikeStatus(statusLower) ||
      isNdrLikeStatus(shipment?.Status?.Status) ||
      isNdrLikeStatus(shipment?.Status?.Instructions)
    if (isNdr) {
      try {
        await recordNdrEvent({
          orderId: order.id,
          userId: order.user_id,
          awbNumber: order.awb_number || undefined,
          status: statusLower,
          reason: shipment?.Status?.Instructions || null,
          remarks: shipment?.Status?.Status || null,
          attemptNo: shipment?.AttemptedCount?.toString?.() || null,
          payload,
        })
        await createNotificationService({
          targetRole: 'user',
          userId: order.user_id,
          title: 'Delivery attempt issue (Delhivery)',
          message: `Order ${order.order_number} marked as ${statusLower}.`,
        })
        await createNotificationService({
          targetRole: 'admin',
          title: 'NDR captured (Delhivery)',
          message: `User ${order.user_id} order ${order.order_number} status ${statusLower}`,
        })
      } catch (e) {
        console.error('❌ Failed to record NDR event (Delhivery):', e)
      }
    }

    // 🔔 RTO capture for Delhivery
    const isRto = ['rto', 'rto_in_transit', 'rto_delivered'].includes(statusLower)
    if (isRto) {
      try {
        const rtoCharge = await applyRtoChargeOnce(innerTx, order, 'Delhivery')
        await recordRtoEvent({
          orderId: order.id,
          userId: order.user_id,
          awbNumber: order.awb_number || undefined,
          status: statusLower,
          reason: shipment?.Status?.Instructions || null,
          remarks: shipment?.Status?.Status || null,
          rtoCharges: rtoCharge,
          payload,
          tx: innerTx,
        })
        await createNotificationService({
          targetRole: 'user',
          userId: order.user_id,
          title: 'RTO update (Delhivery)',
          message: `Order ${order.order_number} status updated: ${statusLower}.`,
        })
        await createNotificationService({
          targetRole: 'admin',
          title: 'RTO event (Delhivery)',
          message: `User ${order.user_id} order ${order.order_number} ${statusLower}`,
        })
      } catch (e) {
        console.error('❌ Failed to record RTO event (Delhivery):', e)
      }
    }

    // 2️⃣ When Manifested → generate invoice (labels will be generated during manifest)
    // Also generate invoice when the courier reports pickup_initiated.
    if (internalStatus === 'booked' || internalStatus === 'pickup_initiated') {
      try {
        // Fetch fresh order data
        const [freshOrder] = await innerTx
          .select()
          .from(b2c_orders)
          .where(eq(b2c_orders.id, order.id))

        if (!freshOrder) {
          console.warn(`⚠️ Order ${order.order_number} not found in transaction`)
          return
        }

        // Labels will be generated during manifest generation, not during webhook processing

        // 📜 Log tracking event (Delhivery)
        try {
          await logTrackingEvent({
            orderId: order.id,
            userId: order.user_id,
            awbNumber: order.awb_number,
            courier: 'Delhivery',
            statusCode: internalStatus,
            statusText: status,
            location,
            raw: payload,
          })
        } catch (e) {
          console.error('Failed to log tracking event (Delhivery):', e)
        }

        // 🔸 Generate invoice using shared helper function
        let invoiceKey = freshOrder.invoice_link
        let invoiceNumberToStore = freshOrder.invoice_number
        let invoiceDateToStore = freshOrder.invoice_date
        let invoiceAmountToStore = freshOrder.invoice_amount

        if (!invoiceKey && isOrderManifestedForDocuments(freshOrder)) {
          console.log(`🧾 Generating invoice for Delhivery order ${order.order_number}`)
          try {
            const invoiceResult = await generateInvoiceForOrderWebhook(freshOrder, innerTx)
            if (invoiceResult) {
              invoiceKey = invoiceResult.key
              invoiceNumberToStore = invoiceResult.invoiceNumber
              invoiceDateToStore = invoiceResult.invoiceDate
              invoiceAmountToStore = invoiceResult.invoiceAmount
              console.log(`✅ Invoice generated successfully: ${invoiceKey}`)
            } else {
              console.warn(
                `⚠️ Invoice generation returned null/undefined for order ${order.order_number}`,
              )
            }
          } catch (invoiceErr: any) {
            console.error(
              `❌ Failed to generate invoice for Delhivery order ${order.order_number}:`,
              invoiceErr?.message || invoiceErr,
            )
            // Don't throw - invoice failure shouldn't prevent label from being saved
          }
        } else if (invoiceKey) {
          console.log(`ℹ️ Invoice already exists for order ${order.order_number}`)
        }

        // Update order record with invoice and manifest (labels will be added during manifest)
        await innerTx
          .update(b2c_orders)
          .set({
            invoice_link: invoiceKey ?? undefined,
            manifest: isOrderManifestedForDocuments({ ...freshOrder, order_status: internalStatus })
              ? shipment?.upload_wbn ?? shipment?.UploadWBN ?? freshOrder.manifest ?? null
              : freshOrder.manifest ?? null,
            invoice_number: invoiceNumberToStore ?? undefined,
            invoice_date: invoiceDateToStore ?? undefined,
            invoice_amount: invoiceAmountToStore ?? undefined,
            updated_at: new Date(),
          })
          .where(eq(b2c_orders.id, order.id))

        console.log(`✅ Invoice saved for order ${order.order_number}`)
        try {
          const delhivery = new DelhiveryService()
          await delhivery.triggerDelhiveryPickupRequest(
            order.pickup_details?.warehouse_name ?? '',
            1,
          )
          console.log(`🚚 Pickup request triggered for ${order.order_number}`)
        } catch (pickupErr: any) {
          console.error(
            `❌ Failed to trigger pickup request for ${order.order_number}:`,
            pickupErr?.message || pickupErr,
          )
          // Don't throw - pickup request failure shouldn't prevent order update
        }
      } catch (err: any) {
        console.error(
          `❌ Failed to generate label/invoice/pickup for ${order.order_number}:`,
          err?.message || err,
          err?.stack,
        )
        // Re-throw to ensure transaction is rolled back if order update fails
        throw err
      }
    }

    // 3️⃣ Delivered → Create COD remittance (if COD order)
    if (internalStatus === 'delivered' && order.order_type === 'cod') {
      try {
        console.log(`💰 Creating COD remittance for Delhivery order ${order.order_number}`)

        const { remittance, created } = await createCodRemittance({
          orderId: order.id,
          orderType: 'b2c',
          userId: order.user_id,
          orderNumber: order.order_number,
          awbNumber: order.awb_number || undefined,
          courierPartner: order.courier_partner || 'Delhivery',
          codAmount: Number(order.order_amount || 0),
          codCharges: Number(order.cod_charges || 0),
          freightCharges: Number(order.freight_charges ?? order.shipping_charges ?? 0),
          collectedAt: new Date(),
        })

        if (created) {
          await createNotificationService({
            targetRole: 'admin',
            title: 'COD remittance created',
            message: `Order ${order.order_number} (${order.awb_number || 'no AWB'}) created pending COD remittance of ₹${Number(
              remittance.remittableAmount || 0,
            ).toFixed(2)}.`,
          })
        }

        console.log(`✅ COD remittance created for Delhivery order ${order.order_number}`)
      } catch (err) {
        console.error(`❌ Failed to create COD remittance for order ${order.order_number}:`, err)
      }
    }

    // 4️⃣ Cancelled → Refund wallet
    if (internalStatus === 'cancelled') {
      await applyCancellationRefundOnce(innerTx, order, 'delhivery_webhook')
    }
  })

  if (shouldRunManifestSideEffects) {
    try {
      const [freshOrder] = await db.select().from(b2c_orders).where(eq(b2c_orders.id, order.id))

      if (!freshOrder) {
        console.warn(`⚠️ Order ${order.order_number} not found after webhook commit`)
        return { success: true }
      }

      try {
        await logTrackingEvent({
          orderId: order.id,
          userId: order.user_id,
          awbNumber: freshOrder.awb_number || order.awb_number,
          courier: 'Delhivery',
          statusCode: internalStatus,
          statusText: status,
          location,
          raw: payload,
        })
      } catch (e) {
        console.error('Failed to log tracking event (Delhivery):', e)
      }

      const hadManifestBeforeWebhook = Boolean(freshOrder.manifest)
      await ensureOrderDocumentsAfterWebhook(freshOrder, db, 'Delhivery')

      const [documentsRefreshedOrder] = await db
        .select()
        .from(b2c_orders)
        .where(eq(b2c_orders.id, order.id))
      const documentOrder = documentsRefreshedOrder || freshOrder

      await db
        .update(b2c_orders)
        .set({
          manifest: shipment?.upload_wbn ?? shipment?.UploadWBN ?? documentOrder.manifest ?? null,
          updated_at: new Date(),
        })
        .where(eq(b2c_orders.id, order.id))

      console.log(`✅ Documents/manifest saved for order ${order.order_number}`)

      if (!hadManifestBeforeWebhook) {
        void new DelhiveryService()
          .triggerDelhiveryPickupRequest(freshOrder.pickup_details?.warehouse_name ?? '', 1)
          .then(() => {
            console.log(`🚚 Pickup request triggered for ${order.order_number}`)
          })
          .catch((pickupErr: any) => {
            console.error(
              `❌ Failed to trigger pickup request for ${order.order_number}:`,
              pickupErr?.message || pickupErr,
            )
          })
      }
    } catch (err: any) {
      console.error(
        `❌ Failed post-commit Delhivery webhook work for ${order.order_number}:`,
        err?.message || err,
        err?.stack,
      )
    }
  }
  return { success: true }
}

/**
 * Process Delhivery Document Push Webhook (POD, Sorter Image, QC Image)
 * According to Delhivery documentation, document push webhooks are separate from scan push webhooks
 */
export async function processDelhiveryDocumentWebhook(
  payload: any,
  documentType: string | null,
  tx = db,
) {
  const shipment = payload?.Shipment || payload
  const waybill = shipment?.AWB || payload?.AWB || payload?.waybill

  if (!waybill) {
    return { success: false, reason: 'missing_awb' }
  }

  const [order] = await tx.select().from(b2c_orders).where(eq(b2c_orders.awb_number, waybill))
  if (!order) {
    console.warn(`⚠️ No local order found for AWB ${waybill} (document webhook)`)
    return { success: false, reason: 'order_not_found' }
  }

  // Extract document URLs based on document type
  let documentUrl: string | null = null
  const docType = (documentType || '').toLowerCase()

  if (docType === 'pod' || docType === 'poddocument') {
    documentUrl =
      shipment?.PODDocument ||
      payload?.PODDocument ||
      shipment?.POD?.DocumentURL ||
      payload?.POD?.DocumentURL ||
      shipment?.DocumentURL ||
      payload?.DocumentURL
  } else if (docType === 'sorterimage' || docType === 'sorter') {
    documentUrl =
      shipment?.SorterImage ||
      payload?.SorterImage ||
      shipment?.Sorter?.ImageURL ||
      payload?.Sorter?.ImageURL ||
      shipment?.ImageURL ||
      payload?.ImageURL
  } else if (docType === 'qcimage' || docType === 'qc') {
    documentUrl =
      shipment?.QCImage ||
      payload?.QCImage ||
      shipment?.QC?.ImageURL ||
      payload?.QC?.ImageURL ||
      shipment?.ImageURL ||
      payload?.ImageURL
  } else {
    // Generic document URL extraction
    documentUrl =
      shipment?.DocumentURL ||
      payload?.DocumentURL ||
      shipment?.ImageURL ||
      payload?.ImageURL ||
      shipment?.URL ||
      payload?.URL
  }

  if (!documentUrl) {
    console.warn(`⚠️ No document URL found in Delhivery document webhook for AWB ${waybill}`)
    return { success: false, reason: 'missing_document_url' }
  }

  console.log(
    `📄 Processing Delhivery ${
      documentType || 'document'
    } webhook for AWB ${waybill}, URL: ${documentUrl}`,
  )

  try {
    await tx.transaction(async (innerTx) => {
      // Store document URL in order metadata or delivery_message field
      // Note: You may want to add a dedicated field for POD/document URLs in the schema
      const updateData: any = {
        updated_at: new Date(),
      }

      // Store in delivery_message if it's POD, otherwise append to existing message
      if (docType === 'pod' || docType === 'poddocument') {
        const existingMessage = order.delivery_message || ''
        updateData.delivery_message = existingMessage
          ? `${existingMessage}\nPOD Document: ${documentUrl}`
          : `POD Document: ${documentUrl}`
      }

      // Log the document for tracking
      await logTrackingEvent({
        orderId: order.id,
        userId: order.user_id,
        awbNumber: order.awb_number,
        courier: 'Delhivery',
        statusCode: 'document_received',
        statusText: `${documentType || 'Document'} received`,
        location: null,
        raw: {
          documentType,
          documentUrl,
          payload,
        },
      })

      await innerTx.update(b2c_orders).set(updateData).where(eq(b2c_orders.id, order.id))

      // Create notification for document received
      await createNotificationService({
        targetRole: 'user',
        userId: order.user_id,
        title: `${documentType || 'Document'} received (Delhivery)`,
        message: `Order ${order.order_number} - ${
          documentType || 'Document'
        } document is now available.`,
      })

      // Also notify admins so POD/document events are visible in admin notification center.
      await createNotificationService({
        targetRole: 'admin',
        title: `${documentType || 'Document'} received (Delhivery)`,
        message: `Order ${order.order_number} (${order.awb_number || waybill}) - ${
          documentType || 'Document'
        } document received.`,
      })

      console.log(
        `✅ Delhivery ${
          documentType || 'document'
        } webhook processed successfully for AWB ${waybill}`,
      )
    })

    return { success: true }
  } catch (error: any) {
    console.error(
      `❌ Failed to process Delhivery document webhook for AWB ${waybill}:`,
      error?.message || error,
    )
    return { success: false, reason: 'processing_error' }
  }
}

// =========================
// Ekart Webhook Processing
// =========================
const mapEkartStatus = (status: string): string => {
  const s = (status || '').toLowerCase()
  if (!s) return 'in_transit'
  if (s.includes('delivered')) return s.includes('rto') ? 'rto_delivered' : 'delivered'
  if (s.includes('out for delivery') || s.includes('ofd')) return 'out_for_delivery'
  if (s.includes('pickup') || s.includes('created') || s.includes('manifest')) return 'booked'
  if (s.includes('ndr') || s.includes('undelivered') || s.includes('not delivered')) return 'ndr'
  if (s.includes('rto')) return 'rto_in_transit'
  return 'in_transit'
}

const NDR_STATUS_MARKERS = [
  'ndr',
  'undelivered',
  'not delivered',
  'delivery_attempt_failed',
  'attempt_failed',
  'attempt_undelivered',
  'delivery_rescheduled',
  'future_delivery_requested',
  'customer_not_available',
  'consignee_refused',
  'address_issue',
  'door_closed',
  'door_locked',
  'shipment_held',
  'nsl',
]

const isNdrLikeStatus = (value?: string | null) => {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return false
  return NDR_STATUS_MARKERS.some((marker) => normalized.includes(marker))
}

const unwrapXpressbeesPayload = (payload: any) => {
  if (payload?.__provider === 'xpressbees' && payload?.body) {
    return payload.body
  }
  if (Array.isArray(payload?.data) && payload.data.length > 0) {
    return payload.data[0]
  }
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data
  }
  return payload
}

const mapXpressbeesStatus = (status: string): string => {
  const s = (status || '').toLowerCase().trim()
  if (!s) return 'in_transit'
  if (s.includes('cancel')) return 'cancelled'
  if (s.includes('ndr') || s.includes('undelivered') || s.includes('attempt')) return 'ndr'
  if (s.includes('rto') && s.includes('deliver')) return 'rto_delivered'
  if (s.includes('rto')) return 'rto_in_transit'
  if (s.includes('out for delivery') || s.includes('ofd')) return 'out_for_delivery'
  if (s === 'delivered' || s.includes(' delivered') || s.includes('delivered ')) return 'delivered'
  if (s.includes('pickup scheduled') || s.includes('pickup requested')) return 'pickup_initiated'
  if (s.includes('pickup') || s.includes('manifest') || s.includes('booked') || s.includes('created')) {
    return 'booked'
  }
  if (s.includes('transit') || s.includes('dispatched')) return 'in_transit'
  return 'in_transit'
}

export async function processEkartWebhook(payload: any, tx = db) {
  const awb =
    payload?.tracking_id ||
    payload?.trackingId ||
    payload?.awb ||
    payload?.waybill ||
    payload?.wbn ||
    payload?.barcodes?.wbn ||
    null

  const statusRaw = payload?.current_status || payload?.status || payload?.event || ''
  const remarks = payload?.remarks || payload?.remark || payload?.message || ''
  const location =
    payload?.current_location ||
    payload?.location ||
    payload?.scan_location ||
    payload?.last_location ||
    null

  if (!awb) return { success: false, reason: 'missing_awb' }

  const [order] = await tx.select().from(b2c_orders).where(eq(b2c_orders.awb_number, awb))
  if (!order) {
    console.warn(`⚠️ No local order found for Ekart AWB ${awb}`)
    return { success: false, reason: 'order_not_found' }
  }

  const internalStatus = mapEkartStatus(statusRaw)
  const statusLower = internalStatus.toLowerCase()
  const statusText = statusRaw || internalStatus

  const updateData: any = {
    order_status: internalStatus,
    delivery_location: location,
    delivery_message: remarks || null,
    updated_at: new Date(),
  }

  if (payload?.courier_cost !== undefined) updateData.courier_cost = Number(payload.courier_cost)
  if (payload?.charged_weight !== undefined) updateData.charged_weight = Number(payload.charged_weight)
  if (payload?.volumetric_weight !== undefined)
    updateData.volumetric_weight = Number(payload.volumetric_weight)
  if (payload?.actual_weight !== undefined) updateData.actual_weight = Number(payload.actual_weight)

  await tx.transaction(async (innerTx) => {
    await innerTx.update(b2c_orders).set(updateData).where(eq(b2c_orders.id, order.id))
    await syncShopifyStatusForLocalOrder({ ...order, ...updateData }, innerTx).catch((err) => {
      console.warn('⚠️ Failed Shopify status sync for Ekart webhook:', err)
    })

    try {
      await logTrackingEvent({
        orderId: order.id,
        userId: order.user_id,
        awbNumber: order.awb_number,
        courier: 'Ekart Logistics',
        statusCode: internalStatus,
        statusText,
        location,
        raw: payload,
      })
    } catch (err: any) {
      console.error('❌ Failed to log Ekart tracking event:', err)
    }

    if (
      ['booked', 'pickup_initiated', 'shipment_created', 'in_transit', 'out_for_delivery', 'delivered'].includes(
        internalStatus,
      )
    ) {
      try {
        const [freshOrder] = await innerTx
          .select()
          .from(b2c_orders)
          .where(eq(b2c_orders.id, order.id))

        if (!freshOrder) {
          console.warn(`⚠️ Order ${order.order_number} not found during Ekart webhook transaction`)
          return
        }

        await ensureOrderDocumentsAfterWebhook(freshOrder, innerTx, 'Ekart')
      } catch (err: any) {
        console.error(`❌ Ekart document recovery flow error for ${order.order_number}:`, err)
      }
    }
  })

  if (isNdrLikeStatus(statusLower) || isNdrLikeStatus(statusText) || isNdrLikeStatus(remarks)) {
    try {
      await recordNdrEvent({
        orderId: order.id,
        userId: order.user_id,
        awbNumber: order.awb_number || undefined,
        status: statusLower,
        reason: remarks || null,
        payload,
      })
      await createNotificationService({
        targetRole: 'user',
        userId: order.user_id,
        title: 'Delivery attempt issue (Ekart)',
        message: `Order ${order.order_number} marked as ${statusLower}.`,
      })
      await createNotificationService({
        targetRole: 'admin',
        title: 'NDR captured (Ekart)',
        message: `User ${order.user_id} order ${order.order_number} status ${statusLower}`,
      })
    } catch (err) {
      console.error('❌ Failed to record NDR event (Ekart):', err)
    }
  }

  if (statusLower.includes('rto')) {
    try {
      const rtoCharge = await applyRtoChargeOnce(tx, order, 'Ekart')
      await recordRtoEvent({
        orderId: order.id,
        userId: order.user_id,
        awbNumber: order.awb_number || undefined,
        status: statusLower,
        reason: remarks || null,
        rtoCharges: rtoCharge,
        payload,
        tx,
      })
      await createNotificationService({
        targetRole: 'user',
        userId: order.user_id,
        title: 'RTO update (Ekart)',
        message: `Order ${order.order_number} status ${statusLower}.`,
      })
      await createNotificationService({
        targetRole: 'admin',
        title: 'RTO event (Ekart)',
        message: `User ${order.user_id} order ${order.order_number} ${statusLower}`,
      })
    } catch (err) {
      console.error('❌ Failed to record RTO event (Ekart):', err)
    }
  }

  if (internalStatus === 'delivered' && order.order_type === 'cod') {
    try {
      console.log(`💰 Creating COD remittance for Ekart order ${order.order_number}`)
      const { remittance, created } = await createCodRemittance({
        orderId: order.id,
        orderType: 'b2c',
        userId: order.user_id,
        orderNumber: order.order_number,
        awbNumber: order.awb_number || undefined,
        courierPartner: 'Ekart Logistics',
        codAmount: Number(order.order_amount ?? 0),
        codCharges: Number(order.cod_charges ?? 0),
        freightCharges: Number(order.freight_charges ?? order.shipping_charges ?? 0),
        collectedAt: new Date(),
      })

      if (created) {
        await createNotificationService({
          targetRole: 'admin',
          title: 'COD remittance created',
          message: `Order ${order.order_number} (${order.awb_number || 'no AWB'}) created pending COD remittance of ₹${Number(
            remittance.remittableAmount || 0,
          ).toFixed(2)}.`,
        })
      }

      console.log(`✅ COD remittance created for Ekart order ${order.order_number}`)
    } catch (err) {
      console.error(`❌ Failed to create COD remittance for Ekart order ${order.order_number}:`, err)
    }
  }

  return { success: true }
}

export async function processXpressbeesWebhook(payload: any, tx = db) {
  const event = unwrapXpressbeesPayload(payload)
  const awb =
    event?.awb_number ||
    event?.awb ||
    event?.waybill ||
    event?.tracking_id ||
    event?.trackingId ||
    event?.shipment?.awb_number ||
    event?.shipment?.awb ||
    null
  const orderRef =
    event?.order_number ||
    event?.order_id ||
    event?.reference_number ||
    event?.shipment_id ||
    null
  const statusRaw =
    event?.current_status ||
    event?.shipment_status ||
    event?.status ||
    event?.event ||
    event?.event_name ||
    event?.scan_status ||
    ''
  const remarks =
    event?.courier_remarks ||
    event?.remarks ||
    event?.remark ||
    event?.message ||
    event?.description ||
    ''
  const location =
    event?.current_location ||
    event?.location ||
    event?.scan_location ||
    event?.hub_name ||
    event?.city ||
    null

  if (!awb && !orderRef) return { success: false, reason: 'missing_awb' }

  let order
  if (awb) {
    ;[order] = await tx.select().from(b2c_orders).where(eq(b2c_orders.awb_number, String(awb)))
  }
  if (!order && orderRef) {
    ;[order] = await tx
      .select()
      .from(b2c_orders)
      .where(eq(b2c_orders.order_number, String(orderRef)))
  }
  if (!order && orderRef) {
    ;[order] = await tx.select().from(b2c_orders).where(eq(b2c_orders.order_id, String(orderRef)))
  }

  if (!order) {
    console.warn(`⚠️ No local order found for Xpressbees AWB ${awb || 'N/A'} ref ${orderRef || 'N/A'}`)
    return { success: false, reason: 'order_not_found' }
  }

  const internalStatus = mapXpressbeesStatus(statusRaw)
  const statusLower = internalStatus.toLowerCase()
  const statusText = statusRaw || internalStatus

  const updateData: any = {
    order_status: internalStatus,
    delivery_location: location,
    delivery_message: remarks || null,
    updated_at: new Date(),
  }

  if (event?.courier_cost !== undefined) updateData.courier_cost = Number(event.courier_cost)
  if (event?.freight_charges !== undefined && updateData.courier_cost === undefined) {
    updateData.courier_cost = Number(event.freight_charges)
  }
  if (event?.charged_weight !== undefined) updateData.charged_weight = Number(event.charged_weight)
  if (event?.chargeable_weight !== undefined && updateData.charged_weight === undefined) {
    updateData.charged_weight = Number(event.chargeable_weight)
  }
  if (event?.volumetric_weight !== undefined) {
    updateData.volumetric_weight = Number(event.volumetric_weight)
  }
  if (event?.actual_weight !== undefined) updateData.actual_weight = Number(event.actual_weight)
  if (event?.label) updateData.label = String(event.label)
  if (event?.manifest) updateData.manifest = String(event.manifest)

  await tx.transaction(async (innerTx) => {
    await innerTx.update(b2c_orders).set(updateData).where(eq(b2c_orders.id, order.id))
    await syncShopifyStatusForLocalOrder({ ...order, ...updateData }, innerTx).catch((err) => {
      console.warn('⚠️ Failed Shopify status sync for Xpressbees webhook:', err)
    })

    try {
      await logTrackingEvent({
        orderId: order.id,
        userId: order.user_id,
        awbNumber: order.awb_number,
        courier: 'Xpressbees',
        statusCode: internalStatus,
        statusText,
        location,
        raw: payload,
      })
    } catch (err: any) {
      console.error('❌ Failed to log Xpressbees tracking event:', err)
    }

    if (
      ['booked', 'pickup_initiated', 'shipment_created', 'in_transit', 'out_for_delivery', 'delivered'].includes(
        internalStatus,
      )
    ) {
      try {
        const [freshOrder] = await innerTx
          .select()
          .from(b2c_orders)
          .where(eq(b2c_orders.id, order.id))

        if (!freshOrder) return
        await ensureOrderDocumentsAfterWebhook(freshOrder, innerTx, 'Xpressbees')
      } catch (err: any) {
        console.error(`❌ Xpressbees document recovery flow error for ${order.order_number}:`, err)
      }
    }
  })

  if (isNdrLikeStatus(statusLower) || isNdrLikeStatus(statusText) || isNdrLikeStatus(remarks)) {
    try {
      await recordNdrEvent({
        orderId: order.id,
        userId: order.user_id,
        awbNumber: order.awb_number || undefined,
        status: statusLower,
        reason: remarks || null,
        remarks: statusText || null,
        payload,
      })
      await createNotificationService({
        targetRole: 'user',
        userId: order.user_id,
        title: 'Delivery attempt issue (Xpressbees)',
        message: `Order ${order.order_number} marked as ${statusLower}.`,
      })
      await createNotificationService({
        targetRole: 'admin',
        title: 'NDR captured (Xpressbees)',
        message: `User ${order.user_id} order ${order.order_number} status ${statusLower}`,
      })
    } catch (err) {
      console.error('❌ Failed to record NDR event (Xpressbees):', err)
    }
  }

  if (statusLower.includes('rto')) {
    try {
      const rtoCharge = await applyRtoChargeOnce(tx, order, 'Xpressbees')
      await recordRtoEvent({
        orderId: order.id,
        userId: order.user_id,
        awbNumber: order.awb_number || undefined,
        status: statusLower,
        reason: remarks || null,
        remarks: statusText || null,
        rtoCharges: rtoCharge,
        payload,
        tx,
      })
      await createNotificationService({
        targetRole: 'user',
        userId: order.user_id,
        title: 'RTO update (Xpressbees)',
        message: `Order ${order.order_number} status ${statusLower}.`,
      })
      await createNotificationService({
        targetRole: 'admin',
        title: 'RTO event (Xpressbees)',
        message: `User ${order.user_id} order ${order.order_number} ${statusLower}`,
      })
    } catch (err) {
      console.error('❌ Failed to record RTO event (Xpressbees):', err)
    }
  }

  if (internalStatus === 'delivered' && order.order_type === 'cod') {
    try {
      const { remittance, created } = await createCodRemittance({
        orderId: order.id,
        orderType: 'b2c',
        userId: order.user_id,
        orderNumber: order.order_number,
        awbNumber: order.awb_number || undefined,
        courierPartner: 'Xpressbees',
        codAmount: Number(order.order_amount ?? 0),
        codCharges: Number(order.cod_charges ?? 0),
        freightCharges: Number(order.freight_charges ?? order.shipping_charges ?? 0),
        collectedAt: new Date(),
      })

      if (created) {
        await createNotificationService({
          targetRole: 'admin',
          title: 'COD remittance created',
          message: `Order ${order.order_number} (${order.awb_number || 'no AWB'}) created pending COD remittance of ₹${Number(
            remittance.remittableAmount || 0,
          ).toFixed(2)}.`,
        })
      }
    } catch (err) {
      console.error(
        `❌ Failed to create COD remittance for Xpressbees order ${order.order_number}:`,
        err,
      )
    }
  }

  if (internalStatus === 'cancelled') {
    await applyCancellationRefundOnce(tx, order, 'xpressbees_webhook')
  }

  return { success: true }
}

const mapGenericWebhookStatus = (status: string): string => {
  const s = (status || '').toLowerCase().trim()
  if (!s) return 'in_transit'
  if (s.includes('cancel')) return 'cancelled'
  if (s.includes('returned to origin')) return 'rto_delivered'
  if (s.includes('return') && s.includes('origin') && s.includes('deliver')) return 'rto_delivered'
  if (s.includes('return') && s.includes('origin')) return 'rto_in_transit'
  if (s.includes('rto') && s.includes('deliver')) return 'rto_delivered'
  if (s.includes('rto')) return 'rto_in_transit'
  if (s.includes('ndr') || s.includes('undelivered') || s.includes('attempt')) return 'ndr'
  if (s.includes('out for delivery') || s.includes('ofd')) return 'out_for_delivery'
  if (s === 'delivered' || s.includes(' delivered') || s.includes('delivered ')) return 'delivered'
  if (s.includes('pickup scheduled') || s.includes('pickup requested')) return 'pickup_initiated'
  if (s.includes('pickup') || s.includes('manifest') || s.includes('booked') || s.includes('created')) {
    return 'booked'
  }
  if (s.includes('transit') || s.includes('dispatched')) return 'in_transit'
  return 'in_transit'
}

const normalizeProviderLabel = (provider: string) => {
  const p = String(provider || '').trim().toLowerCase()
  if (!p) return 'Courier'
  if (p === 'shiprocket') return 'Shiprocket'
  if (p === 'shipmozo') return 'Shipmozo'
  if (p === 'icarry') return 'iCarry'
  if (p === 'truxcargo') return 'Truxcargo'
  return p.charAt(0).toUpperCase() + p.slice(1)
}

const ICARRY_STATUS_LABELS: Record<string, string> = {
  '1': 'Pending Pickup',
  '2': 'Processing',
  '3': 'Shipped',
  '7': 'Canceled',
  '12': 'Damaged',
  '14': 'Lost',
  '16': 'Voided',
  '21': 'Delivered',
  '22': 'In Transit',
  '23': 'Returned to Origin',
  '24': 'Manifested',
  '25': 'Pickup Scheduled',
  '26': 'Out For Delivery',
  '27': 'Pending Return',
}

const ICARRY_NDR_DESCRIPTIONS: Record<string, string> = {
  'REATTEMPT-CONTACT':
    'Consignee address incomplete, wrong, or not reachable on mobile.',
  REATTEMPT: 'Delivery attempt failed.',
  MISROUTE: 'Shipment is in wrong delivery pincode.',
  'DC-ADDRESS': 'Delivery address is ODA or needs self collection.',
  'URGENT-DELIVERY': 'Delivery is beyond EDD.',
  'REATTEMPT-COD-NOT-READY': 'Consignee did not have COD amount ready or asked to come later.',
  'RTO-MISSING': 'Shipment is missing while in return.',
  'OPEN-DELIVERY': 'Consignee asked for open delivery before accepting parcel.',
  'CONSIGNEE-OPENED-REFUSED': 'Consignee opened the parcel and refused delivery.',
  'RTO-REATTEMPT': 'Return shipment delivery attempt failed.',
  'REATTEMPT-NEW-DATE': 'Consignee asked for a future delivery date.',
  'REATTEMPT-RESTRICTED-ENTRY': 'Consignee address entry is restricted.',
  'RTO-PACKING': 'Return shipment could not be completed due to improper packaging.',
  'REATTEMPT-CUST-REFUSED': 'Consignee refused shipment; reattempt requested.',
  'REATTEMPT-OTP': 'Consignee did not have OTP to accept delivery.',
  'MANUAL-VERIFY': 'Unknown NDR event; manual verification needed.',
  'RTO-SECURITY': 'Shipment returned due to security reason.',
  'FINANCE-EMBARGO': 'Shipment is held due to payment issue.',
  'EWAY-SEND': 'Shipment is held pending E-Way bill information.',
  'REATTEMPT-DAMAGE': 'Shipment is damaged.',
  'REATTEMPT-RTO-REFUSED': 'Return shipment has been refused by the shipper.',
  'REATTEMPT-OUTOFSTN': 'Consignee is not at the delivery address.',
}

const ICARRY_STATUS_CALLBACK_TYPES = new Set([
  '',
  'sync_status',
  'shipment_status',
  'shipment_status_update',
  'tracking_status',
  'status_update',
  'tracking_update',
])

const ICARRY_WEIGHT_CALLBACK_TYPES = new Set([
  'weight_dispute',
  'weight_dispute_event',
  'weight_discrepancy',
  'weight_discrepancy_event',
  'new_weight_discrepancy',
  'weight_update',
  'shipment_weight',
])

const firstPresent = (...values: unknown[]) => {
  for (const value of values) {
    if (value === undefined || value === null) continue
    const text = String(value).trim()
    if (text) return value
  }
  return undefined
}

const toNumberOrUndefined = (value: unknown) => {
  if (value === undefined || value === null || value === '') return undefined
  const normalized =
    typeof value === 'string' ? value.replace(/[^\d.-]/g, '') : String(value)
  const n = Number(normalized)
  return Number.isFinite(n) ? n : undefined
}

const normalizeWeightKg = (value: unknown, unit?: unknown, gramsLikely = false) => {
  const n = toNumberOrUndefined(value)
  if (n === undefined || n <= 0) return undefined

  const unitText = String(unit || '').trim().toLowerCase()
  if (unitText === 'g' || unitText === 'gm' || unitText === 'gram' || unitText === 'grams') {
    return n / 1000
  }

  if (unitText === 'kg' || unitText === 'kgs' || unitText === 'kilogram' || unitText === 'kilograms') {
    return n
  }

  return gramsLikely || n > 30 ? n / 1000 : n
}

const normalizeDimensions = (source: any, fallback: any) => ({
  length: Number(firstPresent(source?.length, source?.l, fallback?.length, 0)) || 0,
  breadth:
    Number(firstPresent(source?.breadth, source?.width, source?.b, fallback?.breadth, 0)) || 0,
  height: Number(firstPresent(source?.height, source?.h, fallback?.height, 0)) || 0,
})

const parseWebhookDate = (value: unknown) => {
  if (value === undefined || value === null || value === '') return undefined
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value

  const raw = String(value).trim()
  if (!raw) return undefined

  const normalized = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(raw)
    ? raw.replace(' ', 'T')
    : raw
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

const normalizeIcarryNdrType = (value: unknown) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\u0000-\u001f]+/g, '-')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const describeIcarryNdrType = (type: string) =>
  ICARRY_NDR_DESCRIPTIONS[type] || type.replace(/-/g, ' ').toLowerCase()

const mapIcarryStatus = (status: unknown) => {
  const raw = String(status ?? '').trim()
  const code = raw.replace(/\.0$/, '')
  const label = ICARRY_STATUS_LABELS[code]

  switch (code) {
    case '1':
    case '25':
      return { internalStatus: 'pickup_initiated', statusText: label || raw || 'Pickup initiated' }
    case '2':
    case '24':
      return { internalStatus: 'booked', statusText: label || raw || 'Booked' }
    case '3':
    case '22':
      return { internalStatus: 'in_transit', statusText: label || raw || 'In transit' }
    case '7':
    case '16':
      return { internalStatus: 'cancelled', statusText: label || raw || 'Cancelled' }
    case '12':
      return { internalStatus: 'damaged', statusText: label || raw || 'Damaged' }
    case '14':
      return { internalStatus: 'lost', statusText: label || raw || 'Lost' }
    case '21':
      return { internalStatus: 'delivered', statusText: label || raw || 'Delivered' }
    case '23':
      return { internalStatus: 'rto_delivered', statusText: label || raw || 'Returned to Origin' }
    case '26':
      return { internalStatus: 'out_for_delivery', statusText: label || raw || 'Out For Delivery' }
    case '27':
      return { internalStatus: 'rto_in_transit', statusText: label || raw || 'Pending Return' }
    default:
      return { internalStatus: mapGenericWebhookStatus(raw), statusText: label || raw || 'In Transit' }
  }
}

const resolveProviderStatus = (provider: string, status: unknown) => {
  if (String(provider || '').trim().toLowerCase() === 'icarry') {
    return mapIcarryStatus(status)
  }
  const statusText = String(status || '').trim()
  return {
    internalStatus: mapGenericWebhookStatus(statusText),
    statusText: statusText || 'in_transit',
  }
}

const getIcarryNdrItems = (payload: any) => {
  const rawItems =
    Array.isArray(payload?.ndr_data)
      ? payload.ndr_data
      : Array.isArray(payload?.data?.ndr_data)
        ? payload.data.ndr_data
        : Array.isArray(payload?.msg)
          ? payload.msg
          : []

  return rawItems.filter((item: any) => item && typeof item === 'object')
}

const getIcarryCourierEvent = (payload: any) => {
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return {
      ...payload.data,
      callback_type: payload.data.callback_type || payload.callback_type || payload.callbackType,
    }
  }
  if (payload?.msg && typeof payload.msg === 'object' && !Array.isArray(payload.msg)) {
    return {
      ...payload.msg,
      callback_type: payload.msg.callback_type || payload.callback_type || payload.callbackType,
    }
  }
  return payload
}

const getGenericCourierEvent = (payload: any) =>
  payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
    ? payload.data
    : payload

const getWebhookScanEvents = (event: any) => {
  const candidates = [
    event?.status_feed?.scan,
    event?.statusFeed?.scan,
    event?.tracking_feed?.scan,
    event?.trackingFeed?.scan,
    event?.scan,
    event?.scans,
    event?.tracking_history,
    event?.trackingHistory,
    event?.history,
    event?.events,
  ]

  const rawItems = candidates.find(Array.isArray) || []
  return rawItems
    .filter((item: any) => item && typeof item === 'object')
    .map((item: any) => {
      const status = firstPresent(
        item?.status,
        item?.current_status,
        item?.scan_status,
        item?.event,
        item?.event_name,
        item?.remarks,
        item?.message,
      )
      const date = firstPresent(
        item?.date,
        item?.status_time,
        item?.statusTime,
        item?.scan_time,
        item?.scanTime,
        item?.event_time,
        item?.eventTime,
        item?.timestamp,
        item?.created_at,
        item?.createdAt,
      )
      const location = firstPresent(
        item?.location,
        item?.current_location,
        item?.scan_location,
        item?.scanLocation,
        item?.hub_name,
        item?.hubName,
        item?.city,
      )

      return {
        status: status === undefined ? null : String(status),
        date: date === undefined ? null : String(date),
        location: location === undefined ? null : String(location),
        raw: item,
      }
    })
    .filter((item) => item.status || item.date || item.location)
}

const normalizeShipmozoWebhookEvent = (payload: any) => {
  const event = getGenericCourierEvent(payload)
  const scans = getWebhookScanEvents(event)
  const latestScan = scans[0]
  const referenceId = firstPresent(
    event?.refrence_id,
    event?.reference_id,
    event?.reference_number,
    event?.order_number,
    event?.client_order_id,
    event?.ref_no,
  )
  const providerOrderId = firstPresent(
    event?.shipment_id,
    event?.shipmentId,
    event?.shipment?.id,
    event?.shipmozo_order_id,
    event?.order_id,
    event?.orderId,
  )
  const status = firstPresent(
    event?.current_status,
    event?.shipment_status,
    event?.status,
    event?.event,
    latestScan?.status,
  )
  const statusTime = firstPresent(
    event?.status_time,
    event?.statusTime,
    event?.event_time,
    event?.eventTime,
    event?.updated_at,
    event?.updatedAt,
    latestScan?.date,
  )
  const location = firstPresent(
    event?.current_location,
    event?.location,
    event?.scan_location,
    event?.scanLocation,
    latestScan?.location,
  )
  const carrier = firstPresent(
    event?.carrier,
    event?.courier,
    event?.courier_name,
    event?.courierName,
  )

  return {
    ...event,
    shipment_id: firstPresent(event?.shipment_id, event?.shipmentId, providerOrderId),
    order_number: firstPresent(event?.order_number, referenceId),
    reference_number: firstPresent(event?.reference_number, referenceId),
    current_status: status,
    status: firstPresent(event?.status, status),
    status_time: statusTime,
    date: firstPresent(event?.date, statusTime),
    current_location: location,
    location: firstPresent(event?.location, location),
    courier_remarks: firstPresent(event?.courier_remarks, event?.remarks, event?.message, status),
    carrier,
  }
}

const extractCourierRefs = (event: any) => {
  const awb = firstPresent(
    event?.awb_number,
    event?.awb,
    event?.waybill,
    event?.tracking_no,
    event?.tracking_id,
    event?.trackingId,
    event?.wbn,
    event?.barcode,
  )
  const shipmentId = firstPresent(
    event?.shipment_id,
    event?.shipmentId,
    event?.provider_order_id,
    event?.providerOrderId,
    event?.shipmozo_order_id,
    event?.shipment?.id,
    event?.id,
  )
  const orderRef = firstPresent(
    event?.order_number,
    event?.order_id,
    event?.orderId,
    event?.client_order_id,
    event?.refrence_id,
    event?.reference_id,
    event?.reference_number,
    event?.tracking_ref,
    event?.ref_no,
  )

  return {
    awb: awb === undefined ? null : String(awb),
    shipmentId: shipmentId === undefined ? null : String(shipmentId),
    orderRef: orderRef === undefined ? null : String(orderRef),
  }
}

const findB2cOrderForCourierWebhook = async (
  tx: any,
  refs: { awb?: string | null; shipmentId?: string | null; orderRef?: string | null },
) => {
  let order
  if (refs.awb) {
    ;[order] = await tx.select().from(b2c_orders).where(eq(b2c_orders.awb_number, refs.awb))
  }
  if (!order && refs.shipmentId) {
    ;[order] = await tx
      .select()
      .from(b2c_orders)
      .where(eq(b2c_orders.shipment_id, refs.shipmentId))
  }
  if (!order && refs.orderRef) {
    ;[order] = await tx
      .select()
      .from(b2c_orders)
      .where(eq(b2c_orders.order_number, refs.orderRef))
  }
  if (!order && refs.orderRef) {
    ;[order] = await tx.select().from(b2c_orders).where(eq(b2c_orders.order_id, refs.orderRef))
  }

  return order
}

const resolveWebhookWeights = (provider: string, event: any, order: any) => {
  const normalizedProvider = String(provider || '').trim().toLowerCase()
  const isIcarry = normalizedProvider === 'icarry'
  const isShipmozo = normalizedProvider === 'shipmozo'
  const gramsUnit = firstPresent(
    event?.weight_unit,
    event?.weightUnit,
    event?.charged_weight_unit,
    event?.chargeable_weight_unit,
    event?.billing_weight_unit,
  )
  const actualWeight = normalizeWeightKg(
    firstPresent(
      event?.actual_weight,
      event?.actualWeight,
      event?.actual_wt,
      event?.dead_weight,
      event?.deadWeight,
      event?.physical_weight,
      event?.physicalWeight,
      event?.weighed_weight,
      event?.weighedWeight,
      event?.scanned_weight,
      event?.scannedWeight,
      event?.measured_weight,
      event?.measuredWeight,
    ),
    firstPresent(event?.actual_weight_unit, event?.weight_unit),
    false,
  )
  const volumetricWeight = normalizeWeightKg(
    firstPresent(
      event?.volumetric_weight,
      event?.volumetricWeight,
      event?.volumetric_wt,
      event?.vol_weight,
      event?.volWeight,
      event?.vol_weight_kg,
    ),
    firstPresent(event?.volumetric_weight_unit, event?.weight_unit),
    false,
  )
  const chargedWeight = normalizeWeightKg(
    firstPresent(
      event?.charged_weight,
      event?.chargedWeight,
      event?.charged_wt,
      event?.chargeable_weight,
      event?.chargeableWeight,
      event?.chargeable_wt,
      event?.billing_weight,
      event?.billingWeight,
      event?.billing_wt,
      event?.billed_weight,
      event?.billedWeight,
      event?.billed_wt,
      event?.applied_weight,
      event?.appliedWeight,
      isIcarry ? event?.weight : undefined,
      isShipmozo ? event?.weight : undefined,
    ),
    gramsUnit,
    isIcarry,
  )

  return {
    declaredWeight: Number(order?.weight ?? 0) || 0,
    actualWeight,
    volumetricWeight,
    chargedWeight,
  }
}

const maybeCreateWeightDiscrepancyFromWebhook = async (params: {
  provider: string
  providerLabel: string
  event: any
  payload: any
  order: any
  awb?: string | null
  remarks?: string | null
  statusText?: string | null
}) => {
  const { provider, providerLabel, event, payload, order, awb, remarks, statusText } = params
  const { declaredWeight, actualWeight, volumetricWeight, chargedWeight } = resolveWebhookWeights(
    provider,
    event,
    order,
  )

  if (!declaredWeight || !chargedWeight || chargedWeight <= declaredWeight) return

  const revisedShippingCharge = toNumberOrUndefined(
    firstPresent(
      event?.revised_shipping_charge,
      event?.shipping_charge,
      event?.courier_cost,
      event?.miles,
      event?.amount,
    ),
  )
  const proof = extractWeightProofFromWebhook(payload, String(provider || ''))
  const proofSlipUrl = proof?.weightSlipUrl
  const proofImages = proof?.weightImages?.length
    ? proof.weightImages
    : proofSlipUrl
      ? [proofSlipUrl]
      : undefined

  await createWeightDiscrepancy({
    orderType: 'b2c',
    orderId: order.id,
    userId: order.user_id,
    orderNumber: order.order_number,
    awbNumber: order.awb_number || awb || undefined,
    courierPartner: providerLabel,
    declaredWeight,
    actualWeight: actualWeight ?? declaredWeight,
    volumetricWeight,
    chargedWeight,
    declaredDimensions: normalizeDimensions(null, order),
    actualDimensions: normalizeDimensions(event?.actual_dimensions || event?.dimensions, order),
    originalShippingCharge: Number(order.freight_charges ?? order.shipping_charges ?? 0) || 0,
    revisedShippingCharge,
    courierRemarks: String(firstPresent(remarks, statusText, event?.type) || '').slice(0, 500),
    courierWeightSlipUrl: proofSlipUrl || undefined,
    courierWeightProofImages: proofImages,
    weighingMetadata: {
      timestamp: String(
        firstPresent(
          event?.status_time,
          event?.statusTime,
          event?.event_time,
          event?.eventTime,
          event?.date,
          event?.date_added,
          event?.updated_at,
          '',
        ) || '',
      ),
      location: String(firstPresent(event?.location, event?.city, event?.hub_name, '') || ''),
      source: `${String(provider || '').toLowerCase()}_webhook`,
    },
  })
}

const resolveNextNdrAttemptNo = async (orderId: string) => {
  const [latest] = await db
    .select({ attempt_no: ndr_events.attempt_no })
    .from(ndr_events)
    .where(eq(ndr_events.order_id, orderId))
    .orderBy(sql`${ndr_events.created_at} desc`)
    .limit(1)

  const lastAttempt = Number.parseInt(String(latest?.attempt_no || ''), 10)
  return String(Number.isFinite(lastAttempt) && lastAttempt > 0 ? lastAttempt + 1 : 1)
}

const emitTrackingWebhook = async (params: {
  order: any
  awbNumber?: string | null
  providerLabel: string
  internalStatus: string
  statusText: string
  location?: string | null
  payload: any
}) => {
  const { order, awbNumber, providerLabel, internalStatus, statusText, location, payload } = params
  await sendWebhookEvent(order.user_id, 'tracking.updated', {
    order_id: order.id,
    order_number: order.order_number,
    awb_number: awbNumber || order.awb_number || undefined,
    courier_partner: order.courier_partner || providerLabel,
    integration_type: order.integration_type,
    status: internalStatus,
    status_text: statusText,
    location,
    raw: payload,
    updated_at: new Date().toISOString(),
  }).catch((err) => {
    console.error(`Failed to send tracking.updated webhook for ${providerLabel}:`, err)
  })
}

export const __webhookProcessorTestUtils = {
  describeIcarryNdrType,
  getWebhookScanEvents,
  getIcarryNdrItems,
  mapGenericWebhookStatus,
  mapIcarryStatus,
  normalizeIcarryNdrType,
  normalizeShipmozoWebhookEvent,
  getIcarryCourierEvent,
  isIcarryStatusCallbackType: (value: unknown) =>
    ICARRY_STATUS_CALLBACK_TYPES.has(String(value || '').trim().toLowerCase()),
  isIcarryWeightCallbackType: (value: unknown) =>
    ICARRY_WEIGHT_CALLBACK_TYPES.has(String(value || '').trim().toLowerCase()),
  normalizeWeightKg,
  parseWebhookDate,
  resolveWebhookWeights,
}

const processSingleCourierWebhookEvent = async (params: {
  provider: string
  providerLabel: string
  event: any
  payload: any
  tx: any
  forceNdr?: boolean
  ndrType?: string | null
  ndrDate?: string | null
  ndrDedupeKey?: string | null
}) => {
  const {
    provider,
    providerLabel,
    event,
    payload,
    tx,
    forceNdr = false,
    ndrType,
    ndrDate,
    ndrDedupeKey,
  } = params
  const refs = extractCourierRefs(event)

  if (!refs.awb && !refs.shipmentId && !refs.orderRef) {
    return { success: false, reason: 'missing_awb' as const }
  }

  const order = await findB2cOrderForCourierWebhook(tx, refs)
  if (!order) {
    return {
      success: false,
      reason: 'order_not_found' as const,
      awb: refs.awb || refs.shipmentId || refs.orderRef,
      status: String(firstPresent(event?.status, event?.type, 'unknown') || 'unknown'),
    }
  }

  const scanEvents = getWebhookScanEvents(event)
  const latestScan = scanEvents[0]
  const statusRaw = firstPresent(
    event?.current_status,
    event?.shipment_status,
    event?.status,
    event?.event,
    event?.event_name,
    event?.scan_status,
    event?.remarks_status,
    latestScan?.status,
    ndrType,
    '',
  )
  const { internalStatus: mappedStatus, statusText: mappedStatusText } = resolveProviderStatus(
    provider,
    statusRaw,
  )
  const ndrReason = ndrType ? describeIcarryNdrType(ndrType) : null
  const remarks = String(
    firstPresent(
      event?.courier_remarks,
      event?.remarks,
      event?.remark,
      event?.message,
      event?.description,
      latestScan?.status,
      ndrReason,
      '',
    ) || '',
  )
  const location = firstPresent(
    event?.current_location,
    event?.location,
    event?.scan_location,
    event?.hub_name,
    event?.city,
    latestScan?.location,
    null,
  ) as string | null
  const eventTime = parseWebhookDate(
    firstPresent(
      event?.status_time,
      event?.statusTime,
      event?.event_time,
      event?.eventTime,
      event?.updated_at,
      event?.updatedAt,
      event?.date,
      latestScan?.date,
    ),
  )
  const isRtoEvent =
    mappedStatus.includes('rto') ||
    Boolean(ndrType && (ndrType.startsWith('RTO-') || ndrType.includes('RTO') || ndrType.includes('RETURN')))
  const internalStatus = forceNdr && !isRtoEvent ? 'ndr' : mappedStatus
  const statusLower = internalStatus.toLowerCase()
  const statusText =
    ndrType && ndrReason ? `${ndrType}: ${ndrReason}` : mappedStatusText || internalStatus
  const scanOperationalEvents = scanEvents.map((scan, index) => {
    const rawStatus = String(firstPresent(scan.status, '') || '')
    const mapped = resolveProviderStatus(provider, rawStatus)
    return {
      ...scan,
      index,
      rawStatus,
      internalStatus: mapped.internalStatus,
      statusText: mapped.statusText || rawStatus || mapped.internalStatus,
      eventTime: parseWebhookDate(scan.date),
    }
  })
  const hasScanNdr = scanOperationalEvents.some((scan) =>
    hasNdrSignal(scan.internalStatus, scan.statusText, scan.rawStatus),
  )
  const hasScanRto = scanOperationalEvents.some((scan) => scan.internalStatus.includes('rto'))
  const { actualWeight, volumetricWeight, chargedWeight } = resolveWebhookWeights(provider, event, order)

  const updateData: any = {
    order_status: internalStatus,
    updated_at: new Date(),
  }

  if (location) updateData.delivery_location = String(location)
  if (remarks || statusText) updateData.delivery_message = String(remarks || statusText).slice(0, 100)
  if (refs.awb && !order.awb_number) updateData.awb_number = refs.awb
  if (refs.shipmentId && !order.shipment_id) updateData.shipment_id = refs.shipmentId

  const expectedDeliveryDate = firstPresent(
    event?.expected_delivery_date,
    event?.expectedDeliveryDate,
    event?.estimated_delivery_date,
    event?.estimatedDeliveryDate,
    event?.edd,
    event?.eta,
  )
  if (expectedDeliveryDate) updateData.edd = String(expectedDeliveryDate).slice(0, 120)

  const carrierName = firstPresent(
    event?.carrier,
    event?.courier,
    event?.courier_name,
    event?.courierName,
    event?.courier_company,
    event?.courierCompany,
  )
  if (carrierName) updateData.courier_partner = String(carrierName).slice(0, 50)

  const courierCost = toNumberOrUndefined(
    firstPresent(
      event?.courier_cost,
      event?.shipping_charge,
      event?.freight_charges,
      event?.miles,
      event?.amount,
    ),
  )
  if (courierCost !== undefined) updateData.courier_cost = courierCost
  if (actualWeight !== undefined) updateData.actual_weight = actualWeight
  if (volumetricWeight !== undefined) updateData.volumetric_weight = volumetricWeight
  if (chargedWeight !== undefined) updateData.charged_weight = chargedWeight
  if (event?.label) updateData.label = String(event.label)
  if (event?.manifest) updateData.manifest = String(event.manifest)

  await tx.transaction(async (innerTx: any) => {
    await innerTx.update(b2c_orders).set(updateData).where(eq(b2c_orders.id, order.id))
    await syncShopifyStatusForLocalOrder({ ...order, ...updateData }, innerTx).catch((err) => {
      console.warn(`Failed Shopify status sync for ${providerLabel} webhook:`, err)
    })

    try {
      if (scanOperationalEvents.length) {
        for (const scan of scanOperationalEvents) {
          await logTrackingEvent({
            orderId: order.id,
            userId: order.user_id,
            awbNumber: refs.awb || order.awb_number,
            courier: providerLabel,
            statusCode: scan.internalStatus,
            statusText: scan.statusText,
            location: scan.location || null,
            raw: {
              provider: String(provider || '').toLowerCase(),
              scan: scan.raw,
              raw: payload,
            },
            createdAt: scan.eventTime,
          })
        }
      } else {
        await logTrackingEvent({
          orderId: order.id,
          userId: order.user_id,
          awbNumber: refs.awb || order.awb_number,
          courier: providerLabel,
          statusCode: internalStatus,
          statusText,
          location,
          raw: payload,
          createdAt: eventTime,
        })
      }
      await emitTrackingWebhook({
        order,
        awbNumber: refs.awb || order.awb_number,
        providerLabel,
        internalStatus,
        statusText,
        location,
        payload,
      })
    } catch (err: any) {
      console.error(`Failed to log ${providerLabel} tracking event:`, err)
    }

    if (
      ['booked', 'pickup_initiated', 'shipment_created', 'in_transit', 'out_for_delivery', 'delivered'].includes(
        internalStatus,
      )
    ) {
      const [freshOrder] = await innerTx.select().from(b2c_orders).where(eq(b2c_orders.id, order.id))
      if (freshOrder) await ensureOrderDocumentsAfterWebhook(freshOrder, innerTx, providerLabel)
    }
  })

  if (forceNdr || (!hasScanNdr && hasNdrSignal(statusLower, statusText, remarks))) {
    const explicitAttemptNo = String(
      firstPresent(event?.attempt_no, event?.attempt, event?.attempt_count, '') || '',
    )
    const attemptNo = explicitAttemptNo || (await resolveNextNdrAttemptNo(order.id))

    await captureNdrEventFromWebhook({
      order,
      awbNumber: refs.awb || order.awb_number || '',
      status: isRtoEvent ? 'rto' : statusLower,
      reason: remarks || ndrReason || null,
      remarks: statusText || null,
      attemptNo,
      dedupeKey: ndrDedupeKey || null,
      payload: forceNdr
        ? {
            provider: String(provider || '').toLowerCase(),
            callback_type: 'ndr_status',
            event: {
              ...event,
              type: ndrType || event?.type,
              date_added: ndrDate || event?.date_added,
            },
            raw: payload,
          }
        : payload,
      courierLabel: providerLabel,
      signalParts: [statusText, remarks, ndrType],
    }).catch((err) => console.error(`Failed NDR capture for ${providerLabel}:`, err))
  }

  if ((isRtoEvent || statusLower.includes('rto')) && !hasScanRto) {
    try {
      const rtoStatus = isRtoEvent && !statusLower.includes('rto') ? 'rto_in_transit' : statusLower
      const duplicate = await shouldSkipDuplicateRtoEvent({
        orderId: order.id,
        status: rtoStatus,
        reason: remarks || ndrReason || null,
        remarks: statusText || null,
      })
      if (!duplicate) {
        const rtoCharge = await applyRtoChargeOnce(tx, order, providerLabel)
        await recordRtoEvent({
          orderId: order.id,
          userId: order.user_id,
          awbNumber: refs.awb || order.awb_number || undefined,
          status: rtoStatus,
          reason: remarks || ndrReason || null,
          remarks: statusText || null,
          rtoCharges: rtoCharge,
          payload,
          tx,
        })
      }
    } catch (err) {
      console.error(`Failed RTO capture for ${providerLabel}:`, err)
    }
  }

  if (scanOperationalEvents.length) {
    for (const scan of [...scanOperationalEvents].reverse()) {
      const scanDedupeKey = `${String(provider || '').toLowerCase()}:${
        refs.awb || order.awb_number || refs.shipmentId || order.id
      }:scan:${scan.internalStatus}:${scan.date || scan.index}`

      if (hasNdrSignal(scan.internalStatus, scan.statusText, scan.rawStatus)) {
        const attemptNo = await resolveNextNdrAttemptNo(order.id)
        await captureNdrEventFromWebhook({
          order,
          awbNumber: refs.awb || order.awb_number || undefined,
          status: scan.internalStatus,
          reason: scan.rawStatus || scan.statusText || null,
          remarks: scan.statusText || null,
          attemptNo,
          dedupeKey: scanDedupeKey,
          payload: {
            provider: String(provider || '').toLowerCase(),
            event: scan.raw,
            raw: payload,
            __dedupe_key: scanDedupeKey,
          },
          courierLabel: providerLabel,
          signalParts: [scan.rawStatus, scan.statusText],
        }).catch((err) => console.error(`Failed scan NDR capture for ${providerLabel}:`, err))
      }

      if (scan.internalStatus.includes('rto')) {
        try {
          const duplicate = await shouldSkipDuplicateRtoEvent({
            orderId: order.id,
            status: scan.internalStatus,
            reason: scan.rawStatus || scan.statusText || null,
            remarks: scan.statusText || null,
            dedupeKey: scanDedupeKey,
          })
          if (duplicate) continue

          const rtoCharge = await applyRtoChargeOnce(tx, order, providerLabel)
          await recordRtoEvent({
            orderId: order.id,
            userId: order.user_id,
            awbNumber: refs.awb || order.awb_number || undefined,
            status: scan.internalStatus,
            reason: scan.rawStatus || scan.statusText || null,
            remarks: scan.statusText || null,
            rtoCharges: rtoCharge,
            payload: {
              provider: String(provider || '').toLowerCase(),
              event: scan.raw,
              raw: payload,
              __dedupe_key: scanDedupeKey,
            },
            tx,
          })
        } catch (err) {
          console.error(`Failed scan RTO capture for ${providerLabel}:`, err)
        }
      }
    }
  }

  if (internalStatus === 'delivered' && order.order_type === 'cod') {
    try {
      await createCodRemittance({
        orderId: order.id,
        orderType: 'b2c',
        userId: order.user_id,
        orderNumber: order.order_number,
        awbNumber: refs.awb || order.awb_number || undefined,
        courierPartner: providerLabel,
        codAmount: Number(order.order_amount ?? 0),
        codCharges: Number(order.cod_charges ?? 0),
        freightCharges: Number(order.freight_charges ?? order.shipping_charges ?? 0),
        collectedAt: new Date(),
      })
    } catch (err) {
      console.error(`Failed COD remittance for ${providerLabel}:`, err)
    }
  }

  if (internalStatus === 'cancelled') {
    await applyCancellationRefundOnce(tx, order, `${String(provider || '').toLowerCase()}_webhook`)
  }

  try {
    await maybeCreateWeightDiscrepancyFromWebhook({
      provider,
      providerLabel,
      event,
      payload,
      order,
      awb: refs.awb,
      remarks,
      statusText,
    })
  } catch (err) {
    console.error(`Failed weight discrepancy handling for ${providerLabel}:`, err)
  }

  return {
    success: true as const,
    awb: String(refs.awb || order.awb_number || ''),
    status: statusText,
  }
}

const processIcarryCourierWebhook = async (payload: any, tx: any) => {
  const callbackType = String(payload?.callback_type || payload?.callbackType || '')
    .trim()
    .toLowerCase()
  const providerLabel = normalizeProviderLabel('icarry')

  if (callbackType === 'ndr_status') {
    const items = getIcarryNdrItems(payload)
    if (!items.length) {
      return { success: false, reason: 'invalid_payload' as const, message: 'ndr_data is required' }
    }

    const results = []
    for (const item of items) {
      const ndrType = normalizeIcarryNdrType(firstPresent(item?.type, item?.ndr_type, item?.event_type))
      const ndrDate = String(firstPresent(item?.date_added, item?.date, item?.event_date, '') || '')
      const refs = extractCourierRefs(item)
      const dedupeKey =
        refs.awb || refs.shipmentId
          ? `icarry:ndr:${refs.awb || refs.shipmentId}:${ndrType || 'unknown'}:${ndrDate || 'no-date'}`
          : null

      results.push(
        await processSingleCourierWebhookEvent({
          provider: 'icarry',
          providerLabel,
          event: {
            ...item,
            status: ndrType || item?.status || 'ndr',
            remarks: describeIcarryNdrType(ndrType),
          },
          payload,
          tx,
          forceNdr: true,
          ndrType,
          ndrDate,
          ndrDedupeKey: dedupeKey,
        }),
      )
    }

    const processed = results.filter((result) => result.success)
    if (processed.length) {
      return {
        success: true as const,
        processed: processed.length,
        failed: results.length - processed.length,
        results,
      }
    }

    const first = results[0] as any
    return {
      success: false,
      reason: first?.reason || 'order_not_found',
      awb: first?.awb,
      status: first?.status || 'ndr_status',
      results,
    }
  }

  if (ICARRY_WEIGHT_CALLBACK_TYPES.has(callbackType)) {
    const event = getIcarryCourierEvent(payload)
    const refs = extractCourierRefs(event)
    if (!refs.awb && !refs.shipmentId && !refs.orderRef) {
      return { success: false, reason: 'missing_awb' as const }
    }

    const order = await findB2cOrderForCourierWebhook(tx, refs)
    if (!order) {
      return {
        success: false,
        reason: 'order_not_found' as const,
        awb: refs.awb || refs.shipmentId || refs.orderRef,
        status: 'weight_dispute',
      }
    }

    const { actualWeight, volumetricWeight, chargedWeight } = resolveWebhookWeights(
      'icarry',
      event,
      order,
    )
    const updateData: any = {
      updated_at: new Date(),
    }
    if (actualWeight !== undefined) updateData.actual_weight = actualWeight
    if (volumetricWeight !== undefined) updateData.volumetric_weight = volumetricWeight
    if (chargedWeight !== undefined) {
      updateData.charged_weight = chargedWeight
      if (chargedWeight > Number(order.weight ?? 0)) updateData.weight_discrepancy = true
    }

    if (Object.keys(updateData).length > 1) {
      await tx.update(b2c_orders).set(updateData).where(eq(b2c_orders.id, order.id))
    }

    await maybeCreateWeightDiscrepancyFromWebhook({
      provider: 'icarry',
      providerLabel,
      event,
      payload,
      order,
      awb: refs.awb,
      remarks: String(firstPresent(event?.remarks, event?.message, event?.type, 'weight_dispute') || ''),
      statusText: 'weight_dispute',
    })

    return {
      success: true as const,
      awb: String(refs.awb || order.awb_number || ''),
      status: 'weight_dispute',
    }
  }

  if (!ICARRY_STATUS_CALLBACK_TYPES.has(callbackType)) {
    return {
      success: false,
      reason: 'invalid_callback_type' as const,
      message: `Unsupported iCarry callback_type: ${callbackType}`,
    }
  }

  const event = getIcarryCourierEvent(payload)
  return processSingleCourierWebhookEvent({
    provider: 'icarry',
    providerLabel,
    event,
    payload,
    tx,
  })
}

const processShipmozoCourierWebhook = async (payload: any, tx: any) =>
  processSingleCourierWebhookEvent({
    provider: 'shipmozo',
    providerLabel: normalizeProviderLabel('shipmozo'),
    event: normalizeShipmozoWebhookEvent(payload),
    payload,
    tx,
  })

export async function processGenericCourierWebhook(provider: string, payload: any, tx = db) {
  const normalizedProvider = String(provider || '').trim().toLowerCase()
  if (normalizedProvider === 'icarry') {
    return processIcarryCourierWebhook(payload, tx)
  }
  if (normalizedProvider === 'shipmozo') {
    return processShipmozoCourierWebhook(payload, tx)
  }

  const event = getGenericCourierEvent(payload)
  const refs = extractCourierRefs(event)
  const awb = refs.awb
  const orderRef = refs.orderRef
  const statusRaw =
    event?.current_status ||
    event?.shipment_status ||
    event?.status ||
    event?.event ||
    event?.event_name ||
    event?.scan_status ||
    event?.remarks_status ||
    ''
  const remarks =
    event?.courier_remarks ||
    event?.remarks ||
    event?.remark ||
    event?.message ||
    event?.description ||
    ''
  const location =
    event?.current_location ||
    event?.location ||
    event?.scan_location ||
    event?.hub_name ||
    event?.city ||
    null

  if (!refs.awb && !refs.shipmentId && !refs.orderRef) {
    return { success: false, reason: 'missing_awb' as const }
  }

  const order = await findB2cOrderForCourierWebhook(tx, refs)

  if (!order) return { success: false, reason: 'order_not_found' as const, awb, status: statusRaw || 'unknown' }

  const { internalStatus, statusText } = resolveProviderStatus(normalizedProvider, statusRaw)
  const statusLower = internalStatus.toLowerCase()
  const providerLabel = normalizeProviderLabel(normalizedProvider)

  const updateData: any = {
    order_status: internalStatus,
    delivery_location: location,
    delivery_message: remarks || null,
    updated_at: new Date(),
  }

  if (event?.courier_cost !== undefined) updateData.courier_cost = Number(event.courier_cost)
  if (event?.shipping_charge !== undefined && updateData.courier_cost === undefined) {
    updateData.courier_cost = Number(event.shipping_charge)
  }
  if (event?.charged_weight !== undefined) updateData.charged_weight = Number(event.charged_weight)
  if (event?.chargeable_weight !== undefined && updateData.charged_weight === undefined) {
    updateData.charged_weight = Number(event.chargeable_weight)
  }
  if (event?.volumetric_weight !== undefined) updateData.volumetric_weight = Number(event.volumetric_weight)
  if (event?.actual_weight !== undefined) updateData.actual_weight = Number(event.actual_weight)

  await tx.transaction(async (innerTx) => {
    await innerTx.update(b2c_orders).set(updateData).where(eq(b2c_orders.id, order.id))
    await syncShopifyStatusForLocalOrder({ ...order, ...updateData }, innerTx).catch((err) => {
      console.warn(`⚠️ Failed Shopify status sync for ${providerLabel} webhook:`, err)
    })

    try {
      await logTrackingEvent({
        orderId: order.id,
        userId: order.user_id,
        awbNumber: refs.awb || order.awb_number,
        courier: providerLabel,
        statusCode: internalStatus,
        statusText,
        location,
        raw: payload,
      })
      await emitTrackingWebhook({
        order,
        awbNumber: refs.awb || order.awb_number,
        providerLabel,
        internalStatus,
        statusText,
        location,
        payload,
      })
    } catch (err: any) {
      console.error(`❌ Failed to log ${providerLabel} tracking event:`, err)
    }

    if (
      ['booked', 'pickup_initiated', 'shipment_created', 'in_transit', 'out_for_delivery', 'delivered'].includes(
        internalStatus,
      )
    ) {
      const [freshOrder] = await innerTx.select().from(b2c_orders).where(eq(b2c_orders.id, order.id))
      if (freshOrder) await ensureOrderDocumentsAfterWebhook(freshOrder, innerTx, providerLabel)
    }
  })

  if (hasNdrSignal(statusLower, statusText, remarks)) {
    await captureNdrEventFromWebhook({
      order,
      awbNumber: order.awb_number || String(awb || ''),
      status: statusLower,
      reason: remarks || null,
      remarks: statusText || null,
      payload,
      courierLabel: providerLabel,
      signalParts: [statusText, remarks],
    }).catch((err) => console.error(`❌ Failed NDR capture for ${providerLabel}:`, err))
  }

  if (statusLower.includes('rto')) {
    try {
      const rtoCharge = await applyRtoChargeOnce(tx, order, providerLabel)
      await recordRtoEvent({
        orderId: order.id,
        userId: order.user_id,
        awbNumber: order.awb_number || undefined,
        status: statusLower,
        reason: remarks || null,
        remarks: statusText || null,
        rtoCharges: rtoCharge,
        payload,
        tx,
      })
    } catch (err) {
      console.error(`❌ Failed RTO capture for ${providerLabel}:`, err)
    }
  }

  if (internalStatus === 'delivered' && order.order_type === 'cod') {
    try {
      await createCodRemittance({
        orderId: order.id,
        orderType: 'b2c',
        userId: order.user_id,
        orderNumber: order.order_number,
        awbNumber: order.awb_number || undefined,
        courierPartner: providerLabel,
        codAmount: Number(order.order_amount ?? 0),
        codCharges: Number(order.cod_charges ?? 0),
        freightCharges: Number(order.freight_charges ?? order.shipping_charges ?? 0),
        collectedAt: new Date(),
      })
    } catch (err) {
      console.error(`❌ Failed COD remittance for ${providerLabel}:`, err)
    }
  }

  if (internalStatus === 'cancelled') {
    await applyCancellationRefundOnce(tx, order, `${String(provider || '').toLowerCase()}_webhook`)
  }

  try {
    await maybeCreateWeightDiscrepancyFromWebhook({
      provider: normalizedProvider,
      providerLabel,
      event,
      payload,
      order,
      awb,
      remarks,
      statusText,
    })
  } catch (err) {
    console.error(`❌ Failed weight discrepancy handling for ${providerLabel}:`, err)
  }

  return { success: true as const, awb: String(awb || order.awb_number || ''), status: statusText }
}

export const processShipmozoWebhook = (payload: any, tx = db) =>
  processShipmozoCourierWebhook(payload, tx)
export const processShiprocketWebhook = (payload: any, tx = db) =>
  processGenericCourierWebhook('shiprocket', payload, tx)
export const processTruxcargoWebhook = (payload: any, tx = db) =>
  processGenericCourierWebhook('truxcargo', payload, tx)
export const processIcarryWebhook = (payload: any, tx = db) =>
  processGenericCourierWebhook('icarry', payload, tx)
