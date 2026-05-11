import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
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
import type { CodRemittance } from '../../api/codRemittance'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import PageHeading from '../../components/UI/heading/PageHeading'
import DataTable, { type Column } from '../../components/UI/table/DataTable'
import {
  handleCodRemittancesExport,
  useCodRemittances,
  useCodStats,
} from '../../hooks/useCodRemittance'
import { brand, brandGradients } from '../../theme/brand'

type CodFilterValue = string | Date | null | undefined

interface CodFilterState {
  status?: string
  fromDate?: CodFilterValue
  toDate?: CodFilterValue
}

const formatCurrency = (value: string | number | null | undefined) => {
  const numericValue = Number(value ?? 0)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericValue) ? numericValue : 0)
}

const toApiDate = (value: CodFilterValue) => {
  if (!value) return undefined
  if (value instanceof Date) return value.toISOString()
  const text = String(value).trim()
  return text || undefined
}

const formatDate = (value?: string | null) => (value ? moment(value).format('DD MMM YYYY') : '-')
const formatDateTime = (value?: string | null) =>
  value ? moment(value).format('DD MMM YYYY, hh:mm A') : '-'

const getStatusLabel = (status: string) => {
  if (status === 'credited') return 'Credited'
  if (status === 'pending') return 'Pending'
  return status || 'Pending'
}

const getStatusColor = (status: string): 'success' | 'warning' | 'info' => {
  if (status === 'credited') return 'success'
  if (status === 'pending') return 'warning'
  return 'info'
}

const getStatusIcon = (status: string) => {
  return status === 'credited' ? <MdCheckCircle /> : <MdHourglassEmpty />
}

export default function CodRemittancesList() {
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [isExporting, setIsExporting] = useState(false)
  const [filters, setFilters] = useState<CodFilterState>({
    status: '',
    fromDate: '',
    toDate: '',
  })

  const apiFilters = {
    status: filters.status || undefined,
    fromDate: toApiDate(filters.fromDate),
    toDate: toApiDate(filters.toDate),
  }

  const { data: stats, isLoading: statsLoading } = useCodStats()
  const { data, isLoading, isError } = useCodRemittances(page, rowsPerPage, apiFilters)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      await handleCodRemittancesExport(apiFilters)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const filterFields: FilterField[] = [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All', value: '' },
        { label: 'Pending', value: 'pending' },
        { label: 'Credited', value: 'credited' },
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

  const columns: Column<CodRemittance>[] = [
    {
      id: 'orderNumber',
      label: 'Order Number',
      minWidth: 160,
      render: (_, row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ color: brand.ink, fontWeight: 800 }}>
            {row.orderNumber || '-'}
          </Typography>
          <Typography variant="caption" sx={{ color: brand.inkSoft, fontWeight: 600 }}>
            {row.awbNumber ? `AWB: ${row.awbNumber}` : 'AWB not assigned'}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'courierPartner',
      label: 'Courier',
      minWidth: 130,
      render: (value) => (
        <Typography variant="body2" sx={{ color: brand.ink, fontWeight: 700 }}>
          {value || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'codAmount',
      label: 'COD Amount',
      minWidth: 130,
      render: (value) => (
        <Typography variant="body2" sx={{ color: brand.ink, fontWeight: 800 }}>
          {formatCurrency(value)}
        </Typography>
      ),
    },
    {
      id: 'deductions',
      label: 'Deductions',
      minWidth: 130,
      render: (value) => {
        const amount = Number(value ?? 0)
        return (
          <Typography
            variant="body2"
            sx={{
              color: amount > 0 ? brand.danger : brand.inkSoft,
              fontWeight: 800,
            }}
          >
            {amount > 0 ? `-${formatCurrency(amount)}` : formatCurrency(0)}
          </Typography>
        )
      },
    },
    {
      id: 'remittableAmount',
      label: 'Remittable',
      minWidth: 140,
      render: (value) => (
        <Typography variant="body2" sx={{ color: brand.success, fontWeight: 900 }}>
          {formatCurrency(value)}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 140,
      render: (value) => {
        const status = String(value || 'pending')
        return (
          <Chip
            label={getStatusLabel(status)}
            color={getStatusColor(status)}
            size="small"
            icon={getStatusIcon(status)}
            variant="outlined"
            sx={{
              bgcolor:
                status === 'credited' ? alpha(brand.success, 0.1) : alpha(brand.warning, 0.1),
              borderColor:
                status === 'credited' ? alpha(brand.success, 0.34) : alpha(brand.warning, 0.34),
            }}
          />
        )
      },
    },
    {
      id: 'collectedAt',
      label: 'Collected',
      minWidth: 130,
      render: (value) => (
        <Typography variant="body2" sx={{ color: brand.inkSoft, fontWeight: 700 }}>
          {formatDate(value)}
        </Typography>
      ),
    },
    {
      id: 'creditedAt',
      label: 'Credited At',
      minWidth: 170,
      render: (value) => (
        <Typography variant="body2" sx={{ color: brand.inkSoft, fontWeight: 700 }}>
          {formatDateTime(value)}
        </Typography>
      ),
    },
  ]

  const metrics = [
    {
      label: 'Remitted Till Date',
      value: stats?.remittedTillDate,
      caption: `${stats?.creditedCount ?? 0} credited remittances`,
      icon: <MdTrendingUp size={24} />,
      accent: brand.success,
    },
    {
      label: 'Last Remittance',
      value: stats?.lastRemittance,
      caption: 'Most recent settlement',
      icon: <MdCheckCircle size={24} />,
      accent: brand.sky,
    },
    {
      label: 'Next Remittance',
      value: stats?.nextRemittance,
      caption: `${stats?.pendingCount ?? 0} orders pending`,
      icon: <MdAccountBalanceWallet size={24} />,
      accent: brand.accent,
    },
    {
      label: 'Total Due',
      value: stats?.totalDue,
      caption: 'Awaiting settlement',
      icon: <MdAccessTime size={24} />,
      accent: brand.warning,
    },
  ]

  const appliedCount = Object.values(filters).filter(Boolean).length

  return (
    <Stack spacing={3} sx={{ py: { xs: 1, md: 1.5 } }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', lg: 'center' }}
        gap={2}
      >
        <Box sx={{ flex: 1 }}>
          <PageHeading
            eyebrow="Billing Panel"
            title="COD Remittance"
            subtitle="Track cash-on-delivery collections, deductions, and payout progress from one settlement ledger."
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<MdDownload />}
          onClick={handleExport}
          disabled={isExporting}
          sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start', lg: 'center' } }}
        >
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </Stack>

      <Grid container spacing={2}>
        {metrics.map((metric) => (
          <Grid key={metric.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                background: brandGradients.surface,
                border: `1px solid ${alpha(brand.ink, 0.08)}`,
                boxShadow: '0 18px 38px rgba(15,44,67,0.06)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: '0 0 auto 0',
                  height: 4,
                  bgcolor: metric.accent,
                },
              }}
            >
              <CardContent sx={{ p: 2.3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                  <Stack spacing={0.8} minWidth={0}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: brand.inkSoft,
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {metric.label}
                    </Typography>
                    {statsLoading ? (
                      <Skeleton variant="text" width={140} height={38} />
                    ) : (
                      <Typography
                        sx={{
                          color: brand.ink,
                          fontSize: { xs: '1.45rem', md: '1.65rem' },
                          fontWeight: 900,
                          lineHeight: 1.1,
                        }}
                      >
                        {formatCurrency(metric.value)}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: brand.inkSoft, fontWeight: 700 }}>
                      {statsLoading ? 'Loading settlement data' : metric.caption}
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      flexShrink: 0,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      color: brand.ink,
                      bgcolor: alpha(metric.accent, 0.18),
                      border: `1px solid ${alpha(metric.accent, 0.28)}`,
                    }}
                  >
                    {metric.icon}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <FilterBar<CodFilterState>
        fields={filterFields}
        onApply={(appliedFilters) => {
          setFilters({
            status: appliedFilters.status || '',
            fromDate: appliedFilters.fromDate || '',
            toDate: appliedFilters.toDate || '',
          })
          setPage(1)
        }}
        defaultValues={filters}
        appliedCount={appliedCount}
      />

      {isError ? (
        <Alert severity="error">
          COD remittances could not be loaded. Please refresh the page or try again shortly.
        </Alert>
      ) : isLoading ? (
        <Stack alignItems="center" justifyContent="center" py={5}>
          <Typography sx={{ color: brand.inkSoft, fontWeight: 700 }}>
            Loading remittances...
          </Typography>
        </Stack>
      ) : (
        <DataTable
          rows={data?.remittances || []}
          columns={columns}
          title="Settlement Ledger"
          subTitle="Each row represents a delivered COD order and the amount available for payout."
          pagination
          currentPage={page}
          defaultRowsPerPage={rowsPerPage}
          totalCount={data?.totalCount || 0}
          minTableWidth={1080}
          onPageChange={(newPage) => setPage(newPage)}
          onRowsPerPageChange={(newRowsPerPage) => {
            setRowsPerPage(newRowsPerPage)
            setPage(1)
          }}
        />
      )}
    </Stack>
  )
}
