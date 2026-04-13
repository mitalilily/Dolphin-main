import {
  Avatar,
  Button,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import StatusBadge from 'components/Badge/StatusBadge'
import SortControls from 'components/SortControls'
import TableFilters from 'components/Tables/TableFilters'
import { useDeleteUser, useUsersWithRoleUser } from 'hooks/useUsers'
import { useState } from 'react'
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'
const userFilterOptions = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Brand, Contact, Email, POC, or Business Name',
  },
  {
    key: 'businessTypes',
    label: 'Business Type',
    type: 'multiselect',
    options: [
      { label: 'D2C', value: 'd2c' },
      { label: 'B2B', value: 'b2b' },
      { label: 'B2C', value: 'b2c' },
    ],
  },
  {
    key: 'onboardingComplete',
    label: 'Onboarding Complete',
    type: 'select',
    options: [
      { label: 'Yes', value: true },
      { label: 'No', value: false },
    ],
  },
  {
    key: 'approved',
    label: 'Account Status',
    type: 'select',
    options: [
      { label: 'Approved', value: true },
      { label: 'Not Approved', value: false },
    ],
  },
]

export default function UsersManagementPage() {
  const history = useHistory()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [filters, setFilters] = useState({})
  const [selectedUserId, setSelectedUserId] = useState(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  const deleteUserMutation = useDeleteUser()

  const handleSortByChange = (e) => {
    setSortBy(e)
    setPage(1)
  }

  const handleSortOrderChange = (e) => {
    setSortOrder(e)
    setPage(1)
  }

  const { data: usersResponse, isLoading } = useUsersWithRoleUser({
    page,
    perPage,
    sortBy,
    sortOrder,
    ...filters,
  })

  const users = usersResponse?.data ?? []
  const totalCount = usersResponse?.totalCount ?? 0

  const captions = [
    'User ID',
    'Contact Person',
    'Contact Number',
    'Email',
    'Account Status',
    'Role',
  ]
  const columnKeys = ['id', 'contactPerson', 'contactNumber', 'email', 'approved', 'role']

  const handleView = (id) => {
    history.push(`/admin/users-management/${id}/overview`)
  }

  const handleDeleteClick = (userId) => {
    setSelectedUserId(userId)
    onOpen()
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteUserMutation.mutateAsync(selectedUserId)
      toast({
        title: 'User deleted',
        description: 'User has been deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete user',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }}>
      <TableFilters
        filters={userFilterOptions}
        values={filters}
        onApply={(finalFilters) => {
          setFilters(finalFilters)
          setPage(1) // reset to first page
        }}
      />

      <GenericTable
        paginated
        loading={isLoading}
        page={page}
        setPage={setPage}
        sortByComponent={
          <SortControls
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={handleSortByChange}
            onSortOrderChange={handleSortOrderChange}
          />
        }
        totalCount={totalCount}
        perPage={perPage}
        setPerPage={setPerPage}
        title="Users Management"
        data={users}
        captions={captions}
        columnKeys={columnKeys}
        renderActions={(row) => (
          <HStack spacing={2}>
            <Button size="sm" colorScheme="blue" onClick={() => handleView(row.id)}>
              View Details
            </Button>
            <Button size="sm" colorScheme="red" onClick={() => handleDeleteClick(row.id)}>
              Delete
            </Button>
          </HStack>
        )}
        renderers={{
          approved: (value) => (
            <StatusBadge
              status={value ? 'APPROVED' : 'NOT APPROVED'}
              type={value ? 'success' : 'warning'}
            />
          ),
          contactPerson: (value, row) => (
            <Stack direction={'row'} alignItems={'center'} gap={1}>
              <Avatar
                name={value}
                src={row?.profilePicture}
                _hover={{ zIndex: '3', cursor: 'pointer' }}
                size="sm"
              />
              <span style={{ fontWeight: '500' }}>{value || '—'}</span>
            </Stack>
          ),
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure you want to delete this user?</Text>
            <Text mt={2} color="red.500" fontWeight="bold">
              This action cannot be undone!
            </Text>
            <Text mt={2} fontSize="sm" color="gray.600">
              All user data including profile, wallet, addresses, bank accounts, and KYC details
              will be permanently deleted.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteConfirm}
              isLoading={deleteUserMutation.isLoading}
            >
              Delete User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}
