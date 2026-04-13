/* eslint-disable */
import { ChevronDownIcon, ChevronUpIcon, InfoIcon } from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Button,
  Collapse,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  VStack,
} from '@chakra-ui/react'

export default function B2BForm({
  formData,
  onChange,
  shipmentType,
  couriers = [],
  selectedCourier,
  onCourierChange,
}) {
  const { isOpen: isAdvancedOpen, onToggle: onAdvancedToggle } = useDisclosure()
  const sectionBg = useColorModeValue('white', '#111E37')
  const borderColor = useColorModeValue('rgba(148,163,184,0.3)', 'rgba(148,163,184,0.24)')
  const labelColor = useColorModeValue('gray.700', 'gray.200')
  const mutedText = useColorModeValue('gray.600', 'gray.400')
  const inputBg = useColorModeValue('white', 'rgba(15, 35, 66, 0.8)')

  return (
    <VStack spacing={5} align="stretch">
      <Box bg={sectionBg} borderRadius="16px" p={{ base: 4, md: 5 }} borderWidth="1px" borderColor={borderColor}>
        <HStack justify="space-between" mb={4}>
          <Text fontWeight="800" color={labelColor}>
            B2B Core Inputs
          </Text>
          <Badge bg="brand.100" color="brand.700" borderRadius="full" px={2.5} py={1}>
            Charge Simulation
          </Badge>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isRequired>
            <FormLabel color={labelColor}>
              Total Weight (Kg)
              <Tooltip label="Total shipment weight in kilograms">
                <InfoIcon ml={2} boxSize={3} color="gray.400" />
              </Tooltip>
            </FormLabel>
            <Input
              name="totalWeight"
              type="number"
              step="0.01"
              min="0"
              value={formData.totalWeight}
              onChange={(e) => onChange('totalWeight', e.target.value)}
              placeholder="e.g. 12.5"
              bg={inputBg}
              borderColor={borderColor}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
            />
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor}>
              Number of Pieces
              <Tooltip label="If single piece, single-piece handling may apply">
                <InfoIcon ml={2} boxSize={3} color="gray.400" />
              </Tooltip>
            </FormLabel>
            <Input
              name="pieceCount"
              type="number"
              min="1"
              value={formData.pieceCount || ''}
              onChange={(e) => onChange('pieceCount', e.target.value)}
              placeholder="e.g. 4"
              bg={inputBg}
              borderColor={borderColor}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
            />
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor}>Length (cm)</FormLabel>
            <Input
              name="length"
              type="number"
              step="0.01"
              min="0"
              value={formData.length || ''}
              onChange={(e) => onChange('length', e.target.value)}
              placeholder="Length"
              bg={inputBg}
              borderColor={borderColor}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
            />
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor}>Width (cm)</FormLabel>
            <Input
              name="width"
              type="number"
              step="0.01"
              min="0"
              value={formData.width || ''}
              onChange={(e) => onChange('width', e.target.value)}
              placeholder="Width"
              bg={inputBg}
              borderColor={borderColor}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
            />
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor}>Height (cm)</FormLabel>
            <Input
              name="height"
              type="number"
              step="0.01"
              min="0"
              value={formData.height || ''}
              onChange={(e) => onChange('height', e.target.value)}
              placeholder="Height"
              bg={inputBg}
              borderColor={borderColor}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
            />
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor}>
              Preferred Courier (Optional)
              <Tooltip label="Leave empty for global/default calculation">
                <InfoIcon ml={2} boxSize={3} color="gray.400" />
              </Tooltip>
            </FormLabel>
            <Select
              placeholder="Global / Default"
              value={selectedCourier || ''}
              onChange={(e) => onCourierChange?.(e.target.value)}
              bg={inputBg}
              borderColor={borderColor}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
            >
              <option value="">Global / Default</option>
              {couriers.map((courier) => (
                <option key={courier.id} value={courier.id}>
                  {courier.name}
                </option>
              ))}
            </Select>
          </FormControl>
        </SimpleGrid>
      </Box>

      <Box bg={sectionBg} borderRadius="16px" p={{ base: 4, md: 5 }} borderWidth="1px" borderColor={borderColor}>
        <HStack justify="space-between" mb={3}>
          <VStack align="start" spacing={0}>
            <Text fontWeight="800" color={labelColor}>
              Advanced Inputs
            </Text>
            <Text fontSize="xs" color={mutedText}>
              Holiday, CSD, time-window, demurrage simulation
            </Text>
          </VStack>
          <Button
            size="sm"
            variant="outline"
            borderColor={borderColor}
            onClick={onAdvancedToggle}
            rightIcon={isAdvancedOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          >
            {isAdvancedOpen ? 'Hide' : 'Show'}
          </Button>
        </HStack>

        <Collapse in={isAdvancedOpen} animateOpacity>
          <VStack spacing={4} align="stretch" mt={2}>
            <Divider borderColor={borderColor} />

            <FormControl>
              <FormLabel color={labelColor}>
                Delivery Address
                <Tooltip label="CSD keywords in address can trigger CSD charges">
                  <InfoIcon ml={2} boxSize={3} color="gray.400" />
                </Tooltip>
              </FormLabel>
              <Textarea
                name="deliveryAddress"
                value={formData.deliveryAddress || ''}
                onChange={(e) => onChange('deliveryAddress', e.target.value)}
                placeholder="Full delivery address"
                rows={3}
                bg={inputBg}
                borderColor={borderColor}
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel color={labelColor}>
                Delivery Time Window
                <Tooltip label="Specific windows can affect time-based charges">
                  <InfoIcon ml={2} boxSize={3} color="gray.400" />
                </Tooltip>
              </FormLabel>
              <VStack spacing={3} align="stretch">
                <Select
                  name="deliveryTimeType"
                  value={formData.deliveryTimeType || ''}
                  onChange={(e) => {
                    onChange('deliveryTimeType', e.target.value)
                    if (e.target.value === '') {
                      onChange('deliveryTime', '')
                      onChange('deliveryTimeEnd', '')
                    }
                  }}
                  placeholder="No time requirement"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                >
                  <option value="">No time requirement</option>
                  <option value="before">Before specific time</option>
                  <option value="after">After specific time</option>
                  <option value="specific">At specific time</option>
                  <option value="timeframe">Between two times</option>
                </Select>

                {formData.deliveryTimeType === 'before' && (
                  <Input
                    name="deliveryTime"
                    type="time"
                    value={
                      formData.deliveryTime?.startsWith('before ')
                        ? formData.deliveryTime.replace('before ', '')
                        : formData.deliveryTime || ''
                    }
                    onChange={(e) => onChange('deliveryTime', `before ${e.target.value}`)}
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                  />
                )}

                {formData.deliveryTimeType === 'after' && (
                  <Input
                    name="deliveryTime"
                    type="time"
                    value={
                      formData.deliveryTime?.startsWith('after ')
                        ? formData.deliveryTime.replace('after ', '')
                        : formData.deliveryTime || ''
                    }
                    onChange={(e) => onChange('deliveryTime', `after ${e.target.value}`)}
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                  />
                )}

                {formData.deliveryTimeType === 'specific' && (
                  <Input
                    name="deliveryTime"
                    type="time"
                    value={formData.deliveryTime || ''}
                    onChange={(e) => onChange('deliveryTime', e.target.value)}
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                  />
                )}

                {formData.deliveryTimeType === 'timeframe' && (
                  <SimpleGrid columns={2} spacing={3}>
                    <Input
                      name="deliveryTime"
                      type="time"
                      value={formData.deliveryTime || ''}
                      onChange={(e) => onChange('deliveryTime', e.target.value)}
                      bg={inputBg}
                      borderColor={borderColor}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                    />
                    <Input
                      name="deliveryTimeEnd"
                      type="time"
                      value={formData.deliveryTimeEnd || ''}
                      onChange={(e) => onChange('deliveryTimeEnd', e.target.value)}
                      bg={inputBg}
                      borderColor={borderColor}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                    />
                  </SimpleGrid>
                )}
              </VStack>
            </FormControl>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel color={labelColor}>Pickup Date</FormLabel>
                <Input
                  name="pickupDate"
                  type="date"
                  value={formData.pickupDate || ''}
                  onChange={(e) => onChange('pickupDate', e.target.value)}
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                />
              </FormControl>
              <FormControl>
                <FormLabel color={labelColor}>Order ID</FormLabel>
                <Input
                  name="orderId"
                  value={formData.orderId || ''}
                  onChange={(e) => onChange('orderId', e.target.value)}
                  placeholder="Order ID"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                />
              </FormControl>
              <FormControl>
                <FormLabel color={labelColor}>AWB Number</FormLabel>
                <Input
                  name="awbNumber"
                  value={formData.awbNumber || ''}
                  onChange={(e) => onChange('awbNumber', e.target.value)}
                  placeholder="AWB"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                />
              </FormControl>
            </SimpleGrid>
          </VStack>
        </Collapse>
      </Box>
    </VStack>
  )
}
