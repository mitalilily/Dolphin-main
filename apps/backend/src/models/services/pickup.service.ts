import { and, eq } from 'drizzle-orm'
import { db } from '../client'
import { b2c_orders } from '../schema/b2cOrders'
import { DelhiveryService } from './couriers/delhivery.service'
import { EkartService } from './couriers/ekart.service'
import { IcarryService } from './couriers/icarry.service'
import { ShiprocketCourierService } from './couriers/shiprocket.service'
import { ShipmozoService } from './couriers/shipmozo.service'
import { TruxcargoService } from './couriers/truxcargo.service'
import { XpressbeesService } from './couriers/xpressbees.service'
import { applyCancellationRefundOnce } from './webhookProcessor'

const isAlreadyCancelledProviderMessage = (message: unknown) => {
  const normalized = String(message || '').toLowerCase()
  return (
    normalized.includes('already cancelled') ||
    normalized.includes('already canceled') ||
    normalized.includes('status is cancelled') ||
    normalized.includes('status is canceled') ||
    normalized.includes('order is cancelled') ||
    normalized.includes('order is canceled')
  )
}

const isSuccessText = (value: unknown) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  return ['1', 'true', 'success', 'succeeded', 'cancelled', 'canceled'].includes(normalized)
}

export async function cancelOrderShipment(orderId: string, userId: string) {
  console.log('🔍 Starting cancellation for orderId:', orderId)

  const [order] = await db
    .select()
    .from(b2c_orders)
    .where(and(eq(b2c_orders.id, orderId), eq(b2c_orders.user_id, userId)))

  if (!order) {
    console.error('❌ Order not found:', orderId)
    throw new Error('Order not found')
  }

  console.log('📦 Order found:', {
    orderId: order.id,
    orderNumber: order.order_number,
    integrationType: order.integration_type,
    awbNumber: order.awb_number,
    shipmentId: order.shipment_id,
    currentStatus: order.order_status,
  })

  const integration = (order.integration_type || '').toLowerCase()
  const normalizedStatus = String(order.order_status || '').trim().toLowerCase()
  const cancellableStatuses = new Set([
    'pending',
    'booked',
    'shipment_created',
    'pickup_initiated',
    'manifest_failed',
  ])
  const localOnlyCancelableStatuses = new Set(['pending', 'booked', 'manifest_failed'])

  if (normalizedStatus === 'cancelled') {
    throw new Error('Order is already cancelled')
  }

  if (normalizedStatus === 'cancellation_requested') {
    throw new Error('Cancellation has already been requested')
  }

  if (!cancellableStatuses.has(normalizedStatus)) {
    throw new Error(`Order with status "${order.order_status}" cannot be cancelled`)
  }

  if (!['delhivery', 'ekart', 'xpressbees', 'shipmozo', 'shiprocket', 'truxcargo', 'icarry'].includes(integration)) {
    console.error('❌ Unsupported integration type:', { orderId, integration })
    throw new Error(
      'Only Delhivery, Ekart, Xpressbees, Shipmozo, Shiprocket, Truxcargo and iCarry are supported for cancellation',
    )
  }

  if (!order.awb_number && !(integration === 'icarry' && order.shipment_id)) {
    if (localOnlyCancelableStatuses.has(normalizedStatus)) {
      console.log('Cancelling local pre-manifest order without courier call', {
        orderId,
        integration,
        currentStatus: order.order_status,
      })

      await db.transaction(async (tx) => {
        await tx
          .update(b2c_orders)
          .set({ order_status: 'cancelled', updated_at: new Date() })
          .where(eq(b2c_orders.id, orderId))

        await applyCancellationRefundOnce(tx, order, 'pre_manifest_cancel')
      })

      return {
        success: true,
        localOnly: true,
        message: 'Pre-manifest order cancelled locally',
      }
    }
    console.error('❌ Courier cancellation failed: Missing AWB number', { orderId, integration })
    throw new Error('Cancellation requires an AWB number')
  }

  console.log('🚚 Attempting courier cancellation:', {
    orderId,
    awbNumber: order.awb_number,
    integration,
  })

  const awbNumber = String(order.awb_number || '').trim()
  let cancellationResult: any = null
  if (integration === 'delhivery') {
    const svc = new DelhiveryService()
    cancellationResult = await svc.cancelShipment(awbNumber)
  } else if (integration === 'ekart') {
    const svc = new EkartService()
    cancellationResult = await svc.cancelShipment(awbNumber)
  } else if (integration === 'shipmozo') {
    const svc = new ShipmozoService()
    cancellationResult = await svc.cancelOrder({
      order_id: order.shipment_id || order.order_number || order.id,
      awb_number: awbNumber,
    })
  } else if (integration === 'shiprocket') {
    const svc = new ShiprocketCourierService()
    cancellationResult = await svc.cancelShipmentByAwbs({ awbs: [awbNumber] })
  } else if (integration === 'truxcargo') {
    const svc = new TruxcargoService()
    cancellationResult = await svc.cancelOrder({ waybill: awbNumber })
  } else if (integration === 'icarry') {
    const shipmentId = Number(order.shipment_id || order.awb_number || 0)
    if (!Number.isFinite(shipmentId) || shipmentId <= 0) {
      throw new Error('iCarry cancellation requires a numeric shipment_id')
    }
    const svc = new IcarryService()
    try {
      cancellationResult = await svc.cancelShipment({ shipment_id: shipmentId })
    } catch (err: any) {
      if (!isAlreadyCancelledProviderMessage(err?.message)) {
        throw err
      }
      cancellationResult = {
        success: true,
        status: 'cancelled',
        alreadyCancelled: true,
        message: err.message,
      }
    }
  } else {
    const svc = new XpressbeesService()
    cancellationResult = await svc.cancelShipment(awbNumber)
  }

  // Validate courier response
  // Check for various success indicators: boolean status, string status, success flags, or cancellation remark
  const isSuccess =
    cancellationResult?.success === true ||
    cancellationResult?.success === 1 ||
    cancellationResult?.success === '1' ||
    cancellationResult?.success === 'true' ||
    isSuccessText(cancellationResult?.success) ||
    cancellationResult?.Success === true ||
    cancellationResult?.Success === 1 ||
    cancellationResult?.Success === '1' ||
    isSuccessText(cancellationResult?.Success) ||
    cancellationResult?.result === true ||
    cancellationResult?.result === 1 ||
    cancellationResult?.result === '1' ||
    isSuccessText(cancellationResult?.result) ||
    cancellationResult?.response?.result === true ||
    cancellationResult?.response?.result === 1 ||
    cancellationResult?.response?.result === '1' ||
    isSuccessText(cancellationResult?.response?.result) ||
    cancellationResult?.status === true || // Boolean true (most common)
    cancellationResult?.status === 1 ||
    cancellationResult?.status === '1' ||
    cancellationResult?.status === 'Success' ||
    cancellationResult?.status === 'success' ||
    isSuccessText(cancellationResult?.status) ||
    isSuccessText(cancellationResult?.response?.success) ||
    cancellationResult?.response?.status === true ||
    isSuccessText(cancellationResult?.response?.status) ||
    (cancellationResult?.remark &&
      cancellationResult.remark.toLowerCase().includes('cancelled')) || // Check remark field for cancellation confirmation
    (cancellationResult?.message &&
      cancellationResult?.message.toLowerCase().includes('success') &&
      !cancellationResult?.error) ||
    (cancellationResult?.message &&
      cancellationResult?.message.toLowerCase().includes('cancelled') &&
      !cancellationResult?.error)

  console.log('🔍 Courier response validation:', {
    integration,
    isSuccess,
    success: cancellationResult?.success,
    Success: cancellationResult?.Success,
    result: cancellationResult?.result,
    status: cancellationResult?.status,
    statusType: typeof cancellationResult?.status,
    remark: cancellationResult?.remark,
    message: cancellationResult?.message,
    error: cancellationResult?.error,
    fullResponse: cancellationResult,
  })

  if (!isSuccess) {
    const errorMsg =
      cancellationResult?.error || cancellationResult?.message || 'Courier cancellation not accepted'
    console.error('❌ Courier cancellation failed:', {
      orderId,
      integration,
      response: cancellationResult,
      message: errorMsg,
    })
    throw new Error(errorMsg)
  }

  console.log('✅ Courier cancellation successful')

  const finalStatus = 'cancelled'

  console.log(`💾 Updating order status to ${finalStatus}:`, { orderId, integration })

  await db.transaction(async (tx) => {
    await tx
      .update(b2c_orders)
      .set({ order_status: finalStatus, updated_at: new Date() })
      .where(eq(b2c_orders.id, orderId))

    await applyCancellationRefundOnce(tx, order, 'pickup_cancel_api')
  })

  console.log(`✅ Order status updated to ${finalStatus} successfully:`, { orderId, integration })

  return cancellationResult
}
