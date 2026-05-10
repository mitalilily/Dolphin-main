'use client'

import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Input,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'
import TrackingDetails from 'components/Tools/OrderTracking/TrackingDetails'
import { useTracking } from 'hooks/useTracking'
import { useEffect, useState } from 'react'
import { FaEnvelopeOpenText, FaHashtag, FaPhoneAlt, FaReceipt, FaSearch } from 'react-icons/fa'
import { useLocation } from 'react-router-dom'
import { isValidTrackingContact, normalizeAwbParam, normalizeContactParam } from 'services/order.service'

export default function OrderTrackingPage() {
  const location = useLocation()
  const [mode, setMode] = useState('awb')
  const [form, setForm] = useState({ awb: '', orderNumber: '', contact: '' })
  const [error, setError] = useState('')
  const trackingMutation = useTracking()

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact.trim())
  const isPhone = form.contact.trim().length > 0 && normalizeContactParam(form.contact).length >= 7
  const isContactValid = !form.contact || isValidTrackingContact(form.contact)

  const canSubmit =
    mode === 'awb'
      ? normalizeAwbParam(form.awb).length > 3
      : form.orderNumber.trim().length > 2 && form.contact.trim().length > 3 && isContactValid

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    try {
      await trackingMutation.mutateAsync({
        awb: mode === 'awb' ? normalizeAwbParam(form.awb) : null,
        order: mode === 'order' ? form.orderNumber.trim() : null,
        contact: mode === 'order' ? normalizeContactParam(form.contact) : null,
      })
    } catch (err) {
      setError(err.message || 'Something went wrong')
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const awb = params.get('awb')
    if (awb) {
      const normalizedAwb = normalizeAwbParam(awb)
      setMode('awb')
      setForm({ awb: normalizedAwb, orderNumber: '', contact: '' })
      trackingMutation.mutate({ awb: normalizedAwb })
    }
  }, [location.search])

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }}>
      <Box
        bg={useColorModeValue('white', 'gray.800')}
        shadow="xl"
        rounded="2xl"
        p={{ base: 6, md: 10 }}
        mb={6}
      >
        {/* Header */}
        <Box borderBottom="1px" borderColor="gray.200" pb={6} mb={6}>
          <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="extrabold" color="gray.700">
            Track{' '}
            <Text as="span" color="brand.500">
              Order
            </Text>
          </Text>
          <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.500" mt={1}>
            Enter AWB number or order details to track shipment.
          </Text>
        </Box>

        {/* Tabs */}
        <Stack
          direction={{ base: 'column', sm: 'row' }}
          spacing={4}
          mb={6}
          align={{ base: 'stretch', sm: 'center' }}
        >
          {[
            { key: 'awb', label: 'Track by AWB' },
            { key: 'order', label: 'Track by Order ID' },
          ].map((tab) => (
            <Button
              key={tab.key}
              onClick={() => {
                setMode(tab.key)
                setForm({ awb: '', orderNumber: '', contact: '' })
                setError('')
              }}
              flex={{ base: 1, sm: 'initial' }}
              fontWeight="semibold"
              colorScheme={mode === tab.key ? 'brand' : 'gray'}
              variant={mode === tab.key ? 'solid' : 'outline'}
            >
              {tab.label}
            </Button>
          ))}
        </Stack>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            {mode === 'awb' ? (
              <FormControl>
                <FormLabel fontWeight="semibold">AWB Number</FormLabel>
                <Flex align="center" gap={2}>
                  <Icon as={FaHashtag} color="gray.400" />
                  <Input
                    placeholder="e.g. 1234567890"
                    value={form.awb}
                    onChange={(e) => handleChange('awb', e.target.value)}
                  />
                </Flex>
              </FormControl>
            ) : (
              <>
                <FormControl>
                  <FormLabel fontWeight="semibold">Order ID</FormLabel>
                  <Flex align="center" gap={2}>
                    <Icon as={FaReceipt} color="gray.400" />
                    <Input
                      placeholder="e.g. ORD-2025-0001"
                      value={form.orderNumber}
                      onChange={(e) => handleChange('orderNumber', e.target.value)}
                    />
                  </Flex>
                </FormControl>
                <FormControl>
                  <FormLabel fontWeight="semibold">
                    {isEmail ? 'Email' : isPhone ? 'Phone' : 'Email or Phone'}
                  </FormLabel>
                  <Flex align="center" gap={2}>
                    <Icon as={isEmail ? FaEnvelopeOpenText : FaPhoneAlt} color="gray.400" />
                    <Input
                      placeholder="you@example.com or +91 98765 43210"
                      value={form.contact}
                      onChange={(e) => handleChange('contact', e.target.value)}
                      borderColor={!isContactValid ? 'red.400' : undefined}
                    />
                  </Flex>
                  {!isContactValid && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      Enter a valid email or phone.
                    </Text>
                  )}
                </FormControl>
              </>
            )}

            {error && (
              <Box
                rounded="md"
                border="1px"
                borderColor="red.200"
                bg="red.50"
                color="red.700"
                fontSize="sm"
                px={3}
                py={2}
              >
                {error}
              </Box>
            )}

            {/* Buttons */}
            <Stack
              direction={{ base: 'column', sm: 'row' }}
              spacing={4}
              align={{ base: 'stretch', sm: 'center' }}
            >
              <Button
                type="submit"
                isDisabled={!canSubmit || trackingMutation.isPending}
                colorScheme="brand"
                leftIcon={<FaSearch />}
                w={{ base: '100%', sm: 'auto' }}
              >
                {trackingMutation.isPending ? 'Tracking…' : 'Track Order'}
              </Button>
              <Button
                type="button"
                variant="link"
                color="gray.500"
                onClick={() => {
                  setForm({ awb: '', orderNumber: '', contact: '' })
                }}
                w={{ base: '100%', sm: 'auto' }}
              >
                Reset
              </Button>
            </Stack>
          </VStack>
        </form>
      </Box>

      {/* Tracking Results */}
      {trackingMutation.isSuccess && (
        <TrackingDetails
          isLoading={trackingMutation?.isPending}
          data={trackingMutation?.data}
          error={trackingMutation?.error}
        />
      )}
    </Flex>
  )
}
