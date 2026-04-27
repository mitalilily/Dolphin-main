import { Request, Response } from 'express'
import { ShiprocketCourierService } from '../../models/services/couriers/shiprocket.service'

const handleShiprocketAction = async (
  res: Response,
  action: () => Promise<any>,
  errorMessage: string,
) => {
  try {
    const data = await action()
    return res.json({ success: true, data })
  } catch (err: any) {
    console.error(errorMessage, err)
    return res.status(typeof err?.statusCode === 'number' ? err.statusCode : 500).json({
      success: false,
      message: err?.message || errorMessage,
    })
  }
}

export const shiprocketLoginController = async (_req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().login(),
    'Failed to login to Shiprocket',
  )

export const shiprocketLogoutController = async (_req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().logout(),
    'Failed to logout from Shiprocket',
  )

export const getShiprocketChannelsController = async (_req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().getIntegratedChannels(),
    'Failed to fetch Shiprocket channels',
  )

export const getShiprocketOrdersController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().getAllOrders(req.query as Record<string, any>),
    'Failed to fetch Shiprocket orders',
  )

export const getShiprocketOrderDetailController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().getOrderDetail(String(req.params.orderId || '')),
    'Failed to fetch Shiprocket order detail',
  )

export const getShiprocketProductDetailController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => {
      const productId = String(req.params.productId || '').trim()
      if (!productId) {
        throw Object.assign(new Error('productId is required'), { statusCode: 400 })
      }
      return new ShiprocketCourierService().getProductDetail(productId)
    },
    'Failed to fetch Shiprocket product detail',
  )

export const addShiprocketProductController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().addProduct(req.body || {}),
    'Failed to add Shiprocket product',
  )

export const shiprocketProductsSampleController = async (_req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().getProductsSampleCsv(),
    'Failed to fetch Shiprocket products sample csv',
  )

export const exportShiprocketOrdersController = async (_req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().exportOrders(),
    'Failed to export Shiprocket orders',
  )

export const getShiprocketPickupLocationsController = async (_req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().getPickupLocations(),
    'Failed to fetch Shiprocket pickup locations',
  )

export const addShiprocketPickupLocationController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().addPickupLocation(req.body || {}),
    'Failed to add Shiprocket pickup location',
  )

export const createShiprocketCustomOrderController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().createCustomOrder(req.body || {}),
    'Failed to create Shiprocket custom order',
  )

export const createShiprocketChannelOrderController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().createChannelSpecificOrder(req.body || {}),
    'Failed to create Shiprocket channel order',
  )

export const createShiprocketExchangeOrderController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().createExchangeOrder(req.body || {}),
    'Failed to create Shiprocket exchange order',
  )

export const createShiprocketReturnShipmentController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().createReturnShipment(req.body || {}),
    'Failed to create Shiprocket return shipment',
  )

export const updateShiprocketOrderController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().updateOrder(req.body || {}),
    'Failed to update Shiprocket order',
  )

export const updateShiprocketReturnOrderController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => {
      const orderId = String(req.body?.order_id || '').trim()
      const rawActions = req.body?.action
      const actions = Array.isArray(rawActions)
        ? rawActions.map((item: unknown) => String(item || '').trim()).filter(Boolean)
        : []

      if (!orderId) {
        throw Object.assign(new Error('order_id is required'), { statusCode: 400 })
      }

      if (!actions.length) {
        throw Object.assign(new Error('action must be a non-empty array'), { statusCode: 400 })
      }

      const allowedActions = new Set(['product_details', 'warehouse_address'])
      const invalidActions = actions.filter((action) => !allowedActions.has(action))
      if (invalidActions.length) {
        throw Object.assign(
          new Error(`Invalid action(s): ${invalidActions.join(', ')}. Allowed: product_details, warehouse_address`),
          { statusCode: 400 },
        )
      }

      return new ShiprocketCourierService().updateReturnOrder({
        ...(req.body || {}),
        order_id: orderId,
        action: actions,
      })
    },
    'Failed to update Shiprocket return order',
  )

export const updateShiprocketOrderPickupController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().updateOrderPickupLocation(req.body || {}),
    'Failed to update Shiprocket pickup location',
  )

export const updateShiprocketDeliveryAddressController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().updateCustomerDeliveryAddress(req.body || {}),
    'Failed to update Shiprocket delivery address',
  )

export const cancelShiprocketOrdersController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().cancelOrders(req.body || {}),
    'Failed to cancel Shiprocket orders',
  )

export const fulfillShiprocketOrderInventoryController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().addInventoryForOrderedProduct(req.body || {}),
    'Failed to fulfill Shiprocket order inventory',
  )

export const mapShiprocketOrderProductsController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().mapUnmappedProducts(req.body || {}),
    'Failed to map Shiprocket products',
  )

export const importShiprocketOrdersController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => {
      const file = req.file
      const service = new ShiprocketCourierService()
      if (file?.buffer?.length) {
        return service.importOrdersInBulkFromFile({
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
        })
      }

      return service.importOrdersInBulk(req.body || {})
    },
    'Failed to import Shiprocket orders',
  )

export const shiprocketServiceabilityController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().checkCourierServiceability(req.body || req.query),
    'Failed to fetch Shiprocket serviceability',
  )

export const shiprocketAssignAwbController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().assignAwb(req.body || {}),
    'Failed to assign Shiprocket AWB',
  )

export const shiprocketAssignReturnAwbController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => {
      const shipmentId = Number(req.body?.shipment_id)
      if (!Number.isFinite(shipmentId) || shipmentId <= 0) {
        throw Object.assign(new Error('shipment_id is required and must be a positive number'), {
          statusCode: 400,
        })
      }

      const payload: Record<string, any> = {
        shipment_id: shipmentId,
        is_return: 1,
      }

      const courierId = Number(req.body?.courier_id)
      if (Number.isFinite(courierId) && courierId > 0) {
        payload.courier_id = courierId
      }

      const status = String(req.body?.status || '').trim().toLowerCase()
      if (status) {
        if (status !== 'reassign') {
          throw Object.assign(new Error("status can only be 'reassign' when provided"), {
            statusCode: 400,
          })
        }
        payload.status = status
      }

      return new ShiprocketCourierService().generateAwbForReturnShipment(payload)
    },
    'Failed to generate Shiprocket return AWB',
  )

export const shiprocketGeneratePickupController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => {
      const rawShipmentId = req.body?.shipment_id
      const normalizedShipmentIds = Array.isArray(rawShipmentId)
        ? rawShipmentId.map((id: unknown) => Number(id)).filter((id: number) => Number.isFinite(id) && id > 0)
        : Number.isFinite(Number(rawShipmentId)) && Number(rawShipmentId) > 0
          ? [Number(rawShipmentId)]
          : []

      if (!normalizedShipmentIds.length) {
        throw Object.assign(new Error('shipment_id is required'), { statusCode: 400 })
      }

      if (normalizedShipmentIds.length > 1) {
        throw Object.assign(new Error('Only one shipment_id is allowed per request'), {
          statusCode: 400,
        })
      }

      const status = String(req.body?.status || '').trim()
      if (status && status.toLowerCase() !== 'retry') {
        throw Object.assign(new Error("status can only be 'retry' when provided"), {
          statusCode: 400,
        })
      }

      const payload: Record<string, any> = {
        shipment_id: normalizedShipmentIds,
      }
      if (status) payload.status = status.toLowerCase()

      return new ShiprocketCourierService().generatePickup(payload)
    },
    'Failed to generate Shiprocket pickup',
  )

export const shiprocketGenerateManifestController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().generateManifest(req.body || {}),
    'Failed to generate Shiprocket manifest',
  )

export const shiprocketPrintManifestController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().printManifest(req.body || {}),
    'Failed to print Shiprocket manifest',
  )

export const shiprocketGenerateLabelController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().generateLabel(req.body || {}),
    'Failed to generate Shiprocket label',
  )

export const shiprocketGenerateInvoiceController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().generateInvoice(req.body || {}),
    'Failed to generate Shiprocket invoice',
  )

export const shiprocketTrackAwbController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().trackByAwb(String(req.params.awb || req.query.awb || '')),
    'Failed to track Shiprocket AWB',
  )

export const shiprocketTrackShipmentController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => {
      const shipmentId = String(req.params.shipmentId || req.query.shipment_id || '').trim()
      if (!shipmentId) {
        throw Object.assign(new Error('shipmentId is required'), { statusCode: 400 })
      }
      return new ShiprocketCourierService().trackByShipmentId(shipmentId)
    },
    'Failed to track Shiprocket shipment',
  )

export const shiprocketTrackAwbsController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => {
      const rawAwbs = req.body?.awbs
      const awbs = Array.isArray(rawAwbs)
        ? rawAwbs.map((awb: unknown) => String(awb || '').trim()).filter(Boolean)
        : []

      if (!awbs.length) {
        throw Object.assign(new Error('awbs is required and must be a non-empty string array'), {
          statusCode: 400,
        })
      }

      if (awbs.length > 50) {
        throw Object.assign(new Error('awbs limit exceeded. Maximum allowed is 50'), {
          statusCode: 400,
        })
      }

      return new ShiprocketCourierService().trackByAwbs({ awbs })
    },
    'Failed to track Shiprocket AWBs',
  )

export const shiprocketTrackOrderController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => {
      const orderId = String(req.query.order_id || req.body?.order_id || '').trim()
      const channelId = String(req.query.channel_id || req.body?.channel_id || '').trim()

      if (!orderId) {
        throw Object.assign(new Error('order_id is required'), { statusCode: 400 })
      }

      return new ShiprocketCourierService().trackByOrderId({
        order_id: orderId,
        channel_id: channelId || undefined,
      })
    },
    'Failed to track Shiprocket order',
  )

export const shiprocketUpdateInventoryController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => {
      const productId = String(req.params.productId || '').trim()
      if (!productId) {
        throw Object.assign(new Error('productId is required'), { statusCode: 400 })
      }

      const quantity = Number(req.body?.quantity)
      if (!Number.isFinite(quantity) || quantity < 0) {
        throw Object.assign(new Error('quantity must be a non-negative number'), {
          statusCode: 400,
        })
      }

      const action = String(req.body?.action || '')
        .trim()
        .toLowerCase()
      if (!['add', 'replace', 'remove'].includes(action)) {
        throw Object.assign(new Error("action must be one of: add, replace, remove"), {
          statusCode: 400,
        })
      }

      return new ShiprocketCourierService().updateInventory(productId, {
        quantity,
        action: action as 'add' | 'replace' | 'remove',
      })
    },
    'Failed to update Shiprocket inventory',
  )

export const shiprocketGetZonesController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => {
      const countryId = String(req.params.countryId || req.query.country_id || '').trim()
      if (!countryId) {
        throw Object.assign(new Error('countryId is required'), { statusCode: 400 })
      }
      return new ShiprocketCourierService().getAllZones(countryId)
    },
    'Failed to fetch Shiprocket zones',
  )

export const shiprocketGetLocalityDetailsController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => {
      const postcode = String(req.query.postcode || req.body?.postcode || '').trim()
      if (!postcode) {
        throw Object.assign(new Error('postcode is required'), { statusCode: 400 })
      }
      return new ShiprocketCourierService().getLocalityDetails(postcode)
    },
    'Failed to fetch Shiprocket locality details',
  )

export const cancelShiprocketShipmentAwbsController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => {
      const rawAwbs = req.body?.awbs
      const normalizedAwbs = Array.isArray(rawAwbs)
        ? rawAwbs.map((awb: unknown) => String(awb || '').trim()).filter(Boolean)
        : typeof rawAwbs === 'string'
          ? rawAwbs
              .split(',')
              .map((awb) => awb.trim())
              .filter(Boolean)
          : []

      if (!normalizedAwbs.length) {
        throw Object.assign(new Error('awbs is required and must be a non-empty array'), {
          statusCode: 400,
        })
      }

      if (normalizedAwbs.length > 2000) {
        throw Object.assign(new Error('awbs limit exceeded. Maximum allowed is 2000'), {
          statusCode: 400,
        })
      }

      return new ShiprocketCourierService().cancelShipmentByAwbs({ awbs: normalizedAwbs })
    },
    'Failed to cancel Shiprocket shipment AWBs',
  )

export const getShiprocketNdrShipmentDetailsController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => {
      const awb = String(req.params.awb || '').trim()
      if (!awb) {
        throw Object.assign(new Error('awb is required'), { statusCode: 400 })
      }
      return new ShiprocketCourierService().getNdrShipmentDetails(awb)
    },
    'Failed to fetch Shiprocket NDR shipment details',
  )

export const actionShiprocketNdrController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => {
      const awb = String(req.params.awb || '').trim()
      if (!awb) {
        throw Object.assign(new Error('awb is required'), { statusCode: 400 })
      }

      const action = String(req.body?.action || '').trim().toLowerCase()
      const comments = String(req.body?.comments || '').trim()
      if (!action) {
        throw Object.assign(new Error('action is required'), { statusCode: 400 })
      }
      if (!comments) {
        throw Object.assign(new Error('comments is required'), { statusCode: 400 })
      }

      return new ShiprocketCourierService().actionNdrShipment(awb, req.body || {})
    },
    'Failed to action Shiprocket NDR shipment',
  )

export const shiprocketDiscrepancyController = async (_req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().getDiscrepancyData(),
    'Failed to fetch Shiprocket discrepancy data',
  )

export const shiprocketImportResultController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().checkFileImportStatus(String(req.params.importId || '')),
    'Failed to fetch Shiprocket import status',
  )

export const shiprocketExportUnmappedProductsController = async (_req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().exportUnmappedProducts(),
    'Failed to export Shiprocket unmapped products',
  )

export const shiprocketExportCatalogSampleController = async (_req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () => new ShiprocketCourierService().exportCatalogSample(),
    'Failed to export Shiprocket catalog sample',
  )

export const shiprocketProxyController = async (req: Request, res: Response) =>
  handleShiprocketAction(
    res,
    async () =>
      new ShiprocketCourierService().proxyRequest({
        method: req.body?.method ?? req.query.method,
        path: String(req.body?.path || req.query.path || ''),
        params: (req.body?.params || {}) as Record<string, any>,
        data: req.body?.data ?? req.body?.payload,
      }),
    'Failed to call Shiprocket proxy endpoint',
  )
