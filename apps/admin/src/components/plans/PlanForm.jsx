import { Button, FormControl, FormLabel, Input, Stack } from '@chakra-ui/react'
import { useCreatePlan, useUpdatePlan } from 'hooks/usePlans'
import { useEffect, useState } from 'react'

const PlanForm = ({ plan, onClose }) => {
  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()

  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => {
    if (plan) {
      setForm({ name: plan.name, description: plan.description || '' })
    } else {
      setForm({ name: '', description: '' })
    }
  }, [plan])

  const handleSubmit = () => {
    if (plan) {
      updatePlan.mutate({ id: plan.id, data: form }, { onSuccess: onClose })
    } else {
      createPlan.mutate(form, { onSuccess: onClose })
    }
  }

  return (
    <Stack spacing={4}>
      <FormControl>
        <FormLabel>Name</FormLabel>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </FormControl>
      <FormControl>
        <FormLabel>Description</FormLabel>
        <Input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </FormControl>
      <Button colorScheme="blue" onClick={handleSubmit}>
        {plan ? 'Update Plan' : 'Create Plan'}
      </Button>
    </Stack>
  )
}

export default PlanForm
