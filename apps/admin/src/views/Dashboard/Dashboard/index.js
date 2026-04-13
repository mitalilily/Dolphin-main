import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Progress,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'
import {
  IconAlertTriangle,
  IconCheck,
  IconCoinRupee,
  IconMapPin,
  IconPackageExport,
  IconRefresh,
  IconTruck,
  IconUsers,
} from '@tabler/icons-react'
import { DoorstepCourierScene, RollingVanScene } from 'components/Brand/AnimatedCourierScene'
import Card from 'components/Card/Card'
import CardBody from 'components/Card/CardBody'
import CardHeader from 'components/Card/CardHeader'
import OrdersLineChart from 'components/Charts/OrdersLineChart'
import RevenueBarChart from 'components/Charts/RevenueBarChart'
import { useDashboardStats } from 'hooks/useDashboardStats'
import { useHistory } from 'react-router-dom'

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

const toNum = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function MetricCard({ title, value, subtitle, icon, color = 'brand.500' }) {
  const textPrimary = useColorModeValue('#241A1B', 'gray.100')
  const textSecondary = useColorModeValue('#6A5E59', 'gray.400')
  const iconBg = useColorModeValue('rgba(12,59,128,0.06)', 'rgba(148,163,184,0.14)')

  return (
    <Card borderRadius="24px" h="full" bg={useColorModeValue('rgba(255,253,248,0.96)', 'rgba(18,27,45,0.9)')} borderWidth="1px" borderColor={useColorModeValue('rgba(12,59,128,0.1)', 'rgba(255,255,255,0.08)')}>
      <CardBody p={4.5}>
        <HStack justify="space-between" align="flex-start" mb={2}>
          <Text fontSize="xs" color={textSecondary} fontWeight="700" textTransform="uppercase" letterSpacing="0.45px">
            {title}
          </Text>
          <Flex w="38px" h="38px" borderRadius="14px" bg={iconBg} align="center" justify="center" color={color}>
            {icon}
          </Flex>
        </HStack>
        <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800" color={textPrimary} lineHeight="1.1">
          {value}
        </Text>
        <Text mt={1.5} fontSize="sm" color={textSecondary}>
          {subtitle}
        </Text>
      </CardBody>
    </Card>
  )
}

export default function Dashboard() {
  const history = useHistory()
  const { data: statsData, isLoading, error, refetch, isRefetching } = useDashboardStats()

  const pageBg = useColorModeValue('#F7EBDD', '#142238')
  const panelBg = useColorModeValue('rgba(255,253,248,0.96)', '#101D36')
  const borderColor = useColorModeValue('rgba(12,59,128,0.12)', 'rgba(148,163,184,0.2)')
  const textPrimary = useColorModeValue('#241A1B', 'gray.100')
  const textSecondary = useColorModeValue('#6A5E59', 'gray.400')
  const tileBg = useColorModeValue('rgba(255,244,232,0.8)', 'rgba(148,163,184,0.1)')

  const stats = statsData?.data || {}
  const todayOps = stats.todayOperations || {}
  const financial = stats.financial || {}
  const operational = stats.operational || {}
  const alerts = stats.alerts || {}
  const couriers = stats.couriers || {}
  const geographic = stats.geographic || {}
  const charts = stats.charts || {}

  const heroHighlights = [
    {
      title: 'Today orders',
      value: toNum(todayOps.orders).toLocaleString(),
    },
    {
      title: 'Delivery success',
      value: `${toNum(operational.deliverySuccessRate)}%`,
    },
    {
      title: 'Net revenue',
      value: formatCurrency(financial.totalRevenue),
    },
  ]

  const topCouriers = Object.entries(couriers.performance || {})
    .map(([name, value]) => ({
      name,
      count: toNum(value?.count),
      deliveryRate: toNum(value?.deliveryRate),
      revenue: toNum(value?.revenue),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="65vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text color={textSecondary}>Loading dashboard...</Text>
        </VStack>
      </Flex>
    )
  }

  if (error) {
    return (
      <Flex justify="center" align="center" minH="65vh">
        <VStack spacing={3}>
          <Text color="red.500" fontWeight="700" fontSize="lg">
            Failed to load dashboard data
          </Text>
          <Button size="sm" onClick={() => refetch()} leftIcon={<IconRefresh size={16} />}>
            Retry
          </Button>
        </VStack>
      </Flex>
    )
  }

  return (
    <Box minH="100vh" pb={8} bg={pageBg}>
      <Container maxW="full" pt={{ base: '128px', md: '88px' }} px={{ base: 4, md: 6 }}>
        <Grid templateColumns={{ base: '1fr', '2xl': '1.55fr 0.8fr' }} gap={{ base: 4, xl: 5 }} mb={5} alignItems="start">
          <Card bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="28px">
            <CardBody p={{ base: 4, md: 5 }}>
              <Stack spacing={4}>
                <HStack justify="space-between" flexWrap="wrap" spacing={3}>
                  <VStack align="flex-start" spacing={1}>
                    <Text fontSize="xs" fontWeight="800" letterSpacing="0.16em" textTransform="uppercase" color="brand.500">
                      SkyRush operations deck
                    </Text>
                    <Heading size="lg" color={textPrimary} letterSpacing="-0.04em">
                      Run admin operations from a clearer top layer.
                    </Heading>
                    <Text color={textSecondary} maxW="520px" lineHeight="1.75">
                      The admin home now uses softer surfaces, stronger sectioning, and a more
                      product-led flow for orders, finance, risk, and courier control.
                    </Text>
                  </VStack>
                  <HStack spacing={3}>
                    <Button
                      size="sm"
                      leftIcon={isRefetching ? <Spinner size="sm" /> : <IconRefresh size={16} />}
                      isLoading={isRefetching}
                      onClick={() => refetch()}
                      bg="brand.500"
                      color="white"
                      _hover={{ bg: 'brand.600' }}
                    >
                      Refresh
                    </Button>
                    <Button size="sm" variant="outline" borderColor={borderColor} onClick={() => history.push('/admin/orders')}>
                      Orders
                    </Button>
                  </HStack>
                </HStack>

                <RollingVanScene compact />

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={2.5}>
                  {heroHighlights.map((item) => (
                    <Box key={item.title} p={3} borderRadius="18px" bg={tileBg} borderWidth="1px" borderColor={borderColor}>
                      <Text fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em" color={textSecondary}>
                        {item.title}
                      </Text>
                      <Text mt={1.5} fontSize="lg" fontWeight="800" color={textPrimary}>
                        {item.value}
                      </Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </Stack>
            </CardBody>
          </Card>

          <Box display={{ base: 'none', '2xl': 'block' }}>
            <DoorstepCourierScene compact />
          </Box>
        </Grid>

        <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4} mb={6}>
          <MetricCard
            title="Today Orders"
            value={toNum(todayOps.orders).toLocaleString()}
            subtitle={`${toNum(todayOps.pending)} of today's orders pending dispatch`}
            icon={<IconPackageExport size={18} />}
            color="brand.500"
          />
          <MetricCard
            title="Delivery Success"
            value={`${toNum(operational.deliverySuccessRate)}%`}
            subtitle={`${toNum(operational.deliveredOrders)} delivered out of ${toNum(operational.totalOrders)} orders`}
            icon={<IconCheck size={18} />}
            color="green.500"
          />
          <MetricCard
            title="NDR Rate"
            value={`${toNum(operational.ndrRate)}%`}
            subtitle={`${toNum(operational.ndrOrders)} active NDR orders`}
            icon={<IconAlertTriangle size={18} />}
            color="orange.500"
          />
          <MetricCard
            title="Net Revenue"
            value={formatCurrency(financial.totalRevenue)}
            subtitle={`Today ${formatCurrency(financial.todayRevenue)} | Freight - courier cost`}
            icon={<IconCoinRupee size={18} />}
            color="secondary.500"
          />
        </SimpleGrid>

        <Grid templateColumns={{ base: '1fr', xl: '1.45fr 1fr' }} gap={6} mb={6}>
          <Card bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="24px" h="full">
            <CardHeader p={5} pb={2}>
              <Heading size="sm" color={textPrimary}>Orders Trend (7 days)</Heading>
              <Text fontSize="sm" color={textSecondary} mt={1}>Shipment volume by day</Text>
            </CardHeader>
            <CardBody p={5} pt={2}>
              <Box h={{ base: '240px', md: '320px' }}>
                <OrdersLineChart data={charts.ordersByDate || []} />
              </Box>
            </CardBody>
          </Card>

          <Card bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="24px" h="full">
            <CardHeader p={5} pb={2}>
              <Heading size="sm" color={textPrimary}>Action Queue</Heading>
              <Text fontSize="sm" color={textSecondary} mt={1}>Operational items needing attention</Text>
            </CardHeader>
            <CardBody p={5} pt={2}>
              <VStack spacing={3} align="stretch">
                {[
                  {
                    title: 'Open Tickets',
                    value: toNum(alerts.openTickets),
                    note: toNum(alerts.overdueTickets) ? `${toNum(alerts.overdueTickets)} overdue` : 'Support triage',
                    route: '/admin/support',
                    colorScheme: 'red',
                  },
                  {
                    title: 'Pending KYC',
                    value: toNum(alerts.pendingKyc),
                    note: 'Verification queue',
                    route: '/admin/users-management',
                    colorScheme: 'orange',
                  },
                  {
                    title: 'Weight Disputes',
                    value: toNum(alerts.weightDiscrepancies),
                    note: 'Review reconciliation',
                    route: '/admin/weight-reconciliation',
                    colorScheme: 'blue',
                  },
                ].map((item) => (
                  <Flex
                    key={item.title}
                    p={3.5}
                    borderRadius="18px"
                    borderWidth="1px"
                    borderColor={`${item.colorScheme}.200`}
                    bg={`${item.colorScheme}.50`}
                    justify="space-between"
                    align="center"
                    cursor="pointer"
                    onClick={() => history.push(item.route)}
                    _hover={{ transform: 'translateY(-1px)' }}
                    transition="all 0.2s"
                  >
                    <Box>
                      <Text fontSize="sm" fontWeight="700" color={textPrimary}>{item.title}</Text>
                      <Text fontSize="xs" color={textSecondary}>{item.note}</Text>
                    </Box>
                    <Badge colorScheme={item.colorScheme} borderRadius="full">{item.value}</Badge>
                  </Flex>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        <Grid templateColumns={{ base: '1fr', xl: '1fr 1fr' }} gap={6} mb={6}>
          <Card bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="24px" h="full">
            <CardHeader p={5} pb={2}>
              <Heading size="sm" color={textPrimary}>Revenue Trend (7 days)</Heading>
              <Text fontSize="sm" color={textSecondary} mt={1}>Net revenue performance</Text>
            </CardHeader>
            <CardBody p={5} pt={2}>
              <Box h={{ base: '240px', md: '300px' }}>
                <RevenueBarChart data={charts.revenueByDate || []} />
              </Box>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mt={4}>
                <Box p={3.5} borderRadius="18px" borderWidth="1px" borderColor={borderColor} bg={tileBg}>
                  <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.45px" color={textSecondary} fontWeight="700">
                    COD Outstanding
                  </Text>
                  <Text mt={1} fontWeight="800" color={textPrimary}>{formatCurrency(financial.codRemittanceDue)}</Text>
                </Box>
                <Box p={3.5} borderRadius="18px" borderWidth="1px" borderColor={borderColor} bg={tileBg}>
                  <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.45px" color={textSecondary} fontWeight="700">
                    Total COD Value
                  </Text>
                  <Text mt={1} fontWeight="800" color={textPrimary}>{formatCurrency(financial.codAmount)}</Text>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>

          <Card bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="24px" h="full">
            <CardHeader p={5} pb={2}>
              <Heading size="sm" color={textPrimary}>Courier Snapshot</Heading>
              <Text fontSize="sm" color={textSecondary} mt={1}>Top couriers by volume</Text>
            </CardHeader>
            <CardBody p={5} pt={2}>
              <VStack spacing={3} align="stretch">
                {topCouriers.length === 0 ? (
                  <Text fontSize="sm" color={textSecondary}>No courier data available.</Text>
                ) : (
                  topCouriers.map((courier, index) => (
                    <Box key={courier.name} p={3.5} borderRadius="18px" borderWidth="1px" borderColor={borderColor} bg={tileBg}>
                      <HStack justify="space-between" mb={2}>
                        <HStack spacing={2}>
                          <Badge borderRadius="full">{index + 1}</Badge>
                          <Text fontSize="sm" fontWeight="700" color={textPrimary}>{courier.name}</Text>
                        </HStack>
                        <Text fontSize="sm" color={textSecondary}>{courier.count} orders</Text>
                      </HStack>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="xs" color={textSecondary}>Delivery Rate</Text>
                        <Text fontSize="xs" color={textSecondary}>{courier.deliveryRate}%</Text>
                      </HStack>
                      <Progress size="sm" borderRadius="full" value={courier.deliveryRate} colorScheme="green" mb={2} />
                      <Text fontSize="xs" color={textSecondary}>Revenue: {formatCurrency(courier.revenue)}</Text>
                    </Box>
                  ))
                )}
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        <Grid templateColumns={{ base: '1fr', xl: '1fr 1fr' }} gap={6}>
          <Card bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="24px" h="full">
            <CardHeader p={5} pb={2}>
              <Heading size="sm" color={textPrimary}>Origin Hotspots</Heading>
            </CardHeader>
            <CardBody p={5} pt={2}>
              <Stack spacing={2.5}>
                {(geographic.topOriginCities || []).length === 0 ? (
                  <Text fontSize="sm" color={textSecondary}>No origin city data yet.</Text>
                ) : (
                  (geographic.topOriginCities || []).slice(0, 5).map((item) => (
                    <HStack key={`origin-${item.city}`} justify="space-between" p={3} borderRadius="16px" borderWidth="1px" borderColor={borderColor} bg={tileBg}>
                      <HStack spacing={2}>
                        <IconMapPin size={16} color="#0C3B80" />
                        <Text color={textPrimary} fontSize="sm">{item.city}</Text>
                      </HStack>
                      <Badge>{toNum(item.count)}</Badge>
                    </HStack>
                  ))
                )}
              </Stack>
            </CardBody>
          </Card>

          <Card bg={panelBg} borderWidth="1px" borderColor={borderColor} borderRadius="24px" h="full">
            <CardHeader p={5} pb={2}>
              <Heading size="sm" color={textPrimary}>Destination Hotspots</Heading>
            </CardHeader>
            <CardBody p={5} pt={2}>
              <Stack spacing={2.5}>
                {(geographic.topDestinationCities || []).length === 0 ? (
                  <Text fontSize="sm" color={textSecondary}>No destination city data yet.</Text>
                ) : (
                  (geographic.topDestinationCities || []).slice(0, 5).map((item) => (
                    <HStack key={`dest-${item.city}`} justify="space-between" p={3} borderRadius="16px" borderWidth="1px" borderColor={borderColor} bg={tileBg}>
                      <HStack spacing={2}>
                        <IconMapPin size={16} color="#F57C00" />
                        <Text color={textPrimary} fontSize="sm">{item.city}</Text>
                      </HStack>
                      <Badge>{toNum(item.count)}</Badge>
                    </HStack>
                  ))
                )}
              </Stack>
            </CardBody>
          </Card>
        </Grid>
      </Container>
    </Box>
  )
}
