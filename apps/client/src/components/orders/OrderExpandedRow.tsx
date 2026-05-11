import { alpha, Box, Button, Chip, Divider, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { FaFilePdf } from 'react-icons/fa'
import {
  MdInventory2,
  MdLocalShipping,
  MdLocationOn,
  MdPerson,
  MdReceipt,
  MdShoppingBag,
} from 'react-icons/md'
import { generateManifestService } from '../../api/order.service'
import { useRegenerateOrderDocuments } from '../../hooks/Orders/useOrders'
import { usePresignedDownloadMutation } from '../../hooks/Uploads/usePresignedDownloadUrls'
import { toast } from '../UI/Toast'
import {
  downloadFile,
  getActionableErrorMessage,
  getB2CManifestIdentifier,
  getB2CManifestDisabledReason,
  getDocumentReference,
  getDownloadFileName,
  isDirectDownloadUrl,
  type DocumentType,
} from './bulkActionUtils'

interface OrderExpandedRowProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any
  type?: 'b2b' | 'b2c'
}

export const OrderExpandedRow = ({ row, type = 'b2c' }: OrderExpandedRowProps) => {
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null)
  const [generatingDocumentType, setGeneratingDocumentType] = useState<DocumentType | null>(null)
  const ACCENT = '#0D3B8E'
  const sortCodeValue = String(row?.sort_code || '').trim()

  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = usePresignedDownloadMutation()
  const { mutateAsync: regenerateDocuments, isPending: isRegeneratingDocuments } =
    useRegenerateOrderDocuments()

  const hasLabelDocument = Boolean(String(row?.label_url || row?.label_key || row?.label || '').trim())
  const hasInvoiceDocument = Boolean(
    String(row?.invoice_url || row?.invoice_key || row?.invoice_link || '').trim(),
  )
  const hasManifestDocument = Boolean(
    String(row?.manifest_url || row?.manifest_key || row?.manifest || '').trim(),
  )
  const normalizedStatus = String(row?.order_status || '').trim().toLowerCase()
  const isManifestedOrOperational =
    Boolean(String(row?.manifest_key || row?.manifest || row?.awb_number || '').trim()) ||
    [
      'booked',
      'shipment_created',
      'pickup_initiated',
      'manifest_generated',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'ndr',
      'undelivered',
      'rto',
      'rto_in_transit',
      'rto_delivered',
    ].includes(normalizedStatus)

  const handleDownload = async (key: string, fileType: DocumentType = 'label') => {
    try {
      setDownloadingKey(key)
      const urls = await mutateAsync({ keys: [key] })
      const url = Array.isArray(urls) ? urls[0] : urls

      if (!url) {
        toast.open({
          message: `${
            fileType === 'label' ? 'Label' : fileType === 'invoice' ? 'Invoice' : 'Manifest'
          } file not found. It may not have been generated yet.`,
          severity: 'error',
        })
        return
      }

      await downloadFile(url, getDownloadFileName(row, fileType, key))
    } catch (err: unknown) {
      console.error('Download failed', err)
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Failed to download file'
      toast.open({
        message:
          errorMessage.includes('not found') || errorMessage.includes('404')
            ? `${
                fileType === 'label' ? 'Label' : fileType === 'invoice' ? 'Invoice' : 'Manifest'
              } file not found. It may not have been generated yet.`
            : `Failed to download ${fileType}: ${errorMessage}`,
        severity: 'error',
      })
    } finally {
      setDownloadingKey(null)
    }
  }

  const handleDirectDownload = async (url: string, fileType: DocumentType = 'label') => {
    try {
      if (!url || !isDirectDownloadUrl(url)) {
        toast.open({
          message: `Invalid ${fileType} URL`,
          severity: 'error',
        })
        return
      }

      await downloadFile(url, getDownloadFileName(row, fileType, url))
    } catch (err) {
      console.error('Direct download failed', err)
      toast.open({
        message: `Failed to open ${fileType}`,
        severity: 'error',
      })
    }
  }

  const handleGeneratedDocumentDownload = async (
    documentType: DocumentType,
    payload: Record<string, unknown>,
  ) => {
    const labelValue = String(payload.label || payload.label_url || payload.label_key || '').trim()
    const invoiceValue = String(
      payload.invoice_link || payload.invoice_url || payload.invoice_key || '',
    ).trim()
    const manifestValue = String(
      payload.manifest_url || payload.manifest_key || payload.manifest || '',
    ).trim()

    const source =
      documentType === 'label'
        ? labelValue
        : documentType === 'invoice'
          ? invoiceValue
          : manifestValue

    if (!source) return false

    if (isDirectDownloadUrl(source)) {
      await handleDirectDownload(source, documentType)
      return true
    }

    await handleDownload(source, documentType)
    return true
  }

  const handleGenerateDocument = async (
    documentType: DocumentType,
    regenerateExistingDocument = false,
  ) => {
    try {
      setGeneratingDocumentType(documentType)

      if (documentType === 'manifest' && !regenerateExistingDocument) {
        const manifestDisabledReason = getB2CManifestDisabledReason(row)
        if (manifestDisabledReason) {
          toast.open({
            message: manifestDisabledReason,
            severity: 'error',
          })
          return
        }

        const manifestRef = getB2CManifestIdentifier(row)
        if (!manifestRef) {
          toast.open({
            message: 'Manifest cannot be generated until this order has an order number or AWB.',
            severity: 'error',
          })
          return
        }

        const response = await generateManifestService({ awbs: [manifestRef], type: 'b2c' })
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] }),
          queryClient.invalidateQueries({ queryKey: ['orders'] }),
        ])

        const downloaded = await handleGeneratedDocumentDownload('manifest', {
          manifest_url: response.manifest_url,
          manifest_key: response.manifest_key,
        })

        toast.open({
          message: downloaded
            ? 'Manifest generated and downloaded.'
            : 'Manifest generated successfully.',
          severity: 'success',
        })
        return
      }

      const result = await regenerateDocuments({
        orderId: String(row.id),
        regenerateLabel: documentType === 'label',
        regenerateInvoice: documentType === 'invoice',
        regenerateManifest: documentType === 'manifest',
      })
      const payload = ((result as { data?: Record<string, unknown> })?.data ||
        result ||
        {}) as Record<string, unknown>
      const downloaded = await handleGeneratedDocumentDownload(documentType, payload)

      if (!downloaded) {
        const documentName =
          documentType === 'label' ? 'Label' : documentType === 'invoice' ? 'Invoice' : 'Manifest'
        toast.open({
          message: `${documentName} generated successfully.`,
          severity: 'success',
        })
      }
    } catch (err) {
      console.error(`${documentType} generation failed`, err)
      toast.open({
        message: getActionableErrorMessage(
          err,
          `Failed to generate ${documentType}. Please try again.`,
        ),
        severity: 'error',
      })
    } finally {
      setGeneratingDocumentType(null)
    }
  }

  const renderDocAction = ({
    title,
    keyValue,
    urlValue,
    type,
  }: {
    title: string
    keyValue?: string
    urlValue?: string
    type: DocumentType
  }) => {
    const manifestDisabledReason =
      type === 'manifest' ? getB2CManifestDisabledReason(row) : null
    const canGenerate = type === 'manifest' ? !manifestDisabledReason : isManifestedOrOperational
    if (!keyValue && !urlValue && !canGenerate && type !== 'manifest') return null

    const isDownloading = downloadingKey === keyValue
    const isGenerating = generatingDocumentType === type
    const hasDocument = Boolean(keyValue || urlValue)
    const disabledReason = !hasDocument ? manifestDisabledReason : null
    const canRegenerateExistingDocument = hasDocument && (type === 'manifest' || canGenerate)
    const isDocumentBusy =
      isGenerating ||
      isRegeneratingDocuments ||
      ((isDownloading || isPending) && !urlValue)

    return (
      <Paper
        elevation={0}
        sx={{
          p: 1,
          borderRadius: 1.25,
          border: `1px solid ${alpha(ACCENT, 0.14)}`,
          backgroundColor: '#FFFFFF',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
          <Stack direction="row" alignItems="center" spacing={0.8} sx={{ minWidth: 120 }}>
            <FaFilePdf size={14} color={ACCENT} />
            <Typography fontWeight={700} fontSize={12}>
              {title}
            </Typography>
            {sortCodeValue && type === 'label' && (
              <Chip
                size="small"
                variant="outlined"
                label={`Sort Code: ${sortCodeValue}`}
                sx={{
                  height: 22,
                  fontSize: 10,
                  borderColor: alpha(ACCENT, 0.3),
                  color: ACCENT,
                }}
              />
            )}
          </Stack>

          <Stack direction="row" spacing={0.6} alignItems="center" flexWrap="wrap" useFlexGap>
            <Tooltip title={disabledReason || ''} arrow disableHoverListener={!disabledReason}>
              <span>
                <Button
                  size="small"
                  variant={hasDocument ? 'outlined' : 'contained'}
                  sx={{
                    minWidth: 0,
                    height: 24,
                    px: 0.9,
                    py: 0,
                    borderRadius: 1,
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'none',
                  }}
                  onClick={() => {
                    if (urlValue && isDirectDownloadUrl(urlValue)) {
                      handleDirectDownload(urlValue, type)
                      return
                    }
                    if (keyValue) {
                      handleDownload(keyValue, type)
                      return
                    }
                    handleGenerateDocument(type)
                  }}
                  disabled={Boolean(disabledReason || isDocumentBusy)}
                >
                  {isGenerating
                    ? 'Generating'
                    : isDownloading
                      ? 'Downloading'
                      : hasDocument
                        ? 'Download'
                        : `Generate ${title}`}
                </Button>
              </span>
            </Tooltip>
            {canRegenerateExistingDocument && (
              <Button
                size="small"
                variant="contained"
                sx={{
                  minWidth: 0,
                  height: 24,
                  px: 0.9,
                  py: 0,
                  borderRadius: 1,
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'none',
                }}
                onClick={() => handleGenerateDocument(type, true)}
                disabled={isDocumentBusy}
              >
                {isGenerating ? 'Regenerating' : 'Regenerate'}
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>
    )
  }

  const labelDoc = getDocumentReference(row, 'label')
  const manifestDoc = getDocumentReference(row, 'manifest')
  const invoiceDoc = getDocumentReference(row, 'invoice')
  const products = Array.isArray(row.products) ? row.products : []
  const textValue = (value: unknown, fallback = '-') => {
    const text = String(value ?? '').trim()
    return text || fallback
  }
  const detailCardSx = {
    p: 1.15,
    borderRadius: 1.25,
    border: `1px solid ${alpha(ACCENT, 0.12)}`,
    backgroundColor: '#FFFFFF',
  }
  const detailLabelSx = {
    color: 'text.secondary',
    fontSize: '11px',
    fontWeight: 700,
    lineHeight: 1.2,
  }
  const detailValueSx = {
    color: 'text.primary',
    fontSize: '12px',
    fontWeight: 700,
    lineHeight: 1.35,
  }
  const renderDetailCard = ({
    icon,
    label,
    value,
    wide = false,
  }: {
    icon: ReactNode
    label: string
    value: ReactNode
    wide?: boolean
  }) => (
    <Paper elevation={0} sx={{ ...detailCardSx, gridColumn: wide ? { md: 'span 2' } : undefined }}>
      <Stack direction="row" spacing={0.9} alignItems="flex-start">
        <Box sx={{ color: ACCENT, mt: 0.15, lineHeight: 0 }}>{icon}</Box>
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography sx={detailLabelSx}>{label}</Typography>
          {typeof value === 'string' || typeof value === 'number' ? (
            <Typography sx={detailValueSx}>{value}</Typography>
          ) : (
            value
          )}
        </Stack>
      </Stack>
    </Paper>
  )

  return (
    <Stack spacing={1.2} p={{ xs: 0.8, md: 1 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Typography fontWeight={800} fontSize={14}>
          Order Details
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '11px', fontWeight: 700 }}>
          {textValue(row.order_number)}
        </Typography>
      </Stack>
      <Divider sx={{ borderColor: alpha(ACCENT, 0.1) }} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 1,
        }}
      >
        {renderDetailCard({
          icon: <MdPerson size={16} />,
          label: 'Customer',
          value: `${textValue(row.buyer_name)} (${textValue(row.buyer_phone)})`,
        })}
        {renderDetailCard({
          icon: <MdReceipt size={16} />,
          label: 'AWB',
          value: textValue(row.awb_number),
        })}
        {renderDetailCard({
          icon: <MdLocalShipping size={16} />,
          label: 'Courier',
          value: textValue(row.courier_partner),
        })}
        {renderDetailCard({
          icon: <MdLocalShipping size={16} />,
          label: 'Pickup Location',
          value: `${textValue(row?.pickup_details?.name)}, ${textValue(
            row?.pickup_details?.address,
          )}, ${textValue(row?.pickup_details?.city)} - ${textValue(
            row?.pickup_details?.pincode,
          )}`,
        })}
        {renderDetailCard({
          icon: <MdLocationOn size={16} />,
          label: 'Address',
          wide: true,
          value: `${textValue(row.address)}, ${textValue(row.city)}, ${textValue(
            row.state,
          )} - ${textValue(row.pincode)}`,
        })}
        {renderDetailCard({
          icon: <MdShoppingBag size={16} />,
          label: 'Products',
          wide: true,
          value: (
            <Stack spacing={0.35}>
              {products.length ? (
                products.map(
                  (
                    p: {
                      name?: string
                      productName?: string
                      qty?: number
                      quantity?: number
                      price?: string | number
                      box_name?: string
                      height?: string
                      length?: string
                      breadth?: string
                    },
                    i: number,
                  ) =>
                    type === 'b2c' ? (
                      <Typography key={i} sx={detailValueSx}>
                        {textValue(p?.name || p?.productName || 'Product')} x {textValue(p?.qty ?? p?.quantity ?? 1)} - Rs.{textValue(p?.price ?? 0)}
                      </Typography>
                    ) : (
                      <Stack key={i} spacing={0.15}>
                        <Typography sx={detailValueSx}>{textValue(p?.box_name || 'Box')}</Typography>
                        <Typography sx={detailLabelSx}>
                          {textValue(p?.length)} x {textValue(p?.height)} x {textValue(p?.breadth)}
                        </Typography>
                      </Stack>
                    ),
                )
              ) : (
                <Typography sx={detailValueSx}>-</Typography>
              )}
            </Stack>
          ),
        })}
      </Box>

      {sortCodeValue && (
        <Paper elevation={0} sx={detailCardSx}>
          <Stack direction="row" spacing={0.9} alignItems="center">
            <Box sx={{ color: ACCENT, lineHeight: 0 }}>
              <MdInventory2 size={16} />
            </Box>
            <Typography sx={detailLabelSx}>Sort Code</Typography>
            <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '12px' }}>
              {sortCodeValue}
            </Box>
          </Stack>
        </Paper>
      )}

      {String(row?.order_status || '').toLowerCase() === 'manifest_failed' && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: '1px solid rgba(211, 47, 47, 0.18)',
            backgroundColor: '#FFF7F7',
          }}
        >
          <Stack spacing={0.75}>
            <Typography fontWeight={700} color="error.main">
              Manifest failed
            </Typography>
            <Typography fontSize={13} color="text.secondary">
              {row?.manifest_error || 'The courier rejected the manifest request.'}
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              Retry attempts: {Number(row?.manifest_retry_count ?? 0)}/3
              {row?.manifest_last_retry_at
                ? ` - Last retry: ${new Date(row.manifest_last_retry_at).toLocaleString()}`
                : ''}
            </Typography>
          </Stack>
        </Paper>
      )}

      {(hasLabelDocument || hasInvoiceDocument || hasManifestDocument || isManifestedOrOperational) && (
        <Paper
          elevation={0}
          sx={{
            mt: 0.5,
            p: 1.15,
            borderRadius: 1.25,
            border: `1px solid ${alpha(ACCENT, 0.16)}`,
            backgroundColor: alpha(ACCENT, 0.03),
          }}
        >
          <Typography fontWeight={800} fontSize={13} mb={0.9}>
            Documents
          </Typography>
          <Stack spacing={0.75}>
            {renderDocAction({
              title: 'Label',
              keyValue: labelDoc.key || undefined,
              urlValue: labelDoc.url || undefined,
              type: 'label',
            })}
            {renderDocAction({
              title: 'Manifest',
              keyValue: manifestDoc.key || undefined,
              urlValue: manifestDoc.url || undefined,
              type: 'manifest',
            })}
            {renderDocAction({
              title: 'Invoice',
              keyValue: invoiceDoc.key || undefined,
              urlValue: invoiceDoc.url || undefined,
              type: 'invoice',
            })}
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}
