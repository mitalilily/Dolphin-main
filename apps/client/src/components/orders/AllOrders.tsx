import { useQueryClient } from '@tanstack/react-query'
import { Alert, AlertTitle, Box, Button, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { TbFilter, TbPlus, TbRefresh } from 'react-icons/tb'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { generateManifestService } from '../../api/order.service'
import { useAllOrders, useB2BOrdersByUser, useB2COrdersByUser } from '../../hooks/Orders/useOrders'
import { usePresignedDownloadMutation } from '../../hooks/Uploads/usePresignedDownloadUrls'
import { FilterBar, type FilterField } from '../FilterBar'
import { toast } from '../UI/Toast'
import StatusChip from '../UI/chip/StatusChip'
import DataTable, { type Column } from '../UI/table/DataTable'
import TableSkeleton from '../UI/table/TableSkeleton'
import { statusColorMap } from './b2c/B2COrdersList'
import {
  BULK_MANIFEST_LIMIT,
  downloadFile,
  type DocumentEntry,
  type DocumentType,
  getActionableErrorMessage,
  getB2CManifestIdentifier,
  getB2CManifestProvider,
  getDocumentReference,
  getDownloadFileName,
  isB2CManifestEligible,
  summarizeMessages,
  summarizeOrderNumbers,
} from './bulkActionUtils'
import { OrderExpandedRow } from './OrderExpandedRow'

interface Order {
  id: string | number
  type?: 'b2c' | 'b2b'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

type OrdersFilters = {
  status?: string
  fromDate?: string
  toDate?: string
  search?: string
}

type BulkFeedback = {
  severity: 'info' | 'success' | 'error' | 'warning'
  title: string
  message: string
}

const hasLabelGenerated = (order: Order) =>
  Boolean(String(order.label_url || order.label_key || order.label || '').trim())

const hasInvoiceGenerated = (order: Order) =>
  Boolean(String(order.invoice_url || order.invoice_key || order.invoice_link || '').trim())

const renderDocumentTags = (order: Order) => (
  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
    <StatusChip
      label={hasLabelGenerated(order) ? 'Label Generated' : 'Label Pending'}
      status={hasLabelGenerated(order) ? 'success' : 'pending'}
    />
    <StatusChip
      label={hasInvoiceGenerated(order) ? 'Invoice Generated' : 'Invoice Pending'}
      status={hasInvoiceGenerated(order) ? 'success' : 'pending'}
    />
  </Stack>
)
const isManifestEligible = (order: Order) => {
  return order.type === 'b2c' ? isB2CManifestEligible(order) : false
}

const AllOrders = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedOrderIds, setSelectedOrderIds] = useState<Array<Order['id']>>([])
  const [selectionResetToken, setSelectionResetToken] = useState(0)
  const [downloadingDocumentType, setDownloadingDocumentType] = useState<DocumentType | null>(
    null,
  )
  const [bulkManifesting, setBulkManifesting] = useState(false)
  const [bulkFeedback, setBulkFeedback] = useState<BulkFeedback | null>(null)
  const [filters, setFilters] = useState<OrdersFilters>({
    status: undefined,
    fromDate: undefined,
    toDate: undefined,
    search: undefined,
  })
  const queryClient = useQueryClient()
  const { mutateAsync: presignDownloads } = usePresignedDownloadMutation()
  const isB2CView = location.pathname.startsWith('/orders/b2c')
  const isB2BView = location.pathname.startsWith('/orders/b2b')
  const currentOrderView: 'all' | 'b2c' | 'b2b' = isB2CView ? 'b2c' : isB2BView ? 'b2b' : 'all'

  const clearSelection = () => {
    setSelectedOrderIds([])
    setSelectionResetToken((current) => current + 1)
  }

  useEffect(() => {
    const status = searchParams.get('status') || undefined
    if (status && filters.status !== status) {
      setFilters((prev) => ({
        ...prev,
        status,
      }))
      setPage(1)
      clearSelection()
      setBulkFeedback(null)
    }
  }, [searchParams, filters.status])

  const allOrdersQuery = useAllOrders(
    {
      page,
      limit: rowsPerPage,
      ...filters,
    },
    currentOrderView === 'all',
  )

  const b2cOrdersQuery = useB2COrdersByUser(page, rowsPerPage, filters, currentOrderView === 'b2c')
  const b2bOrdersQuery = useB2BOrdersByUser(page, rowsPerPage, filters, currentOrderView === 'b2b')

  const activeQuery =
    currentOrderView === 'b2c'
      ? b2cOrdersQuery
      : currentOrderView === 'b2b'
        ? b2bOrdersQuery
        : allOrdersQuery

  if (activeQuery.isError)
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          px: 3,
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <Typography
          color="error"
          textAlign="center"
          fontSize="16px"
          fontWeight={600}
          sx={{ color: '#E74C3C' }}
        >
          Failed to fetch orders
        </Typography>
        <Typography textAlign="center" fontSize="14px" sx={{ color: '#6B7280', mt: 1 }}>
          Please try refreshing the page
        </Typography>
      </Box>
    )

  const normalizedOrders: Order[] = (activeQuery.data?.orders ?? []).map((order: any) => ({
    ...order,
    type: order.type || (currentOrderView === 'b2c' ? 'b2c' : currentOrderView === 'b2b' ? 'b2b' : order.type),
  }))
  const orders: Order[] = normalizedOrders
  const totalCount = activeQuery.data?.totalCount ?? 0
  const selectedOrders: Order[] = orders.filter((order) => selectedOrderIds.includes(order.id))
  const manifestValidationMessage =
    selectedOrders.length === 0
      ? 'Select orders to start a bulk action.'
      : selectedOrders.length > BULK_MANIFEST_LIMIT
        ? `You can manifest a maximum of ${BULK_MANIFEST_LIMIT} orders at a time.`
        : selectedOrders.some((order) => !isManifestEligible(order))
          ? 'Some selected orders are not ready for manifest yet.'
          : ''

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
      const b2cManifestGroups = selectedOrders.reduce<Record<string, Order[]>>((groups, order) => {
        if (order.type !== 'b2c') return groups

        const manifestIdentifier = getB2CManifestIdentifier(order)
        if (!manifestIdentifier) return groups

        const providerKey = getB2CManifestProvider(order)
        if (!groups[providerKey]) groups[providerKey] = []
        groups[providerKey].push(order)
        return groups
      }, {})

      const failedOrders: Order[] = []
      const failureReasons: string[] = []
      const warningMessages: string[] = []
      let successCount = 0

      for (const [providerKey, providerOrders] of Object.entries(b2cManifestGroups)) {
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
      const documentEntries = selectedOrders.reduce<DocumentEntry[]>((entries, order) => {
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

  const columns: Column<Order>[] = [
    { id: 'order_number', label: 'Order #' },
    { id: 'type', label: 'Type' },
    { id: 'buyer_name', label: 'Buyer Name' },
    { id: 'city', label: 'City' },
    { id: 'state', label: 'State' },
    { id: 'order_amount', label: 'Amount' },
    {
      id: 'id',
      label: 'Docs',
      minWidth: 220,
      sticky: 'right',
      stickyOffset: 0,
      render: (_v, row) => renderDocumentTags(row),
    },
    {
      label: 'Status',
      id: 'order_status',
      minWidth: 150,
      sticky: 'right',
      stickyOffset: 220,
      render: (v) => <StatusChip label={v} status={statusColorMap[v] || 'info'} />,
    },
  ]

  const filterFields: FilterField[] = [
    {
      name: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Order # / Buyer Name',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: Object.keys(statusColorMap).map((status) => ({
        label: status,
        value: status,
      })),
      isAdvanced: true,
    },
    { name: 'fromDate', label: 'From Date', type: 'date', placeholder: 'YYYY-MM-DD' },
    { name: 'toDate', label: 'To Date', type: 'date', placeholder: 'YYYY-MM-DD' },
  ]

  return (
    <Stack gap={3}>
      <Box
        sx={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid rgba(29, 40, 66, 0.1)',
          boxShadow: '0 12px 28px rgba(29, 40, 66, 0.08)',
          overflow: 'hidden',
        }}
      >
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          alignItems={{ xs: 'flex-start', lg: 'center' }}
          justifyContent="space-between"
          gap={1.5}
          sx={{
            px: { xs: 1.4, md: 2.1 },
            py: 1.5,
            borderBottom: '1px solid rgba(29, 40, 66, 0.08)',
            bgcolor: '#ffffff',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#1D2842',
              fontSize: '20px',
            }}
          >
            Orders Management
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<TbRefresh size={16} />}
              onClick={() => activeQuery.refetch()}
              disabled={activeQuery.isRefetching}
              sx={{ borderRadius: 1.2 }}
            >
              {activeQuery.isRefetching ? 'Refreshing' : 'Refresh'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<TbFilter size={16} />}
              onClick={() =>
                document.getElementById('orders-filter-bar')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }
              sx={{ borderRadius: 1.2 }}
            >
              Filters
            </Button>
            <Button
              variant="contained"
              startIcon={<TbPlus size={16} />}
              onClick={() => navigate('/orders/create')}
              sx={{
                borderRadius: 1.2,
                bgcolor: '#1D2842',
                '&:hover': {
                  bgcolor: '#152038',
                },
              }}
            >
              Create Order
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ px: { xs: 1.4, md: 2.1 }, pt: 1.6 }} id="orders-filter-bar">
          <FilterBar
            fields={filterFields}
            defaultValues={filters}
            onApply={(appliedFilters) => {
              setFilters(appliedFilters)
              setPage(1)
              clearSelection()
              setBulkFeedback(null)
            }}
          />
        </Box>

        {bulkFeedback && (
          <Alert
            severity={bulkFeedback.severity}
            onClose={() => setBulkFeedback(null)}
            sx={{ mt: 2, mx: { xs: 1.4, md: 2.1 }, alignItems: 'flex-start' }}
          >
            <AlertTitle>{bulkFeedback.title}</AlertTitle>
            {bulkFeedback.message}
          </Alert>
        )}

        {selectedOrders.length > 0 && (
          <Box
            sx={{
              mt: 2,
              mx: { xs: 1.4, md: 2.1 },
              p: 2,
              borderRadius: '10px',
              border: '1px solid rgba(29, 40, 66, 0.14)',
              backgroundColor: 'rgba(29, 40, 66, 0.04)',
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
      </Box>

      <Box
        sx={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid rgba(29, 40, 66, 0.1)',
          boxShadow: '0 12px 28px rgba(29, 40, 66, 0.08)',
          overflow: 'hidden',
        }}
      >
        {activeQuery.isLoading ? (
          <Box sx={{ p: 3 }}>
            <TableSkeleton />
          </Box>
        ) : (
          <DataTable<Order>
            rows={orders}
            columns={columns}
            title={
              currentOrderView === 'b2c'
                ? `${totalCount} total B2C orders`
                : currentOrderView === 'b2b'
                  ? `${totalCount} total B2B orders`
                  : `${totalCount} total orders`
            }
            subTitle={
              currentOrderView === 'b2c'
                ? 'Track and action your B2C shipping pipeline.'
                : currentOrderView === 'b2b'
                  ? 'Track and action your B2B shipping pipeline.'
                  : 'Track, filter, and action your order pipeline in a consistent workspace.'
            }
            pagination
            selectable
            currentPage={page}
            onPageChange={(newPage) => {
              setPage(newPage + 1)
              clearSelection()
              setBulkFeedback(null)
            }}
            onRowsPerPageChange={(newRowsPerPage) => {
              setRowsPerPage(newRowsPerPage)
              setPage(1)
              clearSelection()
              setBulkFeedback(null)
            }}
            defaultRowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onSelectRows={(ids) => setSelectedOrderIds(ids as Array<Order['id']>)}
            selectedRowIds={selectedOrderIds}
            selectionResetToken={selectionResetToken}
            expandable
            renderExpandedRow={(row) => <OrderExpandedRow row={row} />}
          />
        )}
      </Box>
    </Stack>
  )
}

export default AllOrders
