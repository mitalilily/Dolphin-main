import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { jwtDecode } from 'jwt-decode'
import { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { DoorstepCourierScene } from '../../components/Brand/AnimatedCourierScene'
import { loginAdmin } from '../../services/auth.service'
import { useAuthStore } from '../../store/useAuthStore'
import { adminBrand } from '../../theme/brand'

function isTokenValid(token) {
  try {
    const decoded = jwtDecode(token)
    return decoded.exp > Date.now() / 1000
  } catch {
    return false
  }
}

function SignIn() {
  const pageBg = useColorModeValue(adminBrand.page, '#071521')
  const shellBg = useColorModeValue('rgba(255,255,255,0.94)', 'rgba(8, 25, 38, 0.92)')
  const shellBorder = useColorModeValue('rgba(16,50,74,0.08)', 'rgba(255,255,255,0.12)')
  const sideBg = useColorModeValue(
    'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(247,241,223,0.94) 100%)',
    'linear-gradient(180deg, rgba(8,25,38,0.96) 0%, rgba(16,50,74,0.94) 100%)',
  )
  const textPrimary = useColorModeValue(adminBrand.ink, 'whiteAlpha.900')
  const textSecondary = useColorModeValue(adminBrand.inkSoft, 'whiteAlpha.700')
  const inputBg = useColorModeValue('rgba(255,255,255,0.94)', 'rgba(38, 30, 25, 0.72)')
  const inputBorder = useColorModeValue('rgba(16,50,74,0.12)', 'rgba(255,255,255,0.18)')
  const iconHoverBg = useColorModeValue('rgba(16,50,74,0.06)', 'rgba(255,255,255,0.12)')
  const chipBg = useColorModeValue('rgba(198,231,255,0.22)', 'rgba(255,255,255,0.08)')
  const chipBorder = useColorModeValue('rgba(16,50,74,0.1)', 'rgba(255,255,255,0.14)')
  const brand = useColorModeValue(adminBrand.ink, '#F3E9DE')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const history = useHistory()
  const login = useAuthStore((state) => state.login)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      toast({
        title: 'Enter email and password',
        description: 'Use your admin credentials to continue.',
        status: 'warning',
        duration: 2500,
        isClosable: true,
      })
      return
    }

    setLoading(true)

    try {
      const data = await loginAdmin(email, password)

      login(data.token, data?.user?.id, data.refreshToken)

      toast({
        title: 'Login successful',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })

      history.push('/admin/dashboard')
    } catch (err) {
      const status = err?.response?.status

      toast({
        title: status === 401 ? 'Invalid email or password' : 'Unable to sign in',
        description:
          status === 401 ? 'Please use a valid admin account.' : 'Please try again in a moment.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')

    if (accessToken && refreshToken && isTokenValid(refreshToken)) {
      history.replace('/admin/dashboard')
    }
  }, [history])

  return (
    <Flex
      minH="100vh"
      bg={pageBg}
      align="center"
      justify="center"
      px={{ base: 4, md: 6 }}
      py={{ base: 6, md: 8 }}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset="0"
        bgImage={useColorModeValue(
          'radial-gradient(circle at 10% 8%, rgba(249,239,202,0.5) 0%, transparent 38%), radial-gradient(circle at 94% 2%, rgba(198,231,255,0.32) 0%, transparent 28%)',
          'radial-gradient(circle at 10% 8%, rgba(255,255,255,0.1) 0%, transparent 38%), radial-gradient(circle at 94% 2%, rgba(198,231,255,0.12) 0%, transparent 28%)',
        )}
      />

      <Flex
        as={motion.div}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        w="100%"
        maxW="1080px"
        bg={shellBg}
        border="1px solid"
        borderColor={shellBorder}
        borderRadius={{ base: '24px', lg: '32px' }}
        boxShadow={useColorModeValue(
          '0 28px 72px rgba(15,44,67,0.12)',
          '0 28px 72px rgba(0,0,0,0.38)',
        )}
        overflow="hidden"
        direction={{ base: 'column', '2xl': 'row' }}
        backdropFilter="blur(16px)"
        zIndex="1"
      >
        <Flex
          display={{ base: 'none', '2xl': 'flex' }}
          w={{ '2xl': '40%' }}
          bg={sideBg}
          color={textPrimary}
          p={{ base: 6, md: 7 }}
          direction="column"
          justify="flex-start"
          minH={{ base: '240px', '2xl': 'unset' }}
          position="relative"
          overflow="hidden"
          borderRight={{ base: 'none', '2xl': '1px solid rgba(16,50,74,0.08)' }}
        >
          <VStack align="flex-start" spacing={4} position="relative" zIndex="1">
            <HStack spacing={2.5} flexWrap="wrap">
              {['Dispatch', 'Finance', 'Visibility'].map((tag) => (
                <Box
                  key={tag}
                  px={3}
                  py={1.5}
                  borderRadius="999px"
                  bg={chipBg}
                  border={`1px solid ${chipBorder}`}
                >
                  <Text fontSize="xs" fontWeight="700" color={textSecondary}>
                    {tag}
                  </Text>
                </Box>
              ))}
            </HStack>

            <HStack spacing={3} align="center">
              <Box
                as="img"
                src={adminBrand.logo}
                alt={adminBrand.panelName}
                h="62px"
                w="224px"
                objectFit="contain"
              />
              <Text fontSize="sm" fontWeight="800" letterSpacing="0.6px" color={textSecondary}>
                ADMIN
              </Text>
            </HStack>

            <Heading
              fontFamily="'Plus Jakarta Sans', 'Barlow', sans-serif"
              fontSize={{ base: '3xl', md: '4xl' }}
              fontWeight="800"
              lineHeight="0.98"
              letterSpacing="-0.04em"
            >
              Keep every shipment
              <Text as="span" display="block" color={brand}>
                moving with clarity.
              </Text>
            </Heading>

            <Text color={textSecondary} fontSize="sm" maxW="420px" lineHeight="1.8">
              Manage orders, track activity, and oversee daily operations through a streamlined
              Dolphin admin dashboard designed to match your brand identity and seamlessly
              connected to the same backend as the client platform.
            </Text>
          </VStack>
        </Flex>

        <Flex
          w={{ base: '100%', '2xl': '60%' }}
          align="center"
          justify="center"
          px={{ base: 5, md: 8 }}
          py={{ base: 7, md: 9 }}
        >
          <Box as="form" noValidate onSubmit={handleSubmit} w="100%" maxW="460px">
            <VStack spacing={6} align="stretch">
              <Box display={{ base: 'block', md: 'none' }}>
                <DoorstepCourierScene compact />
              </Box>

              <Box>
                <HStack spacing={3} align="center" mb={4}>
                  <Box
                    as="img"
                    src={adminBrand.logo}
                    alt={adminBrand.panelName}
                    h="46px"
                    w="168px"
                    objectFit="contain"
                  />
                  <Text fontSize="xs" fontWeight="800" letterSpacing="0.18em" color={textSecondary}>
                    ADMIN
                  </Text>
                </HStack>
                <Text fontSize="xs" fontWeight="800" letterSpacing="0.7px" color={brand} mb={2}>
                  SECURE ACCESS
                </Text>
                <Heading
                  fontFamily="'Plus Jakarta Sans', 'Barlow', sans-serif"
                  fontSize={{ base: '2xl', md: '4xl' }}
                  fontWeight="800"
                  color={textPrimary}
                  lineHeight="1.02"
                  letterSpacing="-0.04em"
                >
                  Welcome back
                </Heading>
                <Text mt={2} color={textSecondary} fontSize="sm" lineHeight="1.8">
                  Sign in with your administrator credentials.
                </Text>
              </Box>

              <HStack spacing={2} flexWrap="wrap">
                {['Fast access', 'Live ops focus'].map((pill) => (
                  <Box
                    key={pill}
                    px={3}
                    py={1.5}
                    borderRadius="999px"
                    bg="rgba(255,255,255,0.78)"
                    border="1px solid rgba(23,19,16,0.08)"
                  >
                    <Text fontSize="xs" fontWeight="700" color={textPrimary}>
                      {pill}
                    </Text>
                  </Box>
                ))}
              </HStack>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="700" color={textPrimary} mb={2}>
                  Email
                </FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter admin email"
                  h="54px"
                  borderRadius="18px"
                  bg={inputBg}
                  borderColor={inputBorder}
                  _hover={{ borderColor: 'brand.400' }}
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 4px rgba(198,231,255,0.34)',
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="700" color={textPrimary} mb={2}>
                  Password
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    h="54px"
                    borderRadius="18px"
                    bg={inputBg}
                    borderColor={inputBorder}
                    pr="48px"
                    _hover={{ borderColor: 'brand.400' }}
                    _focus={{
                      borderColor: 'brand.500',
                      boxShadow: '0 0 0 4px rgba(198,231,255,0.34)',
                    }}
                  />
                  <InputRightElement h="54px" pr="10px">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      variant="ghost"
                      size="sm"
                      color={textSecondary}
                      onClick={() => setShowPassword(!showPassword)}
                      _hover={{ bg: iconHoverBg, color: brand }}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                h="54px"
                borderRadius="999px"
                bg="brand.500"
                color="white"
                fontWeight="700"
                isLoading={loading}
                loadingText="Signing in"
                _hover={{ bg: 'brand.600' }}
                _active={{ bg: 'brand.700' }}
              >
                Sign In
              </Button>
            </VStack>
          </Box>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default SignIn
