import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { FiDownload, FiSettings } from 'react-icons/fi'
import { RiScales3Line } from 'react-icons/ri'
import { useNavigate } from 'react-router-dom'
import { exportWeightDiscrepancies } from '../../api/weightReconciliation'
import type { WeightDiscrepancy } from '../../api/weightReconciliation'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import StatusChip from '../../components/UI/chip/StatusChip'
import PageHeading from '../../components/UI/heading/PageHeading'
import DataTable, { type Column } from '../../components/UI/table/DataTable'
import {
  useBulkAcceptDiscrepancies,
  useBulkRejectDiscrepancies,
  useWeightDiscrepancies,
  useWeightReconciliationSummary,
} from '../../hooks/useWeightReconciliation'

const statusColorMap: Record<string, 'success' | 'error' | 'info' | 'pending'> = {
  pending: 'pending',
  accepted: 'success',
  disputed: 'info',
  resolved: 'success',
  rejected: 'error',
  closed: 'info',
}

export default function WeightReconciliation() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filters, setFilters] = useState({
    status: undefined,
    courierPartner: undefined,
    fromDate: undefined,
    toDate: undefined,
    search: undefined,
  })
  const [selectedDiscrepancies, setSelectedDiscrepancies] = useState<string[]>([])

  // Build API filters
  const apiFilters: Record<string, unknown> = { page, limit: rowsPerPage }
  if (filters.status) apiFilters.status = [filters.status]
  if (filters.courierPartner) apiFilters.courierPartner = [filters.courierPartner]
  if (filters.fromDate) apiFilters.fromDate = filters.fromDate
  if (filters.toDate) apiFilters.toDate = filters.toDate

  const { data: discrepanciesData, refetch } = useWeightDiscrepancies(apiFilters)
  const { data: summary } = useWeightReconciliationSummary(filters.fromDate, filters.toDate)

  const bulkAccept = useBulkAcceptDiscrepancies()
  const bulkReject = useBulkRejectDiscrepancies()

  const discrepancies = discrepanciesData?.discrepancies || []
  const totalCount = discrepanciesData?.pagination?.total || 0

  // Filter by search locally
  const filteredDiscrepancies = filters.search
    ? discrepancies.filter((d: WeightDiscrepancy) => {
        const query = String(filters.search || '').toLowerCase()
        return (
          d.order_number.toLowerCase().includes(query) ||
          d.awb_number?.toLowerCase().includes(query) ||
          d.courier_partner?.toLowerCase().includes(query)
        )
      })
    : discrepancies

  const handleExport = async () => {
    try {
      const blob = await exportWeightDiscrepancies({
        status: filters.status ? [filters.status] : undefined,
        courierPartner: filters.courierPartner ? [filters.courierPartner] : undefined,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `weight-discrepancies-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export weight discrepancies:', error)
      alert('Failed to export CSV. Please try again.')
    }
  }

  const handleBulkAccept = () => {
    if (selectedDiscrepancies.length === 0) return
    if (confirm(`Accept ${selectedDiscrepancies.length} selected discrepancies?`)) {
      bulkAccept.mutate(
        { discrepancyIds: selectedDiscrepancies, notes: 'Bulk accepted from dashboard' },
        {
          onSuccess: () => {
            setSelectedDiscrepancies([])
            refetch()
          },
        },
      )
    }
  }

  const handleBulkReject = () => {
    if (selectedDiscrepancies.length === 0) return
    const reason = prompt('Enter reason for rejecting these discrepancies:')
    if (!reason) return

    bulkReject.mutate(
      { discrepancyIds: selectedDiscrepancies, reason },
      {
        onSuccess: () => {
          setSelectedDiscrepancies([])
          refetch()
        },
      },
    )
  }

  const columns: Column<WeightDiscrepancy>[] = [
    { id: 'order_number', label: 'Order #' },
    { id: 'awb_number', label: 'AWB #' },
    { id: 'courier_partner', label: 'Courier' },
    {
      id: 'declared_weight',
      label: 'Declared (kg)',
      render: (value: unknown) => `${(Number(value) / 1000).toFixed(2)}`,
    },
    {
      id: 'charged_weight',
      label: 'Charged (kg)',
      render: (value: unknown) => `${(Number(value) / 1000).toFixed(2)}`,
    },
    {
      id: 'weight_difference',
      label: 'Difference (kg)',
      render: (value: unknown) => (
        <Typography
          component="span"
          sx={{
            color: Number(value) > 0 ? '#E74C3C' : '#27AE60',
            fontWeight: 600,
          }}
        >
          {Number(value) > 0 ? '+' : ''}
          {(Number(value) / 1000).toFixed(3)}
        </Typography>
      ),
    },
    {
      id: 'additional_charge',
      label: 'Extra Charge',
      render: (value: unknown) => `₹${Number(value || 0).toFixed(2)}`,
    },
    {
      id: 'status',
      label: 'Status',
      render: (value: unknown, row: WeightDiscrepancy) => {
        let displayLabel = String(value)

        // Show more context for resolved status
        if (value === 'resolved') {
          if (row.has_dispute && row.resolution_notes?.includes('rejected')) {
            displayLabel = 'Resolved (Dispute Rejected)'
          } else if (row.has_dispute && row.resolution_notes?.includes('approved')) {
            displayLabel = 'Resolved (Dispute Approved)'
          } else {
            displayLabel = 'Resolved'
          }
        }

        return <StatusChip label={displayLabel} status={statusColorMap[String(value)] || 'success'} />
      },
    },
  ]

  const filterFields: FilterField[] = [
    {
      name: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Order # / AWB / Courier',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Disputed', value: 'disputed' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      isAdvanced: true,
    },
    { name: 'fromDate', label: 'From Date', type: 'date', placeholder: 'YYYY-MM-DD' },
    { name: 'toDate', label: 'To Date', type: 'date', placeholder: 'YYYY-MM-DD' },
  ]

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack gap={3}>
        <Stack direction={{ xs: 'column', lg: 'row' }} alignItems={{ xs: 'stretch', lg: 'center' }} justifyContent="space-between" gap={2}>
          <PageHeading
            eyebrow="Discrepancy Panel"
            title="Weight Discrepancy"
            subtitle="Manage weight discrepancies, resolve extra charges, and keep courier billing aligned in one Nimbus-style reconciliation panel."
            icon={<RiScales3Line size={12} />}
          />
          <Stack direction="row" gap={2}>
            <Button
              startIcon={<FiDownload />}
              onClick={handleExport}
              variant="outlined"
              sx={{
                borderColor: '#333369',
                color: '#333369',
                fontWeight: 600,
                textTransform: 'none',
                px: 2.5,
                py: 1,
                borderRadius: '8px',
                '&:hover': {
                  borderColor: '#2F3B5F',
                  backgroundColor: 'rgba(59, 74, 116, 0.08)',
                },
              }}
            >
              Export CSV
            </Button>
            <Button
              startIcon={<FiSettings />}
              onClick={() => navigate('/reconciliation/weight/settings')}
              variant="outlined"
              sx={{
                borderColor: '#333369',
                color: '#333369',
                fontWeight: 600,
                textTransform: 'none',
                px: 2.5,
                py: 1,
                borderRadius: '8px',
                '&:hover': {
                  borderColor: '#2F3B5F',
                  backgroundColor: 'rgba(59, 74, 116, 0.08)',
                },
              }}
            >
              Settings
            </Button>
          </Stack>
        </Stack>

        {/* Summary Cards */}
        {summary?.summary && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            <Box
              sx={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                p: 2.5,
              }}
            >
              <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '13px', mb: 1 }}>
                Total Discrepancies
              </Typography>
              <Typography variant="h5" sx={{ color: '#333369', fontWeight: 700 }}>
                {summary.summary.totalDiscrepancies}
              </Typography>
            </Box>
            <Box
              sx={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                p: 2.5,
              }}
            >
              <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '13px', mb: 1 }}>
                Pending Review
              </Typography>
              <Typography variant="h5" sx={{ color: '#F39C12', fontWeight: 700 }}>
                {summary.summary.pendingCount}
              </Typography>
            </Box>
            <Box
              sx={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                p: 2.5,
              }}
            >
              <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '13px', mb: 1 }}>
                Active Disputes
              </Typography>
              <Typography variant="h5" sx={{ color: '#3498DB', fontWeight: 700 }}>
                {summary.summary.disputedCount}
              </Typography>
            </Box>
            <Box
              sx={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                p: 2.5,
              }}
            >
              <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '13px', mb: 1 }}>
                Total Extra Charges
              </Typography>
              <Typography variant="h5" sx={{ color: '#E74C3C', fontWeight: 700 }}>
                ₹{Number(summary.summary.totalAdditionalCharges || 0).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Filters */}
        <Box
          sx={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            p: 3,
          }}
        >
          <FilterBar
            fields={filterFields}
            defaultValues={filters}
            onApply={(f) => {
              setFilters(f)
              setPage(1)
            }}
          />
        </Box>

        {/* Bulk Actions */}
        {selectedDiscrepancies.length > 0 && (
          <Box
            sx={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #333369',
              boxShadow: '0 2px 8px rgba(59, 74, 116, 0.15)',
              p: 2,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography sx={{ color: '#333369', fontWeight: 600 }}>
                {selectedDiscrepancies.length} selected
              </Typography>
              <Stack direction="row" gap={2}>
                <Button
                  variant="contained"
                  onClick={handleBulkAccept}
                  disabled={bulkAccept.isPending}
                  sx={{
                    bgcolor: '#27AE60',
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#229954' },
                  }}
                >
                  Accept Selected
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleBulkReject}
                  disabled={bulkReject.isPending}
                  sx={{
                    borderColor: '#E74C3C',
                    color: '#E74C3C',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#C0392B',
                      backgroundColor: 'rgba(231, 76, 60, 0.08)',
                    },
                  }}
                >
                  Reject Selected
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}

        {/* Table */}
        <Box
          sx={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          <DataTable
            columns={columns}
            rows={filteredDiscrepancies}
            pagination
            selectable
            currentPage={page}
            totalCount={totalCount}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            defaultRowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 20, 50]}
            onSelectRows={(ids: unknown[]) => setSelectedDiscrepancies(ids as string[])}
            renderExpandedRow={(row: WeightDiscrepancy) => (
              <Box sx={{ p: 2 }}>
                <Stack direction="row" gap={2}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate(`/reconciliation/weight/${row.id}`)}
                    sx={{
                      bgcolor: '#333369',
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#2F3B5F' },
                    }}
                  >
                    View Details
                  </Button>
                </Stack>
              </Box>
            )}
            expandable
          />
        </Box>
      </Stack>
    </Container>
  )
}