import {
  Box,
  Divider,
  HStack,
  Select,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { IconCalendar } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import B2BAdditionalCharges from '../../../components/B2B/B2BAdditionalCharges'
import B2BRateMatrix from '../../../components/B2B/B2BRateMatrix'
import B2BSurchargeManagement from '../../../components/B2B/B2BSurchargeManagement'
import HolidayCalendar from '../../../components/B2B/HolidayCalendar'
import { PlansService } from '../../../services/plan.service'

const B2BPricingContent = () => {
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const [pricingTabIndex, setPricingTabIndex] = useState(0)
  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => PlansService.getPlans(),
  })

  // Default to first plan if available
  const [selectedPlanId, setSelectedPlanId] = useState('')

  // Global courier state
  const [courierId, setCourierId] = useState('')
  const [serviceProvider, setServiceProvider] = useState('')

  // Update selectedPlanId when plans load - default to first plan
  useEffect(() => {
    if (plans?.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id)
    }
  }, [plans, selectedPlanId])

  return (
    <Box>
      {/* Plan Selector - Simplified */}
      {plans?.length > 0 && (
        <Box mb={4} px={6} pt={4}>
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

      <Tabs index={pricingTabIndex} onChange={setPricingTabIndex} colorScheme="blue" variant="line">
        <Box px={6} pt={4} borderBottomWidth="1px" borderColor={borderColor}>
          <TabList gap={2}>
            <Tab
              _selected={{
                color: 'blue.600',
                borderBottomColor: 'blue.500',
                fontWeight: 'semibold',
              }}
              fontWeight="medium"
              px={4}
              py={3}
              color="gray.600"
              borderBottomWidth="2px"
              borderBottomColor="transparent"
              _hover={{
                color: 'blue.500',
              }}
              transition="all 0.2s"
            >
              Rate Matrix
            </Tab>
            <Tab
              _selected={{
                color: 'blue.600',
                borderBottomColor: 'blue.500',
                fontWeight: 'semibold',
              }}
              fontWeight="medium"
              px={4}
              py={3}
              color="gray.600"
              borderBottomWidth="2px"
              borderBottomColor="transparent"
              _hover={{
                color: 'blue.500',
              }}
              transition="all 0.2s"
            >
              Overhead Charges
            </Tab>
            <Tab
              _selected={{
                color: 'blue.600',
                borderBottomColor: 'blue.500',
                fontWeight: 'semibold',
              }}
              fontWeight="medium"
              px={4}
              py={3}
              color="gray.600"
              borderBottomWidth="2px"
              borderBottomColor="transparent"
              _hover={{
                color: 'blue.500',
              }}
              transition="all 0.2s"
            >
              Additional Charges
            </Tab>
            <Tab
              _selected={{
                color: 'blue.600',
                borderBottomColor: 'blue.500',
                fontWeight: 'semibold',
              }}
              fontWeight="medium"
              px={4}
              py={3}
              color="gray.600"
              borderBottomWidth="2px"
              borderBottomColor="transparent"
              _hover={{
                color: 'blue.500',
              }}
              transition="all 0.2s"
            >
              <IconCalendar size={18} style={{ marginRight: '8px', display: 'inline' }} />
              Holiday Calendar
            </Tab>
          </TabList>
        </Box>

        <TabPanels>
          <TabPanel px={6} py={4}>
            {pricingTabIndex === 0 && <B2BRateMatrix planId={selectedPlanId} />}
          </TabPanel>
          <TabPanel px={6} py={4}>
            {pricingTabIndex === 1 && <B2BSurchargeManagement planId={selectedPlanId} />}
          </TabPanel>
          <TabPanel px={6} py={4}>
            {pricingTabIndex === 2 && <B2BAdditionalCharges planId={selectedPlanId} />}
          </TabPanel>
          <TabPanel px={0} py={0}>
            {pricingTabIndex === 3 && <HolidayCalendar />}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}

export default B2BPricingContent
