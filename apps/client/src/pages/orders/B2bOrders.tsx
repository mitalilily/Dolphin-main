import { Button, Stack, useMediaQuery, useTheme } from '@mui/material'
import { useState } from 'react'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import CustomDrawer from '../../components/UI/drawer/CustomDrawer'
import B2BOrderForm from '../../components/orders/b2b/B2BOrderForm'
import B2BOrdersList from '../../components/orders/b2b/B2bOrdersList'
import { statusColorMap } from '../../components/orders/b2c/B2COrdersList'
import { useKycVerification } from '../../hooks/User/useKycVerification'

const B2bOrders = () => {
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filters, setFilters] = useState<{
    status?: string
    fromDate?: string
    toDate?: string
    search?: string
  }>({})

  const filterFields: FilterField[] = [
    {
      name: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by customer, order # etc.',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: Object.keys(statusColorMap).map((s) => ({ label: s, value: s })),
      isAdvanced: true,
    },
    {
      name: 'fromDate',
      label: 'From Date',
      type: 'date',
      placeholder: 'From',
    },
    {
      name: 'toDate',
      label: 'To Date',
      type: 'date',
      placeholder: 'To',
    },
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleApplyFilters = (appliedFilters: any) => {
    setFilters(appliedFilters)
    setPage(1)
  }

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { checkKycBeforeAction } = useKycVerification()

  const handleCreateB2BOrder = () => {
    checkKycBeforeAction(() => {
      setDrawerOpen(true)
    })
  }

  return (
    <Stack spacing={2}>
      {/* Top row: Create button + Filters */}
      <Stack
        direction={isMobile ? 'column' : 'row'}
        alignItems={isMobile ? 'stretch' : 'center'}
        justifyContent="flex-end"
        spacing={isMobile ? 1 : 2}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateB2BOrder}
          fullWidth={isMobile}
        >
          Create B2B Order
        </Button>
      </Stack>

      <FilterBar
        fields={filterFields}
        onApply={handleApplyFilters}
        defaultValues={{ status: '', fromDate: '', toDate: '', search: '' }}
        appliedCount={Object.values(filters).filter(Boolean).length}
      />

      <B2BOrdersList
        page={page}
        rowsPerPage={rowsPerPage}
        setPage={setPage}
        setRowsPerPage={setRowsPerPage}
        filters={filters}
      />

      <CustomDrawer
        width={isMobile ? '100%' : 1400}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Create New B2B Order"
      >
        <B2BOrderForm onClose={() => setDrawerOpen(false)} />
      </CustomDrawer>
    </Stack>
  )
}

export default B2bOrders
