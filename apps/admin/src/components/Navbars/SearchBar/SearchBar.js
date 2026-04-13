import React from 'react'
import {
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'

export function SearchBar(props) {
  const { variant, children, ...rest } = props
  const searchIconColor = useColorModeValue('brand.500', 'brand.200')
  const inputBg = useColorModeValue('rgba(255,255,255,0.76)', 'rgba(22,30,46,0.82)')
  const inputBorder = useColorModeValue('rgba(12,59,128,0.12)', 'rgba(255,255,255,0.12)')
  const placeholderColor = useColorModeValue('gray.500', 'gray.300')

  return (
    <InputGroup
      bg={inputBg}
      borderRadius="999px"
      border="1px solid"
      borderColor={inputBorder}
      w={{ base: '100%', md: '240px' }}
      boxShadow="0 14px 28px rgba(36,26,27,0.06)"
      overflow="hidden"
      {...rest}
    >
      <InputLeftElement h="100%">
        <IconButton
          bg="transparent"
          borderRadius="inherit"
          _hover={{ bg: 'transparent' }}
          _active={{ bg: 'transparent', transform: 'none', borderColor: 'transparent' }}
          _focus={{ boxShadow: 'none' }}
          icon={<SearchIcon color={searchIconColor} w="15px" h="15px" />}
          aria-label="Search"
          size="sm"
        />
      </InputLeftElement>
      <Input
        fontSize="sm"
        py="12px"
        h="48px"
        placeholder="Search orders, sellers, tickets..."
        borderRadius="inherit"
        border="none"
        _placeholder={{ color: placeholderColor }}
        _focus={{ boxShadow: 'none' }}
      />
    </InputGroup>
  )
}
