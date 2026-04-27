import { Alert, Box, Button, Chip, Paper, Stack, Typography, alpha } from '@mui/material'
import { useEffect, useState } from 'react'
import { FormProvider, useFieldArray, useForm, type FieldErrors } from 'react-hook-form'
import { BiRupee } from 'react-icons/bi'
import { FaBox, FaTruck, FaUser } from 'react-icons/fa'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchLocations } from '../../../api/locations'
import type { CreateShipmentParams } from '../../../api/order.service'
import { useCreateShipment } from '../../../hooks/Orders/useOrders'
import { usePaymentOptions } from '../../../hooks/usePaymentOptions'
import FormSectionAccordion from '../../UI/accordion/FormSectionAccordion'
import AmountSummaryCard from '../AmountSummaryCard'
import DeliveryDetailsForm from '../DeliveryDetailsForm'
import OptionalChargesForm from '../OptionalChargesForm'
import OrderDetailsForm from '../OrderDetailsForm'
import PickupLocationForm from '../PickupLocationForm'
import { SelectCourierForm } from '../SelectCourierForm'
import PackageDetailsForm from './PackageDetailsForm'
import PackageDimensionsForm from './PackageDimensionsForm'

const ACCENT = '#0D3B8E'
const TEXT_PRIMARY = '#102A54'
const TEXT_MUTED = '#496189'

export type Product = {
  productName: string
  price: number
  quantity: number
  discount?: number
  taxRate?: number
  hsnCode?: string
  sku?: string
}

export type B2CFormData = {
  buyerName: string
  buyerPhone: string
  buyerEmail: string
  address: string
  pincode: string
  city: string
  state: string
  country: string
  products: Product[]
  weight: number
  length: number
  breadth: number
  height: number
  orderId: string
  orderDate: string
  orderType: 'prepaid' | 'cod'
  courierPartner: string
  shippingCharges?: number
  transactionFee?: number
  isRtoSame?: boolean
  giftWrap?: number
  discount?: number
  prepaidAmount?: number
  courierCod?: number
  otherCharges?: number
  forwardCharges?: number
  courierCost?: number | null // Estimated courier cost from serviceability (what platform pays courier)

  rtoLocationPincode?: string
  rtoLocationName?: string
  pickupCity?: string
  pickupState?: string
  rtoCity?: string
  rtoState?: string
  rtoLocationPOCName?: string
  rtoLocationPOCPhone?: string
  rtoAddress?: string
  pickupLocationPOCPhone?: string
  pickupLocationId?: string
  pickupLocationPincode?: string
  pickupLocationName?: string
  integrationType?: 'delhivery' | 'xpressbees' | 'shipmozo' | 'icarry'
  pickupAddress?: string
  pickupLocationPOCName?: string
  courierPartnerId: string
  courierOptionKey?: string
  selectedMaxSlabWeight?: number | null
  orderAmount: number
  pickupDate: string
  pickupTime: string
  chargeableWeight?: number | null
  volumetricWeight?: number | null
  slabs?: number | null
  zone?: string
  zoneId?: string
}

export default function B2COrderFormSteps({ onClose }: { onClose?: () => void }) {
  const createShipmentMutation = useCreateShipment(onClose)
  const navigate = useNavigate()
  const location = useLocation()
  const [currentStep, setCurrentStep] = useState(0)
  const steps = ['Order & Delivery', 'Pickup Location', 'Courier Selection']
  const { data: paymentOptions } = usePaymentOptions()

  const defaultPickupDate = new Date().toISOString().split('T')[0]

  // Determine default order type based on enabled payment options
  const getDefaultOrderType = (): 'prepaid' | 'cod' => {
    if (!paymentOptions) return 'prepaid' // Default fallback
    if (paymentOptions.codEnabled) return 'cod'
    if (paymentOptions.prepaidEnabled) return 'prepaid'
    return 'prepaid' // Final fallback
  }

  const methods = useForm<B2CFormData>({
    defaultValues: {
      products: [{ productName: '', price: 0, quantity: 1 }],
      weight: 0,
      length: 0,
      breadth: 0,
      height: 0,
      courierPartnerId: '',
      pickupDate: defaultPickupDate,
      pickupTime: '',
      orderType: getDefaultOrderType(),
      selectedMaxSlabWeight: null,
    },
  })

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    trigger,
    register,
    formState: { errors },
  } = methods
  const { fields, append, remove } = useFieldArray({ control, name: 'products' })

  const shippingCharges = Number(watch('shippingCharges') || 0)
  const transactionFee = Number(watch('transactionFee') || 0)
  const giftWrap = Number(watch('giftWrap') || 0)
  const discount = Number(watch('discount') || 0)
  const prepaidAmount = Number(watch('prepaidAmount') || 0)
  const orderType = watch('orderType') || getDefaultOrderType()

  // Ensure orderType is valid based on payment options
  useEffect(() => {
    if (paymentOptions && orderType) {
      const isCurrentTypeEnabled =
        (orderType === 'cod' && paymentOptions.codEnabled) ||
        (orderType === 'prepaid' && paymentOptions.prepaidEnabled)

      if (!isCurrentTypeEnabled) {
        const newOrderType = paymentOptions.codEnabled
          ? 'cod'
          : paymentOptions.prepaidEnabled
          ? 'prepaid'
          : 'prepaid'
        setValue('orderType', newOrderType)
      }
    }
  }, [paymentOptions, orderType, setValue])

  const subtotal = fields.reduce(
    (sum, _, idx) =>
      sum +
      (watch(`products.${idx}.price`) || 0) * (watch(`products.${idx}.quantity`) || 0) -
      (watch(`products.${idx}.discount`) || 0),
    0,
  )

  // Calculate total order value (customer-facing)
  // Includes: subtotal + shipping + transaction_fee + gift_wrap - discount
  const totalOrderValue = subtotal + shippingCharges + transactionFee + giftWrap - discount
  const totalCollectable = totalOrderValue - prepaidAmount

  const onSubmit = async (data: B2CFormData) => {
    try {
      const normalizedOrderId = data.orderId.trim()

      if (!normalizedOrderId) {
        methods.setError('orderId', {
          type: 'manual',
          message: 'Order ID is required',
        })
        return
      }

      if (!data.courierPartnerId) {
        methods.setError('courierPartnerId', {
          type: 'manual',
          message: 'Please select a courier partner',
        })
        return
      }

      const payload: CreateShipmentParams = {
        order_number: normalizedOrderId,
        payment_type: data.orderType,
        order_amount: subtotal,
        order_date: data?.orderDate,
        package_weight: data.weight,
        package_length: data.length,
        cod_charges: data?.courierCod,
        package_breadth: data.breadth,
        package_height: data.height,
        shipping_charges: Number(data?.shippingCharges ?? 0), // What seller charges customer
        freight_charges: Number(data?.forwardCharges ?? 0), // What platform charges seller (based on rate card)
        courier_cost: data?.courierCost ? Number(data.courierCost) : undefined, // Estimated courier cost from serviceability (what platform pays courier)
        prepaid_amount: data?.prepaidAmount,
        is_rto_different: data?.isRtoSame ? 'no' : 'yes',
        discount: data.discount ?? 0,
        integration_type: data?.integrationType,
        transaction_fee: data?.transactionFee,
        gift_wrap: data?.giftWrap,
        consignee: {
          name: data.buyerName,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          email: data?.buyerEmail,
          phone: data.buyerPhone,
        },
        pickup_location_id: data.pickupLocationId,
        pickup: {
          warehouse_name: data?.pickupLocationName ?? '',
          address: data?.pickupAddress ?? '',
          name: data?.pickupLocationPOCName ?? '',
          phone: data?.pickupLocationPOCPhone ?? '',
          city: data?.pickupCity ?? '',
          state: data?.pickupState ?? '',
          pincode: data.pickupLocationPincode ?? data.pincode,
          pickup_date: data.pickupDate,
          pickup_time: data.pickupTime,
        },

        ...(!data?.isRtoSame && {
          rto: {
            warehouse_name: data?.rtoLocationName ?? '',
            address: data?.rtoAddress ?? '',
            name: data?.rtoLocationPOCName ?? '',
            phone: data?.rtoLocationPOCPhone ?? '',
            city: data?.rtoCity ?? '',
            state: data?.rtoState ?? '',
            pincode: data?.rtoLocationPincode ?? '',
          },
        }),
        order_items: data.products.map((p) => ({
          name: p.productName,
          sku: p.sku ?? 'NA',
          qty: p.quantity,
          price: p.price,
          hsn: p.hsnCode ?? '',
          discount: p.discount ?? 0,
          tax_rate: p.taxRate ?? 0,
        })),
        courier_id: Number(data.courierPartnerId),
        courier_option_key: data.courierOptionKey,
        selected_max_slab_weight:
          data.selectedMaxSlabWeight !== undefined && data.selectedMaxSlabWeight !== null
            ? Number(data.selectedMaxSlabWeight)
            : undefined,
        pickup_date: data.pickupDate,
        pickup_time: data.pickupTime,
        delivery_location: data.zone,
        zone_id: data.zoneId,
      }
      createShipmentMutation.mutate(payload, {
        onSuccess: () => {
          if (location.pathname === '/orders/create') {
            navigate('/orders/list?status=pending')
          }
        },
      })
    } catch (error) {
      console.error('Error submitting B2C order:', error)
    }
  }

  const validateStep = async () => {
    if (currentStep === 0) {
      const productFields = fields.flatMap((_, idx) =>
        ['productName', 'price', 'quantity'].map(
          (key) => `products.${idx}.${key}` as keyof B2CFormData,
        ),
      )

      const step1Fields: (keyof B2CFormData)[] = [
        'buyerName',
        'buyerPhone',
        'address',
        'pincode',
        'orderType',
        'city',
        'state',
        'country',
        ...productFields,
        'weight',
        'length',
        'breadth',
        'height',
      ]

      const baseValid = await trigger(step1Fields)
      if (!baseValid) return false

      // Real-time pincode serviceability check
      const pincode = watch('pincode')
      try {
        const resp = await fetchLocations({ pincode })
        const serviceable = Array.isArray(resp?.data) ? resp.data.length > 0 : !!resp?.data
        if (!serviceable) {
          methods.setError('pincode', {
            type: 'manual',
            message: 'Destination pincode not serviceable by any courier',
          })
          return false
        }
      } catch {
        // ignore transient failure, allow move if fields valid
      }

      return true
    }

    if (currentStep === 2) {
      return await trigger(['courierPartnerId'])
    }

    return true
  }

  const nextStep = async () => {
    const valid = await validateStep()
    if (valid) setCurrentStep((prev) => Math.min(prev + 1, 2))
  }

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0))

  const stepLabels = [
    { title: 'Order & Delivery', caption: 'Customer, products and package details' },
    { title: 'Pickup Location', caption: 'Pickup and RTO warehouse details' },
    { title: 'Courier Selection', caption: 'Choose the best shipping partner' },
  ]

  const stepCompletion = ((currentStep + 1) / stepLabels.length) * 100

  useEffect(() => {
    setValue('orderAmount', totalCollectable, { shouldValidate: true })
  }, [totalCollectable])

  useEffect(() => {
    register('courierPartnerId', {
      required: 'Please select a courier partner',
    })
  }, [register])

  return (
    <FormProvider {...methods}>
      <Stack
        gap={2}
        sx={{
          height: '100%',
          position: 'relative',
          p: { xs: 1, sm: 1.5, md: 2 },
          borderRadius: 4,
          border: `1px solid ${alpha(ACCENT, 0.14)}`,
          background: '#ffffff',
          boxShadow: `0 12px 30px ${alpha(ACCENT, 0.08)}`,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            px: { xs: 2, sm: 2.5, md: 3 },
            py: { xs: 2, sm: 2.25 },
            borderRadius: 3,
            border: `1px solid ${alpha(ACCENT, 0.14)}`,
            background: alpha(ACCENT, 0.03),
          }}
        >
          <Stack gap={1}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              gap={1}
            >
              <Typography variant="h6" fontWeight={800} sx={{ color: TEXT_PRIMARY }}>
                B2C Order Creation
              </Typography>
              <Chip
                label={`Step ${currentStep + 1} of ${stepLabels.length}`}
                size="small"
                sx={{
                  fontWeight: 700,
                  color: TEXT_PRIMARY,
                  backgroundColor: '#ffffff',
                  border: `1px solid ${alpha(ACCENT, 0.2)}`,
                }}
              />
            </Stack>
            <Typography variant="body2" sx={{ color: TEXT_MUTED }}>
              Build shipments faster with a guided flow. Only the active step is editable.
            </Typography>
            <Box
              sx={{
                mt: 0.5,
                width: '100%',
                height: 8,
                borderRadius: 99,
                overflow: 'hidden',
                bgcolor: alpha(ACCENT, 0.08),
                border: `1px solid ${alpha(ACCENT, 0.12)}`,
              }}
            >
              <Box
                sx={{
                  width: `${stepCompletion}%`,
                  height: '100%',
                  transition: 'width 240ms ease',
                  background: ACCENT,
                }}
              />
            </Box>
          </Stack>
        </Paper>

        <Box
          component="form"
          onSubmit={(e) => e.preventDefault()}
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: { xs: 0.5, sm: 1, md: 1.5 },
            pr: { xs: 1, sm: 2, md: 2.5 },
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(ACCENT, 0.35),
              borderRadius: '999px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: alpha(ACCENT, 0.08),
              borderRadius: '999px',
            },
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1.25} mb={2.5}>
            {stepLabels.map((step, index) => {
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              return (
                <Paper
                  key={step.title}
                  elevation={0}
                  sx={{
                    flex: 1,
                    px: 1.5,
                    py: 1.25,
                    borderRadius: 2.5,
                    border: `1px solid ${
                      isActive
                        ? alpha(ACCENT, 0.3)
                        : isCompleted
                        ? alpha(ACCENT, 0.2)
                        : alpha('#64748B', 0.25)
                    }`,
                    background: isActive
                      ? alpha(ACCENT, 0.08)
                      : isCompleted
                      ? alpha(ACCENT, 0.05)
                      : '#ffffff',
                    boxShadow: isActive ? `0 8px 20px ${alpha(ACCENT, 0.12)}` : 'none',
                    transition: 'all 200ms ease',
                  }}
                >
                  <Stack direction="row" gap={1.25} alignItems="center">
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        color: isActive || isCompleted ? '#fff' : '#6b7280',
                        bgcolor: isActive ? ACCENT : isCompleted ? alpha(ACCENT, 0.75) : '#f1f5f9',
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Stack spacing={0.1}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: TEXT_PRIMARY }}>
                        {step.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: TEXT_MUTED, lineHeight: 1.3 }}>
                        {step.caption}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              )
            })}
          </Stack>

          {/* Step content */}
          {currentStep === 0 && (
            <Stack gap={2} mb={2}>
              <FormSectionAccordion title="Order Details" icon={<FaBox />} defaultExpanded>
                <OrderDetailsForm />
              </FormSectionAccordion>

              <FormSectionAccordion title="Recipient Details" icon={<FaUser />} defaultExpanded>
                <DeliveryDetailsForm />
              </FormSectionAccordion>

              <FormSectionAccordion title="Products" icon={<FaBox />} defaultExpanded>
                <PackageDetailsForm
                  append={append}
                  control={control}
                  fields={fields}
                  remove={remove}
                />
              </FormSectionAccordion>

              <FormSectionAccordion defaultExpanded title="Package Details" icon={<FaBox />}>
                <PackageDimensionsForm />
              </FormSectionAccordion>

              <FormSectionAccordion
                title="Optional Charges & Summary"
                icon={<BiRupee />}
                defaultExpanded
              >
                <OptionalChargesForm />
              </FormSectionAccordion>

              <AmountSummaryCard
                subtotal={subtotal}
                totalCollectable={totalCollectable}
                totalOrderValue={totalOrderValue}
                errors={errors as FieldErrors<B2CFormData>}
              />
            </Stack>
          )}

          {currentStep === 1 && <PickupLocationForm />}
          {currentStep === 2 && (
            <FormSectionAccordion title="Courier Selection" icon={<FaTruck />} defaultExpanded>
              {errors.courierPartnerId && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.courierPartnerId.message as string}
                </Alert>
              )}
              <SelectCourierForm shipment_type="b2c" />

              {/* Error shown as Alert */}
            </FormSectionAccordion>
          )}

          {/* Sticky footer inside scroll */}
          <Box
            sx={{
              py: 1.5,
              px: { xs: 1.5, sm: 2.25 },
              background: '#ffffff',
              border: `1px solid ${alpha(ACCENT, 0.16)}`,
              borderRadius: '14px',
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
              mt: 2.5,
              boxShadow: `0 10px 20px ${alpha(ACCENT, 0.08)}`,
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              gap={1.5}
            >
              <Typography variant="body2" sx={{ color: TEXT_MUTED, fontWeight: 600 }}>
                {steps[currentStep]}
              </Typography>
              {currentStep > 0 && (
                <Button
                  type="button" // ✅ no accidental submit
                  loading={createShipmentMutation?.isPending}
                  variant="outlined"
                  onClick={prevStep}
                  fullWidth={false}
                  sx={{
                    minWidth: { xs: '100%', sm: 120 },
                    borderColor: alpha(ACCENT, 0.35),
                    color: ACCENT,
                    '&:hover': { borderColor: ACCENT, backgroundColor: alpha(ACCENT, 0.07) },
                  }}
                >
                  Back
                </Button>
              )}
              {currentStep < 2 ? (
                <Button
                  type="button" // ✅ no accidental submit
                  variant="contained"
                  onClick={nextStep}
                  sx={{
                    minWidth: { xs: '100%', sm: 130 },
                    fontWeight: 700,
                    background: ACCENT,
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button" // ✅ prevent browser reload
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit(onSubmit)} // ✅ react-hook-form submit
                  loading={createShipmentMutation?.isPending}
                  sx={{
                    minWidth: { xs: '100%', sm: 210 },
                    fontWeight: 800,
                    background: ACCENT,
                  }}
                >
                  Create & Book Order
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>
    </FormProvider>
  )
}
