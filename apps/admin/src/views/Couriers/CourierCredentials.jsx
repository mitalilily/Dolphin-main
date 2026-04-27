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
  useUpdateDelhiveryCredentials,
  useUpdateEkartCredentials,
  useUpdateIcarryCredentials,
  useUpdateShipmozoCredentials,
  useUpdateShiprocketCredentials,
  useUpdateXpressbeesCredentials,
} from 'hooks/useCouriers'

const SUPPORTED_PROVIDERS = ['delhivery', 'ekart', 'xpressbees', 'shipmozo', 'shiprocket', 'icarry']

const toTitleCase = (value = '') =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const ProviderCard = ({ title, badgeLabel, badgeColorScheme, children }) => (
  <Box borderWidth="1px" borderRadius="lg" p={5} h="100%">
    <VStack spacing={4} align="stretch">
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

  const updateDelhivery = useUpdateDelhiveryCredentials()
  const updateEkart = useUpdateEkartCredentials()
  const updateXpressbees = useUpdateXpressbeesCredentials()
  const updateShipmozo = useUpdateShipmozoCredentials()
  const updateShiprocket = useUpdateShiprocketCredentials()
  const updateIcarry = useUpdateIcarryCredentials()

  const [delhiveryForm, setDelhiveryForm] = useState({
    apiBase: '',
    clientName: '',
    apiKey: '',
  })
  const [ekartForm, setEkartForm] = useState({
    apiBase: '',
    clientId: '',
    username: '',
    password: '',
    webhookSecret: '',
  })
  const [xpressbeesForm, setXpressbeesForm] = useState({
    apiBase: '',
    username: '',
    password: '',
    apiKey: '',
    webhookSecret: '',
  })
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

  useEffect(() => {
    if (data?.delhivery) {
      setDelhiveryForm({
        apiBase: data.delhivery.apiBase || '',
        clientName: data.delhivery.clientName || '',
        apiKey: '',
      })
    }
    if (data?.ekart) {
      setEkartForm({
        apiBase: data.ekart.apiBase || '',
        clientId: data.ekart.clientId || '',
        username: data.ekart.username || '',
        password: '',
        webhookSecret: '',
      })
    }
    if (data?.xpressbees) {
      setXpressbeesForm({
        apiBase: data.xpressbees.apiBase || '',
        username: data.xpressbees.username || '',
        password: '',
        apiKey: '',
        webhookSecret: '',
      })
    }
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
  }, [data])

  const extraProviders = useMemo(() => {
    const providerSet = new Set(
      serviceProviders
        .map((provider) => (provider?.serviceProvider || '').toLowerCase())
        .filter(Boolean),
    )
    return [...providerSet].filter((provider) => !SUPPORTED_PROVIDERS.includes(provider))
  }, [serviceProviders])

  const handleSaveDelhivery = () => {
    updateDelhivery.mutate(
      {
        apiBase: delhiveryForm.apiBase,
        clientName: delhiveryForm.clientName,
        ...(delhiveryForm.apiKey ? { apiKey: delhiveryForm.apiKey } : {}),
      },
      {
        onSuccess: () => {
          toast({
            title: 'Delhivery credentials updated',
            status: 'success',
          })
          setDelhiveryForm((prev) => ({ ...prev, apiKey: '' }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to update credentials',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleSaveEkart = () => {
    updateEkart.mutate(
      {
        apiBase: ekartForm.apiBase,
        clientId: ekartForm.clientId,
        username: ekartForm.username,
        ...(ekartForm.password ? { password: ekartForm.password } : {}),
        ...(ekartForm.webhookSecret ? { webhookSecret: ekartForm.webhookSecret } : {}),
      },
      {
        onSuccess: () => {
          toast({ title: 'Ekart credentials updated', status: 'success' })
          setEkartForm((prev) => ({ ...prev, password: '', webhookSecret: '' }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to update Ekart credentials',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleSaveXpressbees = () => {
    updateXpressbees.mutate(
      {
        apiBase: xpressbeesForm.apiBase,
        username: xpressbeesForm.username,
        ...(xpressbeesForm.password ? { password: xpressbeesForm.password } : {}),
        ...(xpressbeesForm.apiKey ? { apiKey: xpressbeesForm.apiKey } : {}),
        ...(xpressbeesForm.webhookSecret ? { webhookSecret: xpressbeesForm.webhookSecret } : {}),
      },
      {
        onSuccess: () => {
          toast({ title: 'Xpressbees credentials updated', status: 'success' })
          setXpressbeesForm((prev) => ({
            ...prev,
            password: '',
            apiKey: '',
            webhookSecret: '',
          }))
        },
        onError: (err) => {
          toast({
            title: 'Failed to update Xpressbees credentials',
            description: err?.message,
            status: 'error',
          })
        },
      },
    )
  }

  const handleSaveShipmozo = () => {
    updateShipmozo.mutate(
      {
        apiBase: shipmozoForm.apiBase,
        publicKey: shipmozoForm.publicKey,
        ...(shipmozoForm.privateKey ? { privateKey: shipmozoForm.privateKey } : {}),
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
        ...(shiprocketForm.password ? { password: shiprocketForm.password } : {}),
        defaultPickupLocation: shiprocketForm.defaultPickupLocation,
        defaultChannelId: shiprocketForm.defaultChannelId,
      },
      {
        onSuccess: () => {
          toast({ title: 'Shiprocket credentials updated', status: 'success' })
          setShiprocketForm((prev) => ({ ...prev, password: '' }))
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

  if (isLoading) return <Spinner size="md" />
  if (error) return <Text color="red.500">Failed to load courier credentials</Text>

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }} gap={4}>
      <Text fontSize="xl" fontWeight="bold">
        Courier Credentials
      </Text>

      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
        <ProviderCard
          title="Delhivery"
          badgeColorScheme={data?.delhivery?.hasApiKey ? 'green' : 'orange'}
          badgeLabel={data?.delhivery?.hasApiKey ? 'Configured' : 'Missing API Key'}
        >
          <FormControl>
            <FormLabel>API Base URL</FormLabel>
            <Input
              value={delhiveryForm.apiBase}
              onChange={(e) => setDelhiveryForm((prev) => ({ ...prev, apiBase: e.target.value }))}
              placeholder="https://track.delhivery.com"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Client Name</FormLabel>
            <Input
              value={delhiveryForm.clientName}
              onChange={(e) =>
                setDelhiveryForm((prev) => ({ ...prev, clientName: e.target.value }))
              }
              placeholder="Your Delhivery client name"
            />
          </FormControl>

          <FormControl>
            <FormLabel>API Key</FormLabel>
            <Input
              type="password"
              value={delhiveryForm.apiKey}
              onChange={(e) => setDelhiveryForm((prev) => ({ ...prev, apiKey: e.target.value }))}
              placeholder={data?.delhivery?.apiKeyMasked || 'Enter Delhivery API key'}
            />
            {!!data?.delhivery?.apiKeyMasked && (
              <Text fontSize="xs" color="gray.500" mt={1}>
                Current key: {data.delhivery.apiKeyMasked}
              </Text>
            )}
          </FormControl>

          <Text fontSize="xs" color="gray.500">
            Standard Delhivery credentials. Leave the API key blank to keep the existing secret.
          </Text>

          <Button
            colorScheme="blue"
            onClick={handleSaveDelhivery}
            isLoading={updateDelhivery.isPending}
            alignSelf="flex-start"
          >
            Save Delhivery Credentials
          </Button>
        </ProviderCard>

        <ProviderCard
          title="Ekart Logistics"
          badgeColorScheme={data?.ekart?.hasPassword ? 'green' : 'orange'}
          badgeLabel={data?.ekart?.hasPassword ? 'Credentials set' : 'Missing password'}
        >
          <FormControl>
            <FormLabel>API Base URL</FormLabel>
            <Input
              value={ekartForm.apiBase}
              onChange={(e) => setEkartForm((prev) => ({ ...prev, apiBase: e.target.value }))}
              placeholder="https://app.elite.ekartlogistics.in"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Client ID</FormLabel>
            <Input
              value={ekartForm.clientId}
              onChange={(e) => setEkartForm((prev) => ({ ...prev, clientId: e.target.value }))}
              placeholder="Your Ekart client ID"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Username</FormLabel>
            <Input
              value={ekartForm.username}
              onChange={(e) => setEkartForm((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="Ekart username"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={ekartForm.password}
              onChange={(e) => setEkartForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Enter Ekart password (saved securely)"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Webhook Secret</FormLabel>
            <Input
              type="password"
              value={ekartForm.webhookSecret}
              onChange={(e) => setEkartForm((prev) => ({ ...prev, webhookSecret: e.target.value }))}
              placeholder="Leave blank to keep existing webhook secret"
            />
            {data?.ekart?.hasWebhookSecret && (
              <Text fontSize="xs" color="gray.500" mt={1}>
                Webhook secret already configured on Ekart.
              </Text>
            )}
          </FormControl>

          <Text fontSize="xs" color="gray.500">
            Ekart requires client ID + username/password for token generation.
          </Text>

          <Button
            colorScheme="blue"
            onClick={handleSaveEkart}
            isLoading={updateEkart.isPending}
            alignSelf="flex-start"
          >
            Save Ekart Credentials
          </Button>
        </ProviderCard>

        <ProviderCard
          title="Xpressbees"
          badgeColorScheme={data?.xpressbees?.hasApiKey ? 'green' : 'orange'}
          badgeLabel={data?.xpressbees?.hasApiKey ? 'API key set' : 'Missing API key'}
        >
          <FormControl>
            <FormLabel>API Base URL</FormLabel>
            <Input
              value={xpressbeesForm.apiBase}
              onChange={(e) =>
                setXpressbeesForm((prev) => ({ ...prev, apiBase: e.target.value }))
              }
              placeholder="https://shipment.xpressbees.com"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Username / Email</FormLabel>
            <Input
              value={xpressbeesForm.username}
              onChange={(e) =>
                setXpressbeesForm((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="Xpressbees username or email"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={xpressbeesForm.password}
              onChange={(e) =>
                setXpressbeesForm((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Leave blank to keep existing password"
            />
          </FormControl>

          <FormControl>
            <FormLabel>API Key / Token</FormLabel>
            <Input
              type="password"
              value={xpressbeesForm.apiKey}
              onChange={(e) => setXpressbeesForm((prev) => ({ ...prev, apiKey: e.target.value }))}
              placeholder={data?.xpressbees?.apiKeyMasked || 'Enter Xpressbees API key'}
            />
            {!!data?.xpressbees?.apiKeyMasked && (
              <Text fontSize="xs" color="gray.500" mt={1}>
                Current key: {data.xpressbees.apiKeyMasked}
              </Text>
            )}
          </FormControl>

          <FormControl>
            <FormLabel>Webhook Secret</FormLabel>
            <Input
              type="password"
              value={xpressbeesForm.webhookSecret}
              onChange={(e) =>
                setXpressbeesForm((prev) => ({ ...prev, webhookSecret: e.target.value }))
              }
              placeholder="Leave blank to keep existing webhook secret"
            />
            {data?.xpressbees?.hasWebhookSecret && (
              <Text fontSize="xs" color="gray.500" mt={1}>
                Webhook secret already configured on Xpressbees.
              </Text>
            )}
          </FormControl>

          <Text fontSize="xs" color="gray.500">
            Leave password, API key, or webhook secret blank to keep the saved value.
          </Text>

          <Button
            colorScheme="blue"
            onClick={handleSaveXpressbees}
            isLoading={updateXpressbees.isPending}
            alignSelf="flex-start"
          >
            Save Xpressbees Credentials
          </Button>
        </ProviderCard>

        <ProviderCard
          title="Shipmozo"
          badgeColorScheme={data?.shipmozo?.hasPrivateKey ? 'green' : 'orange'}
          badgeLabel={data?.shipmozo?.hasPrivateKey ? 'Live keys set' : 'Missing private key'}
        >
          <FormControl>
            <FormLabel>API Base URL</FormLabel>
            <Input
              value={shipmozoForm.apiBase}
              onChange={(e) => setShipmozoForm((prev) => ({ ...prev, apiBase: e.target.value }))}
              placeholder="https://shipping-api.com/app/api/v1"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Public Key</FormLabel>
            <Input
              value={shipmozoForm.publicKey}
              onChange={(e) => setShipmozoForm((prev) => ({ ...prev, publicKey: e.target.value }))}
              placeholder="Shipmozo public key"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Private Key</FormLabel>
            <Input
              type="password"
              value={shipmozoForm.privateKey}
              onChange={(e) =>
                setShipmozoForm((prev) => ({ ...prev, privateKey: e.target.value }))
              }
              placeholder={data?.shipmozo?.privateKeyMasked || 'Leave blank to keep existing private key'}
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
              onChange={(e) => setShipmozoForm((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="Shipmozo panel username"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Panel Password</FormLabel>
            <Input
              type="password"
              value={shipmozoForm.password}
              onChange={(e) => setShipmozoForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Leave blank to keep existing password"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Default Warehouse ID</FormLabel>
            <Input
              value={shipmozoForm.defaultWarehouseId}
              onChange={(e) =>
                setShipmozoForm((prev) => ({ ...prev, defaultWarehouseId: e.target.value }))
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
          badgeColorScheme={data?.shiprocket?.hasPassword ? 'green' : 'orange'}
          badgeLabel={data?.shiprocket?.hasPassword ? 'Credentials set' : 'Missing password'}
        >
          <FormControl>
            <FormLabel>API Base URL</FormLabel>
            <Input
              value={shiprocketForm.apiBase}
              onChange={(e) =>
                setShiprocketForm((prev) => ({ ...prev, apiBase: e.target.value }))
              }
              placeholder="https://apiv2.shiprocket.in/v1/external"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Email / Username</FormLabel>
            <Input
              value={shiprocketForm.username}
              onChange={(e) =>
                setShiprocketForm((prev) => ({ ...prev, username: e.target.value }))
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
                setShiprocketForm((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Leave blank to keep existing password"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Default Pickup Location</FormLabel>
            <Input
              value={shiprocketForm.defaultPickupLocation}
              onChange={(e) =>
                setShiprocketForm((prev) => ({ ...prev, defaultPickupLocation: e.target.value }))
              }
              placeholder="Primary warehouse name"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Default Channel ID</FormLabel>
            <Input
              value={shiprocketForm.defaultChannelId}
              onChange={(e) =>
                setShiprocketForm((prev) => ({ ...prev, defaultChannelId: e.target.value }))
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
          title="iCarry"
          badgeColorScheme={data?.icarry?.hasApiKey ? 'green' : 'orange'}
          badgeLabel={data?.icarry?.hasApiKey ? 'API key set' : 'Missing API key'}
        >
          <FormControl>
            <FormLabel>API Base URL</FormLabel>
            <Input
              value={icarryForm.apiBase}
              onChange={(e) => setIcarryForm((prev) => ({ ...prev, apiBase: e.target.value }))}
              placeholder="https://www.icarry.in"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Username</FormLabel>
            <Input
              value={icarryForm.username}
              onChange={(e) => setIcarryForm((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="iCarry username"
            />
          </FormControl>

          <FormControl>
            <FormLabel>API Key</FormLabel>
            <Input
              type="password"
              value={icarryForm.apiKey}
              onChange={(e) => setIcarryForm((prev) => ({ ...prev, apiKey: e.target.value }))}
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
              onChange={(e) => setIcarryForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Leave blank to keep existing password"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Client ID (Optional)</FormLabel>
            <Input
              value={icarryForm.clientId}
              onChange={(e) => setIcarryForm((prev) => ({ ...prev, clientId: e.target.value }))}
              placeholder="iCarry client ID"
            />
          </FormControl>

          <Text fontSize="xs" color="gray.500">
            iCarry requires username + API key. Leave secret fields blank to retain saved values.
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
              This provider is available in service providers, but a dedicated credentials form is
              not added yet.
            </Text>
          </ProviderCard>
        ))}
      </SimpleGrid>
    </Flex>
  )
}

export default CourierCredentials
