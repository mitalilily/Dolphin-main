import {
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
} from '@chakra-ui/react'
import { useMemo } from 'react'
import {
  useServiceProviders,
  useUpdateServiceProviderStatus,
} from 'hooks/useCouriers'

const DEFAULT_ADMIN_PROVIDERS = [
  'delhivery',
  'ekart',
  'xpressbees',
  'shipmozo',
  'shiprocket',
  'truxcargo',
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

  if (isLoading) return <Spinner size="md" />
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
      <HStack justify="space-between" align="center">
        <Text fontSize="sm" color="gray.500">
          Manage provider status at aggregator level.
        </Text>
      </HStack>

      <TableContainer borderWidth="1px" borderRadius="lg">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th minW="160px">Provider</Th>
              <Th isNumeric>Total Couriers</Th>
              <Th isNumeric>Enabled Couriers</Th>
              <Th>Status</Th>
              <Th textAlign="right">Toggle</Th>
            </Tr>
          </Thead>
          <Tbody>
            {normalizedProviders.length === 0 ? (
              <Tr>
                <Td colSpan={5} textAlign="center">
                  <Text color="gray.500">No service provider data found.</Text>
                </Td>
              </Tr>
            ) : (
              normalizedProviders.map((provider) => {
                return (
                  <Tr key={provider.serviceProvider}>
                    <Td>{toProviderLabel(provider.serviceProvider)}</Td>
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
