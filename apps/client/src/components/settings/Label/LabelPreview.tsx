/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Divider, Paper, Stack, Typography } from '@mui/material'
import Barcode from 'react-barcode'
import type { LabelPreferences } from '../../../api/labelPreference.api'

const normalize = (value: unknown) => {
  if (value === undefined || value === null) return ''
  return typeof value === 'string' ? value.trim() : `${value}`
}

const clampText = (value: unknown, max = 25) => {
  const text = normalize(value)
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}...` : text
}

const pickFirst = (...values: unknown[]) => values.map(normalize).find(Boolean) || ''

const buildDimensions = (order: any) => {
  const dimension = normalize(order.dimension) || normalize(order.dimensions)
  if (dimension) return dimension
  if (order.length && order.breadth && order.height) {
    return `${order.length}x${order.breadth}x${order.height} cm`
  }
  return ''
}

const buildWeight = (order: any) => {
  if (order.deadWeight) return normalize(order.deadWeight)
  if (order.weight) return `${order.weight} g`
  if (order.weightKg) return `${order.weightKg} kg`
  return ''
}

const isEnabled = (value: unknown) => (value === undefined ? true : value === true)

type LabelPreviewProps = {
  values: any
  order: any
  preferences?: LabelPreferences
}

export function LabelPreview({ values, order, preferences }: LabelPreviewProps) {
  const charsLimit = Math.max(5, Number(values?.charLimit ?? 25))
  const maxItems = Math.max(1, Number(values?.maxItems ?? 3))

  const awbNumber = pickFirst(order.awb, order.awbNumber, order.awb_number)
  const courierName = normalize(order.courier || order.courier_partner || 'Courier').toUpperCase()
  const paymentType = (normalize(order.paymentType) || normalize(order.payment_type) || 'Prepaid').toLowerCase()
  const paymentBadge = paymentType === 'cod' ? 'COD' : 'PREPAID'

  const orderId = pickFirst(order.orderId, order.order_number)
  const invoiceNumber = pickFirst(order.invoiceNumber, order.invoice_number)
  const customerPhone = pickFirst(order.phone, order.buyer_phone, order.customerPhone)
  const orderValue = pickFirst(order.totalAmount, order.orderValue, order.order_amount, order.order_value)
  const codValue = pickFirst(order.codValue, order.cod_amount, order.cod_value, order.codAmount)
  const declaredValue = pickFirst(order.declaredValue, order.orderValue, order.declared_value)

  const productEntries = Array.isArray(order.products) ? order.products.slice(0, maxItems) : []
  const dimensionValue = buildDimensions(order)
  const weightValue = buildWeight(order)

  const showSellerLogo = isEnabled(values.shipperInfo?.brandLogo) && Boolean(order.shipper?.logoUrl)
  const showSellerName = isEnabled(values.shipperInfo?.sellerBrandName) && Boolean(order.shipper?.name)
  const showShipperAddress = isEnabled(values.shipperInfo?.shipperAddress) && Boolean(order.shipper?.address)
  const showShipperPhone = isEnabled(values.shipperInfo?.shipperPhone) && Boolean(order.shipper?.phone)
  const showShipperGst = isEnabled(values.shipperInfo?.gstin) && Boolean(order.shipper?.gst)
  const showReturnAddress = isEnabled(values.shipperInfo?.rtoAddress) && Boolean(order.shipper?.rtoAddress)

  const showCustomerPhone = isEnabled(values.orderInfo?.customerPhone) && Boolean(customerPhone)
  const showOrderId = isEnabled(values.orderInfo?.orderId) && Boolean(orderId)
  const showInvoiceNumber = isEnabled(values.orderInfo?.invoiceNumber) && Boolean(invoiceNumber)
  const showOrderDate = isEnabled(values.orderInfo?.orderDate) && Boolean(order.orderDate)
  const showInvoiceDate = isEnabled(values.orderInfo?.invoiceDate) && Boolean(order.invoiceDate)
  const showDeclaredValue = isEnabled(values.orderInfo?.declaredValue) && Boolean(declaredValue)
  const showAwb = isEnabled(values.orderInfo?.awb) && Boolean(awbNumber)
  const showCodBadge = isEnabled(values.orderInfo?.cod)
  const showProductDescription = isEnabled(values.productInfo?.itemName) && productEntries.length > 0
  const showOrderSummary = isEnabled(values.productInfo?.otherCharges) && Boolean(orderValue)
  const showDimensions = isEnabled(values.productInfo?.dimension) && Boolean(dimensionValue)
  const showWeight = isEnabled(values.productInfo?.deadWeight) && Boolean(weightValue)
  const showTerms = isEnabled(values.orderInfo?.terms)
  const showPlatformBranding = Boolean(preferences?.powered_by?.trim())

  const infoLineParts: string[] = []
  if (showOrderId) infoLineParts.push(`Order ID: ${orderId}`)
  if (showInvoiceNumber) infoLineParts.push(`Invoice: ${invoiceNumber}`)
  if (showOrderDate) infoLineParts.push(`Order Dt: ${normalize(order.orderDate)}`)
  if (showInvoiceDate) infoLineParts.push(`Inv Dt: ${normalize(order.invoiceDate)}`)
  if (showDeclaredValue) infoLineParts.push(`Declared: ${declaredValue}`)

  const metrics: { label: string; value: string }[] = []
  if (showDimensions) metrics.push({ label: 'Dimensions', value: dimensionValue })
  if (showWeight) metrics.push({ label: 'Weight', value: weightValue })

  const barcodeForOrder = isEnabled(values.orderInfo?.orderId) && Boolean(orderId)

  return (
    <Paper
      sx={{
        p: 2,
        border: '2px solid #0f172a',
        borderRadius: 2,
        width: values.printer === 'thermal' ? '100mm' : '210mm',
        minHeight: values.printer === 'thermal' ? '150mm' : '297mm',
        bgcolor: 'white',
        color: '#0f172a',
        mx: 'auto',
      }}
      elevation={1}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Stack spacing={0.75} flex={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {showSellerLogo && (
                <Box
                  component="img"
                  src={order.shipper?.logoUrl}
                  alt="Seller Logo"
                  sx={{ width: 60, height: 30, objectFit: 'contain', borderRadius: 1, border: '1px solid #cbd5f5' }}
                />
              )}
              <Stack spacing={0.25}>
                {showSellerName && (
                  <Typography variant="subtitle1" fontWeight="700">
                    {order.shipper?.name}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.5 }}>
                  {courierName}
                </Typography>
              </Stack>
            </Stack>
            {showShipperAddress && (
              <Typography variant="body2" color="text.secondary">
                {order.shipper?.address}
              </Typography>
            )}
            {showShipperPhone && (
              <Typography variant="body2">
                Phone: {order.shipper?.phone}
              </Typography>
            )}
            {showShipperGst && (
              <Typography variant="body2">{`GSTIN: ${order.shipper?.gst}`}</Typography>
            )}
          </Stack>

          <Stack spacing={1} minWidth={160} alignItems="flex-end">
            {showAwb && (
              <Typography variant="body2" fontWeight="700" letterSpacing={0.4}>
                AWB #{awbNumber}
              </Typography>
            )}
            {showAwb &&
              (order.barcodeUrl ? (
                <Box
                  component="img"
                  src={order.barcodeUrl}
                  alt="Shipment Barcode"
                  sx={{ maxWidth: '100%', maxHeight: 90, objectFit: 'contain', border: '1px solid #cbd5f5', borderRadius: 1 }}
                />
              ) : (
                <Box sx={{ width: 140 }}>
                  <Barcode value={awbNumber} height={45} width={1.2} displayValue={false} />
                </Box>
              ))}
            {showCodBadge && (
              <Typography
                variant="caption"
                fontWeight="600"
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: paymentType === 'cod' ? '#fee2e2' : '#dcfce7',
                  color: paymentType === 'cod' ? '#b91c1c' : '#15803d',
                }}
              >
                {paymentBadge}
              </Typography>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="stretch"
        >
          <Box sx={{ flex: 1, p: 1, border: '1px solid #e2e8f0', borderRadius: 1, minHeight: 140 }}>
            <Typography variant="caption" color="text.secondary">
              SHIP TO
            </Typography>
            <Typography variant="subtitle2" fontWeight="700">
              {order.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {order.address}
            </Typography>
            {showCustomerPhone && (
              <Typography variant="body2">Phone: {customerPhone}</Typography>
            )}
          </Box>
          <Box sx={{ flex: 1, p: 1, border: '1px solid #e2e8f0', borderRadius: 1, minHeight: 140 }}>
            <Typography variant="caption" color="text.secondary">
              SHIP FROM
            </Typography>
            {showSellerName && (
              <Typography variant="subtitle2" fontWeight="700">
                {order.shipper?.name}
              </Typography>
            )}
            {showShipperAddress && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {order.shipper?.address}
              </Typography>
            )}
            {showShipperPhone && (
              <Typography variant="body2">Phone: {order.shipper?.phone}</Typography>
            )}
          </Box>
        </Stack>

        {infoLineParts.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            {infoLineParts.join(' | ')}
          </Typography>
        )}

        {metrics.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {metrics.map((metric) => (
              <Box
                key={metric.label}
                sx={{
                  px: 1.25,
                  py: 0.4,
                  borderRadius: 1,
                  border: '1px solid #e2e8f0',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {metric.label}
                </Typography>
                <Typography variant="subtitle2">{metric.value}</Typography>
              </Box>
            ))}
          </Stack>
        )}

        {showProductDescription && (
          <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1, overflow: 'hidden' }}>
            <Box component="table" width="100%" sx={{
              borderCollapse: 'collapse',
            }}>
              <Box component="thead" sx={{ backgroundColor: '#f8fafc' }}>
                <Box component="tr">
                  <Box component="th" align="left" sx={{ p: 1, fontSize: 11 }}>
                    Item
                  </Box>
                  {isEnabled(values.productInfo?.skuCode) && (
                    <Box component="th" align="left" sx={{ p: 1, fontSize: 11 }}>
                      SKU
                    </Box>
                  )}
                  {isEnabled(values.productInfo?.productQuantity) && (
                    <Box component="th" align="right" sx={{ p: 1, fontSize: 11 }}>
                      Qty
                    </Box>
                  )}
                  {isEnabled(values.productInfo?.productCost) && (
                    <Box component="th" align="right" sx={{ p: 1, fontSize: 11 }}>
                      Amount
                    </Box>
                  )}
                </Box>
              </Box>
              <Box component="tbody">
                {productEntries.map((product: any, index: number) => (
                  <Box component="tr" key={`${product.name}-${index}`}>
                    <Box component="td" sx={{ p: 1, fontSize: 11 }}>
                      {clampText(product.name, charsLimit)}
                    </Box>
                    {isEnabled(values.productInfo?.skuCode) && (
                      <Box component="td" sx={{ p: 1, fontSize: 11 }}>
                        {normalize(product.sku)}
                      </Box>
                    )}
                    {isEnabled(values.productInfo?.productQuantity) && (
                      <Box component="td" align="right" sx={{ p: 1, fontSize: 11 }}>
                        {normalize(product.qty ?? product.quantity)}
                      </Box>
                    )}
                    {isEnabled(values.productInfo?.productCost) && (
                      <Box component="td" align="right" sx={{ p: 1, fontSize: 11 }}>
                        {normalize(product.price)}
                      </Box>
                    )}
                  </Box>
                ))}
                {isEnabled(values.productInfo?.otherCharges) && order.otherCharges && (
                  <Box component="tr">
                    <Box component="td" colSpan={3} sx={{ p: 1, fontSize: 11, fontWeight: 600 }}>
                      Other Charges
                    </Box>
                    <Box component="td" align="right" sx={{ p: 1, fontSize: 11 }}>
                      {normalize(order.otherCharges)}
                    </Box>
                  </Box>
                )}
                <Box component="tr">
                  <Box component="td" colSpan={3} sx={{ p: 1, fontSize: 11, fontWeight: 700 }}>
                    Total
                  </Box>
                  <Box component="td" align="right" sx={{ p: 1, fontSize: 11, fontWeight: 700 }}>
                    {normalize(order.totalAmount)}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {showOrderSummary && (
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Typography variant="body2" fontWeight="600">
              Order Value: {orderValue}
            </Typography>
            {showCodBadge && paymentType === 'cod' && codValue && (
              <Typography variant="body2" fontWeight="600">
                Collectable: {codValue}
              </Typography>
            )}
          </Stack>
        )}

        {showReturnAddress && (
          <Box sx={{ border: '1px dashed #cbd5f5', borderRadius: 1, p: 1 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              RETURN TO (If undelivered)
            </Typography>
            <Typography variant="body2" fontWeight="600">
              {order.shipper?.rtoAddress}
            </Typography>
            {showShipperPhone && (
              <Typography variant="body2">Phone: {order.shipper?.phone}</Typography>
            )}
          </Box>
        )}

        {showTerms && (
          <Typography variant="caption" color="text.secondary">
            *Terms & Conditions apply. Please refer to your courier documentation for details.
          </Typography>
        )}

        {barcodeForOrder && (
          <Box textAlign="center">
            <Typography variant="body2" gutterBottom>
              Order ID#: {orderId}
            </Typography>
            <Barcode value={orderId} height={50} width={1.3} displayValue={false} />
          </Box>
        )}

        {showPlatformBranding && (
          <Typography variant="caption" align="center" color="text.secondary" fontWeight="600">
            Powered by {preferences?.powered_by}
          </Typography>
        )}
      </Stack>
    </Paper>
  )
}
