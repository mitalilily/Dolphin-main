import axios from 'axios'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../client'
import { b2b_orders } from '../schema/b2bOrders'
import { b2c_orders } from '../schema/b2cOrders'
import { invoicePreferences } from '../schema/invoicePreferences'
import { userProfiles } from '../schema/userProfile'
import { users } from '../schema/users'
import { sanitizeOrdersForCustomer } from '../../utils/orderSanitizer'
import { IOrderFilters, PaginationParams } from './shiprocket.service'
import { generateLabelForOrder } from './generateCustomLabelService'
import dayjs from 'dayjs'
import { generateInvoicePDF, Product } from './invoice.service'
import {
  formatPickupAddress,
  loadInvoiceAssets,
  normalizePickupDetails,
} from './invoiceHelpers'
import { presignDownload, presignUpload } from './upload.service'
import { resolveInvoiceNumber } from './invoiceNumber.service'
import { logTrackingEvent } from './trackingEvents.service'
import { createNotificationService } from './notifications.service'
import { sendWebhookEvent } from '../../services/webhookDelivery.service'
import { recordRtoEvent } from './rto.service'
import { applyRtoChargeOnce } from './webhookProcessor'

const ADMIN_EDITABLE_ORDER_STATUSES = new Set([
  'pending',
  'booked',
  'pickup_initiated',
  'shipment_created',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'ndr',
  'undelivered',
  'rto',
  'rto_in_transit',
  'rto_delivered',
  'cancelled',
  'manifest_failed',
  'cancellation_requested',
])

const ADMIN_RTO_STATUSES = new Set(['rto', 'rto_in_transit', 'rto_delivered'])

export const getAllOrdersServiceAdmin = async ({
  page = 1,
  limit = 10,
  filters = {} as IOrderFilters,
}: PaginationParams & { filters?: IOrderFilters }) => {
  const offset = (page - 1) * limit

  // Fetch B2C orders
  const b2cOrdersRaw = await db.select().from(b2c_orders)
  const b2cOrders = (b2cOrdersRaw ?? []).map((o) => ({ ...o, type: 'b2c' }))

  // Fetch B2B orders
  const b2bOrdersRaw = await db.select().from(b2b_orders)
  const b2bOrders = (b2bOrdersRaw ?? []).map((o) => ({ ...o, type: 'b2b' }))

  // Combine both
  let combinedOrders: any[] = [...b2cOrders, ...b2bOrders]

  // ✅ Append user profiles
  const userIds = combinedOrders
    .map((order) => order.user_id)
    .filter((id): id is string => Boolean(id))

  let userProfilesMap = new Map<string, any>()
  let usersMap = new Map<string, any>()

  if (userIds.length > 0) {
    const uniqueUserIds = Array.from(new Set(userIds))

    const profiles = await db
      .select()
      .from(userProfiles)
      .where(inArray(userProfiles.userId, uniqueUserIds))

    userProfilesMap = new Map(profiles.map((profile) => [profile.userId, profile]))

    const userRows = await db.select().from(users).where(inArray(users.id, uniqueUserIds))
    usersMap = new Map(userRows.map((u) => [u.id, u]))
  }

  combinedOrders = combinedOrders.map((order) => {
    const userId = order.user_id
    const profile = userId ? userProfilesMap.get(userId) || null : null
    const userRecord = userId ? usersMap.get(userId) || null : null

    const companyName =
      profile?.companyInfo?.companyName ||
      profile?.companyInfo?.displayName ||
      null

    return {
      ...order,
      userProfile: profile,
      merchantName: companyName || userRecord?.email || userRecord?.phone || null,
      merchantEmail: userRecord?.email || null,
      merchantPhone: userRecord?.phone || null,
    }
  })

  // ✅ Apply filters
  if (filters.userId) {
    combinedOrders = combinedOrders.filter((o) => o.user_id === filters.userId)
  }

  if (filters.status) {
    combinedOrders = combinedOrders.filter((o) => o.order_status === filters.status)
  }

  if (filters.fromDate) {
    combinedOrders = combinedOrders.filter((o) =>
      o.created_at ? new Date(o.created_at) >= new Date(filters.fromDate!) : false,
    )
  }

  if (filters.toDate) {
    combinedOrders = combinedOrders.filter((o) =>
      o.created_at ? new Date(o.created_at) <= new Date(filters.toDate!) : false,
    )
  }

  if (filters.search) {
    const keyword = filters.search.toLowerCase()
    combinedOrders = combinedOrders.filter((o) => {
      return (
        o.order_number?.toLowerCase().includes(keyword) ||
        o.buyer_name?.toLowerCase().includes(keyword) ||
        o.buyer_phone?.includes(keyword) ||
        o.awb_number?.includes(keyword)
        // o.userProfile?.name?.toLowerCase().includes(keyword) || // ✅ search in user profile
        // o.userProfile?.email?.toLowerCase().includes(keyword)
      )
    })
  }

  // ✅ Sort safely
  const sortBy = filters.sortBy || 'created_at'
  const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc'
  combinedOrders.sort((a, b) => {
    if (sortBy !== 'created_at') return 0
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
  })

  // Counts + pagination
  const totalCount = combinedOrders.length
  if (totalCount === 0) {
    return {
      orders: [],
      totalCount: 0,
      totalPages: 0,
    }
  }

  const totalPages = Math.ceil(totalCount / limit)
  const paginatedOrders = combinedOrders.slice(offset, offset + limit)
  const enrichedOrders = await sanitizeOrdersForCustomer(paginatedOrders)

  return {
    orders: enrichedOrders,
    totalCount,
    totalPages,
  }
}

const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const normalizeProducts = (rawProducts: unknown, fallbackAmount = 0): Product[] => {
  let productsData: any[] = []
  if (Array.isArray(rawProducts)) {
    productsData = rawProducts
  } else if (typeof rawProducts === 'string' && rawProducts.trim()) {
    try {
      const parsed = JSON.parse(rawProducts)
      productsData = Array.isArray(parsed) ? parsed : []
    } catch {
      productsData = []
    }
  }

  const products = productsData.map((p: any) => ({
    name: p?.name ?? p?.productName ?? p?.box_name ?? 'N/A',
    price: toNumber(p?.price),
    qty: Math.max(1, toNumber(p?.qty ?? p?.quantity, 1)),
    sku: p?.sku ?? p?.skuCode ?? '',
    hsn: p?.hsn ?? p?.hsnCode ?? '',
    discount: Math.max(0, toNumber(p?.discount)),
    tax_rate: Math.max(0, toNumber(p?.tax_rate ?? p?.taxRate)),
  }))

  if (products.length > 0) return products
  return [
    {
      name: 'Product',
      price: toNumber(fallbackAmount),
      qty: 1,
      sku: '',
      hsn: '',
      discount: 0,
      tax_rate: 0,
    },
  ]
}

export const regenerateOrderDocumentsServiceAdmin = async ({
  orderId,
  regenerateLabel = true,
  regenerateInvoice = true,
  expectedUserId,
}: {
  orderId: string
  regenerateLabel?: boolean
  regenerateInvoice?: boolean
  expectedUserId?: string
}) => {
  if (!regenerateLabel && !regenerateInvoice) {
    throw new Error('At least one document must be selected for regeneration')
  }

  const [b2cOrder] = await db.select().from(b2c_orders).where(eq(b2c_orders.id, orderId)).limit(1)
  const [b2bOrder] = b2cOrder
    ? [undefined]
    : await db.select().from(b2b_orders).where(eq(b2b_orders.id, orderId)).limit(1)

  const order = b2cOrder || b2bOrder
  if (!order) throw new Error('Order not found')

  const orderType = b2cOrder ? 'b2c' : 'b2b'
  const userId = order.user_id
  if (!userId) throw new Error('Order user not found')
  if (expectedUserId && userId !== expectedUserId) {
    throw new Error('Order not found')
  }

  let newLabelKey: string | null = null
  let newInvoiceKey: string | null = null

  if (regenerateLabel) {
    const labelKey = await generateLabelForOrder(order, userId, db)
    if (!labelKey || typeof labelKey !== 'string') {
      throw new Error('Label regeneration failed')
    }
    newLabelKey = labelKey.trim()
  }

  let generatedInvoiceData: { number: string; date: string; amount: number } | null = null

  if (regenerateInvoice) {
    const [prefs] = await db
      .select()
      .from(invoicePreferences)
      .where(eq(invoicePreferences.userId, userId))
      .limit(1)
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1)
    const companyInfo = (profile as any)?.companyInfo || {}
    const gstDetails = (profile as any)?.gstDetails || {}
    const companyName =
      companyInfo.companyName || companyInfo.businessName || companyInfo.brandName || ''
    const companyGST = gstDetails.gstNumber || companyInfo.gstNumber || ''

    const invoiceNumber = await resolveInvoiceNumber({
      userId,
      existingInvoiceNumber: (order as any)?.invoice_number,
      prefix: prefs?.prefix ?? undefined,
      suffix: prefs?.suffix ?? undefined,
    })
    const invoiceDateDisplay = dayjs().format('DD MMM YYYY')
    const invoiceDateStored = dayjs().format('YYYY-MM-DD')
    const pickupDetails = normalizePickupDetails(order.pickup_details)
    const pickupPincode = pickupDetails?.pincode

    const serviceType = (order as any).service_type || order.integration_type || order.courier_partner || ''
    const pickupAddress = formatPickupAddress(pickupDetails)
    const sellerAddress =
      pickupAddress || companyInfo.companyAddress || companyInfo.address || ''
    const sellerStateCode = pickupDetails?.state || companyInfo.state || ''
    const sellerName =
      pickupDetails?.warehouse_name ||
      companyInfo.brandName ||
      companyInfo.companyName ||
      companyInfo.businessName ||
      'Seller'
    const brandName = companyInfo.brandName || companyInfo.companyName || pickupDetails?.warehouse_name || ''
    const gstNumber = companyGST || companyInfo.gstNumber || companyInfo.gst || ''
    const panNumber = companyInfo.panNumber || companyInfo.pan || ''
    const supportPhone =
      pickupDetails?.phone ||
      companyInfo.companyContactNumber ||
      companyInfo.contactNumber ||
      prefs?.supportPhone ||
      ''
    const supportEmail =
      companyInfo.contactEmail || companyInfo.companyEmail || prefs?.supportEmail || ''

    const products = normalizeProducts(order.products, toNumber(order.order_amount))
    const { logoBuffer, signatureBuffer } = await loadInvoiceAssets(
      {
        companyLogoKey: companyInfo.companyLogoUrl ?? undefined,
        includeSignature: prefs?.includeSignature,
        signatureFile: prefs?.signatureFile ?? undefined,
      },
      order.order_number || String(order.id),
    )

    const invoiceAmount =
      toNumber(order.order_amount) +
      toNumber(order.shipping_charges) +
      toNumber((order as any).gift_wrap) +
      toNumber((order as any).transaction_fee) -
      (toNumber((order as any).discount) + toNumber((order as any).prepaid_amount))

    generatedInvoiceData = {
      number: invoiceNumber,
      date: invoiceDateStored,
      amount: invoiceAmount,
    }

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
      products,
      shippingCharges: toNumber(order.shipping_charges),
      giftWrap: toNumber((order as any).gift_wrap),
      transactionFee: toNumber((order as any).transaction_fee),
      discount: toNumber((order as any).discount),
      prepaidAmount: toNumber((order as any).prepaid_amount),
      courierName: (order as any).courier_partner ?? '',
      courierId: String((order as any).courier_id ?? ''),
      logoBuffer,
      orderType: (order.order_type as 'prepaid' | 'cod') || 'prepaid',
      courierCod: order.order_type === 'cod' ? toNumber((order as any).cod_charges) : 0,
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
      layout: ((prefs?.template as 'classic' | 'thermal') ?? 'classic'),
    })

    const { uploadUrl, key } = await presignUpload({
      filename: `invoice-${order.id}.pdf`,
      contentType: 'application/pdf',
      userId,
      folderKey: 'invoices',
    })
    const finalUploadUrl = Array.isArray(uploadUrl) ? uploadUrl[0] : uploadUrl
    await axios.put(finalUploadUrl, invoiceBuffer, {
      headers: { 'Content-Type': 'application/pdf' },
      validateStatus: (status) => status >= 200 && status < 300,
      timeout: 60000,
    })
    const finalKey = Array.isArray(key) ? key[0] : key
    if (!finalKey || typeof finalKey !== 'string') {
      throw new Error('Invoice upload key missing')
    }
    newInvoiceKey = finalKey.trim()
  }

  const updates: Record<string, unknown> = { updated_at: new Date() }
  if (newLabelKey) updates.label = newLabelKey
  if (newInvoiceKey) updates.invoice_link = newInvoiceKey
  if (newInvoiceKey && generatedInvoiceData) {
    updates.invoice_number = generatedInvoiceData.number
    updates.invoice_date = generatedInvoiceData.date
    updates.invoice_amount = generatedInvoiceData.amount
  }

  if (orderType === 'b2c') {
    await db.update(b2c_orders).set(updates).where(eq(b2c_orders.id, orderId))
  } else {
    await db.update(b2b_orders).set(updates).where(eq(b2b_orders.id, orderId))
  }

  return {
    orderId,
    orderType,
    label: newLabelKey,
    invoice_link: newInvoiceKey,
  }
}

export const updateOrderStatusServiceAdmin = async ({
  orderId,
  nextStatus,
  note,
  adminUserId,
}: {
  orderId: string
  nextStatus: string
  note?: string
  adminUserId?: string
}) => {
  const normalizedStatus = String(nextStatus || '').trim().toLowerCase()
  if (!normalizedStatus) throw new Error('Status is required')
  if (!ADMIN_EDITABLE_ORDER_STATUSES.has(normalizedStatus)) {
    throw new Error(`Unsupported status "${nextStatus}"`)
  }

  const [b2cOrder] = await db.select().from(b2c_orders).where(eq(b2c_orders.id, orderId)).limit(1)
  const [b2bOrder] = b2cOrder
    ? [undefined]
    : await db.select().from(b2b_orders).where(eq(b2b_orders.id, orderId)).limit(1)

  const order = b2cOrder || b2bOrder
  if (!order) throw new Error('Order not found')

  const previousStatus = String(order.order_status || '').trim().toLowerCase()
  if (previousStatus === normalizedStatus) {
    return {
      orderId: order.id,
      orderType: b2cOrder ? 'b2c' : 'b2b',
      previousStatus,
      currentStatus: normalizedStatus,
      updated: false,
    }
  }

  const enteredRtoFlow =
    b2cOrder && !ADMIN_RTO_STATUSES.has(previousStatus) && ADMIN_RTO_STATUSES.has(normalizedStatus)

  await db.transaction(async (tx) => {
    const updatePayload = { order_status: normalizedStatus, updated_at: new Date() }

    if (b2cOrder) {
      await tx.update(b2c_orders).set(updatePayload).where(eq(b2c_orders.id, order.id))
    } else {
      await tx.update(b2b_orders).set(updatePayload).where(eq(b2b_orders.id, order.id))
    }

    if (enteredRtoFlow) {
      const rtoCharge = await applyRtoChargeOnce(
        tx,
        order,
        order.courier_partner || order.integration_type || 'Admin',
      )

      await recordRtoEvent({
        orderId: order.id,
        userId: order.user_id,
        awbNumber: order.awb_number || undefined,
        status: normalizedStatus,
        reason: note || 'RTO status updated by admin',
        remarks: `Admin status update from ${previousStatus || 'unknown'} to ${normalizedStatus}`,
        rtoCharges: rtoCharge,
        payload: {
          source: 'admin_panel',
          previousStatus,
          nextStatus: normalizedStatus,
          note: note || null,
          adminUserId: adminUserId || null,
        },
        tx,
      })
    }
  })

  if (b2cOrder) {
    await logTrackingEvent({
      orderId: order.id,
      userId: order.user_id,
      awbNumber: order.awb_number || null,
      courier: order.courier_partner || order.integration_type || 'Admin',
      statusCode: normalizedStatus,
      statusText: note || `Status updated by admin: ${normalizedStatus}`,
      raw: {
        source: 'admin_panel',
        previousStatus,
        nextStatus: normalizedStatus,
        note: note || null,
        adminUserId: adminUserId || null,
      },
    }).catch((err) => {
      console.error('Failed to log admin order status tracking event:', err)
    })
  }

  await createNotificationService({
    targetRole: 'user',
    userId: order.user_id,
    title: 'Order status updated',
    message: `Order ${order.order_number || order.id} status changed to ${normalizedStatus} by admin.`,
  }).catch((err) => {
    console.error('Failed to create user notification for admin order status update:', err)
  })

  await createNotificationService({
    targetRole: 'admin',
    title: 'Admin order status update',
    message: `Order ${order.order_number || order.id} moved from ${previousStatus || 'unknown'} to ${normalizedStatus}.`,
  }).catch((err) => {
    console.error('Failed to create admin notification for order status update:', err)
  })

  await sendWebhookEvent(order.user_id, 'order.updated', {
    order_id: order.id,
    order_number: order.order_number || undefined,
    awb_number: order.awb_number || undefined,
    previous_status: previousStatus || undefined,
    status: normalizedStatus,
    updated_by: 'admin',
    note: note || undefined,
    updated_at: new Date().toISOString(),
  }).catch((err) => {
    console.error('Failed to send admin order.updated webhook:', err)
  })

  return {
    orderId: order.id,
    orderType: b2cOrder ? 'b2c' : 'b2b',
    previousStatus,
    currentStatus: normalizedStatus,
    updated: true,
  }
}
