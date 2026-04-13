import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material'
import moment from 'moment'
import { useState } from 'react'
import {
  MdAccessTime,
  MdAccountBalanceWallet,
  MdCheckCircle,
  MdDownload,
  MdHourglassEmpty,
  MdTrendingUp,
} from 'react-icons/md'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import PageHeading from '../../components/UI/heading/PageHeading'
import DataTable, { type Column } from '../../components/UI/table/DataTable'
import {
  handleCodRemittancesExport,
  useCodRemittances,
  useCodStats,
} from '../../hooks/useCodRemittance'

export default function CodRemittancesList() {
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [filters, setFilters] = useState<{
    status?: string
    fromDate?: Date
    toDate?: Date
  }>({})

  // Convert Date objects to ISO strings for API
  const apiFilters = {
    status: filters.status,
    fromDate: filters.fromDate?.toISOString(),
    toDate: filters.toDate?.toISOString(),
  }

  // Use custom hooks
  const { data: stats } = useCodStats()
  const { data, isLoading } = useCodRemittances(page, rowsPerPage, apiFilters)

  const handleExport = async () => {
    try {
      await handleCodRemittancesExport(apiFilters)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'credited' ? 'success' : 'info'
  }

  const getStatusIcon = (status: string) => {
    return status === 'credited' ? <MdCheckCircle /> : <MdHourglassEmpty />
  }

  const filterFields: FilterField[] = [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All', value: '' },
        { label: 'Processing', value: 'pending' },
        { label: 'Settled Offline', value: 'credited' },
      ],
      placeholder: 'Select status',
    },
    {
      name: 'fromDate',
      label: 'From Date',
      type: 'date',
      placeholder: 'Start date',
    },
    {
      name: 'toDate',
      label: 'To Date',
      type: 'date',
      placeholder: 'End date',
    },
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: Column<any>[] = [
    {
      id: 'orderNumber',
      label: 'Order Number',
      minWidth: 150,
      render: (_, row) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {row.orderNumber}
          </Typography>
          {row.awbNumber && (
            <Typography variant="caption" color="text.secondary">
              AWB: {row.awbNumber}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'courierPartner',
      label: 'Courier',
      minWidth: 120,
      render: (val) => <Typography variant="body2">{val || 'N/A'}</Typography>,
    },
    {
      id: 'codAmount',
      label: 'COD Amount',
      minWidth: 120,
      render: (val) => (
        <Typography variant="body2" fontWeight={600}>
          ₹{Number(val).toLocaleString('en-IN')}
        </Typography>
      ),
    },
    {
      id: 'deductions',
      label: 'Deductions',
      minWidth: 120,
      render: (val) => (
        <Typography variant="body2" color="error.main">
          -₹{Number(val).toLocaleString('en-IN')}
        </Typography>
      ),
    },
    {
      id: 'remittableAmount',
      label: 'Remittable',
      minWidth: 130,
      render: (val) => (
        <Typography variant="body2" fontWeight={700} color="success.main">
          ₹{Number(val).toLocaleString('en-IN')}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 130,
      render: (val) => (
        <Chip label={val} color={getStatusColor(val)} size="small" icon={getStatusIcon(val)} />
      ),
    },
    {
      id: 'collectedAt',
      label: 'Collected',
      minWidth: 120,
      render: (val) => (
        <Typography variant="body2">{val ? moment(val).format('DD MMM YYYY') : 'N/A'}</Typography>
      ),
    },
    {
      id: 'creditedAt',
      label: 'Settled At',
      minWidth: 150,
      render: (val) => (
        <Typography variant="body2">
          {val ? moment(val).format('DD MMM YYYY HH:mm') : '-'}
        </Typography>
      ),
    },
  ]

  return (
    <Box p={3}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', lg: 'center' }}
        gap={2}
        mb={3}
      >
        <PageHeading
          eyebrow="Billing Panel"
          title="COD Remittance"
          subtitle="Track your cash-on-delivery settlements, settled batches, and payout progress in the shared workspace style."
        />
        <Button variant="contained" startIcon={<MdDownload />} onClick={handleExport}>
          Export CSV
        </Button>
      </Stack>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        {/* Remitted Till Date */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    Remitted Till Date
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    ₹{stats?.remittedTillDate.toLocaleString('en-IN') || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 2,
                    p: 1,
                    display: 'flex',
                  }}
                >
                  <MdTrendingUp size={28} />
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {stats?.creditedCount || 0} settled remittances
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Last Remittance */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out',
              },
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    Last Remittance
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    ₹{stats?.lastRemittance.toLocaleString('en-IN') || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'success.lighter',
                    color: 'success.main',
                    borderRadius: 2,
                    p: 1,
                    display: 'flex',
                  }}
                >
                  <MdCheckCircle size={28} />
                </Box>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Most recent settlement
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Next Remittance (Expected) */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    Next Remittance (Expected)
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    ₹{stats?.nextRemittance.toLocaleString('en-IN') || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 2,
                    p: 1,
                    display: 'flex',
                  }}
                >
                  <MdAccountBalanceWallet size={28} />
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {stats?.pendingCount || 0} orders pending
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Remittance Due */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out',
              },
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    Total Remittance Due
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    ₹{stats?.totalDue.toLocaleString('en-IN') || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'warning.lighter',
                    color: 'warning.main',
                    borderRadius: 2,
                    p: 1,
                    display: 'flex',
                  }}
                >
                  <MdAccessTime size={28} />
                </Box>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Awaiting settlement
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Box mb={3}>
        <FilterBar
          fields={filterFields}
          onApply={(appliedFilters) => {
            setFilters(appliedFilters)
            setPage(1) // Reset to first page when filters change
          }}
          defaultValues={{
            status: '',
            fromDate: undefined,
            toDate: undefined,
          }}
        />
      </Box>

      {/* Data Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <Typography>Loading remittances...</Typography>
        </Box>
      ) : (
        <DataTable
          rows={data?.remittances || []}
          columns={columns}
          title="All Remittances"
          pagination
          currentPage={page}
          defaultRowsPerPage={rowsPerPage}
          totalCount={data?.totalCount || 0}
          onPageChange={(newPage) => setPage(newPage)}
          onRowsPerPageChange={(newRowsPerPage) => {
            setRowsPerPage(newRowsPerPage)
            setPage(1)
          }}
        />
      )}
    </Box>
  )
}
