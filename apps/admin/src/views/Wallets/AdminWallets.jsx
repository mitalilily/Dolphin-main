import {
  Avatar,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  Skeleton,
  SkeletonText,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { IconAdjustments, IconEye, IconMinus, IconPlus, IconWallet } from '@tabler/icons-react'
import StatusBadge from 'components/Badge/StatusBadge'
import CustomDatePicker from 'components/Input/CustomDatePicker'
import CustomModal from 'components/Modal/CustomModal'
import SortControls from 'components/SortControls'
import TableFilters from 'components/Tables/TableFilters'
import {
  useAdjustWalletBalance,
  useAdminWallets,
  useAdminWalletTransactions,
} from 'hooks/useWallet'
import { useState } from 'react'
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

const walletFilterOptions = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Email, Company Name, Brand, or Contact Person',
  },
]

export default function AdminWallets() {
  const history = useHistory()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [selectedWallet, setSelectedWallet] = useState(null)

  // Modals
  const {
    isOpen: isTransactionsOpen,
    onOpen: onTransactionsOpen,
    onClose: onTransactionsClose,
  } = useDisclosure()
  const { isOpen: isAdjustOpen, onOpen: onAdjustOpen, onClose: onAdjustClose } = useDisclosure()

  // Transactions modal state
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [transactionsLimit] = useState(50)
  const [transactionType, setTransactionType] = useState('')
  const [transactionDateFrom, setTransactionDateFrom] = useState(null)
  const [transactionDateTo, setTransactionDateTo] = useState(null)

  // Adjust wallet form
  const [adjustForm, setAdjustForm] = useState({
    type: 'credit',
    amount: '',
    reason: '',
    notes: '',
  })

  const { data: walletsData, isLoading } = useAdminWallets({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
  })

  const { data: transactionsData, isLoading: transactionsLoading } = useAdminWalletTransactions(
    selectedUserId,
    {
      page: transactionsPage,
      limit: transactionsLimit,
      type: transactionType || undefined,
      dateFrom: transactionDateFrom,
      dateTo: transactionDateTo,
    },
    isTransactionsOpen && !!selectedUserId,
  )

  const adjustMutation = useAdjustWalletBalance()

  const wallets = walletsData?.data || []
  const totalCount = walletsData?.totalCount || 0

  const handleSortByChange = (e) => {
    setSortBy(e)
    setPage(1)
  }

  const handleSortOrderChange = (e) => {
    setSortOrder(e)
    setPage(1)
  }

  const handleViewTransactions = (wallet) => {
    setSelectedUserId(wallet.userId)
    setSelectedWallet(wallet)
    setTransactionsPage(1)
    setTransactionType('')
    setTransactionDateFrom(null)
    setTransactionDateTo(null)
    onTransactionsOpen()
  }

  const handleAdjustWallet = (wallet) => {
    setSelectedUserId(wallet.userId)
    setSelectedWallet(wallet)
    setAdjustForm({ type: 'credit', amount: '', reason: '', notes: '' })
    onAdjustOpen()
  }

  const handleAdjustSubmit = async () => {
    if (!adjustForm.amount || !adjustForm.reason) {
      toast({
        status: 'error',
        title: 'Validation Error',
        description: 'Amount and reason are required',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const amountNum = parseFloat(adjustForm.amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        status: 'error',
        title: 'Validation Error',
        description: 'Amount must be a positive number',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      await adjustMutation.mutateAsync({
        userId: selectedUserId,
        type: adjustForm.type,
        amount: amountNum,
        reason: adjustForm.reason,
        notes: adjustForm.notes,
      })
      toast({
        status: 'success',
        title: 'Wallet Adjusted',
        description: `Wallet ${adjustForm.type === 'credit' ? 'credited' : 'debited'} successfully`,
        duration: 3000,
        isClosable: true,
      })
      onAdjustClose()
      setAdjustForm({ type: 'credit', amount: '', reason: '', notes: '' })
    } catch (error) {
      toast({
        status: 'error',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to adjust wallet balance',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleViewUser = (userId) => {
    history.push(`/admin/users-management/${userId}/overview`)
  }

  const captions = ['User', 'Email', 'Balance', 'Currency', 'Last Updated', 'Actions']
  const columnKeys = ['user', 'userEmail', 'balance', 'currency', 'updatedAt', 'actions']

  const formatBalance = (balance) => {
    const num = parseFloat(balance || 0)
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num)
  }

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCompanyName = (companyInfo) => {
    if (!companyInfo) return '—'
    return companyInfo.brandName || companyInfo.businessName || companyInfo.name || '—'
  }

  const getContactPerson = (companyInfo) => {
    if (!companyInfo) return '—'
    return companyInfo.contactPerson || '—'
  }

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }}>
      <TableFilters
        filters={walletFilterOptions}
        values={{ search }}
        onApply={(finalFilters) => {
          setSearch(finalFilters.search || '')
          setPage(1)
        }}
      />

      <GenericTable
        paginated
        loading={isLoading}
        page={page}
        setPage={setPage}
        sortByComponent={
          <SortControls
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={handleSortByChange}
            onSortOrderChange={handleSortOrderChange}
            sortOptions={[
              { value: 'balance', label: 'Balance' },
              { value: 'updatedAt', label: 'Last Updated' },
              { value: 'createdAt', label: 'Created At' },
              { value: 'email', label: 'Email' },
              { value: 'companyName', label: 'Company Name' },
            ]}
          />
        }
        totalCount={totalCount}
        perPage={limit}
        setPerPage={setLimit}
        title="Wallets Management"
        data={wallets}
        captions={captions}
        columnKeys={columnKeys}
        renderActions={(row) => (
          <HStack spacing={2}>
            <Tooltip label="View Transactions">
              <Button
                size="sm"
                colorScheme="blue"
                leftIcon={<IconEye size={16} />}
                onClick={() => handleViewTransactions(row)}
              >
                Transactions
              </Button>
            </Tooltip>
            <Tooltip label="Adjust Balance">
              <Button
                size="sm"
                colorScheme="purple"
                leftIcon={<IconAdjustments size={16} />}
                onClick={() => handleAdjustWallet(row)}
              >
                Adjust
              </Button>
            </Tooltip>
            <Button size="sm" colorScheme="teal" onClick={() => handleViewUser(row.userId)}>
              View User
            </Button>
          </HStack>
        )}
        renderers={{
          user: (value, row) => {
            const companyName = getCompanyName(row?.companyInfo)
            const contactPerson = getContactPerson(row?.companyInfo)
            return (
              <Stack direction="row" alignItems="center" gap={2}>
                <Avatar
                  name={contactPerson !== '—' ? contactPerson : companyName}
                  size="sm"
                  _hover={{ zIndex: '3', cursor: 'pointer' }}
                />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="500" fontSize="sm">
                    {companyName}
                  </Text>
                  {contactPerson !== '—' && (
                    <Text fontSize="xs" color="gray.500">
                      {contactPerson}
                    </Text>
                  )}
                </VStack>
              </Stack>
            )
          },
          userEmail: (value) => <Text>{value || '—'}</Text>,
          balance: (value) => {
            const num = parseFloat(value || 0)
            return (
              <Text fontWeight="bold" color={num >= 0 ? 'green.500' : 'red.500'}>
                {formatBalance(value)}
              </Text>
            )
          },
          currency: (value) => <Text>{value || 'INR'}</Text>,
          updatedAt: (value) => <Text fontSize="sm">{formatDate(value)}</Text>,
        }}
      />

      {/* Transactions Modal */}
      <CustomModal
        isOpen={isTransactionsOpen}
        onClose={onTransactionsClose}
        size="6xl"
        title={
          <VStack align="start" spacing={1}>
            <HStack>
              <IconWallet size={24} />
              <Text>Wallet Transactions</Text>
            </HStack>
            {selectedWallet && (
              <Text fontSize="sm" color="gray.500" fontWeight="normal">
                {getCompanyName(selectedWallet.companyInfo)} - Balance:{' '}
                {formatBalance(selectedWallet.balance)}
              </Text>
            )}
          </VStack>
        }
        footer={<Button onClick={onTransactionsClose}>Close</Button>}
      >
        <VStack spacing={4} align="stretch">
          {/* Filters */}
          <Flex gap={4} flexWrap="wrap">
            <FormControl flex="1" minW="200px">
              <FormLabel fontSize="sm">Transaction Type</FormLabel>
              <Select
                value={transactionType}
                onChange={(e) => {
                  setTransactionType(e.target.value)
                  setTransactionsPage(1)
                }}
                placeholder="All Types"
              >
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </Select>
            </FormControl>
            <FormControl flex="1" minW="200px">
              <FormLabel fontSize="sm">Date From</FormLabel>
              <CustomDatePicker
                selected={transactionDateFrom}
                onChange={(date) => {
                  setTransactionDateFrom(date)
                  setTransactionsPage(1)
                }}
                placeholderText="Select start date"
              />
            </FormControl>
            <FormControl flex="1" minW="200px">
              <FormLabel fontSize="sm">Date To</FormLabel>
              <CustomDatePicker
                selected={transactionDateTo}
                onChange={(date) => {
                  setTransactionDateTo(date)
                  setTransactionsPage(1)
                }}
                placeholderText="Select end date"
              />
            </FormControl>
          </Flex>

          {/* Transactions Table */}
          {transactionsLoading ? (
            <VStack spacing={4} align="stretch">
              <Skeleton height="40px" />
              <SkeletonText mt="4" noOfLines={5} spacing="4" />
              <SkeletonText mt="4" noOfLines={5} spacing="4" />
              <SkeletonText mt="4" noOfLines={5} spacing="4" />
            </VStack>
          ) : (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Type</Th>
                    <Th>Amount</Th>
                    <Th>Reason</Th>
                    <Th>Reference</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {transactionsData?.transactions?.length > 0 ? (
                    transactionsData.transactions.map((txn) => (
                      <Tr key={txn.id}>
                        <Td>{formatDate(txn.created_at)}</Td>
                        <Td>
                          <StatusBadge
                            status={txn.type?.toUpperCase()}
                            type={txn.type === 'credit' ? 'success' : 'error'}
                          />
                        </Td>
                        <Td
                          fontWeight="bold"
                          color={txn.type === 'credit' ? 'green.500' : 'red.500'}
                        >
                          {txn.type === 'credit' ? '+' : '-'}
                          {formatBalance(txn.amount)}
                        </Td>
                        <Td>{txn.reason || '—'}</Td>
                        <Td>
                          <Text fontSize="xs" fontFamily="mono">
                            {txn.ref || '—'}
                          </Text>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={5} textAlign="center" py={8}>
                        <Text color="gray.500">No transactions found</Text>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {transactionsData?.totalCount > transactionsLimit && (
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color="gray.500">
                Showing {transactionsLimit * (transactionsPage - 1) + 1} to{' '}
                {Math.min(transactionsLimit * transactionsPage, transactionsData?.totalCount || 0)}{' '}
                of {transactionsData?.totalCount || 0} transactions
              </Text>
              <HStack>
                <Button
                  size="sm"
                  onClick={() => setTransactionsPage((p) => Math.max(1, p - 1))}
                  isDisabled={transactionsPage === 1}
                >
                  Previous
                </Button>
                <Text fontSize="sm">
                  Page {transactionsPage} of{' '}
                  {Math.ceil((transactionsData?.totalCount || 0) / transactionsLimit)}
                </Text>
                <Button
                  size="sm"
                  onClick={() => setTransactionsPage((p) => p + 1)}
                  isDisabled={
                    transactionsPage >=
                    Math.ceil((transactionsData?.totalCount || 0) / transactionsLimit)
                  }
                >
                  Next
                </Button>
              </HStack>
            </Flex>
          )}
        </VStack>
      </CustomModal>

      {/* Adjust Wallet Modal */}
      <CustomModal
        isOpen={isAdjustOpen}
        onClose={onAdjustClose}
        size="md"
        title={
          <VStack align="start" spacing={1}>
            <HStack>
              <IconAdjustments size={24} />
              <Text>Adjust Wallet Balance</Text>
            </HStack>
            {selectedWallet && (
              <Text fontSize="sm" color="gray.500" fontWeight="normal">
                {getCompanyName(selectedWallet.companyInfo)} - Current Balance:{' '}
                {formatBalance(selectedWallet.balance)}
              </Text>
            )}
          </VStack>
        }
        footer={
          <HStack>
            <Button variant="ghost" onClick={onAdjustClose} isDisabled={adjustMutation.isLoading}>
              Cancel
            </Button>
            <Button
              colorScheme={adjustForm.type === 'credit' ? 'green' : 'red'}
              onClick={handleAdjustSubmit}
              isLoading={adjustMutation.isLoading}
              loadingText={adjustForm.type === 'credit' ? 'Crediting...' : 'Debiting...'}
              leftIcon={
                adjustForm.type === 'credit' ? <IconPlus size={16} /> : <IconMinus size={16} />
              }
            >
              {adjustForm.type === 'credit' ? 'Credit' : 'Debit'} Wallet
            </Button>
          </HStack>
        }
      >
        {adjustMutation.isLoading ? (
          <VStack spacing={4} align="stretch" py={4}>
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="100px" />
          </VStack>
        ) : (
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Type</FormLabel>
              <Select
                value={adjustForm.type}
                onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                isDisabled={adjustMutation.isLoading}
              >
                <option value="credit">Credit (Add Money)</option>
                <option value="debit">Debit (Deduct Money)</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Amount (INR)</FormLabel>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={adjustForm.amount}
                onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                placeholder="Enter amount"
                isDisabled={adjustMutation.isLoading}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Reason</FormLabel>
              <Input
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                placeholder="e.g., Manual adjustment, Refund, etc."
                isDisabled={adjustMutation.isLoading}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Notes (Optional)</FormLabel>
              <Textarea
                value={adjustForm.notes}
                onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
                isDisabled={adjustMutation.isLoading}
              />
            </FormControl>

            {adjustForm.type === 'debit' &&
              parseFloat(selectedWallet?.balance || 0) < parseFloat(adjustForm.amount || 0) && (
                <Box p={3} bg="orange.50" borderRadius="md" border="1px" borderColor="orange.200">
                  <Text fontSize="sm" color="orange.700" fontWeight="bold">
                    Warning: Wallet will go negative
                  </Text>
                  <Text fontSize="xs" color="orange.700" mt={1}>
                    Current balance ({formatBalance(selectedWallet?.balance)}) is less than the
                    debit amount ({formatBalance(adjustForm.amount)}). This admin debit will still
                    be processed and the wallet balance can go below zero.
                  </Text>
                </Box>
              )}
          </VStack>
        )}
      </CustomModal>
    </Flex>
  )
}
