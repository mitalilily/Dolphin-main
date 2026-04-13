import { Button, Flex, FormControl, FormLabel, Input, useToast } from '@chakra-ui/react'
import { useCreateCourier } from 'hooks/useCouriers'
import { useState } from 'react'
import CustomModal from './CustomModal'

const AddCourierModal = ({ isOpen, onClose }) => {
  console.log('isopen', isOpen)
  const toast = useToast()
  const { mutate, isLoading } = useCreateCourier()
  const [name, setName] = useState('')

  const handleSubmit = () => {
    if (!name.trim()) {
      return toast({ title: 'Courier name is required', status: 'warning' })
    }

    mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          toast({ title: 'Courier added successfully', status: 'success' })
          setName('')
          onClose()
        },
        onError: () => {
          toast({ title: 'Failed to add courier', status: 'error' })
        },
      },
    )
  }

  if (!isOpen) return null

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Courier"
      footer={
        <Flex justify="flex-end" gap={2}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={isLoading}>
            Add Courier
          </Button>
        </Flex>
      }
    >
      <Flex direction="column" p={6} gap={4} bg="white" borderRadius="md" minW="300px">
        <FormControl>
          <FormLabel>Courier Name</FormLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </FormControl>
      </Flex>{' '}
    </CustomModal>
  )
}

export default AddCourierModal
