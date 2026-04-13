/* eslint-disable */
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Tab,
  TabList,
  Tabs,
  Text,
  Tooltip,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react'
import B2BForm from 'components/Tools/RateCalculator/B2BForm'
import B2CForm from 'components/Tools/RateCalculator/B2CForm'
import { useAvailableCouriersMutation, useCouriers } from 'hooks/useCouriers'
import { useLocations } from 'hooks/useLocations'
import { usePlans } from 'hooks/usePlans'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BiRupee, BiTachometer } from 'react-icons/bi'
import { TbDiscountCheck } from 'react-icons/tb'
import { b2bAdminService } from 'services/b2bAdmin.service'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

// ✅ Shared common fields
function CommonFields({
  formData,
  handleChange,
  loadingPickup,
  loadingDelivery,
  plans,
  loadingPlans,
}) {
  const panelBg = useColorModeValue('white', '#111E37')
  const panelBorder = useColorModeValue('rgba(148,163,184,0.3)', 'rgba(148,163,184,0.24)')
  const inputBg = useColorModeValue('white', 'rgba(15, 35, 66, 0.8)')
  const headingColor = useColorModeValue('gray.800', 'gray.100')

  return (
    <>
      <Box bg={panelBg} borderRadius="16px" p={{ base: 4, md: 5 }} mb={5} borderWidth="1px" borderColor={panelBorder}>
        <Heading size="sm" mb={4} color={headingColor} fontWeight="800">
          Pickup & Delivery
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl isRequired>
            <FormLabel color={headingColor}>Pickup Pincode</FormLabel>
            <Input
              value={formData.pickupPincode}
              onChange={(e) => handleChange('pickupPincode', e.target.value)}
              placeholder="Enter pickup pincode"
              bg={inputBg}
              borderColor={panelBorder}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
            />
          </FormControl>
          <FormControl>
            <FormLabel color={headingColor}>Pickup City</FormLabel>
            <InputGroup>
              <Input value={formData.pickupCity} isDisabled bg={inputBg} borderColor={panelBorder} />
              {loadingPickup && (
                <InputRightElement>
                  <Spinner size="sm" />
                </InputRightElement>
              )}
            </InputGroup>
          </FormControl>
          <FormControl>
            <FormLabel color={headingColor}>Pickup State</FormLabel>
            <Input value={formData.pickupState} isDisabled bg={inputBg} borderColor={panelBorder} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel color={headingColor}>Delivery Pincode</FormLabel>
            <Input
              value={formData.deliveryPincode}
              onChange={(e) => handleChange('deliveryPincode', e.target.value)}
              placeholder="Enter delivery pincode"
              bg={inputBg}
              borderColor={panelBorder}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
            />
          </FormControl>
          <FormControl>
            <FormLabel color={headingColor}>Delivery City</FormLabel>
            <InputGroup>
              <Input value={formData.deliveryCity} isDisabled bg={inputBg} borderColor={panelBorder} />
              {loadingDelivery && (
                <InputRightElement>
                  <Spinner size="sm" />
                </InputRightElement>
              )}
            </InputGroup>
          </FormControl>
          <FormControl>
            <FormLabel color={headingColor}>Delivery State</FormLabel>
            <Input value={formData.deliveryState} isDisabled bg={inputBg} borderColor={panelBorder} />
          </FormControl>
        </SimpleGrid>
      </Box>

      <Box bg={panelBg} borderRadius="16px" p={{ base: 4, md: 5 }} mb={5} borderWidth="1px" borderColor={panelBorder}>
        <Heading size="sm" mb={4} color={headingColor} fontWeight="800">
          Plan
        </Heading>
        <FormControl isRequired>
          <Select
            placeholder={loadingPlans ? 'Loading plans...' : 'Select a plan'}
            value={formData.planId}
            onChange={(e) => handleChange('planId', e.target.value)}
            bg={inputBg}
            borderColor={panelBorder}
            _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
          >
            {plans?.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box bg={panelBg} borderRadius="16px" p={{ base: 4, md: 5 }} mb={2} borderWidth="1px" borderColor={panelBorder}>
        <Heading size="sm" mb={4} color={headingColor} fontWeight="800">
          Payment & Shipment Value
        </Heading>
        <FormControl mb={6}>
          <FormLabel color={headingColor}>Payment Type</FormLabel>
          <ButtonGroup isAttached width={{ base: '100%', md: '56%' }}>
            <Button
              flex={1}
              variant={formData.paymentType === 'prepaid' ? 'solid' : 'outline'}
              colorScheme="blue"
              onClick={() => handleChange('paymentType', 'prepaid')}
            >
              Prepaid
            </Button>
            <Button
              flex={1}
              variant={formData.paymentType === 'cod' ? 'solid' : 'outline'}
              colorScheme="blue"
              onClick={() => handleChange('paymentType', 'cod')}
            >
              COD
            </Button>
          </ButtonGroup>
        </FormControl>

        <FormControl isRequired>
          <FormLabel color={headingColor}>Order Amount</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none" color="gray.400">
              <BiRupee />
            </InputLeftElement>
            <Input
              type="number"
              value={formData.orderAmount}
              onChange={(e) => handleChange('orderAmount', e.target.value)}
              placeholder="Enter order amount"
              bg={inputBg}
              borderColor={panelBorder}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
            />
          </InputGroup>
        </FormControl>
      </Box>
    </>
  )
}

export default function RateCalculatorPage() {
  const { mutateAsync, isPending, isError, error } = useAvailableCouriersMutation()
  const { data: plans, isLoading: loadingPlans } = usePlans()
  const { data: courierCatalog = [] } = useCouriers()
  const couriersRef = useRef(null)

  const [shipmentType, setShipmentType] = useState('b2c')
  const [availableCouriers, setAvailableCouriers] = useState([])
  const [selectedB2BCourier, setSelectedB2BCourier] = useState('')

  const [formData, setFormData] = useState({
    pickupPincode: '',
    pickupCity: '',
    pickupState: '',
    deliveryPincode: '',
    deliveryCity: '',
    deliveryState: '',
    planId: '',
    paymentType: 'cod',
    orderAmount: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    numberOfBoxes: '',
    pieceCount: '',
    totalWeight: '',
    pickupLocationId: '',
    deliveryAddress: '',
    deliveryTimeType: '',
    deliveryTime: '',
    deliveryTimeEnd: '',
    pickupDate: '',
    orderId: '',
    awbNumber: '',
  })

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    setAvailableCouriers([])
    setSelectedB2BCourier('')
  }, [shipmentType])

  // fetch locations...
  const { data: pickupLocation, isFetching: loadingPickup } = useLocations(
    formData.pickupPincode?.length === 6 ? { pincode: formData.pickupPincode } : null,
    !!formData.pickupPincode,
    ['pickupLocation', formData.pickupPincode],
  )
  useEffect(() => {
    if (pickupLocation?.data?.length > 0) {
      handleChange('pickupCity', pickupLocation.data[0]?.city)
      handleChange('pickupState', pickupLocation.data[0]?.state)
    }
  }, [pickupLocation])

  const { data: deliveryLocation, isFetching: loadingDelivery } = useLocations(
    formData.deliveryPincode?.length === 6 ? { pincode: formData.deliveryPincode } : null,
    !!formData.deliveryPincode,
    ['deliveryLocation', formData.deliveryPincode],
  )
  useEffect(() => {
    if (deliveryLocation?.data?.length > 0) {
      handleChange('deliveryCity', deliveryLocation.data[0]?.city)
      handleChange('deliveryState', deliveryLocation.data[0]?.state)
    }
  }, [deliveryLocation])

  const [isCalculatingB2B, setIsCalculatingB2B] = useState(false)

  const parseEddToDays = (edd) => {
    if (!edd) return Infinity
    if (/^\d{4}-\d{2}-\d{2}/.test(edd)) {
      const diff = new Date(edd).getTime() - Date.now()
      return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0
    }
    const match = edd.match(/(\d+)/)
    return match ? Number(match[1]) : Infinity
  }

  const formatCurrency = (value) => `₹ ${Number(value || 0).toFixed(2)}`
  const getCourierDisplayName = (courier) => courier?.displayName || courier?.name || '—'

  const highlights = useMemo(() => {
    if (shipmentType !== 'b2c' || !availableCouriers?.length) return null

    const enriched = availableCouriers.map((courier) => {
      const forward = courier.localRates?.forward || {}
      const slabbedRate =
        courier?.rate !== undefined && courier?.rate !== null
          ? Number(courier.rate)
          : Number(forward.rate ?? 0)
      const codCharge = Number(forward.cod_charges ?? 0)
      const codPercent = Number(forward.cod_percent ?? 0)
      const total =
        formData.paymentType === 'cod' ? slabbedRate + codCharge + codPercent : slabbedRate
      return {
        ...courier,
        displayName: getCourierDisplayName(courier),
        baseRate: slabbedRate,
        total,
        eddDays: parseEddToDays(courier.edd),
      }
    })

    const cheapest = enriched.reduce((best, entry) => (entry.total < best.total ? entry : best))
    const fastest = enriched.reduce((best, entry) => (entry.eddDays < best.eddDays ? entry : best))

    return {
      cheapest,
      fastest,
    }
  }, [availableCouriers, shipmentType, formData.paymentType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (shipmentType === 'b2b') {
        setIsCalculatingB2B(true)
        const courierMeta = courierCatalog.find(
          (c) => c.id?.toString() === selectedB2BCourier?.toString(),
        )

        const payload = {
          originPincode: formData.pickupPincode,
          destinationPincode: formData.deliveryPincode,
          weightKg: Number(formData.totalWeight || formData.weight || 0),
          paymentMode: formData.paymentType === 'cod' ? 'COD' : 'PREPAID',
          invoiceValue: formData.orderAmount ? Number(formData.orderAmount) : undefined,
          courierId: selectedB2BCourier ? Number(selectedB2BCourier) : undefined,
          serviceProvider:
            courierMeta?.serviceProvider ?? courierMeta?.service_provider ?? undefined,
          planId: formData.planId || undefined,
          // Dimensions for volumetric weight calculation
          length: formData.length ? Number(formData.length) : undefined,
          width: formData.width ? Number(formData.width) : undefined,
          height: formData.height ? Number(formData.height) : undefined,
          // Piece count for single piece handling
          pieceCount: formData.pieceCount ? Number(formData.pieceCount) : undefined,
          isSinglePiece: formData.pieceCount === '1',
          // Delivery address for CSD detection
          deliveryAddress: formData.deliveryAddress || undefined,
          // Delivery time for time-specific delivery charge
          // Format: "before HH:mm", "after HH:mm", "HH:mm", or "HH:mm-HH:mm" for timeframe
          deliveryTime: (() => {
            if (!formData.deliveryTimeType || !formData.deliveryTime) return undefined
            if (formData.deliveryTimeType === 'timeframe' && formData.deliveryTimeEnd) {
              return `${formData.deliveryTime}-${formData.deliveryTimeEnd}`
            }
            if (formData.deliveryTimeType === 'before' || formData.deliveryTimeType === 'after') {
              return formData.deliveryTime // Already includes prefix
            }
            return formData.deliveryTime
          })(),
          // Pickup date for holiday charge
          pickupDate: formData.pickupDate || undefined,
          // Order ID or AWB for tracking events (demurrage, reattempt)
          orderId: formData.orderId || undefined,
          awbNumber: formData.awbNumber || undefined,
        }

        const result = await b2bAdminService.calculateRate(payload)

        setAvailableCouriers([
          {
            id: selectedB2BCourier || 'global',
            name: courierMeta?.name || 'Global Rate',
            charges: result.charges,
            origin: result.origin,
            destination: result.destination,
            rate: result.rate,
          },
        ])

        if (couriersRef.current) {
          setTimeout(() => {
            couriersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 300)
        }

        return
      }

      const payload = {
        ...formData,
        shipmentType,
        weight: shipmentType === 'b2c' ? formData?.weight : formData?.totalWeight,
        cod: formData.paymentType === 'cod' ? Number(formData.orderAmount) || 0 : 0,
        paymentType: formData.paymentType,
        pickupId: formData.pickupLocationId || undefined,
        orderAmount: Number(formData.orderAmount || 0),
        context: 'rate_calculator',
        planId: formData.planId || undefined,
      }
      const result = await mutateAsync(payload)
      setAvailableCouriers(result ?? [])
      if (result?.length && couriersRef.current) {
        setTimeout(() => {
          couriersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 300)
      }
    } catch (err) {
      setAvailableCouriers([])
    } finally {
      if (shipmentType === 'b2b') {
        setIsCalculatingB2B(false)
      }
    }
  }
  console.log('availableCouriers', availableCouriers)

  const tableConfig =
    shipmentType === 'b2b'
      ? {
          data: (availableCouriers ?? [])?.map((entry, idx) => {
            const overheadTotal = (entry?.charges?.overheads || []).reduce(
              (sum, item) => sum + Number(item.amount || 0),
              0,
            )
            const demurrageCharge = Number(entry?.charges?.demurrage ?? 0)
            const totalWithDemurrage = Number(entry?.charges?.total ?? 0) + demurrageCharge
            return {
              sno: idx + 1,
              name: entry?.name,
              originZone: entry?.origin?.zoneCode ?? entry?.origin?.zoneName ?? '-',
              destinationZone: entry?.destination?.zoneCode ?? entry?.destination?.zoneName ?? '-',
              billableWeight: entry?.calculation?.billableWeight ?? '-',
              baseFreight: Number(entry?.charges?.baseFreight ?? 0),
              overhead: overheadTotal,
              demurrage: demurrageCharge,
              total: totalWithDemurrage,
              overheadDetails: entry?.charges?.overheads ?? [],
              demurrageDetails: entry?.breakdown?.demurrage ?? null,
            }
          }),
          captions: [
            'S.No',
            'Courier',
            'Origin Zone',
            'Dest Zone',
            'Billable Weight',
            'Base Freight',
            'Overheads',
            'Demurrage',
            'Total',
            'Breakdown',
          ],
          columnKeys: [
            'sno',
            'name',
            'originZone',
            'destinationZone',
            'billableWeight',
            'baseFreight',
            'overhead',
            'demurrage',
            'total',
            'overheadDetails',
          ],
          renderers: {
            billableWeight: (val) => (val !== '-' ? `${Number(val).toFixed(2)} kg` : '-'),
            baseFreight: (val) => formatCurrency(val),
            overhead: (val) => formatCurrency(val),
            demurrage: (val) => (val > 0 ? formatCurrency(val) : '—'),
            total: (val) => (
              <Text fontWeight="bold" color="purple.600">
                {formatCurrency(val)}
              </Text>
            ),
            overheadDetails: (value, row) => {
              const items = Array.isArray(value) && value.length ? value : []
              const demurrageInfo = row.demurrageDetails
              const parts = []

              if (items.length > 0) {
                parts.push(
                  <VStack align="start" spacing={1} key="overheads">
                    {items.map((item, idx) => (
                      <Text key={idx} fontSize="xs">
                        <strong>{item.name || item.code}:</strong> {formatCurrency(item.amount)}
                      </Text>
                    ))}
                  </VStack>,
                )
              }

              if (demurrageInfo?.applied) {
                parts.push(
                  <Box key="demurrage" mt={2} pt={2} borderTop="1px solid" borderColor="gray.200">
                    <Text fontSize="xs" fontWeight="semibold" mb={1}>
                      Demurrage:
                    </Text>
                    <Text fontSize="xs">
                      Days: {demurrageInfo.storedDays} (Free: {demurrageInfo.freeStorageDays},
                      Extra: {demurrageInfo.extraDays})
                    </Text>
                    <Text fontSize="xs">Amount: {formatCurrency(demurrageInfo.amount)}</Text>
                  </Box>,
                )
              }

              return parts.length > 0 ? <Box>{parts}</Box> : <Text>—</Text>
            },
          },
        }
      : {
          data: (availableCouriers ?? []).map((c, idx) => {
            const forward = c.localRates?.forward || {}
            const baseRate =
              c?.rate !== undefined && c?.rate !== null ? Number(c.rate) : Number(forward?.rate ?? 0)
            const codCharge = Number(forward?.cod_charges ?? 0)
            const codPercent = Number(forward?.cod_percent ?? 0)
            const codTotal = formData.paymentType === 'cod' ? codCharge + codPercent : 0
            return {
              sno: idx + 1,
              name: getCourierDisplayName(c),
              freight_charges: baseRate,
              cod_charges: codTotal,
              total_charges: baseRate + codTotal,
              edd: c.edd,
              zone: c?.approxZone?.code,
              max_slab_weight: forward?.max_slab_weight ?? c?.max_slab_weight ?? null,
              chargeable_weight: c.chargeable_weight || null,
              volumetric_weight: c.volumetric_weight || null,
              slabs: c.slabs || null,
            }
          }),
          captions: [
            'S.No',
            'Courier Name',
            'Freight Charges (Slabbed)',
            'COD Charges',
            'Total Charges',
            'EDD',
            'Max Slab Weight (kg)',
            'Chargeable Weight (g)',
            'Volumetric Weight (g)',
            'Slabs',
            'Zone Code',
          ],
          columnKeys: [
            'sno',
            'name',
            'freight_charges',
            'cod_charges',
            'total_charges',
            'edd',
            'max_slab_weight',
            'chargeable_weight',
            'volumetric_weight',
            'slabs',
            'zone',
          ],
          renderers: {
            freight_charges: (val) => formatCurrency(val),
            cod_charges: (val) => formatCurrency(val),
            total_charges: (val) => formatCurrency(val),
            zone: (val) => (
              <Badge variant="subtle" colorScheme="orange">
                {val}
              </Badge>
            ),
            edd: (val) => <Text color="purple.500">{val}</Text>,
            max_slab_weight: (val) => (val != null ? `${val} kg` : '—'),
            chargeable_weight: (val) =>
              val ? (
                <Text fontWeight="semibold" color="blue.600">
                  {val} g
                </Text>
              ) : (
                <Text color="gray.400">—</Text>
              ),
            volumetric_weight: (val) =>
              val ? (
                <Text fontWeight="semibold" color="teal.600">
                  {val} g
                </Text>
              ) : (
                <Text color="gray.400">—</Text>
              ),
            slabs: (val) =>
              val ? (
                <Badge colorScheme="purple" variant="subtle">
                  {val}
                </Badge>
              ) : (
                <Text color="gray.400">—</Text>
              ),
          },
        }

  return (
    <Stack
      spacing={8}
      pt={{ base: '120px', md: '75px' }}
      bg={useColorModeValue('gray.100', 'gray.900')}
      minH="100vh"
      p={4}
    >
      <Box bg={useColorModeValue('white', 'gray.800')} p={8} borderRadius="2xl" shadow="xl">
        <Heading size="lg" mb={8} color={useColorModeValue('purple.600', 'purple.300')}>
          Rate Calculator
        </Heading>

        <form onSubmit={handleSubmit}>
          {/* Shipment Type FIRST */}
          <Box
            bg={useColorModeValue('gray.50', 'gray.700')}
            borderRadius="2xl"
            p={6}
            mb={6}
            shadow="lg"
          >
            <Heading
              size="sm"
              mb={4}
              color={useColorModeValue('purple.600', 'purple.300')}
              borderBottom="1px solid"
              borderColor={useColorModeValue('gray.200', 'gray.600')}
              pb={2}
            >
              Shipment Type
            </Heading>
            <Tabs
              variant="soft-rounded"
              colorScheme="purple"
              onChange={(index) => setShipmentType(index === 0 ? 'b2c' : 'b2b')}
            >
              <TabList>
                <Tab>B2C</Tab>
                <Tab>B2B</Tab>
              </TabList>
            </Tabs>

            <Box mt={4}>
              {shipmentType === 'b2c' ? (
                <B2CForm shipmentType="b2c" formData={formData} onChange={handleChange} />
              ) : (
                <B2BForm
                  shipmentType="b2b"
                  formData={formData}
                  onChange={handleChange}
                  couriers={courierCatalog}
                  selectedCourier={selectedB2BCourier}
                  onCourierChange={setSelectedB2BCourier}
                />
              )}
            </Box>
          </Box>

          {/* Shared Fields */}
          <CommonFields
            formData={formData}
            handleChange={handleChange}
            loadingPickup={loadingPickup}
            loadingDelivery={loadingDelivery}
            plans={plans}
            loadingPlans={loadingPlans}
          />

          <HStack justify="flex-end" spacing={4}>
            {availableCouriers?.length ? (
              <Button variant="outline" onClick={() => setAvailableCouriers([])}>
                Clear Results
              </Button>
            ) : null}
            <Button
              type="submit"
              isLoading={isPending || isCalculatingB2B}
              colorScheme="purple"
              loadingText="Calculating"
            >
              Calculate Rates
            </Button>
          </HStack>
        </form>
      </Box>

      {isError && (
        <Box bg="red.50" borderRadius="lg" borderWidth="1px" borderColor="red.200" p={4}>
          <Text color="red.600">{error?.message || 'Failed to fetch couriers'}</Text>
        </Box>
      )}

      {shipmentType === 'b2c' && highlights && availableCouriers?.length ? (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box
            shadow="lg"
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={useColorModeValue('green.100', 'green.900')}
          >
            <Box
              px={4}
              py={3}
              borderBottomWidth="1px"
              borderColor={useColorModeValue('green.100', 'green.800')}
            >
              <HStack spacing={2}>
                <Icon as={TbDiscountCheck} color="green.400" boxSize={5} />
                <Text fontWeight="bold">Cheapest Option</Text>
              </HStack>
            </Box>
            <Box px={4} py={4}>
              <Stack spacing={2}>
                <Text fontSize="lg" fontWeight="semibold">
                  {highlights.cheapest?.displayName}
                </Text>
                <Text color="gray.500">Zone {highlights.cheapest?.approxZone?.code || '—'}</Text>
                <Text fontSize="xl" fontWeight="bold" color="green.500">
                  {formatCurrency(highlights.cheapest?.total)}
                </Text>
                <HStack spacing={4}>
                  <Tooltip label="Base Freight">
                    <Text>Freight: {formatCurrency(highlights.cheapest?.baseRate)}</Text>
                  </Tooltip>
                  {formData.paymentType === 'cod' && (
                    <Tooltip label="COD Charges">
                      <Text>
                        COD:{' '}
                        {formatCurrency(highlights.cheapest?.total - highlights.cheapest?.baseRate)}
                      </Text>
                    </Tooltip>
                  )}
                </HStack>
              </Stack>
            </Box>
          </Box>
          <Box
            shadow="lg"
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={useColorModeValue('purple.100', 'purple.900')}
          >
            <Box
              px={4}
              py={3}
              borderBottomWidth="1px"
              borderColor={useColorModeValue('purple.100', 'purple.800')}
            >
              <HStack spacing={2}>
                <Icon as={BiTachometer} color="purple.400" boxSize={5} />
                <Text fontWeight="bold">Fastest Option</Text>
              </HStack>
            </Box>
            <Box px={4} py={4}>
              <Stack spacing={2}>
                <Text fontSize="lg" fontWeight="semibold">
                  {highlights.fastest?.displayName}
                </Text>
                <Text color="gray.500">Zone {highlights.fastest?.approxZone?.code || '—'}</Text>
                <Text fontSize="xl" fontWeight="bold" color="purple.500">
                  {highlights.fastest?.edd || '—'}
                </Text>
                <Text color="gray.600">Total: {formatCurrency(highlights.fastest?.total)}</Text>
              </Stack>
            </Box>
          </Box>
        </SimpleGrid>
      ) : null}

      <Box ref={couriersRef}>
        <GenericTable
          title={shipmentType === 'b2b' ? 'B2B Calculated Rates' : 'B2C Available Couriers'}
          data={tableConfig.data}
          captions={tableConfig.captions}
          columnKeys={tableConfig.columnKeys}
          renderers={tableConfig.renderers}
          loading={isPending || isCalculatingB2B}
          paginated={false}
        />
      </Box>
    </Stack>
  )
}
