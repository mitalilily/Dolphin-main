import { Flex, Link, Text, useColorModeValue } from '@chakra-ui/react'
import { adminBrand } from 'theme/brand'

export default function Footer() {
  const textColor = useColorModeValue('rgba(95,122,143,0.84)', 'gray.400')
  const linkColor = useColorModeValue('brand.500', 'brand.300')
  const borderColor = useColorModeValue('rgba(16,50,74,0.08)', 'rgba(255,255,255,0.08)')
  const landingUrl = process.env.REACT_APP_LANDING_URL || '/'

  return (
    <Flex
      flexDirection="row"
      alignItems={{ base: 'center', xl: 'center' }}
      justifyContent="space-between"
      px="30px"
      py="22px"
      w="100%"
      mt="16px"
    >
      <Flex
        px="18px"
        py="14px"
        w="100%"
        alignItems="center"
        justifyContent="space-between"
        flexDirection={{ base: 'column', md: 'row' }}
        gap={{ base: '8px', md: '16px' }}
        borderRadius="20px"
        border="1px solid"
        borderColor={borderColor}
        bg={useColorModeValue('rgba(255,255,255,0.74)', 'rgba(15,27,45,0.72)')}
      >
        <Text
          color={textColor}
          textAlign={{ base: 'center', xl: 'start' }}
          fontSize="sm"
        >
          &copy; 2026{' '}
          <Link
            color={linkColor}
            href={landingUrl}
            fontWeight="semibold"
            _hover={{ textDecoration: 'none', color: linkColor }}
          >
            {adminBrand.panelName}
          </Link>
          .
        </Text>
        <Text color={textColor} textAlign={{ base: 'center', md: 'end' }} fontSize="sm">
          <Link
            color={linkColor}
            href="https://searchcraftdigital.com/"
            target="_blank"
            rel="noopener noreferrer"
            fontWeight="semibold"
            _hover={{ textDecoration: 'none', color: linkColor }}
          >
            Crafted by SearchCraft Digital
          </Link>
        </Text>
      </Flex>
    </Flex>
  )
}
