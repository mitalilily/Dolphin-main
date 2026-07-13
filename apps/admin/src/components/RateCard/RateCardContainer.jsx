import {
  Box,
  Button,
  Divider,
  Flex,
  Grid,
  HStack,
  Select,
  Stack,
  Tab,
  TabList,
  Tabs,
  Tag,
  Text,
  useToast,
} from '@chakra-ui/react'
import { IconUpload } from '@tabler/icons-react'
import Papa from 'papaparse'
import { useEffect, useMemo, useState } from 'react'

import CustomModal from 'components/Modal/CustomModal'
import { RateCardEditModal } from 'components/Modal/RateCardEditModal'
import TableFilters from 'components/Tables/TableFilters'
import FileUploader from 'components/upload/FileUploader'
import ZoneRateMatrix from 'views/B2B/ZoneRateMatrix'
import { RateCardTable } from './RateCardTable'

import { AddIcon } from '@chakra-ui/icons'
import { useQuery } from '@tanstack/react-query'
import { useImportShippingRates, useShippingRates } from 'hooks/useCouriers'
import { useZones } from 'hooks/useZones'
import { fetchAllCouriersList } from 'services/courier.service'
import { PlansService } from 'services/plan.service'

const B2C_TEMPLATE_SLAB_COUNT = 4

const getCourierProvider = (courier = {}) =>
  courier.serviceProvider || courier.service_provider || courier.provider || ''

const getCourierKey = (courier = {}) => `${courier.id || ''}::${getCourierProvider(courier)}`

const normalizeMode = (value) => {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''
  if (['air', 'a', 'express'].includes(raw)) return 'air'
  if (['surface', 's', 'ground'].includes(raw)) return 'surface'
  return raw
}

const buildB2CSlabHeaders = (prefix) =>
  Array.from({ length: B2C_TEMPLATE_SLAB_COUNT }, (_, index) => {
    const slab = index + 1
    return [
      `${prefix} Slab ${slab} From Kg`,
      `${prefix} Slab ${slab} To Kg`,
      `${prefix} Slab ${slab} Rate`,
      `${prefix} Slab ${slab} Extra Rate`,
      `${prefix} Slab ${slab} Extra Weight Unit Kg`,
    ]
  }).flat()

const getB2CTemplateHeaders = () => {
  const forwardSlabHeaders = buildB2CSlabHeaders('Forward')
  const rtoSlabHeaders = buildB2CSlabHeaders('RTO')

  return [
    'Courier ID',
    'Courier Name',
    'Service Provider',
    'Mode',
    'Business Type',
    'Zone Code',
    'Zone',
    'Forward Rate',
    ...forwardSlabHeaders,
    'RTO Rate',
    ...rtoSlabHeaders,
    'COD Charges',
    'COD Percent',
    'Other Charges',
  ]
}

const buildB2CTemplateRows = (couriers = [], allZones = [], mode = 'surface') => {
  const normalizedMode = normalizeMode(mode) || 'surface'
  const forwardSlabHeaders = buildB2CSlabHeaders('Forward')
  const rtoSlabHeaders = buildB2CSlabHeaders('RTO')

  return couriers.flatMap((courier) =>
    allZones.map((zone) => [
      courier.id || '',
      courier.name || '',
      getCourierProvider(courier),
      normalizedMode,
      'b2c',
      zone.code || '',
      zone.name || '',
      '',
      ...forwardSlabHeaders.map(() => ''),
      '',
      ...rtoSlabHeaders.map(() => ''),
      '',
      '',
      '',
    ]),
  )
}

const downloadBlobCsv = (headers, rows, filename) => {
  const csv = Papa.unparse({ fields: headers, data: rows })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const downloadSingleCourierB2CTemplate = (courier, allZones = [], mode = 'surface') => {
  if (!courier?.id || !allZones?.length) return

  const provider = getCourierProvider(courier) || 'provider'
  const safeName = String(courier.name || courier.id)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  downloadBlobCsv(
    getB2CTemplateHeaders(),
    buildB2CTemplateRows([courier], allZones, mode),
    `b2c_single_courier_rate_card_${provider}_${safeName || courier.id}_${normalizeMode(mode) || 'surface'}.csv`,
  )
}

const downloadAllCouriersB2CTemplate = (allCouriers = [], allZones = [], mode = 'surface') => {
  if (!allCouriers?.length || !allZones?.length) return

  downloadBlobCsv(
    getB2CTemplateHeaders(),
    buildB2CTemplateRows(allCouriers, allZones, mode),
    `b2c_all_couriers_rate_card_${normalizeMode(mode) || 'surface'}.csv`,
  )
}

export const RateCardContainer = ({ forceBusinessType = null, embedded = false }) => {
  const toast = useToast()

  const businessTypes = ['B2B', 'B2C']
  // If forceBusinessType is provided, use it; otherwise allow switching
  const forcedIndex = forceBusinessType
    ? businessTypes.indexOf(forceBusinessType.toUpperCase())
    : -1
  const [businessTypeIndex, setBusinessTypeIndex] = useState(forcedIndex >= 0 ? forcedIndex : 0)

  const selectedBusinessType = businessTypes[businessTypeIndex].toLowerCase()
  const isB2BSelected = selectedBusinessType === 'b2b'

  const { data: courierList } = useQuery({
    queryKey: ['all-couriers', selectedBusinessType],
    queryFn: () => fetchAllCouriersList({ businessType: selectedBusinessType }),
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => PlansService.getPlans(),
  })

  const { mutate: importRates, isPending: isImporting } = useImportShippingRates()

  // Prevent changing business type if forced
  useEffect(() => {
    if (forceBusinessType && businessTypeIndex !== forcedIndex) {
      setBusinessTypeIndex(forcedIndex)
    }
  }, [forceBusinessType, forcedIndex, businessTypeIndex])
  const { zones } = useZones(businessTypes[businessTypeIndex])
  const [filters, setFilters] = useState({})
  const { data, isLoading } = useShippingRates(filters)

  const [selectedRate, setSelectedRate] = useState(null)
  const [isModalOpen, setModalOpen] = useState(false)
  const [isImportModalOpen, setImportModalOpen] = useState(false)
  const [templateCourierKey, setTemplateCourierKey] = useState('')
  const [templateMode, setTemplateMode] = useState('surface')

  // Default to first plan if available
  const [selectedPlanId, setSelectedPlanId] = useState('')

  // Update selectedPlanId when plans load - default to first plan
  useEffect(() => {
    if (plans?.length > 0) {
      // Always set to first plan if not set, or if current selection is invalid
      if (!selectedPlanId || !plans.find((p) => p.id === selectedPlanId)) {
        setSelectedPlanId(plans[0].id)
      }
    }
  }, [plans, selectedPlanId])

  useEffect(() => {
    if (!courierList?.length) return
    if (
      !templateCourierKey ||
      !courierList.find((courier) => getCourierKey(courier) === templateCourierKey)
    ) {
      setTemplateCourierKey(getCourierKey(courierList[0]))
    }
  }, [courierList, templateCourierKey])

  // Update filters whenever business type or plan changes
  useEffect(() => {
    const nextFilters = { businessType: selectedBusinessType }
    if (selectedBusinessType === 'b2c' && selectedPlanId) {
      nextFilters.planId = selectedPlanId
    }
    setFilters(nextFilters)
  }, [selectedBusinessType, selectedPlanId])

  const openEditModal = (row) => {
    setSelectedRate(row)
    setModalOpen(true)
  }

  const openAddModal = () => {
    // Ensure planId is set before opening modal for new rate
    if (!selectedPlanId && plans?.length > 0) {
      setSelectedPlanId(plans[0].id)
    }
    setSelectedRate(null)
    setModalOpen(true)
  }

  const handleImportRates = () => setImportModalOpen(true)

  const selectedTemplateCourier = useMemo(
    () => courierList?.find((courier) => getCourierKey(courier) === templateCourierKey),
    [courierList, templateCourierKey],
  )

  const filterOptions = useMemo(
    () => {
      const options = [
        {
          key: 'courier_name',
          label: 'Courier',
          type: 'multiselect',
          options: courierList?.map((c) => ({ label: c?.name, value: c?.name })) || [],
        },
        {
          key: 'mode',
          label: 'Mode',
          type: 'select',
          options: [
            { label: 'Air', value: 'air' },
            { label: 'Surface', value: 'surface' },
          ],
        },
      ]

      if (selectedBusinessType !== 'b2c') {
        options.push({ key: 'min_weight', label: 'Min Weight', type: 'text' })
      }

      options.push({
        key: 'zone',
        label: 'Zone',
        type: 'multiselect',
        options: zones?.map((zone) => ({ label: zone.name, value: zone.code })) || [],
      })

      return options
    },
    [courierList, selectedBusinessType, zones],
  )

  return (
    <Flex
      direction="column"
      pt={embedded ? 0 : { base: '120px', md: '75px' }}
      gap={embedded ? 3 : 4}
    >
      {/* Business Type Tabs - Only show if not forced */}
      {!forceBusinessType && (
        <Tabs
          variant="solid-rounded"
          colorScheme="brand"
          index={businessTypeIndex}
          onChange={setBusinessTypeIndex}
          mb={2}
        >
          <TabList gap={2}>
            <Tab
              flex={1}
              px={6}
              py={4}
              borderRadius="lg"
              alignItems="flex-start"
              _selected={{ bg: 'white', shadow: 'md', color: 'brand.600', cursor: 'pointer' }}
              _focus={{ boxShadow: 'none' }}
            >
              <Stack spacing={1} align="flex-start" width="100%">
                <HStack spacing={2}>
                  <Tag colorScheme="blue" size="sm">
                    B2B
                  </Tag>
                  <Text fontWeight="semibold">Enterprise Rate Card</Text>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  Zone-based pricing that maps by state and integrates with your matrix rates.
                </Text>
              </Stack>
            </Tab>

            <Tab
              flex={1}
              px={6}
              py={4}
              borderRadius="lg"
              alignItems="flex-start"
              _selected={{ bg: 'white', shadow: 'md', color: 'brand.600', cursor: 'pointer' }}
              _focus={{ boxShadow: 'none' }}
            >
              <Stack spacing={1} align="flex-start" width="100%">
                <HStack spacing={2}>
                  <Tag colorScheme="purple" size="sm">
                    B2C
                  </Tag>
                  <Text fontWeight="semibold">Retail Rate Card</Text>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  Standard pricing for direct-to-consumer shipments, managed by serviceable
                  pincodes.
                </Text>
              </Stack>
            </Tab>
          </TabList>
        </Tabs>
      )}

      {!isB2BSelected && (
        <>
          {/* Plan Selector */}
          {plans?.length > 0 && (
            <Box mb={4}>
              <HStack spacing={3} align="center">
                <Text fontSize="sm" fontWeight="medium" color="gray.700" minW="80px">
                  Select Plan:
                </Text>
                <Select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  maxW="200px"
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </Select>
              </HStack>
              <Divider mt={4} />
            </Box>
          )}

          {/* Filters and actions */}
          <Grid templateColumns="3fr 2fr" width="100%" gap={4} mb={4} alignItems="center">
            <TableFilters filters={filterOptions} values={filters} onApply={setFilters} />
            <Flex justify="flex-end" gap={2}>
              <Button
                size="sm"
                colorScheme="brand"
                leftIcon={<AddIcon />}
                onClick={openAddModal}
                isDisabled={!selectedPlanId || plans?.length === 0}
              >
                Add Rate
              </Button>
              <Button
                size="sm"
                colorScheme="pink"
                leftIcon={<IconUpload />}
                onClick={handleImportRates}
                isDisabled={!selectedPlanId || plans?.length === 0}
              >
                Import Rate Card
              </Button>
            </Flex>
          </Grid>

          {/* Rate Card Table */}
          <RateCardTable
            data={data || []}
            zones={zones}
            planId={selectedPlanId || filters?.planId}
            businessType={selectedBusinessType}
            onEdit={openEditModal}
            loading={isLoading}
          />

          {/* Edit Rate Modal */}
          <RateCardEditModal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            data={selectedRate}
            existingRates={data}
            zones={zones}
            planId={selectedPlanId || filters?.planId}
            couriers={courierList || []}
            businessType={selectedBusinessType}
          />

          {/* Import Modal */}
          <CustomModal
            isOpen={isImportModalOpen}
            onClose={() => setImportModalOpen(false)}
            title="Import B2C Rates"
            size="xl"
            action={null}
          >
            <Stack spacing={4} mb={5}>
              <Box>
                <Text fontWeight="semibold" mb={1}>
                  Upload options
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Use the uploader below for either file. The all-couriers template lets you send
                  every courier rate card at once; the one-courier template is for smaller updates.
                </Text>
              </Box>
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p={4}>
                  <Text fontWeight="semibold" mb={1}>
                    All courier rate card at once
                  </Text>
                  <Text fontSize="sm" color="gray.600" mb={3}>
                    One CSV containing every B2C courier and every zone for the selected mode.
                  </Text>
                  <Select
                    value={templateMode}
                    onChange={(event) => setTemplateMode(event.target.value)}
                    mb={3}
                  >
                    <option value="surface">Surface</option>
                    <option value="air">Air</option>
                  </Select>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    width="100%"
                    onClick={() =>
                      downloadAllCouriersB2CTemplate(courierList || [], zones || [], templateMode)
                    }
                    isDisabled={!courierList?.length || !zones?.length}
                  >
                    Download All Couriers Template
                  </Button>
                </Box>
                <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p={4}>
                  <Text fontWeight="semibold" mb={1}>
                    One courier rate card
                  </Text>
                  <Text fontSize="sm" color="gray.600" mb={3}>
                    A smaller CSV for only the selected courier and selected mode.
                  </Text>
                  <Grid templateColumns={{ base: '1fr', md: '2fr 1fr' }} gap={3} mb={3}>
                    <Select
                      value={templateCourierKey}
                      onChange={(event) => setTemplateCourierKey(event.target.value)}
                    >
                      {(courierList || []).map((courier) => (
                        <option key={getCourierKey(courier)} value={getCourierKey(courier)}>
                          {courier.name} ({getCourierProvider(courier) || 'provider'} #{courier.id})
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={templateMode}
                      onChange={(event) => setTemplateMode(event.target.value)}
                    >
                      <option value="surface">Surface</option>
                      <option value="air">Air</option>
                    </Select>
                  </Grid>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="blue"
                    width="100%"
                    onClick={() =>
                      downloadSingleCourierB2CTemplate(
                        selectedTemplateCourier,
                        zones || [],
                        templateMode,
                      )
                    }
                    isDisabled={!selectedTemplateCourier || !zones?.length}
                  >
                    Download One Courier Template
                  </Button>
                </Box>
              </Grid>
            </Stack>
            <FileUploader
              maxSizeMb={5}
              folderKey="rates"
              uploadLoading={isImporting}
              onUploaded={(files) => {
                if (!files.length) return
                importRates(
                  {
                    file: files[0],
                    planId: selectedPlanId || filters?.planId,
                    businessType: filters?.businessType || selectedBusinessType,
                  },
                  {
                    onSuccess: () => {
                      toast({
                        title: 'Imported successfully',
                        status: 'success',
                        duration: 3000,
                        isClosable: true,
                      })
                      setImportModalOpen(false)
                    },
                    onError: (err) => {
                      toast({
                        title: 'Failed to upload rate card',
                        description: err?.message,
                        status: 'error',
                        duration: 4000,
                        isClosable: true,
                      })
                    },
                  },
                )
              }}
            />
          </CustomModal>
        </>
      )}

      {isB2BSelected && (
        <Box pt={4}>
          <ZoneRateMatrix embedded />
        </Box>
      )}
    </Flex>
  )
}
