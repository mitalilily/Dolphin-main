import {
  alpha,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { BiRupee } from 'react-icons/bi'
import CourierRateCards from '../../components/CourierRateCard'
import B2BRateCalculator from '../../components/tools/B2BRateCalculator'
import B2CRateCalculator from '../../components/tools/B2CRateCalculator'
import CustomIconLoadingButton from '../../components/UI/button/CustomLoadingButton'
import PageHeading from '../../components/UI/heading/PageHeading'
import CustomInput from '../../components/UI/inputs/CustomInput'
import { SmartTabs } from '../../components/UI/tab/Tabs'
import { DE_BLUE } from '../../components/user/profile/UserProfileForm'
import { useAvailableCouriersMutation } from '../../hooks/Integrations/useCouriers'
import { usePaymentOptions } from '../../hooks/usePaymentOptions'
import { usePincodeLookup } from '../../hooks/User/usePincodeLookup'
import { defaultLogo } from '../../utils/constants'

type ShipmentType = 'b2b' | 'b2c'
const BRAND_GREEN = '#56C0A5'

const termsAndConditions = {
  b2c: [
    'Above Shared Commercials are Exclusive GST.',
    'Above pricing subject to change based on courier company updation or change in any commercials.',
    'Freight Weight is Picked - Volumetric or Dead weight whichever is higher will be charged.',
    "Return charges as same as Forward for currier's where special RTO pricing is not shared.",
    'Fixed COD charge or COD % of the order value whichever is higher.',
    'Other charges like address correction charges if applicable shall be charged extra.',
    'Prohibited item not to be ship, if any penalty will charge to seller.',
    'No Claim would be entertained for Glassware, Fragile products, Concealed damages and improper packaging.',
    'Any weight dispute due to incorrect weight declaration cannot be claimed.',
    'Chargeable weight would be volumetric or actual weight, whichever is higher (LxBxH/5000).',
    'Delhivery 2 KG, 5 KG & 10 KG accounts have 4000 volumetric divisor.',
    'Liability of Reverse QC check - maximum limit INR 2000 or product value whichever is lower.',
  ],
  b2b: [
    'Above Shared Commercials are Exclusive GST.',
    'Above pricing subject to change based on courier company updation or change in any commercials.',
    'Freight Weight is Picked - Volumetric or Dead weight whichever is higher will be charged.',
    'Other charges like address correction charges if applicable shall be charged extra.',
    'Prohibited item not to be ship, if any penalty will charge to seller.',
    'No Claim would be entertained for Glassware, Fragile products, Concealed damages and improper packaging.',
    'Any weight dispute due to incorrect weight declaration cannot be claimed.',
    'Chargeable weight would be volumetric or actual weight, whichever is higher.',
    'Delhivery: (LxBxH/27000)*CFT',
    {
      text: 'The Transporter Id are as Follows',
      sub: ['Delhivery B2B is 06AAPCS9575E1ZR'],
    },
  ],
}

export const cardStyles = {
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 3,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any

export function RateCalculator() {
  const { mutateAsync, isPending, isError, error } = useAvailableCouriersMutation()
  const couriersRef = useRef<HTMLDivElement | null>(null) // 👈 ref for scrolling
  const [shipmentType, setShipmentType] = useState<ShipmentType>('b2c')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [availableCouriers, setAvailableCouriers] = useState<any[]>([])
  const { data: paymentOptions } = usePaymentOptions()

  const methods = useForm({
    mode: 'onBlur',
    defaultValues: {
      pickupPincode: '',
      pickupCity: '',
      pickupState: '',
      deliveryPincode: '',
      deliveryCity: '',
      deliveryState: '',
      paymentType: 'cod',
      length: '',
      breadth: '',
      height: '',
      weight: '',
      totalWeight: '',
      numberOfBoxes: '',
      orderAmount: '', // ✅ added shipment value
    },
  })

  const {
    watch,
    setValue,
    setError,
    clearErrors,
    register,
    handleSubmit,
    formState: { errors },
  } = methods

  const pickupPincode = watch('pickupPincode')
  const deliveryPincode = watch('deliveryPincode')

  // ✅ Single hook handles both lookups
  const loadingPickup = usePincodeLookup(pickupPincode, 'pickup', setValue, setError, clearErrors)
  const loadingDelivery = usePincodeLookup(
    deliveryPincode,
    'delivery',
    setValue,
    setError,
    clearErrors,
  )

  // ✅ Submit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (formData: any) => {
    try {
      // convert to numbers
      const length = Number(formData.length) || 0
      const breadth = Number(formData.breadth) || 0
      const height = Number(formData.height) || 0
      const actualWeightKg = Number(formData.weight) || 0 // kg from UI

      // volumetric weight in grams
      const volumetricWeightGrams = ((length * breadth * height) / 5000) * 1000
      // convert actual weight from kg → grams
      const actualWeightGrams = actualWeightKg * 1000
      // applicable weight in grams (freeze min 500g)
      const applicableWeightGrams = Math.max(actualWeightGrams, volumetricWeightGrams, 500)

      const orderAmountValue = Number(formData.orderAmount || 0)

      const payload = {
        pickupPincode: formData.pickupPincode,
        deliveryPincode: formData.deliveryPincode,
        // 👇 send applicable weight (grams) to backend
        weight: applicableWeightGrams,
        cod: formData.paymentType === 'cod' ? Math.max(orderAmountValue, 1) : 0,
        length,
        breadth,
        height,
        orderAmount: orderAmountValue > 0 ? orderAmountValue : undefined,
        shipmentType: shipmentType,
        payment_type: formData?.paymentType,
        // Hint to backend that this is just a rate calculator call (can skip heavy live checks)
        context: 'rate_calculator',
      }

      const result = await mutateAsync(payload) // 👈 awaited
      setAvailableCouriers(result ?? [])
      console.log('Available couriers:', result)
    } catch (err) {
      setAvailableCouriers([])
      console.error('Failed fetching couriers:', err)
    }
  }

  useEffect(() => {
    if (availableCouriers?.length > 0 && couriersRef.current) {
      couriersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [availableCouriers])

  useEffect(() => {
    setAvailableCouriers([])
  }, [shipmentType])

  // Set default payment type based on enabled options
  useEffect(() => {
    if (paymentOptions) {
      const currentPaymentType = methods.watch('paymentType')
      const isCurrentEnabled =
        (currentPaymentType === 'cod' && paymentOptions.codEnabled) ||
        (currentPaymentType === 'prepaid' && paymentOptions.prepaidEnabled)

      if (!isCurrentEnabled) {
        // Set to first available option
        if (paymentOptions.codEnabled) {
          methods.setValue('paymentType', 'cod')
        } else if (paymentOptions.prepaidEnabled) {
          methods.setValue('paymentType', 'prepaid')
        }
      }
    }
  }, [paymentOptions, methods])

  return (
    <Stack>
      <PageHeading
        eyebrow="Tools Panel"
        title="Rate Calculator"
        subtitle="Estimate shipping charges, compare courier availability, and validate shipment economics in a cleaner utility panel."
      />
      <FormProvider {...methods}>
        <CardContent
          sx={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            p: 3,
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
            Rate Calculator
          </Typography>

          {/* Tabs */}
          <SmartTabs
            value={shipmentType}
            onChange={(val) => setShipmentType(val)}
            tabs={[
              { label: 'B2C', value: 'b2c' },
              { label: 'B2B', value: 'b2b' },
            ]}
          />

          <Divider sx={{ my: 2 }} />

          {/* Pickup Section */}
          <Grid container spacing={2}>
            <Grid size={4}>
              <CustomInput
                label="Pickup Pincode"
                {...register('pickupPincode', {
                  required: 'Pickup pincode is required',
                  pattern: {
                    value: /^[1-9][0-9]{5}$/,
                    message: 'Enter valid 6-digit pincode',
                  },
                })}
                error={!!errors.pickupPincode}
                helperText={errors.pickupPincode?.message as string}
                fullWidth
              />
            </Grid>
            <Grid size={4}>
              <CustomInput
                label="Pickup City"
                {...register('pickupCity')}
                fullWidth
                disabled
                postfix={loadingPickup ? <CircularProgress size={16} /> : null}
              />
            </Grid>
            <Grid size={4}>
              <CustomInput
                label="Pickup State"
                {...register('pickupState')}
                fullWidth
                disabled
                postfix={loadingPickup ? <CircularProgress size={16} /> : null}
              />
            </Grid>

            {/* Delivery Section */}
            <Grid size={4}>
              <CustomInput
                label="Delivery Pincode"
                {...register('deliveryPincode', {
                  required: 'Delivery pincode is required',
                  pattern: {
                    value: /^[1-9][0-9]{5}$/,
                    message: 'Enter valid 6-digit pincode',
                  },
                })}
                error={!!errors.deliveryPincode}
                helperText={errors.deliveryPincode?.message as string}
                fullWidth
              />
            </Grid>
            <Grid size={4}>
              <CustomInput
                label="Delivery City"
                {...register('deliveryCity')}
                fullWidth
                disabled
                postfix={loadingDelivery ? <CircularProgress size={16} /> : null}
              />
            </Grid>
            <Grid size={4}>
              <CustomInput
                label="Delivery State"
                {...register('deliveryState')}
                fullWidth
                disabled
                postfix={loadingDelivery ? <CircularProgress size={16} /> : null}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Conditional Forms */}
          {shipmentType === 'b2c' ? <B2CRateCalculator /> : <B2BRateCalculator />}

          <Divider sx={{ my: 2 }} />
          <Controller
            name="paymentType"
            control={methods?.control}
            rules={{ required: 'Please select a payment type' }}
            render={({ field, fieldState }) => (
              <Stack mb={3}>
                <Typography color="#7F8C8D" sx={{ fontSize: '15px' }}>
                  {' '}
                  Payment Type
                </Typography>
                <Stack direction={'column'} mt={2}>
                  <ToggleButtonGroup
                    value={field.value}
                    exclusive
                    onChange={(_, newValue) => {
                      if (newValue !== null) field.onChange(newValue)
                    }}
                  >
                    {(!paymentOptions || paymentOptions.prepaidEnabled) && (
                      <ToggleButton
                        value="prepaid"
                        sx={{
                          px: 3,
                          mx: 1,
                          py: 1,
                          borderRadius: '10px !important',
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          color: '#6B7280',
                          border: '1px solid #E2E8F0',
                          transition: 'all 0.25s ease',
                          '&.Mui-selected': {
                            background: BRAND_GREEN,
                            color: '#FFFFFF',
                            transform: 'scale(1.05)',
                          },
                          '&:hover': {
                            borderColor: BRAND_GREEN,
                            color: '#333369',
                          },
                        }}
                      >
                        Prepaid
                      </ToggleButton>
                    )}

                    {(!paymentOptions || paymentOptions.codEnabled) && (
                      <ToggleButton
                        value="cod"
                        sx={{
                          px: 3,
                          py: 1,
                          mx: 1,
                          borderRadius: '10px !important',
                          textTransform: 'none',
                          fontWeight: 500,
                          fontSize: '0.95rem',
                          color: '#6B7280',
                          border: '1px solid #E2E8F0',
                          transition: 'all 0.25s ease',
                          '&.Mui-selected': {
                            background: BRAND_GREEN,
                            color: '#FFFFFF',
                            transform: 'scale(1.05)',
                          },
                          '&:hover': {
                            borderColor: BRAND_GREEN,
                            color: '#333369',
                          },
                        }}
                      >
                        COD
                      </ToggleButton>
                    )}
                  </ToggleButtonGroup>

                  {fieldState?.error && (
                    <p className="text-red-500 text-sm mt-2">{fieldState.error.message}</p>
                  )}
                </Stack>
              </Stack>
            )}
          />

          <Divider sx={{ my: 2 }} />

          <Grid size={4}>
            <CustomInput
              label="Order Amount (Shipment Value)"
              type="number"
              placeholder="Enter Shipment Value"
              {...register('orderAmount', {
                required: 'Order amount is required',
                min: { value: 1, message: 'Order amount must be at least 1' },
              })}
              error={!!errors.orderAmount}
              helperText={errors.orderAmount?.message as string}
              fullWidth
              prefix={<BiRupee />}
            />
          </Grid>
          <Divider sx={{ my: 2 }} />

          <CustomIconLoadingButton
            onClick={handleSubmit(onSubmit)}
            text="Calculate Shipping Rate"
            loading={isPending}
            loadingText="Calculating..."
            styles={{
              py: 1.5,
              borderRadius: 1,
              bgcolor: DE_BLUE,
              fontWeight: 800,
              boxShadow: `0 8px 20px ${alpha(DE_BLUE, 0.3)}`,
              '&:hover': { bgcolor: '#0043A4' },
            }}
          />
        </CardContent>
      </FormProvider>
      {isPending && (
        <Typography sx={{ color: '#333369', textAlign: 'center', py: 2 }}>
          Loading available couriers...
        </Typography>
      )}

      {isError ? (
        <Typography sx={{ color: '#E74C3C', textAlign: 'center', py: 2 }}>
          Failed to fetch couriers: {error?.message ?? 'Unknown error'}
        </Typography>
      ) : (
        <CourierRateCards
          shipmentType={watch('paymentType')}
          availableCouriers={availableCouriers}
          defaultLogo={defaultLogo}
        />
      )}

      <Divider />
      <CardContent
        sx={{
          mt: 3,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          p: 3,
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ color: '#333369', fontWeight: 700 }}>
          Terms & Conditions ({shipmentType.toUpperCase()})
        </Typography>

        <Stack spacing={1}>
          {termsAndConditions[shipmentType].map((term, idx) => {
            if (typeof term === 'string') {
              return (
                <Typography
                  key={idx}
                  variant="body2"
                  sx={{ color: '#6B7280', fontSize: '0.85rem', lineHeight: 1.6 }}
                >
                  • {term}
                </Typography>
              )
            }

            // If it’s an object with sub-items
            return (
              <Stack key={idx} spacing={0.5}>
                <Typography
                  variant="body2"
                  sx={{ color: '#333369', fontSize: '0.85rem', lineHeight: 1.6, fontWeight: 600 }}
                >
                  • {term.text}
                </Typography>
                <Stack pl={3} spacing={0.3}>
                  {term.sub.map((subItem, subIdx) => (
                    <Typography
                      key={subIdx}
                      variant="body2"
                      sx={{ color: '#6B7280', fontSize: '0.8rem', lineHeight: 1.5 }}
                    >
                      ◦ {subItem}
                    </Typography>
                  ))}
                </Stack>
              </Stack>
            )
          })}
        </Stack>
      </CardContent>
    </Stack>
  )
}
