import { HamburgerIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Stack,
  Text,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react'
import IconBox from 'components/Icons/IconBox'
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { adminBrand } from 'theme/brand'

function SidebarResponsive(props) {
  const location = useLocation()
  const mainPanel = React.useRef()

  const activeRoute = (routeName) => (location.pathname === routeName ? 'active' : '')

  const drawerBg = useColorModeValue('rgba(255,255,255,0.98)', 'rgba(16, 24, 40, 0.98)')
  const activeBg = useColorModeValue('rgba(198,231,255,0.24)', 'rgba(143, 212, 255, 0.16)')
  const hoverBg = useColorModeValue('rgba(255,221,174,0.22)', 'rgba(255, 255, 255, 0.08)')
  const textColor = useColorModeValue('gray.700', 'gray.100')
  const iconColor = useColorModeValue('gray.500', 'gray.300')
  const activeTextColor = adminBrand.ink
  const dividerColor = useColorModeValue('rgba(16, 50, 74, 0.1)', 'rgba(143, 212, 255, 0.18)')
  const hamburgerSurface = useColorModeValue('rgba(255,255,255,0.72)', 'rgba(16, 24, 40, 0.82)')
  const hamburgerBorder = useColorModeValue('rgba(12,59,128,0.12)', 'rgba(255,255,255,0.12)')
  const defaultHamburgerColor = useColorModeValue('gray.700', 'gray.200')
  const hamburgerColor = props.secondary ? 'white' : defaultHamburgerColor

  const createLinks = (routes) => {
    return routes
      .filter((prop) => prop.show !== false)
      .map((prop) => {
        if (prop.redirect) return null

        if (prop.category) {
          return (
            <Box key={prop.name}>
              <Text color={textColor} fontWeight="800" mb="12px" ps="14px" pt="8px" fontSize="11px" textTransform="uppercase" letterSpacing="0.14em">
                {document.documentElement.dir === 'rtl' ? prop.rtlName : prop.name}
              </Text>
              {createLinks(prop.views)}
            </Box>
          )
        }

        const isActive = activeRoute(prop.layout + prop.path) === 'active'

        return (
          <NavLink to={prop.layout + prop.path} key={prop.name}>
            <Button
              boxSize="initial"
              justifyContent="flex-start"
              alignItems="center"
              bg={isActive ? activeBg : 'transparent'}
              mb="10px"
              px="14px"
              py="13px"
              borderRadius="18px"
              w="100%"
              border="1px solid"
              borderColor={isActive ? 'rgba(198,231,255,0.4)' : 'transparent'}
              _hover={{ bg: hoverBg, transform: 'translateX(2px)' }}
              _active={{ bg: 'inherit', transform: 'none' }}
              _focus={{ boxShadow: 'none' }}
              transition="all 0.2s ease"
            >
              <Flex align="center">
                <IconBox
                  bg={isActive ? 'rgba(198,231,255,0.48)' : 'rgba(198,231,255,0.18)'}
                  color={isActive ? activeTextColor : iconColor}
                  h="34px"
                  w="34px"
                  me="12px"
                  borderRadius="14px"
                >
                  {prop.icon}
                </IconBox>
                <Text color={isActive ? activeTextColor : textColor} my="auto" fontSize="sm" fontWeight={isActive ? '700' : '600'}>
                  {document.documentElement.dir === 'rtl' ? prop.rtlName : prop.name}
                </Text>
              </Flex>
            </Button>
          </NavLink>
        )
      })
  }

  const { logoText, routes } = props
  const links = <>{createLinks(routes)}</>

  const brand = (
    <Box pt="26px" mb="12px">
      <Flex align="center" justify="center" gap="10px" mb="18px" fontWeight="bold" direction="column">
        <Box as="img" src={adminBrand.logo} alt={adminBrand.panelName} h="44px" w="168px" objectFit="contain" />
        <Text fontSize="xs" color={textColor} fontWeight="700" textTransform="uppercase" letterSpacing="0.16em">
          {logoText}
        </Text>
      </Flex>
      <Box h="1px" bg={dividerColor} mx="6px" mb="14px" />
    </Box>
  )

  const { isOpen, onOpen, onClose } = useDisclosure()
  const btnRef = React.useRef()
  return (
    <Flex display={{ sm: 'flex', xl: 'none' }} ref={mainPanel} alignItems="center">
      <Box
        ref={btnRef}
        cursor="pointer"
        onClick={onOpen}
        p="9px"
        borderRadius="16px"
        bg={hamburgerSurface}
        border="1px solid"
        borderColor={hamburgerBorder}
        boxShadow="0 12px 24px rgba(36,26,27,0.08)"
      >
        <HamburgerIcon color={hamburgerColor} w="20px" h="20px" />
      </Box>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        placement={document.documentElement.dir === 'rtl' ? 'right' : 'left'}
        finalFocusRef={btnRef}
      >
        <DrawerOverlay bg="blackAlpha.500" backdropFilter="blur(7px)" />
        <DrawerContent
          w="296px"
          maxW="296px"
          borderRadius="0 26px 26px 0"
          bg={drawerBg}
          borderRight="1px solid rgba(16,50,74,0.08)"
          boxShadow="0 28px 56px rgba(15,44,67,0.16)"
        >
          <DrawerCloseButton _focus={{ boxShadow: 'none' }} color={textColor} />
          <DrawerBody px="14px" pt="2">
            <Box maxW="100%" h="100vh">
              {brand}
              <Stack direction="column" mb="40px">
                <Box>{links}</Box>
              </Stack>
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  )
}

export default SidebarResponsive
