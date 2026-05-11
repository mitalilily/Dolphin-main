import { useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  AlertTitle,
  alpha,
  Box,
  Button,
  Link,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import moment from 'moment'
import { useState, type ReactNode } from 'react'
import { generateManifestService } from '../../../api/order.service'
import { useAllCouriersWithDetails } from '../../../hooks/Integrations/useCouriers'
import {
  useB2COrdersByUser,
  useCancelShipment,
  useCreateReverseShipment,
  useRetryFailedManifest,
} from '../../../hooks/Orders/useOrders'
import { usePickupAddresses } from '../../../hooks/Pickup/usePickupAddresses'
import { usePresignedDownloadMutation } from '../../../hooks/Uploads/usePresignedDownloadUrls'
import { useKycVerification } from '../../../hooks/User/useKycVerification'
import type { B2COrder } from '../../../types/generic.types'
import { FilterBar, type FilterField } from '../../FilterBar'
import { toast } from '../../UI/Toast'
import StatusChip from '../../UI/chip/StatusChip'
import CustomDrawer from '../../UI/drawer/CustomDrawer'
import { SmartTabs } from '../../UI/tab/Tabs'
import DataTable, { type Column } from '../../UI/table/DataTable'
import TableSkeleton from '../../UI/table/TableSkeleton'
import CustomSelect from '../../UI/inputs/CustomSelect'
import {
  BULK_MANIFEST_LIMIT,
  downloadFile,
  type DocumentEntry,
  type DocumentType,
  getActionableErrorMessage,
  getB2CCancelDisabledReason,
  getB2CManifestIdentifier,
  getB2CManifestDisabledReason,
  getB2CManifestProvider,
  getDocumentReference,
  getDownloadFileName,
  hasManifestDocument,
  isB2CManifestComplete,
  isB2CManifestEligible,
  summarizeMessages,
  summarizeOrderNumbers,
} from '../bulkActionUtils'
import { OrderExpandedRow } from '../OrderExpandedRow'
import ReverseModal from '../reverse/ReverseModal'
import B2COrderFormSteps from './B2COrderForm'

/* ───────────── Types ───────────── */
interface OrderFilters {
  status?: string
  sortBy?: 'created_at'
  sortOrder?: 'asc' | 'desc'
  type?: string
  courier?: string
  warehouse?: string
  fromDate?: string
  toDate?: string
  search?: string
}

type BulkFeedback = {
  severity: 'info' | 'success' | 'error' | 'warning'
  title: string
  message: string
}

/* ───────────── Status Color Mapping ───────────── */
export const statusColorMap: Record<string, 'success' | 'pending' | 'error' | 'info'> = {
  pending: 'pending',
  booked: 'info',
  manifest_failed: 'error',
  pickup_initiated: 'success',
  shipment_created: 'info', // legacy
  in_transit: 'pending',
  out_for_delivery: 'pending',
  delivered: 'success',
  cancelled: 'error',
  ndr: 'error',
  rto: 'error',
  rto_in_transit: 'pending',
  rto_delivered: 'info',
  cancellation_requested: 'info',
  manifest_generated: 'success', // legacy
}

/* ───────────── Shipping Statuses ───────────── */
const shippingStatusMap: Record<string, string> = {
  pending: 'Pending',
  booked: 'Booked',
  manifest_failed: 'Manifest Failed',
  pickup_initiated: 'Manifested',
  shipment_created: 'Shipment Created',
  in_transit: 'In Transit',
  out_for_delivery: 'Out For Delivery',
  delivered: 'Delivered',
  ndr: 'NDR',
  rto: 'RTO Initiated',
  rto_in_transit: 'RTO In Transit',
  rto_delivered: 'RTO Delivered',
  cancellation_requested: 'Cancellation Requested',
  cancelled: 'Cancelled',
  manifest_generated: 'Manifested',
}

const B2COrdersList = () => {
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm')) // mobile
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md')) // tablet
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg')) // small desktop
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg')) // large desktop

  let drawerWidth: string | number = '100%' // default full width
  if (isXs) drawerWidth = '100%' // mobile full width
  else if (isSm) drawerWidth = '95%' // tablets
  else if (isMd) drawerWidth = '95%' // small desktops
  else if (isLgUp) drawerWidth = 1200 // large desktop fixed width
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedOrderIds, setSelectedOrderIds] = useState<Array<B2COrder['id']>>([])
  const [selectionResetToken, setSelectionResetToken] = useState(0)
  const [downloadingDocumentType, setDownloadingDocumentType] = useState<DocumentType | null>(null)
  const [bulkManifesting, setBulkManifesting] = useState(false)
  const [bulkFeedback, setBulkFeedback] = useState<BulkFeedback | null>(null)
  const [filters, setFilters] = useState<OrderFilters>({
    status: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  })
  const [selectedTab, setSelectedTab] = useState<string>('')

  const effectiveFilters: OrderFilters = {
    ...filters,
    status: selectedTab || undefined,
    sortBy: filters.sortBy || 'created_at',
    sortOrder: filters.sortOrder || 'desc',
  }

  const { data, isLoading, isError } = useB2COrdersByUser(page, rowsPerPage, effectiveFilters)
  const { mutateAsync: retryFailedManifest, isPending: retryingManifest } = useRetryFailedManifest()
  const queryClient = useQueryClient()
  const { mutateAsync: presignDownloads } = usePresignedDownloadMutation()
  const { data: couriers } = useAllCouriersWithDetails()
  const { data: warehouses } = usePickupAddresses()
  const { mutate: cancelShipment, isPending: cancellingShipment } = useCancelShipment()
  const { mutate: createReverse } = useCreateReverseShipment()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reverseOrder, setReverseOrder] = useState<any | null>(null)
  const orders: B2COrder[] = data?.orders || []
  const selectedOrders: B2COrder[] = orders.filter((order) => selectedOrderIds.includes(order.id))
  const manifestValidationMessage =
    selectedOrders.length === 0
      ? 'Select orders to start a bulk action.'
      : selectedOrders.length > BULK_MANIFEST_LIMIT
        ? `You can manifest a maximum of ${BULK_MANIFEST_LIMIT} orders at a time.`
        : selectedOrders.some((order) => !isB2CManifestEligible(order))
          ? 'Some selected orders are not ready for manifest yet.'
          : ''

  const clearSelection = () => {
    setSelectedOrderIds([])
    setSelectionResetToken((current) => current + 1)
  }

  /* ───────────── Handlers ───────────── */
  const handleGenerateManifest = async (order: B2COrder) => {
    const manifestDisabledReason = getB2CManifestDisabledReason(order)
    if (manifestDisabledReason) {
      setBulkFeedback({
        severity: 'error',
        title: 'Manifest unavailable',
        message: manifestDisabledReason,
      })
      toast.open({ message: manifestDisabledReason, severity: 'error' })
      return
    }

    const manifestRef = getB2CManifestIdentifier(order)
    if (!manifestRef) {
      const message = `Manifest cannot be started for ${order.order_number} yet.`
      setBulkFeedback({
        severity: 'error',
        title: 'Manifest unavailable',
        message,
      })
      toast.open({ message, severity: 'error' })
      return
    }
    try {
      setBulkFeedback({
        severity: 'info',
        title: 'Manifest in progress',
        message: `Processing ${order.order_number}.`,
      })
      const response = await generateManifestService({ awbs: [manifestRef], type: 'b2c' })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
      ])
      const successMessage = `Manifest completed for ${order.order_number}.`
      const warningSummary = summarizeMessages(response.warnings || [])
      if (warningSummary) {
        const warningMessage = `${successMessage} ${warningSummary}`
        setBulkFeedback({
          severity: 'warning',
          title: 'Manifest completed with warnings',
          message: warningMessage,
        })
        toast.open({ message: warningMessage, severity: 'info' })
        return
      }
      setBulkFeedback({
        severity: 'success',
        title: 'Manifest completed',
        message: successMessage,
      })
      toast.open({ message: successMessage, severity: 'success' })
    } catch (error) {
      console.error('Manifest failed for order:', order.order_number, error)
      const errorMessage = getActionableErrorMessage(
        error,
        `Manifest failed for ${order.order_number}.`,
      )
      setBulkFeedback({
        severity: 'error',
        title: 'Manifest failed',
        message: `${order.order_number}: ${errorMessage}`,
      })
      toast.open({
        message: `${order.order_number}: ${errorMessage}`,
        severity: 'error',
      })
    }
  }

  const handleRetryManifest = async (order: B2COrder) => {
    if (!order.id) return
    await retryFailedManifest(String(order.id))
  }

  const handleApplyFilters = (appliedFilters: OrderFilters) => {
    // Merge while preserving current status unless explicitly set
    setFilters((prev) => ({
      ...prev,
      ...appliedFilters,
      status: appliedFilters.status !== undefined ? appliedFilters.status : prev.status,
      sortBy: appliedFilters.sortBy !== undefined ? appliedFilters.sortBy : prev.sortBy,
      sortOrder: appliedFilters.sortOrder !== undefined ? appliedFilters.sortOrder : prev.sortOrder,
    }))
    setPage(1)
    clearSelection()
    setBulkFeedback(null)
  }

  const { checkKycBeforeAction } = useKycVerification()

  const handleCreateB2COrder = () => {
    checkKycBeforeAction(() => {
      setDrawerOpen(true)
    })
  }

  const handleTabChange = (newValue: string) => {
    setSelectedTab(newValue)
    setPage(1)
    clearSelection()
    setBulkFeedback(null)
    setFilters((prev) => ({
      ...prev,
      sortBy: prev.sortBy || 'created_at',
      sortOrder: prev.sortOrder || 'desc',
    }))

    // Keep status filtering local; do not sync status to URL params.
  }

  const handleBulkManifest = async () => {
    if (!selectedOrders.length) {
      const message = 'Select up to 5 eligible orders to manifest.'
      setBulkFeedback({
        severity: 'error',
        title: 'No orders selected',
        message,
      })
      toast.open({ message, severity: 'error' })
      return
    }

    if (manifestValidationMessage) {
      setBulkFeedback({
        severity: 'error',
        title: 'Manifest unavailable',
        message: manifestValidationMessage,
      })
      toast.open({ message: manifestValidationMessage, severity: 'error' })
      return
    }

    setBulkManifesting(true)
    setBulkFeedback({
      severity: 'info',
      title: 'Manifest in progress',
      message: `Processing ${selectedOrders.length} selected order(s).`,
    })

    try {
      const manifestGroups = selectedOrders.reduce<Record<string, B2COrder[]>>((groups, order) => {
        const manifestIdentifier = getB2CManifestIdentifier(order)
        if (!manifestIdentifier) return groups

        const providerKey = getB2CManifestProvider(order)
        if (!groups[providerKey]) groups[providerKey] = []
        groups[providerKey].push(order)
        return groups
      }, {})

      const failedOrders: B2COrder[] = []
      const failureReasons: string[] = []
      const warningMessages: string[] = []
      let successCount = 0

      for (const [providerKey, providerOrders] of Object.entries(manifestGroups)) {
        const identifiers = providerOrders
          .map((order) => getB2CManifestIdentifier(order))
          .filter((value): value is string => Boolean(value))

        if (!identifiers.length) continue

        try {
          const response = await generateManifestService({ awbs: identifiers, type: 'b2c' })
          successCount += providerOrders.length
          if (response.warnings?.length) {
            warningMessages.push(...response.warnings)
          }
        } catch (error) {
          console.error('Bulk manifest provider batch failed:', error)
          failedOrders.push(...providerOrders)
          failureReasons.push(
            `${providerKey}: ${getActionableErrorMessage(
              error,
              'Manifest could not be completed for this batch.',
            )}`,
          )
        }
      }

      if (successCount > 0) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] }),
          queryClient.invalidateQueries({ queryKey: ['orders'] }),
        ])
      }

      if (failedOrders.length > 0) {
        const failedOrderIds = failedOrders.map((order) => order.id)
        const failedOrderNumbers = summarizeOrderNumbers(
          failedOrders.map((order) => order.order_number || order.id),
        )
        const message =
          successCount > 0
            ? `Completed ${successCount} order(s). Failed for ${failedOrders.length}: ${failedOrderNumbers}. ${failureReasons.join(' ')}`
            : `Failed for ${failedOrders.length} order(s): ${failedOrderNumbers}. ${failureReasons.join(' ')}`
        const warningSummary = summarizeMessages(warningMessages)
        const finalMessage = warningSummary ? `${message} ${warningSummary}` : message

        setSelectedOrderIds(failedOrderIds)
        setBulkFeedback({
          severity: successCount > 0 ? 'warning' : 'error',
          title: successCount > 0 ? 'Manifest partially completed' : 'Manifest failed',
          message: finalMessage,
        })
        toast.open({ message: finalMessage, severity: 'error' })
        return
      }

      const successMessage = `Manifest completed for ${successCount} order(s).`
      const warningSummary = summarizeMessages(warningMessages)
      if (warningSummary) {
        const warningMessage = `${successMessage} ${warningSummary}`
        setBulkFeedback({
          severity: 'warning',
          title: 'Manifest completed with warnings',
          message: warningMessage,
        })
        toast.open({ message: warningMessage, severity: 'info' })
        clearSelection()
        return
      }
      setBulkFeedback({
        severity: 'success',
        title: 'Manifest completed',
        message: successMessage,
      })
      toast.open({ message: successMessage, severity: 'success' })
      clearSelection()
    } finally {
      setBulkManifesting(false)
    }
  }

  const handleBulkDownload = async (type: DocumentType) => {
    if (!selectedOrders.length) {
      const message = 'Select at least one order to download documents.'
      setBulkFeedback({
        severity: 'error',
        title: 'No orders selected',
        message,
      })
      toast.open({ message, severity: 'error' })
      return
    }

    setDownloadingDocumentType(type)
    setBulkFeedback({
      severity: 'info',
      title: `Downloading ${type}s`,
      message: `Preparing ${selectedOrders.length} selected order(s) for ${type} download.`,
    })

    try {
      const documentEntries = selectedOrders.reduce((entries: DocumentEntry[], order: B2COrder) => {
        const { key, url } = getDocumentReference(order, type)
        if (!key && !url) return entries

        const source = key || url
        entries.push({
          key,
          url,
          fileName: getDownloadFileName(order, type, source),
        })
        return entries
      }, [])

      if (!documentEntries.length) {
        const message = `No ${type} files are available for the selected orders.`
        setBulkFeedback({
          severity: 'error',
          title: `No ${type} files found`,
          message,
        })
        toast.open({ message, severity: 'error' })
        return
      }

      const uniqueEntries = Array.from(
        new Map<string, DocumentEntry>(
          documentEntries.map((entry) => [entry.key || entry.url || entry.fileName, entry]),
        ).values(),
      )

      const keyEntries = uniqueEntries.filter(
        (entry): entry is DocumentEntry & { key: string } => Boolean(entry.key),
      )
      const directEntries = uniqueEntries.filter(
        (entry): entry is DocumentEntry & { url: string } => !entry.key && Boolean(entry.url),
      )
      const presignedUrls = keyEntries.length
        ? await presignDownloads({ keys: keyEntries.map((entry) => String(entry.key)) })
        : []

      let downloadedCount = 0
      let skippedCount = documentEntries.length - uniqueEntries.length

      for (const entry of directEntries) {
        await downloadFile(String(entry.url), entry.fileName)
        downloadedCount += 1
      }

      for (const [index, entry] of keyEntries.entries()) {
        const resolvedUrl = Array.isArray(presignedUrls) ? presignedUrls[index] : null
        if (!resolvedUrl) {
          skippedCount += 1
          continue
        }

        await downloadFile(resolvedUrl, entry.fileName)
        downloadedCount += 1
      }

      if (!downloadedCount) {
        const message = `No ${type} files could be downloaded for the selected orders.`
        setBulkFeedback({
          severity: 'error',
          title: `${type[0].toUpperCase()}${type.slice(1)} download failed`,
          message,
        })
        toast.open({ message, severity: 'error' })
        return
      }

      const summaryMessage =
        skippedCount > 0
          ? `Downloaded ${downloadedCount} ${type} file(s). Skipped ${skippedCount} missing or duplicate file(s).`
          : `Downloaded ${downloadedCount} ${type} file(s).`

      setBulkFeedback({
        severity: skippedCount > 0 ? 'warning' : 'success',
        title:
          skippedCount > 0
            ? `${type[0].toUpperCase()}${type.slice(1)} download completed with skips`
            : `${type[0].toUpperCase()}${type.slice(1)} download completed`,
        message: summaryMessage,
      })
      toast.open({ message: summaryMessage, severity: skippedCount > 0 ? 'info' : 'success' })
    } catch (error) {
      console.error(`Bulk ${type} download failed:`, error)
      const message = getActionableErrorMessage(
        error,
        `Failed to download selected ${type} files. Please try again.`,
      )
      setBulkFeedback({
        severity: 'error',
        title: `${type[0].toUpperCase()}${type.slice(1)} download failed`,
        message,
      })
      toast.open({ message, severity: 'error' })
    } finally {
      setDownloadingDocumentType(null)
    }
  }

  /* ───────────── Filter Fields ───────────── */
  const filterFields: FilterField[] = [
    {
      name: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by customer, order # etc.',
    },
    {
      name: 'type',
      label: 'Order Type',
      type: 'select',
      options: [
        { label: 'All', value: '' },
        { label: 'COD', value: 'cod' },
        { label: 'Prepaid', value: 'prepaid' },
      ],
      isAdvanced: true,
    },
    {
      name: 'courier',
      label: 'Courier',
      type: 'select',
      options:
        couriers?.map((c: { name: string; id: string }) => ({ label: c.name, value: c.id })) ?? [],
      isAdvanced: true,
    },
    {
      name: 'warehouse',
      label: 'Warehouse',
      type: 'select',
      options:
        warehouses?.pickupAddresses?.map((w) => ({
          label: w.pickup?.addressNickname,
          value: w.pickup?.addressNickname,
        })) ?? [],
      isAdvanced: true,
    },
    { name: 'fromDate', label: 'From Date', type: 'date', placeholder: 'From' },
    { name: 'toDate', label: 'To Date', type: 'date', placeholder: 'To' },
  ]

  const defaultFilterValues: Record<string, unknown> = {
    sortBy: 'created_at',
    sortOrder: 'desc',
    ...filters,
  }

  /* ───────────── Columns ───────────── */
  const hasLabelGenerated = (row: B2COrder) =>
    Boolean(String(row.label_url || row.label_key || row.label || '').trim())

  const hasInvoiceGenerated = (row: B2COrder) =>
    Boolean(String(row.invoice_url || row.invoice_key || row.invoice_link || '').trim())

  const compactChipSx = {
    height: 22,
    px: 0.35,
    fontSize: '10px',
    fontWeight: 800,
    borderRadius: 1,
    boxShadow: 'none',
    '& .MuiChip-icon': {
      color: 'currentColor',
      ml: 0.35,
      mr: -0.2,
    },
    '& .MuiChip-label': {
      px: 0.65,
    },
  }

  const primaryCellTextSx = {
    color: theme.palette.text.primary,
    fontSize: '12px',
    fontWeight: 800,
    lineHeight: 1.25,
  }

  const secondaryCellTextSx = {
    color: theme.palette.text.secondary,
    fontSize: '11px',
    fontWeight: 600,
    lineHeight: 1.25,
  }

  const compactButtonSx = {
    minWidth: 0,
    height: 24,
    px: 0.85,
    py: 0,
    borderRadius: 1,
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'none',
    lineHeight: 1,
  }

  const formatMoney = (value: unknown) => `Rs.${Number(value ?? 0).toFixed(2)}`
  const formatDate = (value: unknown) =>
    value ? moment(value).format('DD MMM, hh:mm A') : '-'
  const compactStatusLabels: Record<string, string> = {
    cancellation_requested: 'Cancel Req.',
    manifest_failed: 'Manifest Failed',
    out_for_delivery: 'OFD',
    pickup_initiated: 'Manifested',
    rto_in_transit: 'RTO Transit',
    rto_delivered: 'RTO Done',
  }

  const renderDocPill = (label: string, generated: boolean) => {
    const color = generated ? '#147A56' : '#A15C00'
    const bg = generated ? '#E4F6EE' : '#FFF0DE'

    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          height: 22,
          px: 0.8,
          borderRadius: 1,
          border: `1px solid ${alpha(color, 0.16)}`,
          backgroundColor: bg,
          color,
          fontSize: '10px',
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        {label}
      </Box>
    )
  }

  const columns: Column<B2COrder>[] = [
    {
      label: 'Order',
      id: 'order_number',
      minWidth: 160,
      render: (_v, row) => (
        <Stack spacing={0.45}>
          <Stack direction="row" spacing={0.55} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography sx={primaryCellTextSx}>{row.order_number || '-'}</Typography>
            <StatusChip
              label={row.is_external_api ? 'API' : 'Local'}
              status={row.is_external_api ? 'info' : 'success'}
              sx={compactChipSx}
            />
          </Stack>
          <Typography sx={secondaryCellTextSx}>AWB: {row.awb_number || '-'}</Typography>
          <Typography sx={secondaryCellTextSx}>Created: {formatDate(row.created_at)}</Typography>
        </Stack>
      ),
      truncate: false,
    },
    {
      label: 'Buyer',
      id: 'buyer_name',
      minWidth: 130,
      render: (_v, row) => (
        <Stack spacing={0.3}>
          <Typography sx={primaryCellTextSx}>{row.buyer_name || '-'}</Typography>
          <Typography sx={secondaryCellTextSx}>{row.buyer_phone || '-'}</Typography>
        </Stack>
      ),
      truncate: false,
    },
    {
      label: 'Courier',
      id: 'courier_partner',
      minWidth: 110,
      render: (value) => (
        <Typography sx={{ ...primaryCellTextSx, fontWeight: 700 }}>
          {String(value || '-')}
        </Typography>
      ),
    },
    {
      label: 'Financials',
      id: 'order_amount',
      minWidth: 124,
      render: (_v, row) => {
        const orderAmount = Number(row.order_amount ?? 0)
        const cod = Number(row.cod_charges ?? 0)
        const customerTotal = Math.max(orderAmount - cod, 0)
        const chargeRow = (label: string, value: unknown) => (
          <Stack direction="row" justifyContent="space-between" gap={1}>
            <Typography sx={secondaryCellTextSx}>{label}</Typography>
            <Typography sx={{ ...secondaryCellTextSx, color: theme.palette.text.primary }}>
              {formatMoney(value)}
            </Typography>
          </Stack>
        )

        return (
          <Stack spacing={0.45}>
            <Typography sx={primaryCellTextSx}>{formatMoney(customerTotal)}</Typography>
            <Stack spacing={0.2}>
              {chargeRow('Ship', row.shipping_charges)}
              {chargeRow('COD', row.cod_charges)}
              {chargeRow('Other', row.other_charges)}
            </Stack>
          </Stack>
        )
      },
      truncate: false,
    },
    {
      label: 'Docs',
      id: 'id',
      minWidth: 100,
      render: (_v, row) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {renderDocPill('Label', hasLabelGenerated(row))}
          {renderDocPill('Invoice', hasInvoiceGenerated(row))}
        </Stack>
      ),
      truncate: false,
    },
    {
      label: 'Status',
      id: 'order_status',
      minWidth: 110,
      render: (v) => (
        <StatusChip
          label={
            compactStatusLabels[String(v || '').toLowerCase()] ||
            shippingStatusMap[String(v || '').toLowerCase()] ||
            String(v || '-')
          }
          status={statusColorMap[String(v || '').toLowerCase()] || 'info'}
          sx={compactChipSx}
        />
      ),
      truncate: false,
    },
    {
      label: 'Actions',
      id: 'id',
      minWidth: 142,
      sticky: 'right',
      stickyOffset: 0,
      truncate: false,
      render: (_, row) => {
        const actions: ReactNode[] = []
        const currentStatus = String(row.order_status || '').toLowerCase()
        const manifestDisabledReason = getB2CManifestDisabledReason(row)
        const cancelDisabledReason = getB2CCancelDisabledReason(row)
        const manifestComplete = isB2CManifestComplete(row)
        const hasManifest = hasManifestDocument(row)
        const manifestButtonText = bulkManifesting
          ? 'Manifesting'
          : manifestComplete
            ? 'Manifested'
            : 'Manifest'

        if (currentStatus === 'delivered') {
          actions.push(
            <Button
              key="reverse"
              size="small"
              variant="outlined"
              onClick={() => setReverseOrder(row)}
              sx={compactButtonSx}
            >
              Reverse
            </Button>,
          )
        }

        actions.push(
          <Tooltip key="manifest" title={manifestDisabledReason || ''} arrow disableHoverListener={!manifestDisabledReason}>
            <span>
              <Button
                size="small"
                variant={manifestComplete ? 'outlined' : 'contained'}
                color={manifestComplete ? 'success' : 'primary'}
                disabled={bulkManifesting || Boolean(manifestDisabledReason)}
                onClick={() => handleGenerateManifest(row)}
                sx={compactButtonSx}
              >
                {manifestButtonText}
              </Button>
            </span>
          </Tooltip>,
        )

        if (hasManifest) {
          const manifestUrl =
            row.manifest_url ||
            (/^https?:\/\//i.test(String(row.manifest || '')) ? row.manifest : '')
          if (manifestUrl) {
            actions.push(
              <Link
                key="view-manifest"
                href={manifestUrl}
                target="_blank"
                rel="noopener"
                underline="hover"
                sx={{ alignSelf: 'center', fontSize: 11, fontWeight: 800 }}
              >
                View
              </Link>,
            )
          }
        }

        actions.push(
          <Tooltip key="cancel" title={cancelDisabledReason || ''} arrow disableHoverListener={!cancelDisabledReason}>
            <span>
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={cancellingShipment || Boolean(cancelDisabledReason)}
                onClick={() => cancelShipment(row.id as unknown as string)}
                sx={compactButtonSx}
              >
                Cancel
              </Button>
            </span>
          </Tooltip>,
        )

        const retriesRemaining = Number(row.manifest_retries_remaining ?? 0)
        const canRetryManifest =
          row.can_retry_manifest === true &&
          String(row.integration_type || '').toLowerCase() === 'delhivery'

        if (currentStatus === 'manifest_failed' && canRetryManifest) {
          actions.push(
            <Button
              key="retry-manifest"
              size="small"
              variant="contained"
              color="warning"
              disabled={retryingManifest}
              onClick={() => handleRetryManifest(row)}
              sx={compactButtonSx}
            >
              {retryingManifest ? 'Retrying' : `Retry ${retriesRemaining}`}
            </Button>,
          )
        }

        return (
          <Stack direction="row" spacing={0.55} flexWrap="wrap" useFlexGap>
            {actions}
          </Stack>
        )
      },
    },
  ]

  /* ───────────── Tabs ───────────── */
  const tabs = [
    { label: 'All', value: '' },
    ...Object.entries(shippingStatusMap).map(([value, label]) => ({
      label,
      value,
    })),
  ]

  if (isError) {
    return (
      <Typography color="error" textAlign="center" py={4}>
        Failed to fetch orders
      </Typography>
    )
  }

  return (
    <Stack spacing={2}>
      {/* Top row: Create button */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" gap={2}>
        <Box sx={{ width: { xs: '100%', sm: 220 } }}>
          <CustomSelect
            label="Sort by Created At"
            value={filters.sortOrder || 'desc'}
            onSelect={(value) => {
              const sortOrder = (value as 'asc' | 'desc') || 'desc'
              setFilters((prev) => ({ ...prev, sortBy: 'created_at', sortOrder }))
              setPage(1)
              clearSelection()
              setBulkFeedback(null)
            }}
            items={[
              { key: 'asc', label: 'Newest first' },
              { key: 'desc', label: 'Oldest first' },
            ]}
          />
        </Box>
        <Button variant="contained" color="primary" onClick={handleCreateB2COrder}>
          Create B2C Order
        </Button>
      </Stack>

      {/* 🔹 Status Tabs Row */}
      <SmartTabs tabs={tabs} value={selectedTab} onChange={handleTabChange} />

      {/* 🔹 Advanced Filter Bar */}
      <FilterBar
        fields={filterFields}
        onApply={handleApplyFilters}
        defaultValues={defaultFilterValues}
        appliedCount={Object.values(filters).filter(Boolean).length}
      />

      {bulkFeedback && (
        <Alert
          severity={bulkFeedback.severity}
          onClose={() => setBulkFeedback(null)}
          sx={{ alignItems: 'flex-start' }}
        >
          <AlertTitle>{bulkFeedback.title}</AlertTitle>
          {bulkFeedback.message}
        </Alert>
      )}

      {selectedOrders.length > 0 && (
        <Box
          sx={{
            p: 2,
            borderRadius: '10px',
            border: '1px solid rgba(51, 51, 105, 0.14)',
            backgroundColor: 'rgba(51, 51, 105, 0.04)',
          }}
        >
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            alignItems={{ xs: 'flex-start', lg: 'center' }}
            justifyContent="space-between"
            gap={2}
          >
            <Box>
              <Typography sx={{ fontWeight: 700, color: '#333369', fontSize: '15px' }}>
                {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
              </Typography>
              <Typography sx={{ color: '#6B7280', fontSize: '13px', mt: 0.5 }}>
                Manifest up to {BULK_MANIFEST_LIMIT} eligible orders at once. Bulk label, invoice,
                and manifest downloads have no selection limit.
              </Typography>
              {manifestValidationMessage && (
                <Typography sx={{ color: '#C0392B', fontSize: '12px', mt: 0.75 }}>
                  {manifestValidationMessage}
                </Typography>
              )}
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} flexWrap="wrap">
              <Button
                variant="contained"
                onClick={handleBulkManifest}
                disabled={bulkManifesting || Boolean(manifestValidationMessage)}
                sx={{ textTransform: 'none', minWidth: 170 }}
              >
                {bulkManifesting ? 'Manifesting...' : 'Manifest Selected'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleBulkDownload('label')}
                disabled={downloadingDocumentType !== null}
                sx={{ textTransform: 'none' }}
              >
                {downloadingDocumentType === 'label' ? 'Downloading...' : 'Download Labels'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleBulkDownload('invoice')}
                disabled={downloadingDocumentType !== null}
                sx={{ textTransform: 'none' }}
              >
                {downloadingDocumentType === 'invoice' ? 'Downloading...' : 'Download Invoices'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleBulkDownload('manifest')}
                disabled={downloadingDocumentType !== null}
                sx={{ textTransform: 'none' }}
              >
                {downloadingDocumentType === 'manifest' ? 'Downloading...' : 'Download Manifests'}
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  clearSelection()
                  setBulkFeedback(null)
                }}
                sx={{ textTransform: 'none' }}
              >
                Clear
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}

      {/* 🔹 Data Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable<B2COrder>
          rows={orders}
          columns={columns}
          title="My B2C Orders"
          density="compact"
          maxHeight={680}
          minTableWidth={980}
          pagination
          selectable
          currentPage={page}
          defaultRowsPerPage={rowsPerPage}
          totalCount={data?.totalCount || 0}
          onPageChange={(newPage) => {
            setPage(newPage)
            clearSelection()
            setBulkFeedback(null)
          }}
          bgOverlayImg="/images/orders-bg.png"
          onRowsPerPageChange={(newLimit) => {
            setRowsPerPage(newLimit)
            setPage(1)
            clearSelection()
            setBulkFeedback(null)
          }}
          onSelectRows={(ids) => setSelectedOrderIds(ids)}
          selectedRowIds={selectedOrderIds}
          selectionResetToken={selectionResetToken}
          expandable
          renderExpandedRow={(row) => <OrderExpandedRow row={row} />}
        />
      )}

      <ReverseModal
        open={Boolean(reverseOrder)}
        order={reverseOrder}
        onClose={() => setReverseOrder(null)}
        onConfirm={(payload) => {
          createReverse(payload)
          setReverseOrder(null)
        }}
      />

      <CustomDrawer
        width={drawerWidth}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Create New B2C Order"
      >
        <B2COrderFormSteps onClose={() => setDrawerOpen(false)} />
      </CustomDrawer>
    </Stack>
  )
}

export default B2COrdersList
