import { alpha, Box, Button, Chip, Divider, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
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
          p: 1.5,
          borderRadius: 2,
          border: `1px solid ${alpha(ACCENT, 0.14)}`,
          backgroundColor: '#FFFFFF',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="flex-start" gap={1.25}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FaFilePdf size={16} color={ACCENT} />
            <Typography fontWeight={600} fontSize={13}>
              {title}
            </Typography>
            {sortCodeValue && type === 'label' && (
              <Chip
                size="small"
                variant="outlined"
                label={`Sort Code: ${sortCodeValue}`}
                sx={{ fontSize: 11, borderColor: alpha(ACCENT, 0.3), color: ACCENT }}
              />
            )}
          </Stack>

          <Tooltip title={disabledReason || ''} arrow disableHoverListener={!disabledReason}>
            <span>
              <Button
                size="small"
                variant={hasDocument ? 'outlined' : 'contained'}
                sx={{ minWidth: 0, px: 1.25, py: 0.25, textTransform: 'none' }}
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
                  ? 'Generating...'
                  : isDownloading
                    ? 'Downloading...'
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
              sx={{ minWidth: 0, px: 1.25, py: 0.25, textTransform: 'none' }}
              onClick={() => handleGenerateDocument(type, true)}
              disabled={isDocumentBusy}
            >
              {isGenerating ? 'Regenerating...' : 'Regenerate'}
            </Button>
          )}
        </Stack>
      </Paper>
    )
  }

  const labelDoc = getDocumentReference(row, 'label')
  const manifestDoc = getDocumentReference(row, 'manifest')
  const invoiceDoc = getDocumentReference(row, 'invoice')

  return (
    <Stack spacing={2} p={1.5}>
      <Typography fontWeight={700} fontSize={16}>
        Order Details
      </Typography>
      <Divider />

      <Stack direction="row" spacing={1} alignItems="center">
        <MdPerson size={20} />
        <Typography>
          <strong>Customer:</strong> {row.buyer_name} ({row.buyer_phone})
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <MdLocationOn size={20} />
        <Typography>
          <strong>Address:</strong> {row.address}, {row.city}, {row.state} - {row.pincode}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="flex-start">
        <MdShoppingBag size={20} style={{ marginTop: 4 }} />
        <Stack spacing={0.5}>
          <Typography fontWeight={500}>Products:</Typography>
          {row.products?.map(
            (
              p: {
                name: string
                qty: number
                price: string
                box_name?: string
                height?: string
                length?: string
                breadth?: string
              },
              i: number,
            ) =>
              type === 'b2c' ? (
                <Typography key={i} fontSize={13}>
                  {p?.name} x {p?.qty} - Rs.{p?.price}
                </Typography>
              ) : (
                <Stack key={i}>
                  <Typography fontSize={13}>{p?.box_name}</Typography>
                  <Typography fontSize={13}>
                    {p?.length} x {p?.height} x {p?.breadth}
                  </Typography>
                </Stack>
              ),
          )}
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <MdLocalShipping size={20} />
        <Typography>
          <strong>Pickup Location:</strong> {row?.pickup_details?.name},{' '}
          {row?.pickup_details?.address}, {row?.pickup_details?.city} -{' '}
          {row?.pickup_details?.pincode}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <MdReceipt size={20} />
          <Typography>
            <strong>AWB:</strong> {row.awb_number}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <MdLocalShipping size={20} />
          <Typography>
            <strong>Courier:</strong> {row.courier_partner}
          </Typography>
        </Stack>
      </Stack>

      {sortCodeValue && (
        <Stack direction="row" spacing={1} alignItems="center">
          <MdInventory2 size={20} />
          <Typography>
            <strong>Sort Code:</strong>{' '}
            <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
              {sortCodeValue}
            </Box>
          </Typography>
        </Stack>
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
            p: 2,
            borderRadius: 2.5,
            border: `1px solid ${alpha(ACCENT, 0.16)}`,
            backgroundColor: alpha(ACCENT, 0.03),
          }}
        >
          <Typography fontWeight={700} fontSize={14} mb={1.25}>
            Documents
          </Typography>
          <Stack spacing={1}>
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
