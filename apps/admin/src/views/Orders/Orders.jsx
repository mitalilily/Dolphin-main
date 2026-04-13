import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Text,
  Select,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import Card from 'components/Card/Card'
import CardBody from 'components/Card/CardBody'
import OrdersTable from 'components/Tables/OrdersTable'
import TableFilters from 'components/Tables/TableFilters'
import { useOrders } from 'hooks/useOrders'
import { useEffect, useMemo, useState } from 'react'
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiDownload,
  FiPackage,
  FiRefreshCw,
  FiShoppingBag,
  FiTruck,
  FiXCircle,
} from 'react-icons/fi'
import { useLocation } from 'react-router-dom'
import { exportOrdersToCSV } from 'services/order.service'

const Orders = () => {
  const location = useLocation()
  const initialSearch = new URLSearchParams(location.search).get('search') || ''
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    search: initialSearch,
    fromDate: '',
    toDate: '',
  })
  const [isExporting, setIsExporting] = useState(false)

  const { data: ordersData, isLoading, isFetching, refetch } = useOrders(page, limit, filters)
  const toast = useToast()

  useEffect(() => {
    const nextSearch = new URLSearchParams(location.search).get('search') || ''
    setFilters((prev) => {
      if (prev.search === nextSearch) return prev
      return {
        ...prev,
        search: nextSearch,
      }
    })
    setPage(1)
  }, [location.search])

  const textColor = useColorModeValue('gray.700', 'white')
  const bgStats = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Calculate statistics
  const stats = useMemo(() => {
    const orders = ordersData?.orders || []
    return {
      total: ordersData?.totalCount || 0,
      pending: orders.filter((o) => o.order_status === 'pending').length,
      shipped: orders.filter(
        (o) => o.order_status === 'shipment_created' || o.order_status === 'in_transit',
      ).length,
      delivered: orders.filter((o) => o.order_status === 'delivered').length,
      cancelled: orders.filter((o) => o.order_status === 'cancelled').length,
      cancellationRequested: orders.filter((o) => o.order_status === 'cancellation_requested')
        .length,
    }
  }, [ordersData])

  const handleStatusFilter = (statusValue = '') => {
    setFilters((prev) => ({
      ...prev,
      status: statusValue,
    }))
    setPage(1)
  }

  const isStatusActive = (statusValue = '') => filters.status === statusValue

  const handleExport = async () => {
    try {
      setIsExporting(true)
      await exportOrdersToCSV(filters)
      toast({
        title: 'Export successful',
        description: 'Orders have been exported to CSV',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error.message || 'Failed to export orders',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsExporting(false)
    }
  }

  const filterOptions = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by Order ID, AWB, or Customer...',
    },
    {
      key: 'status',
      label: 'Order Status',
      type: 'select',
      placeholder: 'All Statuses',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'shipment_created', label: 'Shipment Created' },
        { value: 'in_transit', label: 'In Transit' },
        { value: 'out_for_delivery', label: 'Out for Delivery' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancellation_requested', label: 'Cancellation Requested' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'rto', label: 'RTO' },
        { value: 'rto_in_transit', label: 'RTO In Transit' },
        { value: 'rto_delivered', label: 'RTO Delivered' },
      ],
    },
    {
      key: 'fromDate',
      label: 'From Date',
      type: 'date',
      placeholder: 'Start Date',
    },
    {
      key: 'toDate',
      label: 'To Date',
      type: 'date',
      placeholder: 'End Date',
    },
  ]

  return (
    <Box pt={{ base: '120px', md: '75px' }}>
      {/* Page Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack spacing={3}>
          <Flex
            align="center"
            justify="center"
            w={12}
            h={12}
            borderRadius="xl"
            bg={useColorModeValue('blue.500', 'blue.400')}
          >
            <Icon as={FiShoppingBag} w={6} h={6} color="white" />
          </Flex>
          <Box>
            <Heading size="lg" color={textColor}>
              Orders Management
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Track and manage all your orders
            </Text>
          </Box>
        </HStack>
        <HStack spacing={3} display={{ base: 'none', md: 'flex' }}>
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={() => refetch()}
            isLoading={isFetching}
            variant="outline"
            size="md"
          >
            Refresh
          </Button>
          <Button
            leftIcon={<FiDownload />}
            onClick={handleExport}
            isLoading={isExporting}
            loadingText="Exporting..."
            colorScheme="blue"
            size="md"
          >
            Export
          </Button>
        </HStack>
      </Flex>

      {/* Compact Statistics */}
      <Grid
        templateColumns={{
          base: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          xl: 'repeat(6, 1fr)',
        }}
        gap={3}
        mb={4}
      >
        <Flex
          bg={useColorModeValue('blue.50', 'blue.900')}
          p={3}
          borderRadius="lg"
          align="center"
          gap={3}
          cursor="pointer"
          _hover={{ bg: useColorModeValue('blue.100', 'blue.800') }}
          transition="all 0.2s"
          borderWidth={isStatusActive('') ? '2px' : '1px'}
          borderColor={isStatusActive('') ? 'blue.400' : borderColor}
          onClick={() => handleStatusFilter('')}
        >
          <Icon as={FiPackage} w={5} h={5} color="blue.500" flexShrink={0} />
          <Box>
            <Text fontSize="xs" color="gray.600" fontWeight="500">
              Total
            </Text>
            <Text fontSize="xl" fontWeight="bold" color={textColor}>
              {stats.total}
            </Text>
          </Box>
        </Flex>

        <Flex
          bg={useColorModeValue('orange.50', 'orange.900')}
          p={3}
          borderRadius="lg"
          align="center"
          gap={3}
          cursor="pointer"
          _hover={{ bg: useColorModeValue('orange.100', 'orange.800') }}
          transition="all 0.2s"
          borderWidth={isStatusActive('pending') ? '2px' : '1px'}
          borderColor={isStatusActive('pending') ? 'orange.400' : borderColor}
          onClick={() => handleStatusFilter('pending')}
        >
          <Icon as={FiRefreshCw} w={5} h={5} color="orange.500" flexShrink={0} />
          <Box>
            <Text fontSize="xs" color="gray.600" fontWeight="500">
              Pending
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="orange.500">
              {stats.pending}
            </Text>
          </Box>
        </Flex>

        <Flex
          bg={useColorModeValue('purple.50', 'purple.900')}
          p={3}
          borderRadius="lg"
          align="center"
          gap={3}
          cursor="pointer"
          _hover={{ bg: useColorModeValue('purple.100', 'purple.800') }}
          transition="all 0.2s"
          borderWidth={
            filters.status === 'shipment_created' || filters.status === 'in_transit' ? '2px' : '1px'
          }
          borderColor={
            filters.status === 'shipment_created' || filters.status === 'in_transit'
              ? 'purple.400'
              : borderColor
          }
          onClick={() => handleStatusFilter('in_transit')}
        >
          <Icon as={FiTruck} w={5} h={5} color="purple.500" flexShrink={0} />
          <Box>
            <Text fontSize="xs" color="gray.600" fontWeight="500">
              Shipped
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="purple.500">
              {stats.shipped}
            </Text>
          </Box>
        </Flex>

        <Flex
          bg={useColorModeValue('green.50', 'green.900')}
          p={3}
          borderRadius="lg"
          align="center"
          gap={3}
          cursor="pointer"
          _hover={{ bg: useColorModeValue('green.100', 'green.800') }}
          transition="all 0.2s"
          borderWidth={isStatusActive('delivered') ? '2px' : '1px'}
          borderColor={isStatusActive('delivered') ? 'green.400' : borderColor}
          onClick={() => handleStatusFilter('delivered')}
        >
          <Icon as={FiCheckCircle} w={5} h={5} color="green.500" flexShrink={0} />
          <Box>
            <Text fontSize="xs" color="gray.600" fontWeight="500">
              Delivered
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="green.500">
              {stats.delivered}
            </Text>
          </Box>
        </Flex>

        <Flex
          bg={useColorModeValue('yellow.50', 'yellow.900')}
          p={3}
          borderRadius="lg"
          align="center"
          gap={3}
          cursor="pointer"
          _hover={{ bg: useColorModeValue('yellow.100', 'yellow.800') }}
          transition="all 0.2s"
          borderWidth={isStatusActive('cancellation_requested') ? '2px' : '1px'}
          borderColor={isStatusActive('cancellation_requested') ? 'yellow.500' : borderColor}
          onClick={() => handleStatusFilter('cancellation_requested')}
        >
          <Icon as={FiAlertTriangle} w={5} h={5} color="yellow.600" flexShrink={0} />
          <Box>
            <Text fontSize="xs" color="gray.600" fontWeight="500">
              Cancellation Requested
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="yellow.600">
              {stats.cancellationRequested}
            </Text>
          </Box>
        </Flex>

        <Flex
          bg={useColorModeValue('red.50', 'red.900')}
          p={3}
          borderRadius="lg"
          align="center"
          gap={3}
          cursor="pointer"
          _hover={{ bg: useColorModeValue('red.100', 'red.800') }}
          transition="all 0.2s"
          borderWidth={isStatusActive('cancelled') ? '2px' : '1px'}
          borderColor={isStatusActive('cancelled') ? 'red.400' : borderColor}
          onClick={() => handleStatusFilter('cancelled')}
        >
          <Icon as={FiXCircle} w={5} h={5} color="red.500" flexShrink={0} />
          <Box>
            <Text fontSize="xs" color="gray.600" fontWeight="500">
              Cancelled
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="red.500">
              {stats.cancelled}
            </Text>
          </Box>
        </Flex>
      </Grid>

      <Flex justify="flex-end" align="center" mb={3}>
        <HStack spacing={3}>
          <Text fontSize="sm" color="gray.500">
            Sort by Created At
          </Text>
          <Select
            size="sm"
            w="180px"
            value={filters.sortOrder}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                sortBy: 'created_at',
                sortOrder: e.target.value,
              }))
              setPage(1)
            }}
          >
            <option value="asc">Newest first</option>
            <option value="desc">Oldest first</option>
          </Select>
        </HStack>
      </Flex>

      {/* Filters Card */}
      <Card mb={4} boxShadow="sm">
        <CardBody p={4}>
          <TableFilters
            filters={filterOptions}
            values={filters}
            onApply={(appliedFilters) => {
              setFilters((prev) => ({
                ...appliedFilters,
                sortBy: prev.sortBy || 'created_at',
                sortOrder: prev.sortOrder || 'desc',
              }))
              setPage(1)
            }}
            actions={[]}
            showActiveFiltersCount={true}
            cardStyle={false}
          />
        </CardBody>
      </Card>

      {/* Orders Table */}
      <OrdersTable
        orders={ordersData?.orders}
        totalCount={ordersData?.totalCount}
        page={page}
        setPage={setPage}
        perPage={limit}
        setPerPage={setLimit}
        loading={isLoading || isFetching}
        onRefresh={refetch}
      />
    </Box>
  )
}

export default Orders
