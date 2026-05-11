// controllers/shipmentController.ts
import { Request, Response } from 'express'
import {
  checkMerchantOrderNumberAvailability,
  createB2BShipmentService,
  createB2CShipmentService,
  generateManifestService,
  getAllOrdersService,
  getB2BOrdersByUserService,
  getB2COrdersByUserService,
  ShipmentParams,
  retryFailedManifestService,
  trackByAwbService,
  trackByOrderService,
} from '../models/services/shiprocket.service'
import { regenerateOrderDocumentsServiceAdmin } from '../models/services/adminOrders.service'
import { getHttpStatusCode, normalizeAwb, parseTrackingQuery } from '../utils/tracking'

export const createB2CShipmentController = async (req: any, res: Response) => {
  try {
    const id = req.user?.sub
    // Local order creation (via dashboard), so is_external_api = false

    // Set a longer timeout for B2C order creation (3 minutes)
    // External courier API calls (Delhivery) can take time
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Order creation timed out after 3 minutes')), 180000)
    })

    const shipmentPromise = createB2CShipmentService(req.body, id, false)

    const shipment = (await Promise.race([shipmentPromise, timeoutPromise])) as Awaited<
      ReturnType<typeof createB2CShipmentService>
    >

    res.status(200).json({ success: true, shipment })
  } catch (error: any) {
    const isShiprocketKycError =
      error?.code === 'SHIPROCKET_KYC_REQUIRED' ||
      String(error?.message || '')
        .toLowerCase()
        .includes('kyc verification is mandated')
    const isShiprocketCredentialError =
      error?.code === 'SHIPROCKET_INVALID_CREDENTIALS' ||
      String(error?.message || '')
        .toLowerCase()
        .includes('shiprocket credentials are invalid')

    const statusCode =
      typeof error?.statusCode === 'number'
        ? error.statusCode
        : typeof error?.status === 'number'
          ? error.status
          : 500

    const errorMessage = isShiprocketKycError
      ? 'Shipment cannot be created because Shiprocket account KYC is incomplete. Complete KYC in your Shiprocket panel and retry.'
      : isShiprocketCredentialError
        ? 'Shipment cannot be created because Shiprocket credentials are invalid. Update the Shiprocket API email/password or auth token in admin courier settings and retry.'
      : error.message?.includes('timeout') || error.code === 'ECONNABORTED'
        ? 'Order creation is taking longer than expected. Please try again or contact support if the issue persists.'
        : error.message || 'Failed to create order. Please try again.'

    console.error('Error creating B2C shipment:', {
      message: errorMessage,
      statusCode,
      code: error?.code ?? null,
      stack: error?.stack || null,
      response: error?.response || null,
      request: {
        order_number: req.body?.order_number,
        integration_type: req.body?.integration_type,
        payment_type: req.body?.payment_type,
        courier_id: req.body?.courier_id ?? null,
      },
    })
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      ...(isShiprocketKycError ? { error_code: 'SHIPROCKET_KYC_REQUIRED' } : {}),
      ...(isShiprocketCredentialError ? { error_code: 'SHIPROCKET_INVALID_CREDENTIALS' } : {}),
    })
  }
}

export const createB2BShipmentController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.sub // Assuming you have auth middleware
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const params: ShipmentParams = req.body

    // Basic validation (you can enhance this with Zod/Yup)
    if (!params.order_number || !params.consignee || !params?.order_items?.length) {
      return res.status(400).json({ message: 'Invalid shipment payload' })
    }

    // Call service to create shipment (local order creation, so is_external_api = false)
    const shipmentData = await createB2BShipmentService(params, userId, false)

    return res.status(200).json({
      message: 'B2B shipment created successfully',
      shipment: shipmentData,
    })
  } catch (err: any) {
    console.error('B2B Shipment Controller Error:', err)
    const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500
    return res.status(statusCode).json({ message: err.message || 'Internal server error' })
  }
}

export const checkOrderNumberAvailabilityController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.sub
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const orderNumber = req.query.orderNumber as string | undefined
    const result = await checkMerchantOrderNumberAvailability(userId, orderNumber)

    return res.status(200).json({
      success: true,
      data: {
        orderNumber: result.normalizedOrderNumber,
        available: result.available,
        message: result.available
          ? 'Order ID is available.'
          : `Order ID "${result.normalizedOrderNumber}" already exists for this merchant.`,
      },
    })
  } catch (error: any) {
    const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : 500
    return res.status(statusCode).json({
      success: false,
      message: error?.message || 'Failed to check order ID availability.',
    })
  }
}

export const getAllOrdersController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.sub
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    // Pagination params
    const page = parseInt(req.query.page as string, 10) || 1
    const limit = parseInt(req.query.limit as string, 10) || 10

    // Filters from query
    const filters = {
      status: req.query.status as string | undefined,
      fromDate: req.query.fromDate as string | undefined,
      toDate: req.query.toDate as string | undefined,
      search: req.query.search as string | undefined,
    }

    const { orders, totalCount, totalPages } = await getAllOrdersService(userId, {
      page,
      limit,
      filters,
    })

    res.status(200).json({ success: true, orders, totalCount, totalPages })
  } catch (error: any) {
    console.error('Error fetching all orders:', error.message)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getB2COrdersController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    // Pagination params
    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 10, 100)

    const rawStatus = (req.query.status as string | undefined) || undefined
    const normalizedStatus = rawStatus
      ? rawStatus
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, '_')
      : undefined

    // Filters from query
    const filters = {
      status: normalizedStatus || undefined,
      type: req.query.type as string | undefined,
      courier: req.query.courier as string | undefined,
      warehouse: req.query.warehouse as string | undefined,
      fromDate: req.query.fromDate as string | undefined,
      toDate: req.query.toDate as string | undefined,
      search: req.query.search as string | undefined,
      sortBy: (req.query.sortBy as 'created_at' | undefined) || 'created_at',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc' | undefined) || 'desc',
    }

    const { orders, totalCount, totalPages } = await getB2COrdersByUserService(
      userId,
      page,
      limit,
      filters,
    )

    return res.status(200).json({
      success: true,
      orders,
      totalCount,
      totalPages,
    })
  } catch (error: any) {
    console.error('❌ Error fetching B2C orders', {
      userId: (req as any)?.user?.sub,
      query: req?.query,
      message: error?.message,
      stack: error?.stack,
    })

    // Detect Drizzle/PG query errors
    if (typeof error.message === 'string' && error.message.includes('Failed query')) {
      return res.status(200).json({
        success: true,
        orders: [],
        totalCount: 0,
        totalPages: 0,
      })
    }

    // Fallback generic error
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching orders. Please try again later.',
    })
  }
}

export const getB2BOrdersController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.sub
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    // Pagination params
    const page = parseInt(req.query.page as string, 10) || 1
    const limit = parseInt(req.query.limit as string, 10) || 10

    // Filters from query
    const filters = {
      status: req.query.status as string | undefined,
      fromDate: req.query.fromDate as string | undefined,
      toDate: req.query.toDate as string | undefined,
      search: req.query.search as string | undefined,
      companyName: req.query.companyName as string | undefined, // optional B2B-specific filter
    }

    const { orders, totalCount, totalPages } = await getB2BOrdersByUserService(
      userId,
      page,
      limit,
      filters,
    )

    res.status(200).json({ success: true, orders, totalCount, totalPages })
  } catch (error: any) {
    console.error('❌ Error fetching B2B orders', {
      userId: req?.user?.sub,
      query: req?.query,
      message: error?.message,
      stack: error?.stack,
    })
    res.status(500).json({ success: false, message: error.message })
  }
}

export const generateManifestController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.sub
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { awbs, type = 'b2c' } = req.body

    if (!awbs || !Array.isArray(awbs) || awbs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order numbers or AWBs are required',
      })
    }

    if (!['b2c', 'b2b'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid manifest type' })
    }

    // Manifest generation can take a while when couriers process multiple orders.
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Manifest generation timed out after 10 minutes')), 600000)
    })

    const manifestPromise = generateManifestService({
      awbs,
      type,
      userId,
    })

    const { manifest_id, manifest_url, manifest_key, warnings } = (await Promise.race([
      manifestPromise,
      timeoutPromise,
    ])) as Awaited<ReturnType<typeof generateManifestService>>

    return res.status(200).json({
      success: true,
      message: 'Manifest generated and saved successfully',
      manifest_id,
      manifest_url,
      manifest_key,
      warnings,
    })
  } catch (error: any) {
    console.error('Generate manifest error:', error)
    const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : 500
    // Don't expose internal error details, provide user-friendly message
    const errorMessage =
      error.message?.includes('timeout') || error.code === 'ECONNABORTED'
        ? 'Manifest generation is taking longer than expected. Please try again or contact support if the issue persists.'
        : error.message || 'Failed to generate manifest. Please try again.'
    return res.status(statusCode).json({ success: false, message: errorMessage })
  }
}

export const retryFailedManifestController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.sub
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { orderId } = req.params
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' })
    }

    const result = await retryFailedManifestService(String(orderId), userId)

    return res.status(200).json({
      success: true,
      message: 'Manifest retry completed successfully.',
      ...result,
    })
  } catch (error: any) {
    console.error('Retry failed manifest error:', error)
    const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : 500
    return res.status(statusCode).json({
      success: false,
      message: error?.message || 'Failed to retry manifest.',
    })
  }
}

export const regenerateOrderDocumentsController = async (req: any, res: Response) => {
  try {
    const userId = req.user?.sub
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const orderId = String(req.params.orderId || '').trim()
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' })
    }

    const hasExplicitDocumentSelection =
      typeof req.body?.regenerateLabel === 'boolean' ||
      typeof req.body?.regenerateInvoice === 'boolean' ||
      typeof req.body?.regenerateManifest === 'boolean'
    const regenerateLabel =
      typeof req.body?.regenerateLabel === 'boolean'
        ? req.body.regenerateLabel
        : !hasExplicitDocumentSelection
    const regenerateInvoice =
      typeof req.body?.regenerateInvoice === 'boolean'
        ? req.body.regenerateInvoice
        : !hasExplicitDocumentSelection
    const regenerateManifest =
      typeof req.body?.regenerateManifest === 'boolean' ? req.body.regenerateManifest : false

    const result = await regenerateOrderDocumentsServiceAdmin({
      orderId,
      regenerateLabel,
      regenerateInvoice,
      regenerateManifest,
      expectedUserId: userId,
    })

    return res.status(200).json({
      success: true,
      message: 'Order documents regenerated successfully',
      data: result,
    })
  } catch (error: any) {
    const statusCode = error?.message === 'Order not found' ? 404 : 400
    return res.status(statusCode).json({
      success: false,
      message: error?.message || 'Failed to regenerate order documents',
    })
  }
}

// export const getB2BOrdersController = async (req: Request, res: Response) => {
//   try {
//     const orders = await getAllB2BOrdersService()
//     res.status(200).json({ success: true, orders })
//   } catch (error: any) {
//     console.error('Error fetching B2B orders:', error.message)
//     res.status(500).json({ success: false, message: error.message })
//   }
// }

export const trackOrderController = async (req: Request, res: Response) => {
  try {
    const trackingQuery = parseTrackingQuery(req.query as Record<string, unknown>)

    if (trackingQuery.mode === 'order') {
      const orderData = await trackByOrderService({
        orderNumber: trackingQuery.orderNumber,
        email: trackingQuery.email,
        phone: trackingQuery.phone,
      })

      const awbNumber = normalizeAwb(orderData?.awb_number)
      if (!awbNumber) {
        return res.status(404).json({
          success: false,
          message: 'AWB number not found for this order',
        })
      }

      const trackingData = await trackByAwbService(awbNumber)
      return res.json({ success: true, data: trackingData })
    }

    const trackingData = await trackByAwbService(trackingQuery.awb)
    return res.json({ success: true, data: trackingData })
  } catch (err: any) {
    const statusCode = getHttpStatusCode(err, 500)
    if (statusCode >= 500) {
      console.error('Error tracking order:', err)
    }
    return res.status(statusCode).json({
      success: false,
      message: err?.message || 'Failed to fetch tracking',
    })
  }
}
