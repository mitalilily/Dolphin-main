// src/pages/integrations/Couriers.tsx

import { Stack } from '@mui/material'
import { useState } from 'react'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import PageHeading from '../../components/UI/heading/PageHeading'
import CourierList from '../../components/integrations/couriers/CourierList'
import CourierSummaryCard from '../../components/integrations/couriers/CourierSummaryCard'
import { useCouriers } from '../../hooks/Integrations/useCouriers'

const filterFields: FilterField[] = [
  {
    name: 'sortBy',
    label: 'Sort By',
    type: 'select',
    options: [
      { label: 'Latest Added', value: 'latest' },
      { label: 'Oldest First', value: 'oldest' },
      { label: 'Name (A-Z)', value: 'az' },
      { label: 'Name (Z-A)', value: 'za' },
    ],
    placeholder: 'Select sort order',
  },
  {
    name: 'name',
    label: 'Courier Name',
    type: 'text',
    placeholder: 'Search by name',
  },
  {
    name: 'masterCompany',
    label: 'Master Company',
    type: 'text',
    placeholder: 'Search by company',
  },
  {
    name: 'isHyperlocal',
    label: 'Hyperlocal',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Yes', value: true },
      { label: 'No', value: false },
    ],
  },
  {
    name: 'podAvailable',
    label: 'POD Available',
    type: 'select',
    isAdvanced: true,
    options: [
      { label: 'All', value: '' },
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    name: 'realtimeTracking',
    label: 'Tracking Type',
    type: 'text',
    isAdvanced: true,
    placeholder: 'e.g., API, Manual',
  },
]

const initialFilterValues = {
  sortBy: '',
  name: '',
  masterCompany: '',
  isHyperlocal: '',
  podAvailable: '',
  realtimeTracking: '',
}

const Couriers = () => {
  const [filters, setFilters] = useState(initialFilterValues)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { data, isLoading } = useCouriers({
    page,
    limit: rowsPerPage,
    filters: {
      ...filters,
      serviceProviders: ['icarry', 'shipmozo'],
    },
  })

  const appliedCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'sortBy' && Boolean(value),
  ).length

  return (
    <Stack gap={2}>
      <PageHeading
        eyebrow="Courier Panel"
        title="Couriers"
        subtitle="Review courier partners, filter network coverage, and compare service readiness in a operations workspace."
      />
      <CourierSummaryCard
        summary={
          data?.summary ?? {
            pickupPincodesCount: 0,
            serviceablePincodesCount: 0,
            totalCourierCount: 0,
            totalOdaCount: 0,
            totalRtoCount: 0,
          }
        }
      />

      <FilterBar
        fields={filterFields}
        defaultValues={initialFilterValues}
        onApply={(newFilters) => {
          setFilters(newFilters)
          setPage(0) // reset to first page on filter change
        }}
        bgOverlayImg="/images/filters-bg.png"
        appliedCount={appliedCount}
      />

      <CourierList
        loading={isLoading}
        couriers={data?.couriers ?? []}
        totalCount={data?.totalCount ?? 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />
    </Stack>
  )
}

export default Couriers
