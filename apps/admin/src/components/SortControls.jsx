import { FormControl, FormLabel, Select, Stack, useColorModeValue } from '@chakra-ui/react'

// Available sort fields
const SORT_BY_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'email', label: 'Email' },
  { value: 'companyName', label: 'Business Name' },
  { value: 'contactPerson', label: 'Contact Person' },
]

// Available sort orders
const SORT_ORDER_OPTIONS = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
]

export default function SortControls({ sortBy, sortOrder, onSortByChange, onSortOrderChange }) {
  const selectBg = useColorModeValue('white', 'gray.700')
  const selectBorder = useColorModeValue('gray.300', 'gray.600')
  const selectHoverBorder = useColorModeValue('blue.500', 'blue.300')

  return (
    <Stack direction={'row'}>
      {/* Sort By */}
      <FormControl width={{ base: '100%', md: '170px' }} maxW="170px">
        <FormLabel htmlFor="sort-by" fontSize="sm" color="gray.600" mb={1}>
          Sort By
        </FormLabel>
        <Select
          id="sort-by"
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
          size="sm"
          bg={selectBg}
          borderColor={selectBorder}
          _hover={{ borderColor: selectHoverBorder }}
          _focus={{
            borderColor: selectHoverBorder,
            boxShadow: '0 0 0 1px blue',
          }}
          borderRadius="md"
          transition="border-color 0.2s, box-shadow 0.2s"
        >
          {SORT_BY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </FormControl>

      {/* Sort Order */}
      <FormControl width={{ base: '100%', md: '200px' }} maxW="200px">
        <FormLabel htmlFor="sort-order" fontSize="sm" color="gray.600" mb={1}>
          Sort Order
        </FormLabel>
        <Select
          id="sort-order"
          value={sortOrder}
          onChange={(e) => onSortOrderChange(e.target.value)}
          size="sm"
          bg={selectBg}
          borderColor={selectBorder}
          _hover={{ borderColor: selectHoverBorder }}
          _focus={{
            borderColor: selectHoverBorder,
            boxShadow: '0 0 0 1px blue',
          }}
          borderRadius="md"
          transition="border-color 0.2s, box-shadow 0.2s"
        >
          {SORT_ORDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </FormControl>
    </Stack>
  )
}
