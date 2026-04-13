import { Paper, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { fetchMyRto } from '../../api/rto'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import PageHeading from '../../components/UI/heading/PageHeading'
import DataTable, { type Column } from '../../components/UI/table/DataTable'

type RtoRow = {
  awb_number?: string
  order_id?: string
  status?: string
  reason?: string
  remarks?: string
  rto_charges?: number | string
}
type TableRow = RtoRow & { id: string | number }

export default function RtoList() {
  const [rows, setRows] = useState<RtoRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filters, setFilters] = useState<{ search?: string; fromDate?: string; toDate?: string }>({})

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const resp = await fetchMyRto({
          page,
          limit: rowsPerPage,
          search: filters.search,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
        })
        setRows(resp?.data || [])
        setTotalCount(resp?.totalCount || 0)
      } finally {
        setLoading(false)
      }
    })()
  }, [page, rowsPerPage, filters])

  const columns: Column<TableRow>[] = useMemo(
    () => [
      { id: 'awb_number', label: 'AWB' },
      { id: 'order_id', label: 'Order ID' },
      { id: 'status', label: 'Status' },
      { id: 'reason', label: 'Reason' },
      { id: 'remarks', label: 'Remarks' },
      { id: 'rto_charges', label: 'RTO Charges' },
    ],
    [],
  )

  const filterFields: FilterField[] = [
    { name: 'search', label: 'Search', type: 'text', placeholder: 'AWB / Order ID / Reason' },
    { name: 'fromDate', label: 'From', type: 'date' },
    { name: 'toDate', label: 'To', type: 'date' },
  ]

  const tableRows: TableRow[] = useMemo(
    () => rows.map((r, idx) => ({ id: r.awb_number || r.order_id || idx, ...r })),
    [rows],
  )

  return (
    <Stack gap={3} p={4}>
      <PageHeading
        title="RTO"
        subtitle="Track return-to-origin events, filter timelines, and monitor reverse charges from a consistent operations workspace."
      />
      <FilterBar
        fields={filterFields}
        defaultValues={filters}
        onApply={(f) => {
          setFilters(f)
          setPage(1)
        }}
        loading={loading}
      />

      <Paper sx={{ borderRadius: 2, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {loading ? (
          <Typography p={3}>Loading RTO events...</Typography>
        ) : (
          <DataTable
            rows={tableRows}
            columns={columns}
            title="RTO Events"
            pagination
            currentPage={page}
            onPageChange={setPage}
            onRowsPerPageChange={(n) => {
              setRowsPerPage(n)
              setPage(1)
            }}
            defaultRowsPerPage={rowsPerPage}
            totalCount={totalCount}
          />
        )}
      </Paper>
    </Stack>
  )
}
