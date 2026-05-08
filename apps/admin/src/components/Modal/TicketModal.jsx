import { Box, Button, FormControl, FormLabel, Select, VStack } from '@chakra-ui/react'
import CustomDatePicker from 'components/Input/CustomDatePicker'
import { useUpdateTicket } from 'hooks/useTickets'
import { useEffect, useMemo, useState } from 'react'

const statusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
]

const allowedTransitions = {
  open: ['in_progress', 'resolved', 'closed'],
  in_progress: ['open', 'resolved', 'closed'],
  resolved: ['in_progress', 'closed'],
  closed: ['open', 'in_progress'],
}

const toValidDate = (value) => {
  if (!value) return undefined
  const nextDate = value instanceof Date ? value : new Date(value)
  return Number.isNaN(nextDate.getTime()) ? undefined : nextDate
}

export const TicketModal = ({ selectedTicket, onClose }) => {
  const [editedStatus, setEditedStatus] = useState(selectedTicket?.status)
  const [editedDueDate, setEditedDueDate] = useState(
    toValidDate(selectedTicket?.dueDate || selectedTicket?.dueBy),
  )

  const { mutate: updateTicket, isPending: isUpdating } = useUpdateTicket(onClose)

  useEffect(() => {
    setEditedStatus(selectedTicket?.status || 'open')
    setEditedDueDate(toValidDate(selectedTicket?.dueDate || selectedTicket?.dueBy))
  }, [selectedTicket?.id, selectedTicket?.status, selectedTicket?.dueDate, selectedTicket?.dueBy])

  const handleStatusChange = (e) => {
    const newStatus = e.target.value
    setEditedStatus(newStatus)

    if (selectedTicket?.status === 'closed' && newStatus === 'open') {
      setEditedDueDate(undefined)
    }
  }

  const currentDueDate = useMemo(
    () => toValidDate(selectedTicket?.dueDate || selectedTicket?.dueBy),
    [selectedTicket?.dueDate, selectedTicket?.dueBy],
  )

  const handleUpdate = () => {
    if (!selectedTicket?.id) return

    const statusChanged = editedStatus !== selectedTicket?.status
    const dueByChanged =
      editedDueDate instanceof Date &&
      !Number.isNaN(editedDueDate.getTime()) &&
      (!currentDueDate || currentDueDate.toISOString() !== editedDueDate.toISOString())

    if (!statusChanged && !dueByChanged) return

    const payload = {
      ticketId: selectedTicket?.id,
      data: {},
    }

    if (statusChanged) payload.data.status = editedStatus
    if (dueByChanged) payload.data.dueDate = editedDueDate?.toISOString()

    updateTicket(payload)
  }

  const isDisabledTransition = (toStatus) => {
    const from = selectedTicket?.status

    if (!from) return true
    if (toStatus === from) return false
    return !allowedTransitions[from]?.includes(toStatus)
  }

  const showDueDatePicker = editedStatus === 'open' || editedStatus === 'in_progress'

  if (!selectedTicket) return null

  return (
    <Box px={6} py={4}>
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>Status</FormLabel>
          <Select value={editedStatus} onChange={handleStatusChange}>
            {statusOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={isDisabledTransition(option.value)}
              >
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>

        {showDueDatePicker && (
          <FormControl>
            <FormLabel>Due By</FormLabel>
            <CustomDatePicker
              selectedDate={editedDueDate}
              onChange={setEditedDueDate}
              minDate={new Date()}
            />
          </FormControl>
        )}

        <Button
          mt={2}
          colorScheme="blue"
          onClick={handleUpdate}
          isDisabled={isUpdating}
          isLoading={isUpdating}
        >
          Save
        </Button>
      </VStack>
    </Box>
  )
}
