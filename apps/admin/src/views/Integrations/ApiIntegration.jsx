import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
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
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { CopyIcon, DeleteIcon, EditIcon, AddIcon } from '@chakra-ui/icons'
import { useState } from 'react'
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
  useUpdateApiKey,
} from 'hooks/useApiIntegration'
import {
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
  useUpdateWebhook,
} from 'hooks/useApiIntegration'

const WEBHOOK_EVENTS = [
  'order.created',
  'order.updated',
  'order.shipped',
  'order.delivered',
  'order.failed',
  'order.rto',
  'order.cancelled',
  'order.return_created',
  'order.ndr',
  'shipment.label_generated',
  'shipment.manifest_generated',
  'tracking.updated',
]

const ApiIntegration = () => {
  const [activeTab, setActiveTab] = useState('apiKeys')
  const [copiedKey, setCopiedKey] = useState(null)
  const toast = useToast()

  // API Keys
  const { data: apiKeysData, isLoading: apiKeysLoading } = useApiKeys()
  const apiKeys = apiKeysData?.data || []
  const createApiKey = useCreateApiKey()
  const updateApiKey = useUpdateApiKey()
  const deleteApiKey = useDeleteApiKey()

  // Webhooks
  const { data: webhooksData, isLoading: webhooksLoading } = useWebhooks()
  const webhooks = webhooksData?.data || []
  const createWebhook = useCreateWebhook()
  const updateWebhook = useUpdateWebhook()
  const deleteWebhook = useDeleteWebhook()

  // Modals
  const {
    isOpen: isApiKeyModalOpen,
    onOpen: onApiKeyModalOpen,
    onClose: onApiKeyModalClose,
  } = useDisclosure()
  const {
    isOpen: isWebhookModalOpen,
    onOpen: onWebhookModalOpen,
    onClose: onWebhookModalClose,
  } = useDisclosure()
  const {
    isOpen: isApiKeyViewModalOpen,
    onOpen: onApiKeyViewModalOpen,
    onClose: onApiKeyViewModalClose,
  } = useDisclosure()

  // Form states
  const [apiKeyForm, setApiKeyForm] = useState({ key_name: '' })
  const [webhookForm, setWebhookForm] = useState({
    url: '',
    name: '',
    events: [],
    is_active: true,
  })
  const [newApiKey, setNewApiKey] = useState(null)
  const [editingItem, setEditingItem] = useState(null)

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(label)
    toast({
      title: 'Copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleCreateApiKey = () => {
    createApiKey.mutate(apiKeyForm, {
      onSuccess: (data) => {
        setNewApiKey(data.data)
        setApiKeyForm({ key_name: '' })
        onApiKeyModalClose()
        onApiKeyViewModalOpen()
      },
    })
  }

  const handleUpdateApiKey = (id, data) => {
    updateApiKey.mutate(
      { id, data },
      {
        onSuccess: () => {
          setEditingItem(null)
        },
      },
    )
  }

  const handleDeleteApiKey = (id) => {
    if (window.confirm('Are you sure you want to delete this API key?')) {
      deleteApiKey.mutate(id)
    }
  }

  const handleCreateWebhook = () => {
    if (!webhookForm.url || webhookForm.events.length === 0) {
      toast({
        title: 'Please fill all required fields',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    createWebhook.mutate(webhookForm, {
      onSuccess: () => {
        setWebhookForm({ url: '', name: '', events: [], is_active: true })
        onWebhookModalClose()
      },
    })
  }

  const handleUpdateWebhook = (id, data) => {
    updateWebhook.mutate(
      { id, data },
      {
        onSuccess: () => {
          setEditingItem(null)
        },
      },
    )
  }

  const handleDeleteWebhook = (id) => {
    if (window.confirm('Are you sure you want to delete this webhook subscription?')) {
      deleteWebhook.mutate(id)
    }
  }

  const toggleEvent = (event) => {
    setWebhookForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }))
  }

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }} gap={6} px={4}>
      <Text fontSize="2xl" fontWeight="bold">
        API Integration
      </Text>

      {/* Tabs */}
      <HStack spacing={4} borderBottom="1px" borderColor="gray.200">
        <Button
          variant={activeTab === 'apiKeys' ? 'solid' : 'ghost'}
          colorScheme={activeTab === 'apiKeys' ? 'blue' : 'gray'}
          onClick={() => setActiveTab('apiKeys')}
        >
          API Keys
        </Button>
        <Button
          variant={activeTab === 'webhooks' ? 'solid' : 'ghost'}
          colorScheme={activeTab === 'webhooks' ? 'blue' : 'gray'}
          onClick={() => setActiveTab('webhooks')}
        >
          Webhooks
        </Button>
      </HStack>

      {/* API Keys Tab */}
      {activeTab === 'apiKeys' && (
        <Box>
          <Flex justify="space-between" mb={4}>
            <Text fontSize="lg" fontWeight="semibold">
              API Keys
            </Text>
            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onApiKeyModalOpen}>
              Create API Key
            </Button>
          </Flex>

          {apiKeysLoading ? (
            <Spinner size="md" />
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Status</Th>
                    <Th>Last Used</Th>
                    <Th>Created</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {apiKeys.length === 0 ? (
                    <Tr>
                      <Td colSpan={5} textAlign="center">
                        <Text color="gray.500">No API keys found. Create one to get started.</Text>
                      </Td>
                    </Tr>
                  ) : (
                    apiKeys.map((key) => (
                      <Tr key={key.id}>
                        <Td>{key.key_name}</Td>
                        <Td>
                          <Badge colorScheme={key.is_active ? 'green' : 'red'}>
                            {key.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </Td>
                        <Td>
                          {key.last_used_at
                            ? new Date(key.last_used_at).toLocaleDateString()
                            : 'Never'}
                        </Td>
                        <Td>{new Date(key.created_at).toLocaleDateString()}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<EditIcon />}
                              size="sm"
                              onClick={() => {
                                setEditingItem(key)
                                handleUpdateApiKey(key.id, {
                                  is_active: !key.is_active,
                                })
                              }}
                            />
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              onClick={() => handleDeleteApiKey(key.id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <Box>
          <Flex justify="space-between" mb={4}>
            <Text fontSize="lg" fontWeight="semibold">
              Webhook Subscriptions
            </Text>
            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onWebhookModalOpen}>
              Create Webhook
            </Button>
          </Flex>

          {webhooksLoading ? (
            <Spinner size="md" />
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>URL</Th>
                    <Th>Events</Th>
                    <Th>Status</Th>
                    <Th>Stats</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {webhooks.length === 0 ? (
                    <Tr>
                      <Td colSpan={6} textAlign="center">
                        <Text color="gray.500">
                          No webhook subscriptions found. Create one to get started.
                        </Text>
                      </Td>
                    </Tr>
                  ) : (
                    webhooks.map((webhook) => (
                      <Tr key={webhook.id}>
                        <Td>{webhook.name || 'Unnamed'}</Td>
                        <Td>
                          <Text fontSize="sm" maxW="300px" isTruncated>
                            {webhook.url}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{webhook.events?.length || 0} events</Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={webhook.is_active ? 'green' : 'red'}>
                            {webhook.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="xs">
                            Success: {webhook.successful_deliveries || 0} | Failed:{' '}
                            {webhook.failed_deliveries || 0}
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<EditIcon />}
                              size="sm"
                              onClick={() => {
                                setEditingItem(webhook)
                                setWebhookForm({
                                  url: webhook.url,
                                  name: webhook.name || '',
                                  events: webhook.events || [],
                                  is_active: webhook.is_active,
                                })
                                onWebhookModalOpen()
                              }}
                            />
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              onClick={() => handleDeleteWebhook(webhook.id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Create API Key Modal */}
      <Modal isOpen={isApiKeyModalOpen} onClose={onApiKeyModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create API Key</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Key Name</FormLabel>
                <Input
                  value={apiKeyForm.key_name}
                  onChange={(e) => setApiKeyForm({ key_name: e.target.value })}
                  placeholder="e.g., Production API Key"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onApiKeyModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateApiKey}
              isLoading={createApiKey.isLoading}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View New API Key Modal */}
      <Modal isOpen={isApiKeyViewModalOpen} onClose={onApiKeyViewModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>API Key Created</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {newApiKey && (
              <VStack spacing={4} align="stretch">
                <Box p={4} bg="yellow.50" borderRadius="md" border="1px" borderColor="yellow.200">
                  <Text fontSize="sm" fontWeight="bold" color="yellow.800" mb={2}>
                    ⚠️ Important: Save these credentials securely
                  </Text>
                  <Text fontSize="xs" color="yellow.700">
                    You will not be able to view the API key and secret again after closing this
                    dialog.
                  </Text>
                </Box>
                <FormControl>
                  <FormLabel>API Key</FormLabel>
                  <HStack>
                    <Input value={newApiKey.api_key} readOnly />
                    <IconButton
                      icon={<CopyIcon />}
                      onClick={() => handleCopy(newApiKey.api_key, 'key')}
                      colorScheme={copiedKey === 'key' ? 'green' : 'gray'}
                    />
                  </HStack>
                </FormControl>
                <FormControl>
                  <FormLabel>API Secret</FormLabel>
                  <HStack>
                    <Input value={newApiKey.api_secret} readOnly />
                    <IconButton
                      icon={<CopyIcon />}
                      onClick={() => handleCopy(newApiKey.api_secret, 'secret')}
                      colorScheme={copiedKey === 'secret' ? 'green' : 'gray'}
                    />
                  </HStack>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onApiKeyViewModalClose}>
              I've saved the credentials
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create/Edit Webhook Modal */}
      <Modal isOpen={isWebhookModalOpen} onClose={onWebhookModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingItem ? 'Edit Webhook Subscription' : 'Create Webhook Subscription'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Name (optional)</FormLabel>
                <Input
                  value={webhookForm.name}
                  onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                  placeholder="e.g., Production Webhooks"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Webhook URL</FormLabel>
                <Input
                  value={webhookForm.url}
                  onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                  placeholder="https://your-app.com/webhooks"
                  type="url"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Events to Subscribe</FormLabel>
                <Box
                  border="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  p={3}
                  maxH="200px"
                  overflowY="auto"
                >
                  <VStack align="stretch" spacing={2}>
                    {WEBHOOK_EVENTS.map((event) => (
                      <Flex key={event} align="center">
                        <input
                          type="checkbox"
                          checked={webhookForm.events.includes(event)}
                          onChange={() => toggleEvent(event)}
                          style={{ marginRight: '8px' }}
                        />
                        <Text fontSize="sm">{event}</Text>
                      </Flex>
                    ))}
                  </VStack>
                </Box>
              </FormControl>
              <FormControl>
                <Flex align="center" justify="space-between">
                  <FormLabel mb={0}>Active</FormLabel>
                  <Switch
                    isChecked={webhookForm.is_active}
                    onChange={(e) =>
                      setWebhookForm({ ...webhookForm, is_active: e.target.checked })
                    }
                  />
                </Flex>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onWebhookModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => {
                if (editingItem) {
                  handleUpdateWebhook(editingItem.id, webhookForm)
                  setEditingItem(null)
                } else {
                  handleCreateWebhook()
                }
              }}
              isLoading={createWebhook.isLoading || updateWebhook.isLoading}
            >
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}

export default ApiIntegration

