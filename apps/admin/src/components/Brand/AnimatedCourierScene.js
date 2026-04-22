import { Badge, Box, Flex, HStack, Progress, SimpleGrid, Stack, Text, VStack } from '@chakra-ui/react'

const NAVY = '#171310'
const ORANGE = '#D97943'
const CREAM = '#F7EFE5'
const TEXT = '#171310'

function Shell({ eyebrow, title, description, children, compact = false }) {
  return (
    <Box
      borderRadius="22px"
      border="1px solid rgba(23,19,16,0.12)"
      bg={`radial-gradient(circle at 14% 10%, rgba(200,169,137,0.22) 0%, transparent 34%), radial-gradient(circle at 88% 12%, rgba(217,121,67,0.14) 0%, transparent 32%), linear-gradient(180deg, #fffaf4 0%, ${CREAM} 100%)`}
      boxShadow="0 18px 40px rgba(36,26,27,0.08)"
      px={{ base: 5, md: 6 }}
      py={{ base: compact ? 4 : 5, md: compact ? 5 : 6 }}
      overflow="hidden"
    >
      <Stack spacing={1.5} mb={compact ? 4 : 5} maxW="320px">
        <Text fontSize="11px" fontWeight="800" color={NAVY} letterSpacing="0.16em" textTransform="uppercase">
          {eyebrow}
        </Text>
        <Text fontSize={{ base: 'xl', md: compact ? 'xl' : '2xl' }} fontWeight="800" color={TEXT} lineHeight="1.1">
          {title}
        </Text>
        <Text fontSize="sm" color="rgba(36,26,27,0.72)" lineHeight="1.7">
          {description}
        </Text>
      </Stack>
      {children}
    </Box>
  )
}

function MetricTile({ label, value, hint }) {
  return (
    <Box p={3} borderRadius="16px" border="1px solid rgba(23,19,16,0.08)" bg="rgba(255,255,255,0.66)">
      <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color="rgba(36,26,27,0.58)">
        {label}
      </Text>
      <Text mt={1} fontSize="lg" fontWeight="800" color={TEXT}>
        {value}
      </Text>
      <Text mt={1} fontSize="xs" color="rgba(36,26,27,0.66)">
        {hint}
      </Text>
    </Box>
  )
}

function StaticRouteIllustration() {
  return (
    <Box
      borderRadius="20px"
      border="1px solid rgba(23,19,16,0.1)"
      bg="linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(247,239,229,0.92) 100%)"
      p={4}
      minH="168px"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset="auto -20px 20px -20px"
        h="44px"
        borderTop="1px dashed rgba(23,19,16,0.16)"
        borderBottom="1px dashed rgba(23,19,16,0.12)"
        opacity="0.9"
      />
      <Flex position="absolute" left="18px" top="18px" direction="column" gap={2}>
        {['Scan', 'Sort', 'Dispatch'].map((step, index) => (
          <HStack key={step} spacing={2}>
            <Badge borderRadius="full" bg={index === 2 ? 'rgba(217,121,67,0.16)' : 'rgba(16,50,74,0.1)'} color={NAVY}>
              0{index + 1}
            </Badge>
            <Text fontSize="xs" fontWeight="700" color="rgba(36,26,27,0.72)">
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
        boxShadow="0 14px 26px rgba(23,19,16,0.16)"
      >
        <Box position="absolute" left="14px" top="16px" w="64px" h="34px" borderRadius="10px" bg={ORANGE} />
        <Box position="absolute" right="16px" top="16px" w="52px" h="34px" borderRadius="10px" bg="rgba(255,255,255,0.18)" />
        <Box position="absolute" left="18px" bottom="-18px" w="28px" h="28px" borderRadius="full" bg="rgba(255,255,255,0.94)" />
        <Box position="absolute" right="18px" bottom="-18px" w="28px" h="28px" borderRadius="full" bg="rgba(255,255,255,0.94)" />
        <Box position="absolute" left="26px" bottom="-10px" w="12px" h="12px" borderRadius="full" bg={ORANGE} />
        <Box position="absolute" right="26px" bottom="-10px" w="12px" h="12px" borderRadius="full" bg={ORANGE} />
      </Box>

      <Box position="absolute" right="62px" top="38px" w="88px" h="54px" borderRadius="16px" bg="rgba(217,121,67,0.16)" />
      <Box position="absolute" right="124px" top="24px" w="14px" h="14px" borderRadius="full" bg="rgba(217,121,67,0.36)" />
      <Box position="absolute" right="150px" top="40px" w="10px" h="10px" borderRadius="full" bg="rgba(23,19,16,0.22)" />
      <Box position="absolute" right="166px" top="56px" w="8px" h="8px" borderRadius="full" bg="rgba(23,19,16,0.16)" />
    </Box>
  )
}

export function RollingVanScene({ compact = false }) {
  return (
    <Shell
      eyebrow="Operations snapshot"
      title="Clear dispatch control, without visual noise."
      description="A stable summary of live orders, delivery performance, and the queue that needs attention."
      compact={compact}
    >
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
        <MetricTile label="Today's orders" value="1,284" hint="84 waiting for dispatch" />
        <MetricTile label="Delivery success" value="96%" hint="Last 24 hours" />
        <MetricTile label="COD due" value="₹12.8L" hint="Pending remittance" />
      </SimpleGrid>
      <Box mt={4}>
        <StaticRouteIllustration />
      </Box>
    </Shell>
  )
}

export function DoorstepCourierScene({ compact = false }) {
  return (
    <Shell
      eyebrow="Doorstep clarity"
      title="Handoff status at a glance."
      description="Keep confirmation, exception handling, and courier visibility in one calm, readable block."
      compact={compact}
    >
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between" p={3} borderRadius="16px" border="1px solid rgba(23,19,16,0.08)" bg="rgba(255,255,255,0.7)">
          <Box>
            <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color="rgba(36,26,27,0.58)">
              Final handoff
            </Text>
            <Text mt={1} fontSize="sm" fontWeight="800" color={TEXT}>
              42 shipments awaiting OTP confirmation
            </Text>
          </Box>
          <Badge colorScheme="orange" borderRadius="full">
            Watchlist
          </Badge>
        </HStack>

        <SimpleGrid columns={3} spacing={3}>
          <MetricTile label="Out for delivery" value="328" hint="Across 14 cities" />
          <MetricTile label="Exceptions" value="19" hint="Need review" />
          <MetricTile label="Fast lanes" value="112" hint="Same-day movement" />
        </SimpleGrid>

        <Box
          borderRadius="18px"
          border="1px solid rgba(23,19,16,0.08)"
          bg="linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(248,241,231,0.96) 100%)"
          p={4}
          position="relative"
          overflow="hidden"
        >
          <Box position="absolute" left="-18px" bottom="-14px" w="112px" h="112px" borderRadius="full" bg="rgba(16,50,74,0.08)" />
          <Box position="absolute" right="-20px" top="-20px" w="92px" h="92px" borderRadius="full" bg="rgba(217,121,67,0.12)" />
          <Text fontSize="sm" fontWeight="700" color={TEXT} mb={2}>
            Courier lane
          </Text>
          <Progress value={74} size="sm" borderRadius="full" colorScheme="orange" mb={2} />
          <HStack justify="space-between">
            <Text fontSize="xs" color="rgba(36,26,27,0.66)">
              Route readiness
            </Text>
            <Text fontSize="xs" fontWeight="700" color={TEXT}>
              74%
            </Text>
          </HStack>
        </Box>
      </VStack>
    </Shell>
  )
}
