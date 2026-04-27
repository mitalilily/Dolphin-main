import {
  Badge,
  Flex,
  HStack,
  Spinner,
  Switch,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { useMemo } from 'react'
import { useCouriers, useServiceProviders, useUpdateServiceProviderStatus } from 'hooks/useCouriers'

const DEFAULT_ADMIN_PROVIDERS = [
  'delhivery',
  'ekart',
  'xpressbees',
  'shipmozo',
  'shiprocket',
  'icarry',
  'juxcargo',
]

const toProviderLabel = (value = '') =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const ServiceProviders = () => {
  const { data: providers = [], isLoading, error } = useServiceProviders()
  const { data: couriers = [], isLoading: isCouriersLoading } = useCouriers()
  const updateStatus = useUpdateServiceProviderStatus()
  const toast = useToast()

  const normalizedProviders = useMemo(() => {
    const providerMap = new Map(
      providers.map((provider) => [
        (provider?.serviceProvider || '').toLowerCase(),
        {
          ...provider,
          serviceProvider: (provider?.serviceProvider || '').toLowerCase(),
          totalCouriers: Number(provider?.totalCouriers || 0),
          enabledCouriers: Number(provider?.enabledCouriers || 0),
          isEnabled: Boolean(provider?.isEnabled),
        },
      ]),
    )

    DEFAULT_ADMIN_PROVIDERS.forEach((providerKey) => {
      if (!providerMap.has(providerKey)) {
        providerMap.set(providerKey, {
          serviceProvider: providerKey,
          totalCouriers: 0,
          enabledCouriers: 0,
          isEnabled: false,
        })
      }
    })

    return Array.from(providerMap.values()).sort((a, b) =>
      (a?.serviceProvider || '').localeCompare(b?.serviceProvider || '', undefined, {
        sensitivity: 'base',
      }),
    )
  }, [providers])

  const couriersByProvider = useMemo(() => {
    const grouped = couriers.reduce((acc, courier) => {
      const providerKey = (courier?.serviceProvider || '').toLowerCase()
      if (!providerKey) return acc
      if (!acc[providerKey]) {
        acc[providerKey] = []
      }
      acc[providerKey].push(courier?.name || `${courier?.id || ''}`.trim())
      return acc
    }, {})

    Object.keys(grouped).forEach((provider) => {
      grouped[provider] = grouped[provider]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    })

    return grouped
  }, [couriers])

  if (isLoading || isCouriersLoading) return <Spinner size="md" />
  if (error) return <Text color="red.500">Failed to load service providers</Text>

  const handleToggle = (provider) => {
    updateStatus.mutate(
      { serviceProvider: provider.serviceProvider, isEnabled: !provider.isEnabled },
      {
        onSuccess: () => {
          toast({
            title: `Provider ${provider.isEnabled ? 'disabled' : 'enabled'} successfully`,
            status: 'success',
          })
        },
        onError: () => {
          toast({
            title: 'Failed to update provider status',
            status: 'error',
          })
        },
      },
    )
  }

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }} gap={4}>
      <Text fontSize="xl" fontWeight="bold">
        Service Providers
      </Text>
      <Text fontSize="sm" color="gray.500">
        Manage provider status and review newly added couriers grouped under each provider.
      </Text>

      <TableContainer borderWidth="1px" borderRadius="lg">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th minW="160px">Provider</Th>
              <Th minW="280px">Couriers</Th>
              <Th isNumeric>Total Couriers</Th>
              <Th isNumeric>Enabled Couriers</Th>
              <Th>Status</Th>
              <Th textAlign="right">Toggle</Th>
            </Tr>
          </Thead>
          <Tbody>
            {normalizedProviders.length === 0 ? (
              <Tr>
                <Td colSpan={6} textAlign="center">
                  <Text color="gray.500">No service provider data found.</Text>
                </Td>
              </Tr>
            ) : (
              normalizedProviders.map((provider) => {
                const providerKey = (provider.serviceProvider || '').toLowerCase()
                const names = couriersByProvider[providerKey] || []

                return (
                  <Tr key={provider.serviceProvider}>
                    <Td>{toProviderLabel(provider.serviceProvider)}</Td>
                    <Td>
                      {names.length ? (
                        <Wrap spacing={2}>
                          {names.map((name) => (
                            <WrapItem key={`${provider.serviceProvider}-${name}`}>
                              <Badge colorScheme="blue" borderRadius="md" px={2} py={1}>
                                {name}
                              </Badge>
                            </WrapItem>
                          ))}
                        </Wrap>
                      ) : (
                        <Text fontSize="sm" color="gray.500">
                          No couriers mapped
                        </Text>
                      )}
                    </Td>
                    <Td isNumeric>{provider.totalCouriers}</Td>
                    <Td isNumeric>{provider.enabledCouriers}</Td>
                    <Td>
                      <Text
                        fontWeight="semibold"
                        color={provider.isEnabled ? 'green.500' : 'red.500'}
                      >
                        {provider.isEnabled ? 'Enabled' : 'Disabled'}
                      </Text>
                    </Td>
                    <Td>
                      <HStack justify="flex-end">
                        <Switch
                          colorScheme="green"
                          isChecked={provider.isEnabled}
                          isDisabled={updateStatus.isPending}
                          onChange={() => handleToggle(provider)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                )
              })
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </Flex>
  )
}

export default ServiceProviders
