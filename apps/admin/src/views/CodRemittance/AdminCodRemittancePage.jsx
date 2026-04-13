import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Tab,
  Table,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
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
import StatusBadge from 'components/Badge/StatusBadge'
import Card from 'components/Card/Card'
import TableFilters from 'components/Tables/TableFilters'
import {
  useAllCodRemittances,
  useCodPlatformStats,
  useConfirmCourierSettlement,
  useManualCreditWallet,
  usePreviewCourierSettlement,
  useUpdateRemittanceNotes,
} from 'hooks/useCodRemittance'
import { useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import {
  downloadSettlementCsvTemplate,
  exportAllCodRemittances,
} from 'services/codRemittance.service'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

// Filter options for COD remittances
const remittanceFilterOptions = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Order Number, AWB, Email',
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Pending', value: 'pending' },
      { label: 'Settled', value: 'credited' },
    ],
  },
  {
    key: 'fromDate',
    label: 'From Date',
    type: 'date',
  },
  {
    key: 'toDate',
    label: 'To Date',
    type: 'date',
  },
]

export default function AdminCodRemittancePage() {
  const history = useHistory()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [filters, setFilters] = useState({})
  const [selectedRemittance, setSelectedRemittance] = useState(null)
  const [notes, setNotes] = useState('')

  // CSV Upload States
  const [csvFile, setCsvFile] = useState(null)
  const [courierPartner, setCourierPartner] = useState('delhivery')
  const [csvPreviewData, setCsvPreviewData] = useState(null)
  const [selectedForCredit, setSelectedForCredit] = useState([])
  const [utrNumber, setUtrNumber] = useState('')
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0])
  const [reviewTabIndex, setReviewTabIndex] = useState(0)

  const { isOpen: isNotesOpen, onOpen: onNotesOpen, onClose: onNotesClose } = useDisclosure()
  const { isOpen: isCreditOpen, onOpen: onCreditOpen, onClose: onCreditClose } = useDisclosure()
  const {
    isOpen: isCsvUploadOpen,
    onOpen: onCsvUploadOpen,
    onClose: onCsvUploadClose,
  } = useDisclosure()
  const {
    isOpen: isCsvReviewOpen,
    onOpen: onCsvReviewOpen,
    onClose: onCsvReviewClose,
  } = useDisclosure()

  // Hooks
  const { data: stats, isLoading: statsLoading } = useCodPlatformStats()
  const { data: remittanceData, isLoading: remittancesLoading } = useAllCodRemittances({
    page,
    limit: perPage,
    ...filters,
  })
  const manualCreditMutation = useManualCreditWallet()
  const updateNotesMutation = useUpdateRemittanceNotes()
  const previewCsvMutation = usePreviewCourierSettlement()
  const confirmSettlementMutation = useConfirmCourierSettlement()

  const remittances = remittanceData?.data?.remittances || []
  const totalCount = remittanceData?.data?.totalCount || 0

  // Handlers
  const handleExport = async () => {
    try {
      await exportAllCodRemittances(filters)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      await downloadSettlementCsvTemplate()
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Unable to download template CSV right now.',
        status: 'error',
        duration: 4000,
      })
    }
  }

  const handleOpenNotes = (remittance) => {
    setSelectedRemittance(remittance)
    setNotes(remittance.notes || '')
    onNotesOpen()
  }

  const handleSaveNotes = async () => {
    if (selectedRemittance) {
      await updateNotesMutation.mutateAsync({
        remittanceId: selectedRemittance.id,
        notes,
      })
      onNotesClose()
    }
  }

  const handleOpenCredit = (remittance) => {
    setSelectedRemittance(remittance)
    onCreditOpen()
  }

  const handleManualCredit = async () => {
    if (selectedRemittance) {
      await manualCreditMutation.mutateAsync(selectedRemittance.id)
      onCreditClose()
    }
  }

  const handleViewUser = (userId) => {
    history.push(`/admin/users-management/${userId}/overview`)
  }

  // CSV Upload Handlers
  const handleCsvFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv'
    if (!isCsv) {
      toast({
        title: 'Invalid file',
        description: 'Please upload a valid .csv file.',
        status: 'warning',
        duration: 3500,
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'CSV file size must be under 10MB.',
        status: 'warning',
        duration: 3500,
      })
      return
    }

    setCsvFile(file)
  }

  const handleUploadCsv = async () => {
    if (!csvFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to upload',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const csvContent = e.target.result
      try {
        const result = await previewCsvMutation.mutateAsync({
          courierPartner,
          csvData: csvContent,
        })

        setCsvPreviewData(result.data)
        const summary = result.data?.summary || {}
        const nextTabIndex =
          summary.matched > 0
            ? 0
            : summary.discrepancies > 0
            ? 1
            : summary.notFound > 0
            ? 2
            : summary.alreadyCredited > 0
            ? 3
            : summary.errors > 0
            ? 4
            : 0
        setReviewTabIndex(nextTabIndex)

        // Auto-select all matched orders
        const matchedIds = result.data.results.matched.map((m) => m.remittanceId)
        setSelectedForCredit(matchedIds)

        onCsvUploadClose()
        onCsvReviewOpen()
      } catch (error) {
        toast({
          title: 'CSV Upload Failed',
          description: error.response?.data?.message || 'Failed to parse CSV',
          status: 'error',
          duration: 5000,
        })
      }
    }
    reader.readAsText(csvFile)
  }

  const handleToggleSelect = (remittanceId) => {
    setSelectedForCredit((prev) =>
      prev.includes(remittanceId)
        ? prev.filter((id) => id !== remittanceId)
        : [...prev, remittanceId],
    )
  }

  const handleSelectAll = (items) => {
    const ids = items.map((item) => item.remittanceId)
    setSelectedForCredit((prev) => {
      const allSelected = ids.every((id) => prev.includes(id))
      if (allSelected) {
        return prev.filter((id) => !ids.includes(id))
      } else {
        return [...new Set([...prev, ...ids])]
      }
    })
  }

  const handleConfirmCredit = async () => {
    if (selectedForCredit.length === 0) {
      toast({
        title: 'No orders selected',
        description: 'Please select at least one order to mark as settled',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    if (!utrNumber.trim()) {
      toast({
        title: 'UTR Required',
        description: 'Please enter the UTR/Transaction number',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    try {
      // Get selected remittances data
      const remittancesToCredit = [
        ...csvPreviewData.results.matched,
        ...csvPreviewData.results.discrepancies,
      ].filter((item) => selectedForCredit.includes(item.remittanceId))

      const apiResult = await confirmSettlementMutation.mutateAsync({
        remittances: remittancesToCredit,
        utrNumber,
        settlementDate,
        courierPartner,
      })

      const settled = apiResult?.data?.results?.credited || []
      const failed = apiResult?.data?.results?.failed || []
      const settledIds = new Set(settled.map((item) => item.remittanceId))

      if (failed.length > 0) {
        setSelectedForCredit((prev) => prev.filter((id) => !settledIds.has(id)))
        toast({
          title: 'Settlement partially processed',
          description: `Settled ${settled.length}, failed ${failed.length}. Review and retry failed rows.`,
          status: 'warning',
          duration: 6000,
        })
        return
      }

      toast({
        title: 'Settlement Confirmed',
        description: `Successfully marked ${settled.length} orders as settled`,
        status: 'success',
        duration: 5000,
      })

      // Reset and close
      onCsvReviewClose()
      setCsvPreviewData(null)
      setSelectedForCredit([])
      setUtrNumber('')
      setCsvFile(null)
    } catch (error) {
      toast({
        title: 'Settlement Failed',
        description: error.response?.data?.message || 'Failed to confirm settlement',
        status: 'error',
        duration: 5000,
      })
    }
  }

  // Table columns
  const captions = [
    'Order',
    'User',
    'Courier',
    'COD Amount',
    'Deductions',
    'Remittable',
    'Status',
    'Collected',
    'Settled',
    'Actions',
  ]

  const columnKeys = [
    'orderNumber',
    'userEmail',
    'courierPartner',
    'codAmount',
    'deductions',
    'remittableAmount',
    'status',
    'collectedAt',
    'creditedAt',
  ]

  const hasCreditableRows = useMemo(() => {
    if (!csvPreviewData) return false
    return (
      (csvPreviewData.results?.matched?.length || 0) +
        (csvPreviewData.results?.discrepancies?.length || 0) >
      0
    )
  }, [csvPreviewData])

  const toAmount = (value) => {
    const n = Number(value ?? 0)
    return Number.isFinite(n) ? n : 0
  }

  const formatInr = (value) => `₹${toAmount(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const creditPreview = useMemo(() => {
    const codAmount = toAmount(selectedRemittance?.codAmount)
    const freightCharges = toAmount(selectedRemittance?.shippingCharges)
    const codCharges = toAmount(selectedRemittance?.codCharges)
    const deductions =
      selectedRemittance?.deductions !== undefined && selectedRemittance?.deductions !== null
        ? toAmount(selectedRemittance?.deductions)
        : freightCharges + codCharges
    const remittableAmount =
      selectedRemittance?.remittableAmount !== undefined &&
      selectedRemittance?.remittableAmount !== null
        ? toAmount(selectedRemittance?.remittableAmount)
        : codAmount - deductions

    return {
      codAmount,
      freightCharges,
      codCharges,
      deductions,
      remittableAmount,
    }
  }, [selectedRemittance])

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }}>
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="24px" mb="20px">
        <Card>
          <Stat>
            <StatLabel fontSize="sm" color="gray.500" fontWeight="bold" mb="4px">
              Total Pending
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color="orange.500">
              ₹{stats?.data?.totalPending?.amount?.toLocaleString('en-IN') || 0}
            </StatNumber>
            <StatHelpText fontSize="xs" color="gray.400">
              {stats?.data?.totalPending?.count || 0} orders
            </StatHelpText>
          </Stat>
        </Card>

        <Card>
          <Stat>
            <StatLabel fontSize="sm" color="gray.500" fontWeight="bold" mb="4px">
              Today's Settled
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color="green.500">
              ₹{stats?.data?.todayCredited?.amount?.toLocaleString('en-IN') || 0}
            </StatNumber>
            <StatHelpText fontSize="xs" color="gray.400">
              {stats?.data?.todayCredited?.count || 0} orders
            </StatHelpText>
          </Stat>
        </Card>

        <Card>
          <Stat>
            <StatLabel fontSize="sm" color="gray.500" fontWeight="bold" mb="4px">
              Total Settled
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color="blue.500">
              ₹{stats?.data?.totalCredited?.amount?.toLocaleString('en-IN') || 0}
            </StatNumber>
            <StatHelpText fontSize="xs" color="gray.400">
              {stats?.data?.totalCredited?.count || 0} orders
            </StatHelpText>
          </Stat>
        </Card>

        <Card>
          <Stat>
            <StatLabel fontSize="sm" color="gray.500" fontWeight="bold" mb="4px">
              Users with Pending
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color="purple.500">
              {stats?.data?.usersWithPending || 0}
            </StatNumber>
            <StatHelpText fontSize="xs" color="gray.400">
              Sellers
            </StatHelpText>
          </Stat>
        </Card>
      </SimpleGrid>

      {/* Filters */}
      <TableFilters
        filters={remittanceFilterOptions}
        values={filters}
        onApply={(finalFilters) => {
          setFilters(finalFilters)
          setPage(1)
        }}
      />

      {/* Actions */}
      <Flex mb="20px" gap={3}>
        <Button colorScheme="purple" size="sm" onClick={onCsvUploadOpen}>
          Upload Settlement CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
          Download Template
        </Button>
        <Button colorScheme="teal" size="sm" onClick={handleExport}>
          Export CSV
        </Button>
      </Flex>

      {/* Table */}
      <GenericTable
        paginated
        loading={remittancesLoading || statsLoading}
        page={page}
        setPage={setPage}
        totalCount={totalCount}
        perPage={perPage}
        setPerPage={setPerPage}
        title="COD Remittances (All Users)"
        data={remittances}
        captions={captions}
        columnKeys={columnKeys}
        renderActions={(row) => (
          <HStack spacing={2}>
            {row.status === 'pending' && (
              <Tooltip label="Mark settled offline">
                <Button size="xs" colorScheme="green" onClick={() => handleOpenCredit(row)}>
                  Settle
                </Button>
              </Tooltip>
            )}
            <Tooltip label="Add/Edit Notes">
              <Button size="xs" colorScheme="blue" onClick={() => handleOpenNotes(row)}>
                Notes
              </Button>
            </Tooltip>
            <Tooltip label="View User">
              <Button size="xs" variant="outline" onClick={() => handleViewUser(row.userId)}>
                User
              </Button>
            </Tooltip>
          </HStack>
        )}
        renderers={{
          orderNumber: (value, row) => (
            <Tooltip label={`AWB: ${row.awbNumber || 'N/A'}`}>
              <Box>
                <Text fontWeight="600" fontSize="sm">
                  {value}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  AWB: {row.awbNumber || 'N/A'}
                </Text>
              </Box>
            </Tooltip>
          ),
          userEmail: (value, row) => (
            <Box>
              <Text fontSize="sm" fontWeight="500">
                {value}
              </Text>
              {row.userName && (
                <Text fontSize="xs" color="gray.500">
                  {row.userName}
                </Text>
              )}
            </Box>
          ),
          codAmount: (value) => <Text fontWeight="600">₹{value?.toLocaleString('en-IN')}</Text>,
          deductions: (value) => <Text color="red.500">₹{value?.toLocaleString('en-IN')}</Text>,
          remittableAmount: (value) => (
            <Text fontWeight="700" color="green.600">
              ₹{value?.toLocaleString('en-IN')}
            </Text>
          ),
          status: (value) => (
            <StatusBadge
              status={value === 'pending' ? 'PENDING' : 'SETTLED'}
              type={value === 'pending' ? 'warning' : 'success'}
            />
          ),
          collectedAt: (value) => (
            <Text fontSize="xs">{value ? new Date(value).toLocaleDateString() : 'N/A'}</Text>
          ),
          creditedAt: (value) => (
            <Text fontSize="xs" color="green.600">
              {value ? new Date(value).toLocaleDateString() : '—'}
            </Text>
          ),
        }}
      />

      {/* Notes Modal */}
      <Modal isOpen={isNotesOpen} onClose={onNotesClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Notes</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" mb="8px" fontWeight="500">
              Order: {selectedRemittance?.orderNumber}
            </Text>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this remittance..."
              rows={6}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onNotesClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSaveNotes}
              isLoading={updateNotesMutation.isPending}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Manual Settlement Confirmation Modal */}
      <Modal isOpen={isCreditOpen} onClose={onCreditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Mark COD Settlement Offline</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb="12px">Please review the COD settlement breakup before marking it settled:</Text>
            <Box p="12px" bg="gray.50" borderRadius="md" mb="12px">
              <Text fontSize="sm" fontWeight="600">
                Order: {selectedRemittance?.orderNumber}
              </Text>
              <Text fontSize="sm">User: {selectedRemittance?.userEmail}</Text>
              <Text fontSize="xs" color="gray.600">
                AWB: {selectedRemittance?.awbNumber || 'N/A'} | Courier:{' '}
                {selectedRemittance?.courierPartner || 'N/A'}
              </Text>
            </Box>

            <Box p="12px" border="1px solid" borderColor="gray.200" borderRadius="md" mb="12px">
              <Flex justify="space-between" mb="6px">
                <Text fontSize="sm" color="gray.700">
                  COD Collected
                </Text>
                <Text fontSize="sm" fontWeight="600">
                  {formatInr(creditPreview.codAmount)}
                </Text>
              </Flex>
              <Flex justify="space-between" mb="6px">
                <Text fontSize="sm" color="gray.700">
                  Less: Freight Charges
                </Text>
                <Text fontSize="sm" fontWeight="600" color="red.500">
                  - {formatInr(creditPreview.freightCharges)}
                </Text>
              </Flex>
              <Flex justify="space-between" mb="6px">
                <Text fontSize="sm" color="gray.700">
                  Less: COD Charges
                </Text>
                <Text fontSize="sm" fontWeight="600" color="red.500">
                  - {formatInr(creditPreview.codCharges)}
                </Text>
              </Flex>
              <Flex justify="space-between" mb="6px">
                <Text fontSize="sm" color="gray.700">
                  Total Deductions
                </Text>
                <Text fontSize="sm" fontWeight="700" color="red.600">
                  - {formatInr(creditPreview.deductions)}
                </Text>
              </Flex>
              <Flex justify="space-between" pt="8px" borderTop="1px solid" borderColor="gray.200">
                <Text fontSize="sm" fontWeight="700">
                  Net Seller Settlement
                </Text>
                <Text fontSize="lg" fontWeight="bold" color="green.600">
                  {formatInr(creditPreview.remittableAmount)}
                </Text>
              </Flex>
            </Box>

            <Box p="10px" bg="orange.50" borderRadius="md" mb="12px">
              <Text fontSize="xs" color="orange.800">
                By default, COD remittance keeps deductions at zero because sellers recharge wallet
                separately. Edit these fields only when you intentionally want a manual deduction
                before marking the net seller settlement in panel.
              </Text>
            </Box>
            <Text fontSize="xs" color="red.500">
              ⚠️ This action only marks the remittance as settled in panel. It does not credit the wallet.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreditClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleManualCredit}
              isLoading={manualCreditMutation.isPending}
            >
              Confirm Settlement
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* CSV Upload Modal */}
      <Modal isOpen={isCsvUploadOpen} onClose={onCsvUploadClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload Courier Settlement CSV</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="sm">2-step settlement flow</AlertTitle>
                  <AlertDescription fontSize="xs">
                    Step 1: Upload and review. Step 2: Confirm selected rows with UTR.
                  </AlertDescription>
                </Box>
              </Alert>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600">
                  Courier Partner
                </FormLabel>
                <Select value={courierPartner} onChange={(e) => setCourierPartner(e.target.value)}>
                  <option value="delhivery">Delhivery</option>
                  <option value="ekart">Ekart</option>
                  <option value="xpressbees">Xpressbees</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600">
                  Select CSV File
                </FormLabel>
                <Input type="file" accept=".csv" onChange={handleCsvFileChange} p={1} />
                {csvFile && (
                  <Text fontSize="xs" color="green.500" mt={2}>
                    ✓ {csvFile.name}
                  </Text>
                )}
              </FormControl>

              <Box bg="blue.50" p={3} borderRadius="md" fontSize="xs">
                <Text fontWeight="600" mb={1}>
                  📝 Instructions:
                </Text>
                <Text>1. Login to your courier dashboard</Text>
                <Text>2. Navigate to Reports → COD Settlement</Text>
                <Text>3. Select date range and download CSV</Text>
                <Text>4. Upload the CSV file here</Text>
                <Text mt={1} color="gray.600">
                  Tip: Use the template if your courier export format varies.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCsvUploadClose}>
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleUploadCsv}
              isLoading={previewCsvMutation.isPending}
            >
              Upload & Preview
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* CSV Review Modal */}
      <Modal isOpen={isCsvReviewOpen} onClose={onCsvReviewClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxW="90vw">
          <ModalHeader>Review Settlement Data</ModalHeader>
          <ModalCloseButton />
          <ModalBody maxH="70vh" overflowY="auto">
            {csvPreviewData && (
              <VStack spacing={4} align="stretch">
                {/* Summary Cards */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                  <Box
                    bg="green.50"
                    p={3}
                    borderRadius="md"
                    borderWidth={1}
                    borderColor="green.200"
                  >
                    <Text fontSize="xs" color="gray.600" fontWeight="600">
                      Matched Orders
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                      {csvPreviewData.summary.matched}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      ₹{csvPreviewData.summary.totalMatchedAmount?.toLocaleString('en-IN')}
                    </Text>
                  </Box>

                  <Box
                    bg="orange.50"
                    p={3}
                    borderRadius="md"
                    borderWidth={1}
                    borderColor="orange.200"
                  >
                    <Text fontSize="xs" color="gray.600" fontWeight="600">
                      Discrepancies
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                      {csvPreviewData.summary.discrepancies}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Amount mismatches
                    </Text>
                  </Box>

                  <Box bg="red.50" p={3} borderRadius="md" borderWidth={1} borderColor="red.200">
                    <Text fontSize="xs" color="gray.600" fontWeight="600">
                      Not Found
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="red.600">
                      {csvPreviewData.summary.notFound}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Not in system
                    </Text>
                  </Box>

                  <Box bg="gray.50" p={3} borderRadius="md" borderWidth={1} borderColor="gray.200">
                    <Text fontSize="xs" color="gray.600" fontWeight="600">
                      Already Settled
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="gray.600">
                      {csvPreviewData.summary.alreadyCredited}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Previously settled offline
                    </Text>
                  </Box>
                </SimpleGrid>

                {/* UTR and Date Inputs */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="600">
                      UTR / Transaction Number
                    </FormLabel>
                    <Input
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="Enter UTR/Reference number"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="600">
                      Settlement Date
                    </FormLabel>
                    <Input
                      type="date"
                      value={settlementDate}
                      onChange={(e) => setSettlementDate(e.target.value)}
                    />
                  </FormControl>
                </SimpleGrid>

                {csvPreviewData.summary.errors > 0 && (
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">Rows with parsing issues detected</AlertTitle>
                      <AlertDescription fontSize="xs">
                        {csvPreviewData.summary.errors} row(s) have missing/invalid data. Review the
                        "Errors" tab before final confirmation.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {!hasCreditableRows && (csvPreviewData.summary.notFound > 0 || csvPreviewData.summary.alreadyCredited > 0) && (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">No settle-able rows found</AlertTitle>
                      <AlertDescription fontSize="xs">
                        All rows are currently either not found in your remittance records or already settled.
                        Check AWB/order mapping in the "Not Found" tab, then retry.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {/* Tabs for different categories */}
                <Tabs index={reviewTabIndex} onChange={setReviewTabIndex}>
                  <TabList>
                    <Tab>Matched ({csvPreviewData.results.matched.length}) ✅</Tab>
                    <Tab>Discrepancies ({csvPreviewData.results.discrepancies.length}) ⚠️</Tab>
                    <Tab>Not Found ({csvPreviewData.results.notFound.length}) ❌</Tab>
                    <Tab>Already Settled ({csvPreviewData.results.alreadyCredited.length})</Tab>
                    <Tab>Errors ({csvPreviewData.results.errors.length})</Tab>
                  </TabList>

                  <TabPanels>
                    {/* Matched Tab */}
                    <TabPanel p={0} pt={4}>
                      {csvPreviewData.results.matched.length > 0 ? (
                        <>
                          <Flex mb={2} align="center" gap={2}>
                            <Checkbox
                              isChecked={
                                csvPreviewData.results.matched.length > 0 &&
                                csvPreviewData.results.matched.every((item) =>
                                  selectedForCredit.includes(item.remittanceId),
                                )
                              }
                              onChange={() => handleSelectAll(csvPreviewData.results.matched)}
                            >
                              <Text fontSize="sm" fontWeight="600">
                                Select All Matched
                              </Text>
                            </Checkbox>
                            <Text fontSize="xs" color="gray.500">
                              ({selectedForCredit.length} selected)
                            </Text>
                          </Flex>
                          <Box overflowX="auto">
                            <Table size="sm" variant="simple">
                              <Thead>
                                <Tr>
                                  <Th>Select</Th>
                                  <Th>Order #</Th>
                                  <Th>AWB</Th>
                                  <Th>Courier Amount</Th>
                                  <Th>Our Amount</Th>
                                  <Th>Difference</Th>
                                  <Th>Status</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {csvPreviewData.results.matched.map((item) => (
                                  <Tr key={item.remittanceId}>
                                    <Td>
                                      <Checkbox
                                        isChecked={selectedForCredit.includes(item.remittanceId)}
                                        onChange={() => handleToggleSelect(item.remittanceId)}
                                      />
                                    </Td>
                                    <Td fontSize="xs">{item.orderNumber}</Td>
                                    <Td fontSize="xs">{item.awb}</Td>
                                    <Td fontSize="xs" fontWeight="600">
                                      ₹{item.courierAmount?.toLocaleString('en-IN')}
                                    </Td>
                                    <Td fontSize="xs">
                                      ₹{item.ourAmount?.toLocaleString('en-IN')}
                                    </Td>
                                    <Td fontSize="xs" color="green.600">
                                      ₹{Math.abs(item.difference || 0)?.toFixed(2)}
                                    </Td>
                                    <Td>
                                      <StatusBadge status="MATCHED" type="success" />
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>
                        </>
                      ) : (
                        <Text color="gray.500" fontSize="sm">
                          No matched orders
                        </Text>
                      )}
                    </TabPanel>

                    {/* Discrepancies Tab */}
                    <TabPanel p={0} pt={4}>
                      {csvPreviewData.results.discrepancies.length > 0 ? (
                        <>
                          <Flex mb={2} align="center" gap={2}>
                            <Checkbox
                              isChecked={
                                csvPreviewData.results.discrepancies.length > 0 &&
                                csvPreviewData.results.discrepancies.every((item) =>
                                  selectedForCredit.includes(item.remittanceId),
                                )
                              }
                              onChange={() => handleSelectAll(csvPreviewData.results.discrepancies)}
                            >
                              <Text fontSize="sm" fontWeight="600">
                                Select All (Review amounts carefully!)
                              </Text>
                            </Checkbox>
                          </Flex>
                          <Box overflowX="auto">
                            <Table size="sm" variant="simple">
                              <Thead>
                                <Tr>
                                  <Th>Select</Th>
                                  <Th>Order #</Th>
                                  <Th>AWB</Th>
                                  <Th>Courier Amount</Th>
                                  <Th>Our Amount</Th>
                                  <Th>Difference</Th>
                                  <Th>Status</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {csvPreviewData.results.discrepancies.map((item) => (
                                  <Tr key={item.remittanceId} bg="orange.50">
                                    <Td>
                                      <Checkbox
                                        isChecked={selectedForCredit.includes(item.remittanceId)}
                                        onChange={() => handleToggleSelect(item.remittanceId)}
                                      />
                                    </Td>
                                    <Td fontSize="xs">{item.orderNumber}</Td>
                                    <Td fontSize="xs">{item.awb}</Td>
                                    <Td fontSize="xs" fontWeight="600" color="orange.600">
                                      {item.courierAmount !== null &&
                                      item.courierAmount !== undefined
                                        ? `₹${item.courierAmount?.toLocaleString('en-IN')}`
                                        : 'Missing'}
                                    </Td>
                                    <Td fontSize="xs">
                                      ₹{item.ourAmount?.toLocaleString('en-IN')}
                                    </Td>
                                    <Td fontSize="xs" fontWeight="600" color="red.600">
                                      {item.difference !== null && item.difference !== undefined
                                        ? `${item.difference > 0 ? '+' : ''}₹${item.difference?.toFixed(2)}`
                                        : 'N/A'}
                                    </Td>
                                    <Td>
                                      <StatusBadge status="MISMATCH" type="warning" />
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>
                        </>
                      ) : (
                        <Text color="gray.500" fontSize="sm">
                          No discrepancies
                        </Text>
                      )}
                    </TabPanel>

                    {/* Not Found Tab */}
                    <TabPanel p={0} pt={4}>
                      {csvPreviewData.results.notFound.length > 0 ? (
                        <Box overflowX="auto">
                          <Table size="sm" variant="simple">
                            <Thead>
                              <Tr>
                                <Th>AWB</Th>
                                <Th>Order #</Th>
                                <Th>Amount</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {csvPreviewData.results.notFound.map((item, index) => (
                                <Tr key={index} bg="red.50">
                                  <Td fontSize="xs">{item.awb}</Td>
                                  <Td fontSize="xs">{item.orderNumber}</Td>
                                  <Td fontSize="xs">
                                    ₹{item.courierAmount?.toLocaleString('en-IN')}
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      ) : (
                        <Text color="gray.500" fontSize="sm">
                          All orders found in system
                        </Text>
                      )}
                    </TabPanel>

                    {/* Already Settled Tab */}
                    <TabPanel p={0} pt={4}>
                      {csvPreviewData.results.alreadyCredited.length > 0 ? (
                        <Box overflowX="auto">
                          <Table size="sm" variant="simple">
                            <Thead>
                              <Tr>
                                <Th>AWB</Th>
                                <Th>Order #</Th>
                                <Th>Settled At</Th>
                                <Th>Amount</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {csvPreviewData.results.alreadyCredited.map((item) => (
                                <Tr key={item.remittanceId} bg="gray.50">
                                  <Td fontSize="xs">{item.awb}</Td>
                                  <Td fontSize="xs">{item.orderNumber}</Td>
                                  <Td fontSize="xs">
                                    {new Date(item.creditedAt).toLocaleString()}
                                  </Td>
                                  <Td fontSize="xs" color="green.600">
                                    ₹{item.creditedAmount?.toLocaleString('en-IN')}
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      ) : (
                        <Text color="gray.500" fontSize="sm">
                          No previously settled orders
                        </Text>
                      )}
                    </TabPanel>

                    {/* Errors Tab */}
                    <TabPanel p={0} pt={4}>
                      {csvPreviewData.results.errors.length > 0 ? (
                        <Box overflowX="auto">
                          <Table size="sm" variant="simple">
                            <Thead>
                              <Tr>
                                <Th>#</Th>
                                <Th>Error</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {csvPreviewData.results.errors.map((item, index) => (
                                <Tr key={index} bg="red.50">
                                  <Td fontSize="xs">{index + 1}</Td>
                                  <Td fontSize="xs">{item.error || 'Invalid row data'}</Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      ) : (
                        <Text color="gray.500" fontSize="sm">
                          No parse errors found
                        </Text>
                      )}
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter bg="gray.50" borderTopWidth={1}>
            <HStack spacing={3} width="100%" justify="space-between">
              <Box>
                <Text fontSize="sm" fontWeight="600">
                  Selected: {selectedForCredit.length} orders
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Total: ₹
                  {[
                    ...(csvPreviewData?.results?.matched || []),
                    ...(csvPreviewData?.results?.discrepancies || []),
                  ]
                    .filter((item) => selectedForCredit.includes(item.remittanceId))
                    .reduce((sum, item) => sum + (item.courierAmount || 0), 0)
                    .toLocaleString('en-IN')}
                </Text>
              </Box>
              <HStack>
                <Button variant="ghost" onClick={onCsvReviewClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleConfirmCredit}
                  isLoading={confirmSettlementMutation.isPending}
                  isDisabled={selectedForCredit.length === 0 || !utrNumber}
                >
                  Confirm Settlement ({selectedForCredit.length})
                </Button>
              </HStack>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}
