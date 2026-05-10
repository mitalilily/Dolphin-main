import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
  Spinner,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import {
  useCourierCredentials,
  useServiceProviders,
  useUpdateIcarryCredentials,
  useUpdateTruxcargoCredentials,
  useUpdateShipmozoCredentials,
  useUpdateShiprocketCredentials,
} from 'hooks/useCouriers'

const SUPPORTED_PROVIDERS = [
  'delhivery',
  'ekart',
  'xpressbees',
  'shipmozo',
  'shiprocket',
  'truxcargo',
  'icarry',
]

const toTitleCase = (value = '') =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const ProviderCard = ({ title, badgeLabel, badgeColorScheme, children }) => (
  <Box
    borderWidth="1px"
    borderRadius="md"
    bg="white"
    p={5}
    h="100%"
    boxShadow="sm"
  >
    <VStack spacing={4} align="stretch" h="100%">
      <Flex justify="space-between" align="center" gap={3}>
        <Text fontWeight="semibold">{title}</Text>
        <Badge colorScheme={badgeColorScheme}>{badgeLabel}</Badge>
      </Flex>
      {children}
    </VStack>
  </Box>
)

const CourierCredentials = () => {
  const toast = useToast()
  const { data, isLoading, error } = useCourierCredentials()
  const { data: serviceProviders = [] } = useServiceProviders()

  const updateShipmozo = useUpdateShipmozoCredentials()
  const updateShiprocket = useUpdateShiprocketCredentials()
  const updateTruxcargo = useUpdateTruxcargoCredentials()
  const updateIcarry = useUpdateIcarryCredentials()

  const [shipmozoForm, setShipmozoForm] = useState({
    apiBase: '',
    publicKey: '',
    privateKey: '',
    username: '',
    password: '',
    defaultWarehouseId: '',
  })
  const [shiprocketForm, setShiprocketForm] = useState({
    apiBase: '',
    username: '',
    password: '',
    authToken: '',
    defaultPickupLocation: '',
    defaultChannelId: '',
  })
  const [icarryForm, setIcarryForm] = useState({
    apiBase: '',
    username: '',
    apiKey: '',
    password: '',
    clientId: '',
  })
  const [truxcargoForm, setTruxcargoForm] = useState({
    apiBase: '',
    userId: '',
    apiKey: '',
  })

  useEffect(() => {
    if (data?.shipmozo) {
      setShipmozoForm({
        apiBase: data.shipmozo.apiBase || '',
        publicKey: data.shipmozo.publicKey || '',
        privateKey: '',
        username: data.shipmozo.username || '',
        password: '',
        defaultWarehouseId: data.shipmozo.defaultWarehouseId || '',
      })
    }
    if (data?.shiprocket) {
      setShiprocketForm({
        apiBase: data.shiprocket.apiBase || '',
        username: data.shiprocket.username || '',
        password: '',
        authToken: '',
        defaultPickupLocation: data.shiprocket.defaultPickupLocation || '',
        defaultChannelId: data.shiprocket.defaultChannelId || '',
      })
    }
    if (data?.icarry) {
      setIcarryForm({
        apiBase: data.icarry.apiBase || '',
        username: data.icarry.username || '',
        apiKey: '',
        password: '',
        clientId: data.icarry.clientId || '',
      })
    }
    if (data?.truxcargo) {
      setTruxcargoForm({
        apiBase: data.truxcargo.apiBase || '',
        userId: data.truxcargo.userId || '',
        apiKey: '',
      })
    }
  }, [data])

  const extraProviders = useMemo(() => {
    const providerSet = new Set(
      serviceProviders
        .map((provider) => (provider?.serviceProvider || '').toLowerCase())
        .filter(Boolean),
    )
    return [...providerSet].filter(
      (provider) => !SUPPORTED_PROVIDERS.includes(provider),
    )
  }, [serviceProviders])

  const handleSaveShipmozo = () => {
    updateShipmozo.mutate(
      {
        apiBase: shipmozoForm.apiBase,
        publicKey: shipmozoForm.publicKey,
        ...(shipmozoForm.privateKey
          ? { privateKey: shipmozoForm.privateKey }
          : {}),
        username: shipmozoForm.username,
        ...(shipmozoForm.password ? { password: shipmozoForm.password } : {}),
        defaultWarehouseId: shipmozoForm.defaultWarehouseId,
      },
      {
        onSuccess: () => {
          toast({ title: 'Shipmozo credentials updated', status: 'success' })
          setShipmozoForm((prev) => ({
            ...prev,
            privateKey: '',
            password: '',
          }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to update Shipmozo credentials',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleSaveShiprocket = () => {
    updateShiprocket.mutate(
      {
        apiBase: shiprocketForm.apiBase,
        username: shiprocketForm.username,
        ...(shiprocketForm.password
          ? { password: shiprocketForm.password }
          : {}),
        ...(shiprocketForm.authToken
          ? { authToken: shiprocketForm.authToken }
          : {}),
        defaultPickupLocation: shiprocketForm.defaultPickupLocation,
        defaultChannelId: shiprocketForm.defaultChannelId,
      },
      {
        onSuccess: () => {
          toast({ title: 'Shiprocket credentials updated', status: 'success' })
          setShiprocketForm((prev) => ({
            ...prev,
            password: '',
            authToken: '',
          }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to update Shiprocket credentials',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleSaveIcarry = () => {
    updateIcarry.mutate(
      {
        apiBase: icarryForm.apiBase,
        username: icarryForm.username,
        ...(icarryForm.apiKey ? { apiKey: icarryForm.apiKey } : {}),
        ...(icarryForm.password ? { password: icarryForm.password } : {}),
        clientId: icarryForm.clientId,
      },
      {
        onSuccess: () => {
          toast({ title: 'iCarry credentials updated', status: 'success' })
          setIcarryForm((prev) => ({ ...prev, apiKey: '', password: '' }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to update iCarry credentials',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleSaveTruxcargo = () => {
    updateTruxcargo.mutate(
      {
        apiBase: truxcargoForm.apiBase,
        userId: truxcargoForm.userId,
        ...(truxcargoForm.apiKey ? { apiKey: truxcargoForm.apiKey } : {}),
      },
      {
        onSuccess: () => {
          toast({ title: 'Truxcargo credentials updated', status: 'success' })
          setTruxcargoForm((prev) => ({ ...prev, apiKey: '' }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to update Truxcargo credentials',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  if (isLoading) return <Spinner size="md" />
  if (error)
    return <Text color="red.500">Failed to load courier credentials</Text>

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }} gap={4}>
      <Box>
        <Text fontSize="xl" fontWeight="bold">
          Courier Credentials
        </Text>
        <Text fontSize="sm" color="gray.500" mt={1}>
          Manage the active shipping partners used for bookings and service
          checks.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} alignItems="stretch">
        <ProviderCard
          title="Shipmozo"
          badgeColorScheme={data?.shipmozo?.hasPrivateKey ? 'green' : 'orange'}
          badgeLabel={
            data?.shipmozo?.hasPrivateKey
              ? 'Live keys set'
              : 'Missing private key'
          }
        >
          <FormControl>
            <FormLabel>API Base URL</FormLabel>
            <Input
              value={shipmozoForm.apiBase}
              onChange={(e) =>
                setShipmozoForm((prev) => ({
                  ...prev,
                  apiBase: e.target.value,
                }))
              }
              placeholder="https://shipping-api.com/app/api/v1"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Public Key</FormLabel>
            <Input
              value={shipmozoForm.publicKey}
              onChange={(e) =>
                setShipmozoForm((prev) => ({
                  ...prev,
                  publicKey: e.target.value,
                }))
              }
              placeholder="Shipmozo public key"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Private Key</FormLabel>
            <Input
              type="password"
              value={shipmozoForm.privateKey}
              onChange={(e) =>
                setShipmozoForm((prev) => ({
                  ...prev,
                  privateKey: e.target.value,
                }))
              }
              placeholder={
                data?.shipmozo?.privateKeyMasked ||
                'Leave blank to keep existing private key'
              }
            />
            {!!data?.shipmozo?.privateKeyMasked && (
              <Text fontSize="xs" color="gray.500" mt={1}>
                Current key: {data.shipmozo.privateKeyMasked}
              </Text>
            )}
          </FormControl>

          <FormControl>
            <FormLabel>Panel Username</FormLabel>
            <Input
              value={shipmozoForm.username}
              onChange={(e) =>
                setShipmozoForm((prev) => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
              placeholder="Shipmozo panel username"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Panel Password</FormLabel>
            <Input
              type="password"
              value={shipmozoForm.password}
              onChange={(e) =>
                setShipmozoForm((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              placeholder="Leave blank to keep existing password"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Default Warehouse ID</FormLabel>
            <Input
              value={shipmozoForm.defaultWarehouseId}
              onChange={(e) =>
                setShipmozoForm((prev) => ({
                  ...prev,
                  defaultWarehouseId: e.target.value,
                }))
              }
              placeholder="e.g. 15637"
            />
          </FormControl>

          <Text fontSize="xs" color="gray.500">
            Shipmozo uses header-based auth with public/private keys.
          </Text>

          <Button
            colorScheme="blue"
            onClick={handleSaveShipmozo}
            isLoading={updateShipmozo.isPending}
            alignSelf="flex-start"
          >
            Save Shipmozo Credentials
          </Button>
        </ProviderCard>

        <ProviderCard
          title="Shiprocket"
          badgeColorScheme={
            data?.shiprocket?.hasAuthToken || data?.shiprocket?.hasPassword
              ? 'green'
              : 'orange'
          }
          badgeLabel={
            data?.shiprocket?.hasAuthToken
              ? 'Token set'
              : data?.shiprocket?.hasPassword
                ? 'Password set'
                : 'Missing credentials'
          }
        >
          <FormControl>
            <FormLabel>API Base URL</FormLabel>
            <Input
              value={shiprocketForm.apiBase}
              onChange={(e) =>
                setShiprocketForm((prev) => ({
                  ...prev,
                  apiBase: e.target.value,
                }))
              }
              placeholder="https://apiv2.shiprocket.in/v1/external"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Email / Username</FormLabel>
            <Input
              value={shiprocketForm.username}
              onChange={(e) =>
                setShiprocketForm((prev) => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
              placeholder="Shiprocket login email"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={shiprocketForm.password}
              onChange={(e) =>
                setShiprocketForm((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              placeholder="Leave blank to keep existing password"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Auth Token / API Key</FormLabel>
            <Input
              type="password"
              value={shiprocketForm.authToken}
              onChange={(e) =>
                setShiprocketForm((prev) => ({
                  ...prev,
                  authToken: e.target.value,
                }))
              }
              placeholder={
                data?.shiprocket?.authTokenMasked ||
                'Paste Shiprocket auth token'
              }
            />
            {!!data?.shiprocket?.authTokenMasked && (
              <Text fontSize="xs" color="gray.500" mt={1}>
                Current token: {data.shiprocket.authTokenMasked}
              </Text>
            )}
          </FormControl>

          <FormControl>
            <FormLabel>Default Pickup Location</FormLabel>
            <Input
              value={shiprocketForm.defaultPickupLocation}
              onChange={(e) =>
                setShiprocketForm((prev) => ({
                  ...prev,
                  defaultPickupLocation: e.target.value,
                }))
              }
              placeholder="Primary warehouse name"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Default Channel ID</FormLabel>
            <Input
              value={shiprocketForm.defaultChannelId}
              onChange={(e) =>
                setShiprocketForm((prev) => ({
                  ...prev,
                  defaultChannelId: e.target.value,
                }))
              }
              placeholder="Optional channel ID"
            />
          </FormControl>

          <Button
            colorScheme="blue"
            onClick={handleSaveShiprocket}
            isLoading={updateShiprocket.isPending}
            alignSelf="flex-start"
          >
            Save Shiprocket Credentials
          </Button>
        </ProviderCard>

        <ProviderCard
          title="Truxcargo"
          badgeColorScheme={data?.truxcargo?.hasApiKey ? 'green' : 'orange'}
          badgeLabel={
            data?.truxcargo?.hasApiKey ? 'API key set' : 'Missing API key'
          }
        >
          <FormControl>
            <FormLabel>API Base URL</FormLabel>
            <Input
              value={truxcargoForm.apiBase}
              onChange={(e) =>
                setTruxcargoForm((prev) => ({
                  ...prev,
                  apiBase: e.target.value,
                }))
              }
              placeholder="https://b2b.truxcargo.com"
            />
          </FormControl>

          <FormControl>
            <FormLabel>User ID (Optional)</FormLabel>
            <Input
              value={truxcargoForm.userId}
              onChange={(e) =>
                setTruxcargoForm((prev) => ({
                  ...prev,
                  userId: e.target.value,
                }))
              }
              placeholder="Truxcargo user id"
            />
          </FormControl>

          <FormControl>
            <FormLabel>API Key</FormLabel>
            <Input
              type="password"
              value={truxcargoForm.apiKey}
              onChange={(e) =>
                setTruxcargoForm((prev) => ({
                  ...prev,
                  apiKey: e.target.value,
                }))
              }
              placeholder={
                data?.truxcargo?.apiKeyMasked || 'Enter Truxcargo API key'
              }
            />
            {!!data?.truxcargo?.apiKeyMasked && (
              <Text fontSize="xs" color="gray.500" mt={1}>
                Current key: {data.truxcargo.apiKeyMasked}
              </Text>
            )}
          </FormControl>

          <Button
            colorScheme="blue"
            onClick={handleSaveTruxcargo}
            isLoading={updateTruxcargo.isPending}
            alignSelf="flex-start"
          >
            Save Truxcargo Credentials
          </Button>
        </ProviderCard>

        <ProviderCard
          title="iCarry"
          badgeColorScheme={data?.icarry?.hasApiKey ? 'green' : 'orange'}
          badgeLabel={
            data?.icarry?.hasApiKey ? 'API key set' : 'Missing API key'
          }
        >
          <FormControl>
            <FormLabel>API Base URL</FormLabel>
            <Input
              value={icarryForm.apiBase}
              onChange={(e) =>
                setIcarryForm((prev) => ({ ...prev, apiBase: e.target.value }))
              }
              placeholder="https://www.icarry.in"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Username</FormLabel>
            <Input
              value={icarryForm.username}
              onChange={(e) =>
                setIcarryForm((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="iCarry username"
            />
          </FormControl>

          <FormControl>
            <FormLabel>API Key</FormLabel>
            <Input
              type="password"
              value={icarryForm.apiKey}
              onChange={(e) =>
                setIcarryForm((prev) => ({ ...prev, apiKey: e.target.value }))
              }
              placeholder={data?.icarry?.apiKeyMasked || 'Enter iCarry API key'}
            />
            {!!data?.icarry?.apiKeyMasked && (
              <Text fontSize="xs" color="gray.500" mt={1}>
                Current key: {data.icarry.apiKeyMasked}
              </Text>
            )}
          </FormControl>

          <FormControl>
            <FormLabel>Password (Optional)</FormLabel>
            <Input
              type="password"
              value={icarryForm.password}
              onChange={(e) =>
                setIcarryForm((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Leave blank to keep existing password"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Client ID (Optional)</FormLabel>
            <Input
              value={icarryForm.clientId}
              onChange={(e) =>
                setIcarryForm((prev) => ({ ...prev, clientId: e.target.value }))
              }
              placeholder="iCarry client ID"
            />
          </FormControl>

          <Text fontSize="xs" color="gray.500">
            iCarry requires username + API key. Leave secret fields blank to
            retain saved values.
          </Text>

          <Button
            colorScheme="blue"
            onClick={handleSaveIcarry}
            isLoading={updateIcarry.isPending}
            alignSelf="flex-start"
          >
            Save iCarry Credentials
          </Button>
        </ProviderCard>

        {extraProviders.map((provider) => (
          <ProviderCard
            key={provider}
            title={toTitleCase(provider)}
            badgeColorScheme="gray"
            badgeLabel="Credentials UI Pending"
          >
            <Text fontSize="sm" color="gray.500">
              This provider is available in service providers, but a dedicated
              credentials form is not added yet.
            </Text>
          </ProviderCard>
        ))}
      </SimpleGrid>
    </Flex>
  )
}

export default CourierCredentials
