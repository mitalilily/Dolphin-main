import { Badge, Box, Flex, HStack, Progress, SimpleGrid, Stack, Text, VStack } from '@chakra-ui/react'
import { adminBrand } from 'theme/brand'

const NAVY = adminBrand.ink
const SKY = adminBrand.sky
const AQUA = adminBrand.aqua
const ACCENT = adminBrand.accent
const LINE = adminBrand.line
const TEXT = adminBrand.ink
const MUTED = adminBrand.inkSoft

const asPercentValue = (value) => {
  const parsed = Number(String(value || '').replace('%', ''))
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.min(100, parsed))
}

function Shell({ eyebrow, title, description, children, compact = false }) {
  return (
    <Box
      borderRadius="22px"
      border={`1px solid ${LINE}`}
      bg={`radial-gradient(circle at 12% 8%, rgba(198,231,255,0.64) 0%, transparent 34%), radial-gradient(circle at 88% 12%, rgba(255,221,174,0.48) 0%, transparent 30%), ${adminBrand.surfaceGradient}`}
      boxShadow={adminBrand.shadow}
      px={{ base: 5, md: 6 }}
      py={{ base: compact ? 4 : 5, md: compact ? 5 : 6 }}
      overflow="hidden"
    >
      <Stack spacing={1.5} mb={compact ? 4 : 5} maxW="360px">
        <Text fontSize="11px" fontWeight="800" color={NAVY} letterSpacing="0.16em" textTransform="uppercase">
          {eyebrow}
        </Text>
        <Text fontSize={{ base: 'xl', md: compact ? 'xl' : '2xl' }} fontWeight="800" color={TEXT} lineHeight="1.1">
          {title}
        </Text>
        <Text fontSize="sm" color={MUTED} lineHeight="1.7">
          {description}
        </Text>
      </Stack>
      {children}
    </Box>
  )
}

function MetricTile({ label, value, hint }) {
  return (
    <Box p={3} borderRadius="16px" border="1px solid rgba(16,50,74,0.08)" bg="rgba(255,255,255,0.72)">
      <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color={MUTED}>
        {label}
      </Text>
      <Text mt={1} fontSize="lg" fontWeight="800" color={TEXT}>
        {value}
      </Text>
      <Text mt={1} fontSize="xs" color={MUTED}>
        {hint}
      </Text>
    </Box>
  )
}

function StaticRouteIllustration() {
  return (
    <Box
      borderRadius="20px"
      border="1px solid rgba(16,50,74,0.1)"
      bg="linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(245,251,255,0.92) 100%)"
      p={4}
      minH="168px"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset="auto -20px 20px -20px"
        h="44px"
        borderTop="1px dashed rgba(16,50,74,0.2)"
        borderBottom="1px dashed rgba(16,50,74,0.12)"
        opacity="0.9"
      />
      <Flex position="absolute" left="18px" top="18px" direction="column" gap={2}>
        {['Scan', 'Sort', 'Dispatch'].map((step, index) => (
          <HStack key={step} spacing={2}>
            <Badge borderRadius="full" bg={index === 2 ? 'rgba(255,221,174,0.72)' : 'rgba(198,231,255,0.62)'} color={NAVY}>
              0{index + 1}
            </Badge>
            <Text fontSize="xs" fontWeight="700" color={MUTED}>
              {step}
            </Text>
          </HStack>
        ))}
      </Flex>

      <Box
        position="absolute"
        right="20px"
        bottom="24px"
        w={{ base: '180px', md: '220px' }}
        h="88px"
        borderRadius="18px"
        bg={NAVY}
        boxShadow="0 14px 26px rgba(16,50,74,0.16)"
      >
        <Box position="absolute" left="14px" top="16px" w="64px" h="34px" borderRadius="10px" bg={SKY} />
        <Box position="absolute" right="16px" top="16px" w="52px" h="34px" borderRadius="10px" bg="rgba(255,255,255,0.2)" />
        <Box position="absolute" left="18px" bottom="-18px" w="28px" h="28px" borderRadius="full" bg="rgba(255,255,255,0.94)" />
        <Box position="absolute" right="18px" bottom="-18px" w="28px" h="28px" borderRadius="full" bg="rgba(255,255,255,0.94)" />
        <Box position="absolute" left="26px" bottom="-10px" w="12px" h="12px" borderRadius="full" bg={ACCENT} />
        <Box position="absolute" right="26px" bottom="-10px" w="12px" h="12px" borderRadius="full" bg={ACCENT} />
      </Box>

      <Box position="absolute" right="62px" top="38px" w="88px" h="54px" borderRadius="16px" bg="rgba(212,246,255,0.58)" />
      <Box position="absolute" right="124px" top="24px" w="14px" h="14px" borderRadius="full" bg="rgba(255,221,174,0.72)" />
      <Box position="absolute" right="150px" top="40px" w="10px" h="10px" borderRadius="full" bg="rgba(16,50,74,0.2)" />
      <Box position="absolute" right="166px" top="56px" w="8px" h="8px" borderRadius="full" bg="rgba(16,50,74,0.16)" />
    </Box>
  )
}

export function RollingVanScene({ compact = false, metrics = {} }) {
  const {
    todayOrders = '0',
    todayPending = '0 pending dispatch',
    deliverySuccess = '0%',
    deliveryHint = 'Delivered orders',
    codDue = 'Rs. 0',
    codHint = 'Pending remittance',
  } = metrics

  return (
    <Shell
      eyebrow="Operations snapshot"
      title="Live order movement"
      description="Current B2C and B2B activity, refreshed from the admin dashboard API."
      compact={compact}
    >
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
        <MetricTile label="Today's orders" value={todayOrders} hint={todayPending} />
        <MetricTile label="Delivery success" value={deliverySuccess} hint={deliveryHint} />
        <MetricTile label="COD due" value={codDue} hint={codHint} />
      </SimpleGrid>
      <Box mt={4}>
        <StaticRouteIllustration />
      </Box>
    </Shell>
  )
}

export function DoorstepCourierScene({ compact = false, metrics = {} }) {
  const {
    outForDelivery = '0',
    finalHandoff = '0 shipments out for delivery',
    exceptions = '0',
    exceptionsHint = 'NDR and stuck orders',
    inTransit = '0',
    inTransitHint = 'Moving today',
    routeReadiness = 0,
  } = metrics
  const routeReadinessValue = asPercentValue(routeReadiness)

  return (
    <Shell
      eyebrow="Courier control"
      title="Handoff status at a glance"
      description="Live delivery movement, exception pressure, and same-day dispatch status."
      compact={compact}
    >
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between" p={3} borderRadius="16px" border="1px solid rgba(16,50,74,0.08)" bg="rgba(255,255,255,0.72)">
          <Box>
            <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color={MUTED}>
              Final handoff
            </Text>
            <Text mt={1} fontSize="sm" fontWeight="800" color={TEXT}>
              {finalHandoff}
            </Text>
          </Box>
          <Badge bg={AQUA} color={NAVY} borderRadius="full">
            Live
          </Badge>
        </HStack>

        <SimpleGrid columns={3} spacing={3}>
          <MetricTile label="Out for delivery" value={outForDelivery} hint="Active now" />
          <MetricTile label="Exceptions" value={exceptions} hint={exceptionsHint} />
          <MetricTile label="In transit" value={inTransit} hint={inTransitHint} />
        </SimpleGrid>

        <Box
          borderRadius="18px"
          border="1px solid rgba(16,50,74,0.08)"
          bg="linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(245,251,255,0.96) 100%)"
          p={4}
          position="relative"
          overflow="hidden"
        >
          <Box position="absolute" left="-18px" bottom="-14px" w="112px" h="112px" borderRadius="full" bg="rgba(198,231,255,0.42)" />
          <Box position="absolute" right="-20px" top="-20px" w="92px" h="92px" borderRadius="full" bg="rgba(255,221,174,0.38)" />
          <Text fontSize="sm" fontWeight="700" color={TEXT} mb={2}>
            Delivery readiness
          </Text>
          <Progress value={routeReadinessValue} size="sm" borderRadius="full" colorScheme="blue" mb={2} />
          <HStack justify="space-between">
            <Text fontSize="xs" color={MUTED}>
              Success rate
            </Text>
            <Text fontSize="xs" fontWeight="700" color={TEXT}>
              {routeReadinessValue}%
            </Text>
          </HStack>
        </Box>
      </VStack>
    </Shell>
  )
}
