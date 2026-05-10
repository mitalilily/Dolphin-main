'use client'

import {
  Badge,
  Box,
  Container,
  Flex,
  Grid,
  HStack,
  Icon,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react'
import {
  FaBoxOpen,
  FaBuilding,
  FaExclamationTriangle,
  FaShippingFast,
  FaStore,
  FaTruck,
} from 'react-icons/fa'

const stages = [
  { label: 'Booked', icon: FaStore },
  { label: 'Pending Pickup', icon: FaBuilding },
  { label: 'In Transit', icon: FaTruck },
  { label: 'Out for Delivery', icon: FaShippingFast },
  { label: 'Delivered', icon: FaBoxOpen },
]

const statusLabels = {
  BK: 'Booked',
  PP: 'Pending Pickup',
  IT: 'In Transit',
  OFD: 'Out for Delivery',
  DL: 'Delivered',
  CAN: 'Cancelled',
  RT: 'RTO',
  'RT-IT': 'RTO In Transit',
  'RT-DL': 'RTO Delivered',
  EX: 'Exception',
}

const getStatusCode = (value) => {
  const raw = String(value || '').trim()
  const compact = raw.toUpperCase().replace(/\s+/g, '-')
  if (statusLabels[compact]) return compact

  const text = raw.toLowerCase()
  if (text.includes('cancel')) return 'CAN'
  if (text.includes('rto') && text.includes('deliver')) return 'RT-DL'
  if (text.includes('rto')) return 'RT'
  if (text.includes('deliver')) return 'DL'
  if (text.includes('out for delivery')) return 'OFD'
  if (text.includes('transit') || text.includes('shipped') || text.includes('dispatch')) return 'IT'
  if (text.includes('pickup')) return 'PP'
  if (text.includes('book') || text.includes('created') || text.includes('manifest')) return 'BK'
  return compact || 'BK'
}

const getStageIndex = (value) => {
  const code = getStatusCode(value)
  if (code === 'DL') return 4
  if (code === 'OFD') return 3
  if (code === 'IT') return 2
  if (code === 'PP') return 1
  return 0
}

export default function TrackingDetails({ data, isLoading, error }) {
  const cardBg = useColorModeValue('white', 'gray.800')
  const detailItemBg = useColorModeValue('gray.50', 'gray.700')
  const historyBorderColor = useColorModeValue('gray.200', 'gray.600')
  const history = Array.isArray(data?.history) ? data.history : []

  if (isLoading) {
    return (
      <Flex direction="column" align="center" justify="center" py={12}>
        <Spinner size="xl" thickness="4px" color="blue.500" />
        <Text mt={4} fontWeight="medium">
          Fetching your tracking details…
        </Text>
      </Flex>
    )
  }

  if (error || !data) {
    return (
      <Box bg="red.50" border="1px" borderColor="red.200" rounded="lg" p={6} textAlign="center">
        <Icon as={FaExclamationTriangle} boxSize={10} color="red.500" mb={2} />
        <Text fontWeight="bold" fontSize="lg" color="red.700">
          {error ? 'Something went wrong' : 'Tracking Not Found'}
        </Text>
        <Text fontSize="sm" mt={1} color="red.600">
          {error?.message || 'Please check your AWB / Order details and try again.'}
        </Text>
      </Box>
    )
  }

  const currentStage = getStageIndex(data?.status_code || history[0]?.status_code || data?.status)

  return (
    <Container maxW="6xl" py={8}>
      <Grid templateColumns={{ base: '1fr', md: '1fr 2fr' }} gap={6}>
        {/* Shipment Details */}
        <Box bg={cardBg} rounded="lg" shadow="md" p={6}>
          <Text fontSize="xl" fontWeight="bold" mb={4}>
            Shipment Details
          </Text>
          <VStack spacing={3} align="stretch">
            {[
              { label: 'Courier', value: data.courier_name },
              { label: 'Provider', value: data.provider },
              { label: 'AWB No', value: data.awb_number },
              { label: 'Order Number', value: data.order_number },
              { label: 'Payment Type', value: data.payment_type },
              { label: 'Expected Delivery', value: data.edd },
            ].map((item) => (
              <Box
                key={item.label}
                p={3}
                rounded="md"
                bg={detailItemBg}
              >
                <Text fontSize="xs" textTransform="uppercase" color="gray.500">
                  {item.label}
                </Text>
                <Text fontWeight="semibold">{item.value || '-'}</Text>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* Tracking Progress + History */}
        <VStack spacing={6} align="stretch">
          {/* Progress */}
          <Box bg={cardBg} rounded="lg" shadow="md" p={6}>
            <HStack justify="space-between">
              {stages.map((stage, index) => {
                const active = index <= currentStage
                return (
                  <VStack key={stage.label} spacing={2}>
                    <Flex
                      w={10}
                      h={10}
                      rounded="full"
                      align="center"
                      justify="center"
                      bg={active ? 'blue.500' : 'gray.300'}
                      color="white"
                    >
                      <Icon as={stage.icon} />
                    </Flex>
                    <Text
                      fontSize="xs"
                      fontWeight={active ? 'bold' : 'normal'}
                      color={active ? 'blue.600' : 'gray.500'}
                      textAlign="center"
                    >
                      {stage.label}
                    </Text>
                  </VStack>
                )
              })}
            </HStack>
          </Box>

          {/* History */}
          <Box bg={cardBg} rounded="lg" shadow="md" p={6}>
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              Tracking History
            </Text>
            {data.warning && (
              <Box rounded="md" border="1px" borderColor="orange.200" bg="orange.50" p={3} mb={4}>
                <Text color="orange.700" fontSize="sm">
                  {data.warning}
                </Text>
              </Box>
            )}
            <VStack spacing={4} align="stretch">
              {history.length === 0 ? (
                <Text color="gray.500" fontSize="sm">
                  No tracking events available yet.
                </Text>
              ) : (
                history.map((h, idx) => {
                  const eventCode = getStatusCode(h.status_code || h.message)
                  return (
                    <Box
                      key={`${h.event_time}-${idx}`}
                      p={4}
                      border="1px"
                      borderColor={historyBorderColor}
                      rounded="md"
                    >
                      <Badge
                        colorScheme={
                          eventCode === 'CAN' ? 'red' : eventCode === 'DL' ? 'green' : 'blue'
                        }
                        mb={2}
                      >
                        {statusLabels[eventCode] || h.status_code || 'Status Update'}
                      </Badge>
                      {h.location && (
                        <Text fontSize="sm">
                          <strong>Location:</strong> {h.location}
                        </Text>
                      )}
                    <Text fontSize="sm">
                      <strong>Time:</strong>{' '}
                      {h.event_time
                        ? new Date(h.event_time).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'N/A'}
                    </Text>
                      {h.message && (
                        <Text fontSize="sm" mt={1}>
                          {h.message}
                        </Text>
                      )}
                    </Box>
                  )
                })
              )}
            </VStack>
          </Box>
        </VStack>
      </Grid>
    </Container>
  )
}
