import { Box, Flex, Link, Text, useColorModeValue } from '@chakra-ui/react'

export default function Footer() {
  const textColor = useColorModeValue('rgba(36,26,27,0.64)', 'gray.400')
  const linkColor = useColorModeValue('brand.500', 'brand.300')
  const borderColor = useColorModeValue('rgba(12,59,128,0.08)', 'rgba(255,255,255,0.08)')

  return (
    <Flex
      flexDirection={{ base: 'column', xl: 'row' }}
      alignItems={{ base: 'center', xl: 'center' }}
      justifyContent="space-between"
      px="30px"
      py="22px"
      w="100%"
      mt="16px"
    >
      <Box
        px="18px"
        py="14px"
        borderRadius="20px"
        border="1px solid"
        borderColor={borderColor}
        bg={useColorModeValue('rgba(255,251,246,0.74)', 'rgba(15,27,45,0.72)')}
      >
        <Text
          color={textColor}
          textAlign={{ base: 'center', xl: 'start' }}
          fontSize="sm"
        >
          &copy; {new Date().getFullYear()} SkyRush Express Courier admin workspace.
          <Link
            color={linkColor}
            href="https://resonant-piroshki-dcb9ff.netlify.app/"
            target="_blank"
            fontWeight="semibold"
            ms="6px"
          >
            Updated design system
          </Link>
        </Text>
      </Box>
    </Flex>
  )
}
