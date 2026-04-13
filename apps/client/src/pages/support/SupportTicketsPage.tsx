import { Button, Skeleton, Stack, useMediaQuery, useTheme } from '@mui/material'
import { useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { FiPlus } from 'react-icons/fi'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import CustomDrawer from '../../components/UI/drawer/CustomDrawer'
import PageHeading from '../../components/UI/heading/PageHeading'
import TableSkeleton from '../../components/UI/table/TableSkeleton'
import { SupportTicketForm } from '../../components/support/SupportTicketForm'
import SupportTicketList from '../../components/support/SupportTicketList'
import TicketStatusSummaryCard from '../../components/support/TicketStatusSummaryCard'
import { useMyTickets } from '../../hooks/User/useSupport'

const supportTicketFilterFields: FilterField[] = [
  {
    name: 'sortBy',
    label: 'Sort By',
    type: 'select',
    options: [
      { label: 'Latest First', value: 'latest' },
      { label: 'Oldest First', value: 'oldest' },
      { label: 'Due Soon', value: 'dueSoon' },
      { label: 'Due Latest', value: 'dueLatest' },
    ],
    placeholder: 'Select sort order',
  },
  {
    name: 'subject',
    label: 'Subject',
    type: 'text',
    placeholder: 'Search by subject',
  },
  {
    name: 'awbNumber',
    label: 'AWB Number',
    type: 'text',
    placeholder: 'Search by AWB',
    isAdvanced: true,
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Shipment Issues', value: 'shipment_issues' },
      { label: 'AWB & Label Issues', value: 'awb_issues' },
      { label: 'Payments & Refunds', value: 'payment_refund' },
      { label: 'Courier Partner Issues', value: 'courier_partner' },
      { label: 'Returns & RTOs', value: 'returns_rto' },
      { label: 'KYC & Onboarding', value: 'kyc_onboarding' },
      { label: 'Platform Issues', value: 'platform_issue' },
      { label: 'Other / General Query', value: 'other' },
    ],
    placeholder: 'Select category',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Open', value: 'open' },
      { label: 'In Progress', value: 'in_progress' },
      { label: 'Resolved', value: 'resolved' },
      { label: 'Closed', value: 'closed' },
    ],
    placeholder: 'Select status',
    isAdvanced: true,
  },
  {
    name: 'subcategory',
    label: 'Subcategory',
    type: 'text',
    isAdvanced: true,
    placeholder: 'Search by subcategory',
  },
]

const initialFilterValues = {
  sortBy: 'latest',
  subject: '',
  awbNumber: '',
  category: '',
  status: '',
  subcategory: '',
}

export const SupportTicketsPage = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filters, setFilters] = useState(initialFilterValues)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { data: tickets, isLoading } = useMyTickets({
    page,
    limit: rowsPerPage,
    filters: filters,
  })

  const appliedCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'sortBy' && Boolean(value),
  ).length

  return (
    <Stack spacing={3}>
      <PageHeading
        eyebrow="Support Panel"
        title="Support"
        subtitle="Manage issue resolution, ticket queues, and seller support requests from a support panel."
      />
      {isLoading ? (
        <Skeleton />
      ) : (
        <TicketStatusSummaryCard
          counts={tickets?.statusCounts ?? { closed: 0, in_progress: 0, open: 0, resolved: 0 }}
        />
      )}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        {' '}
        <FilterBar
          fields={supportTicketFilterFields}
          defaultValues={initialFilterValues}
          onApply={(newFilters) => {
            setFilters(newFilters)
            setPage(0) // reset to first page on filter change
          }}
          bgOverlayImg="/images/filters-bg.png"
          appliedCount={appliedCount}
        />
        <Button
          sx={{ ml: !isMobile ? '50px' : 0 }}
          size="small"
          variant="contained"
          startIcon={<FiPlus size={18} />}
          onClick={() => setDrawerOpen(true)}
        >
          Create Ticket
        </Button>
      </Stack>
      {!isLoading && (
        <Stack direction="row" justifyContent="flex-end">
          <Button
            href="https://wa.me/919217553934?text=Hi%2C%20I%27m%20a%20seller%20and%20I%20need%20some%20assistance.%20Can%20you%20please%20help%3F"
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            color="success"
            startIcon={<FaWhatsapp />}
            sx={{
              textTransform: 'none',
              mt: 1,
              color: 'green',
            }}
          >
            Get Help on WhatsApp
          </Button>
        </Stack>
      )}

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <SupportTicketList
          rows={tickets?.data ?? []}
          currentPage={page}
          rowsPerPage={rowsPerPage}
          totalCount={tickets?.totalCount ?? 0}
          onPageChange={(newPage) => setPage(newPage)}
          onRowsPerPageChange={(rows) => {
            setRowsPerPage(rows)
            setPage(1)
          }}
        />
      )}

      <CustomDrawer
        title="Create Support Ticket"
        open={drawerOpen}
        width={1100}
        onClose={() => setDrawerOpen(false)}
        anchor="right"
      >
        <Stack sx={{ color: '#fff', p: 2 }} gap={2}>
          <SupportTicketForm
            onSuccess={() => {
              setDrawerOpen(false)
            }}
          />
        </Stack>
      </CustomDrawer>
    </Stack>
  )
}
