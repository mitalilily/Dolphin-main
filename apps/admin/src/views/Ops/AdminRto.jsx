import {
  Box,
  Button,
  Flex,
  HStack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Stack,
  Tag,
  Text,
} from '@chakra-ui/react'
import TableFilters from 'components/Tables/TableFilters'
import { useAdminRto, useAdminRtoKpis } from 'hooks/useOps'
import { useState } from 'react'
import { exportAdminRto } from 'services/ops.service'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

export default function AdminRto() {
  const [filters, setFilters] = useState({ search: '', fromDate: '', toDate: '' })
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)

  const { data, isLoading } = useAdminRto({
    page,
    limit: perPage,
    search: filters.search,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
  })
  const { data: kpisData } = useAdminRtoKpis({
    search: filters.search,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
  })
  const rows = data?.data || []

  const filterOptions = [
    { key: 'search', label: 'Search', type: 'text', placeholder: 'AWB / Order / Reason' },
    { key: 'fromDate', label: 'From', type: 'date' },
    { key: 'toDate', label: 'To', type: 'date' },
  ]

  const totalCount = data?.totalCount || 0

  const captions = ['AWB', 'Order', 'Status', 'Latest Reason', 'Latest Remarks', 'RTO Charges', 'Created', 'Timeline']
  const columnKeys = [
    'awb_number',
    'order_summary',
    'status',
    'reason',
    'remarks',
    'rto_charges',
    'created_at',
    'timeline',
  ]

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }} gap={4}>
      {/* KPIs + Export */}
      <HStack justify="space-between">
        <HStack spacing={6}>
          <Stat>
            <StatLabel>Total RTO Events</StatLabel>
            <StatNumber>{kpisData?.data?.total ?? 0}</StatNumber>
            <StatHelpText>All statuses</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>RTO Charges</StatLabel>
            <StatNumber>₹{Number(kpisData?.data?.totalCharges || 0).toFixed(2)}</StatNumber>
            <StatHelpText>Sum of RTO charges</StatHelpText>
          </Stat>
        </HStack>
        <Button
          onClick={() =>
            exportAdminRto({
              search: filters.search,
              fromDate: filters.fromDate || undefined,
              toDate: filters.toDate || undefined,
            })
          }
          colorScheme="blue"
          variant="solid"
        >
          Export CSV
        </Button>
      </HStack>
      <TableFilters
        filters={filterOptions}
        values={filters}
        onApply={(f) => {
          setFilters(f)
          setPage(1)
        }}
      />

      <GenericTable
        paginated
        loading={isLoading}
        page={page}
        setPage={setPage}
        totalCount={totalCount}
        perPage={perPage}
        isLoading={isLoading}
        setPerPage={setPerPage}
        title="RTO Events"
        data={rows}
        captions={captions}
        columnKeys={columnKeys}
        renderers={{
          order_summary: (_v, row) => (
            <Stack spacing={0.5}>
              <Text fontSize="sm" fontWeight="700">{row.order_number || '—'}</Text>
              <Text fontSize="xs" color="gray.500">{row.order_id || '—'}</Text>
              <Text fontSize="xs" color="gray.500">{row.courier_partner || '—'}</Text>
            </Stack>
          ),
          status: (v) => <Tag>{v}</Tag>,
          rto_charges: (v) => (
            <Text fontSize="sm" fontWeight="600">
              {v ? `₹${Number(v).toFixed(2)}` : '—'}
            </Text>
          ),
          created_at: (v) => <Text fontSize="xs">{v ? new Date(v).toLocaleString() : '—'}</Text>,
          timeline: (timeline) => (
            <Stack spacing={2} minW="280px">
              {(Array.isArray(timeline) ? timeline : []).map((event, index) => (
                <Box
                  key={event.id || index}
                  p={2.5}
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  bg={index === 0 ? 'blue.50' : 'gray.50'}
                >
                  <HStack justify="space-between" align="start" mb={1.5}>
                    <Tag size="sm" colorScheme={index === 0 ? 'blue' : 'gray'}>
                      {event.status || '—'}
                    </Tag>
                    <Text fontSize="xs" color="gray.500">
                      {event.created_at ? new Date(event.created_at).toLocaleString() : '—'}
                    </Text>
                  </HStack>
                  {event.reason ? (
                    <Text fontSize="xs" fontWeight="600" color="gray.700">
                      Reason: {event.reason}
                    </Text>
                  ) : null}
                  {event.remarks ? (
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      {event.remarks}
                    </Text>
                  ) : null}
                  {event.rto_charges ? (
                    <Text fontSize="xs" color="gray.700" mt={1}>
                      Charges: ₹{Number(event.rto_charges).toFixed(2)}
                    </Text>
                  ) : null}
                </Box>
              ))}
            </Stack>
          ),
        }}
        columnWidths={{
          order_summary: '180px',
          timeline: '340px',
        }}
      />
    </Flex>
  )
}
