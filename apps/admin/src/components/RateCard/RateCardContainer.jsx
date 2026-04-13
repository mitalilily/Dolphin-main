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

const normalizeProvider = (value) => String(value || '').trim().toLowerCase()

const normalizeMode = (value) => {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''
  if (['air', 'a', 'express'].includes(raw)) return 'air'
  if (['surface', 's', 'ground'].includes(raw)) return 'surface'
  return raw
}

// CSV exporter
const downloadCSV = (allCouriers = [], allZones = [], existingData = [], filters = {}) => {
  if (!allCouriers?.length || !allZones?.length) return
  const type = filters?.businessType?.toLowerCase()

  let headers = []
  let rows = []

  // Common headers
  const baseHeaders = [
    'Courier ID',
    'Courier Name',
    'Service Provider',
    'Mode',
    'Business Type',
  ]

  if (type === 'b2c') {
    headers = [
      ...baseHeaders,
      ...allZones.flatMap((zone) => [
        `${zone.name} (Forward)`,
        `${zone.name} (RTO)`,
        `${zone.name} (Forward Slabs)`,
        `${zone.name} (RTO Slabs)`,
      ]),
      'COD Charges',
      'COD Percent',
      'Other Charges',
    ]

    rows = existingData
      .filter((r) => r.business_type === type && r.plan_id === filters.planId)
      .map((row) => {
        const courier =
          allCouriers.find(
            (c) =>
              Number(c.id) === Number(row.courier_id) &&
              normalizeProvider(c.serviceProvider || c.service_provider || '') ===
                normalizeProvider(row.service_provider || row.serviceProvider || '') &&
              normalizeMode(c.mode || row.mode || '') === normalizeMode(row.mode || ''),
          ) || {}

        const zoneValues = allZones.flatMap((zone) => {
          const zoneRates = row.rates?.[zone.name] || {}
          const zoneSlabs = row.zone_slabs?.[zone.name] || {}
          return [
            zoneRates.forward ?? '',
            zoneRates.rto ?? '',
            zoneSlabs.forward?.length ? JSON.stringify(zoneSlabs.forward) : '',
            zoneSlabs.rto?.length ? JSON.stringify(zoneSlabs.rto) : '',
          ]
        })

        return [
          row.courier_id ?? courier.id ?? '',
          row.courier_name ?? courier.name ?? '',
          row.service_provider || row.serviceProvider || courier.serviceProvider || '',
          row.mode || '',
          type,
          ...zoneValues,
          row.cod_charges ?? '',
          row.cod_percent ?? '',
          row.other_charges ?? '',
        ]
      })
  }

  if (type === 'b2b') {
    headers = [
      ...baseHeaders,
      'Min Weight',
      ...allZones.flatMap((zone) => [`${zone.name} (Per Kg Forward)`, `${zone.name} (Per Kg RTO)`]),
      'COD Charges',
      'COD Percent',
      'Other Charges',
    ]

    rows = existingData
      .filter((r) => r.business_type === type && r.plan_id === filters.planId)
      .map((row) => {
        const courier =
          allCouriers.find(
            (c) =>
              Number(c.id) === Number(row.courier_id) &&
              normalizeProvider(c.serviceProvider || c.service_provider || '') ===
                normalizeProvider(row.service_provider || row.serviceProvider || '') &&
              normalizeMode(c.mode || row.mode || '') === normalizeMode(row.mode || ''),
          ) || {}

        const zoneValues = allZones.flatMap((zone) => {
          const zoneRates = row.rates?.[zone.name] || {}
          return [zoneRates.forward_per_kg ?? '', zoneRates.rto_per_kg ?? '']
        })

        return [
          row.courier_id ?? courier.id ?? '',
          row.courier_name ?? courier.name ?? '',
          row.service_provider || row.serviceProvider || courier.serviceProvider || '',
          row.mode || '',
          row.min_weight || '',
          type,
          ...zoneValues,
          row.cod_charges ?? '',
          row.cod_percent ?? '',
          row.other_charges ?? '',
        ]
      })
  }

  const csv = Papa.unparse({ fields: headers, data: rows })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', `shipping_rate_card_${type}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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
            planId={filters?.planId}
            couriers={courierList || []}
            businessType={selectedBusinessType}
          />

          {/* Import Modal */}
          <CustomModal
            isOpen={isImportModalOpen}
            onClose={() => setImportModalOpen(false)}
            title="Import Rates"
            size="xl"
            action={
              <Button
                size="sm"
                colorScheme="blue"
                onClick={() => downloadCSV(courierList || [], zones || [], data || [], filters)}
              >
                Download CSV
              </Button>
            }
          >
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
