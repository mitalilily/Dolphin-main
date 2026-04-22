import { Box, Button, Flex, HStack, Link, Text, useColorModeValue } from '@chakra-ui/react'
import SidebarResponsive from 'components/Sidebar/SidebarResponsive'
import PropTypes from 'prop-types'
import React from 'react'
import { NavLink } from 'react-router-dom'
import routes from 'routes.js'
import { adminBrand } from 'theme/brand'

const navLinks = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Orders', to: '/admin/orders' },
  { label: 'Support', to: '/admin/support' },
]

export default function AuthNavbar(props) {
  const { logoText, secondary, ...rest } = props

  const defaultMainText = useColorModeValue(adminBrand.ink, 'gray.100')
  const defaultMutedText = useColorModeValue(adminBrand.inkSoft, 'gray.400')
  const defaultNavbarBg = useColorModeValue('rgba(255,255,255,0.9)', 'rgba(8,25,38,0.94)')
  const defaultNavbarBorder = useColorModeValue('1px solid rgba(16,50,74,0.08)', '1px solid rgba(255,255,255,0.12)')
  const defaultNavbarShadow = useColorModeValue('0 18px 36px rgba(15,44,67,0.1)', '0 18px 36px rgba(0, 0, 0, 0.42)')
  const navShellBg = useColorModeValue('rgba(247,241,223,0.72)', 'rgba(255,255,255,0.06)')
  const navShellBorder = useColorModeValue('rgba(16,50,74,0.08)', 'rgba(255,255,255,0.12)')
  const navHoverBg = useColorModeValue('rgba(198,231,255,0.38)', 'rgba(255,255,255,0.08)')
  const mainText = secondary ? 'white' : defaultMainText
  const mutedText = secondary ? 'whiteAlpha.700' : defaultMutedText
  const navbarBg = secondary ? 'none' : defaultNavbarBg
  const navbarBorder = secondary ? 'none' : defaultNavbarBorder
  const navbarShadow = secondary ? 'none' : defaultNavbarShadow

  return (
    <Flex
      position={secondary ? 'absolute' : 'fixed'}
      top="12px"
      left="50%"
      transform="translate(-50%, 0px)"
      background={navbarBg}
      border={navbarBorder}
      boxShadow={navbarShadow}
      backdropFilter={secondary ? 'none' : 'blur(14px)'}
      borderRadius="20px"
      px={{ base: '12px', md: '16px' }}
      py="8px"
      mx="auto"
      width="1180px"
      maxW="94%"
      alignItems="center"
      minH="60px"
    >
      <Flex w="100%" justifyContent={{ base: 'start', lg: 'space-between' }} align="center" gap={4}>
        <Link href={`${process.env.PUBLIC_URL}/#/`} display="flex" alignItems="center" color={mainText}>
          <Box as="img" src={adminBrand.logo} alt={adminBrand.panelName} h="34px" w="126px" objectFit="contain" me="10px" />
          <Box display={{ base: 'none', md: 'block' }}>
            <Text fontSize="xs" letterSpacing="0.16em" textTransform="uppercase" fontWeight="800" color="secondary.500">
              Admin Portal
            </Text>
            <Text fontSize="sm" color={mutedText} fontWeight="700">
              Unified ops workspace
            </Text>
          </Box>
        </Link>

        <HStack
          display={{ base: 'none', lg: 'flex' }}
          spacing={1}
          px="6px"
          py="4px"
          borderRadius="999px"
          border="1px solid"
          borderColor={navShellBorder}
          bg={navShellBg}
        >
          {navLinks.map((item) => (
            <NavLink to={item.to} key={item.label}>
              <Button
                variant="ghost"
                borderRadius="999px"
                px="12px"
                minH="34px"
                fontSize="13px"
                fontWeight="700"
                color={mainText}
                _hover={{ bg: navHoverBg }}
              >
                {item.label}
              </Button>
            </NavLink>
          ))}
        </HStack>

        <Box ms={{ base: 'auto', lg: '0px' }} display={{ base: 'flex', lg: 'none' }}>
          <SidebarResponsive logoText={logoText || adminBrand.panelName} secondary={secondary} routes={routes} {...rest} />
        </Box>

        <Link href="/auth/signin" display={{ base: 'none', lg: 'block' }}>
          <Button
            bg="brand.500"
            color="white"
            fontSize="13px"
            borderRadius="999px"
            px="16px"
            minH="36px"
            _hover={{ bg: 'brand.600' }}
          >
            Admin access
          </Button>
        </Link>
      </Flex>
    </Flex>
  )
}

AuthNavbar.propTypes = {
  color: PropTypes.oneOf(['primary', 'info', 'success', 'warning', 'danger']),
  brandText: PropTypes.string,
}
