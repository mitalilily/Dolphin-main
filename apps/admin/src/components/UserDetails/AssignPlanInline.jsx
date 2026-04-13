import { Box, Button, Select, Spinner, useToast, VStack } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { PlansService } from 'services/plan.service'

const AssignPlanInline = ({ userId, currentPlanId }) => {
  const [selectedPlan, setSelectedPlan] = useState(currentPlanId || '')
  const toast = useToast()
  const queryClient = useQueryClient()

  // Fetch all plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => PlansService.getPlans(),
  })

  // Only show active plans
  const activePlans = plans?.filter((plan) => plan.is_active)

  // Mutation to assign/update user plan
  const assignPlanMutation = useMutation({
    mutationFn: ({ userId, planId }) => PlansService.assignPlanToUser(userId, planId),
    onSuccess: () => {
      toast({
        title: 'Plan assigned successfully',
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
      queryClient.invalidateQueries(['user', userId]) // refresh user data
    },
    onError: (err) => {
      toast({
        title: 'Failed to assign plan',
        description: err.message || 'Try again later.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    },
  })

  const handleAssign = () => {
    if (!selectedPlan) return
    assignPlanMutation.mutate({ userId, planId: selectedPlan })
  }

  useEffect(() => {
    setSelectedPlan(currentPlanId)
  }, [currentPlanId])

  return (
    <Box w={{ base: '100%', md: '400px' }}>
      <VStack align="stretch" spacing={4}>
        {plansLoading ? (
          <Spinner size="sm" alignSelf="center" />
        ) : (
          <Select
            placeholder="Select Plan"
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
          >
            {activePlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </Select>
        )}

        <Button
          colorScheme="teal"
          onClick={handleAssign}
          isLoading={assignPlanMutation.isLoading}
          loadingText="Assigning"
          isDisabled={!selectedPlan || selectedPlan === currentPlanId}
        >
          Update Plan
        </Button>
      </VStack>
    </Box>
  )
}

export default AssignPlanInline
