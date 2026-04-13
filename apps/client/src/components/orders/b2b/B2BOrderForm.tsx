import { Box, Button, Stack, Step, StepLabel, Stepper } from '@mui/material'
import { useEffect, useState } from 'react'
import { FormProvider, useForm, type FieldErrors } from 'react-hook-form'
import { BiRupee } from 'react-icons/bi'
import { FaBox, FaFileInvoice, FaTruck, FaUser } from 'react-icons/fa'
import { useLocation, useNavigate } from 'react-router-dom'
import type { CreateB2BShipmentParams } from '../../../api/order.service'
import { useCreateB2BShipment } from '../../../hooks/Orders/useOrders'
import { usePaymentOptions } from '../../../hooks/usePaymentOptions'
import FormSectionAccordion from '../../UI/accordion/FormSectionAccordion'
import AmountSummaryCard from '../AmountSummaryCard'
import DeliveryDetailsForm from '../DeliveryDetailsForm'
import OptionalChargesForm from '../OptionalChargesForm'
import OrderDetailsForm from '../OrderDetailsForm'
import PickupLocationForm from '../PickupLocationForm'
import { SelectCourierForm } from '../SelectCourierForm'
import B2BInvoicesForm from './B2BInvoicesForm'
import B2BProductsForm from './B2BProductsForm'
// Box structure - top level array
export type Box = {
  lengthCm: number
  breadthCm: number
  heightCm: number
  weightKg: number
}

// Invoice structure - array of invoices
export type Invoice = {
  invoiceNumber: string
  invoiceDate: string
  invoiceValue: number
  invoiceFileUrl?: string
}

// Main Form Data
export type B2BFormData = {
  // Buyer details
  buyerName: string
  buyerPhone: string
  buyerEmail: string
  address: string
  pincode: string
  companyName: string
  gstin?: string
  city: string
  state: string
  country: string

  // Boxes array (top level)
  boxes: Box[]

  // Invoices array
  invoices: Invoice[]

  // Shipment package info (optional if using boxes)
  weight?: number
  length?: number
  breadth?: number
  height?: number

  // Order details
  orderId: string
  orderDate: string
  orderType: 'prepaid' | 'cod'
  orderAmount: number

  // Courier details
  courierPartner: string
  courierPartnerId: string
  courierOptionKey?: string
  shippingCharges?: number
  transactionFee?: number
  giftWrap?: number
  discount?: number
  prepaidAmount?: number
  courierCod?: number
  courierCost?: number | null // Estimated courier cost from serviceability (what platform pays courier)
  forwardCharges?: number
  otherCharges?: number
  integrationType?: 'delhivery'

  // Pickup location (optional)
  pickupLocationId?: string
  pickupLocationPincode?: string
  pickupLocationName?: string
  pickupAddress?: string
  pickupLocationPOCName?: string
  pickupLocationPOCPhone?: string
  pickupCity?: string
  pickupState?: string
  pickupDate?: string
  pickupTime?: string

  // RTO location (for B2B, typically same as pickup)
  isRtoSame?: boolean
  rtoLocationPincode?: string
  rtoLocationName?: string
  rtoAddress?: string
  rtoLocationPOCName?: string
  rtoLocationPOCPhone?: string
  rtoCity?: string
  rtoState?: string

  // Insurance
  isInsurance?: boolean
  zone?: string
  zoneId?: string
}

export default function B2BOrderForm({ onClose }: { onClose?: () => void }) {
  const createShipmentMutation = useCreateB2BShipment(onClose)
  const navigate = useNavigate()
  const location = useLocation()
  const [currentStep, setCurrentStep] = useState(0)
  const steps = ['Order & Delivery', 'Pickup Location', 'Courier Selection']
  const { data: paymentOptions } = usePaymentOptions()

  // Determine default order type based on enabled payment options
  const getDefaultOrderType = (): 'prepaid' | 'cod' => {
    if (!paymentOptions) return 'prepaid' // Default fallback
    if (paymentOptions.codEnabled) return 'cod'
    if (paymentOptions.prepaidEnabled) return 'prepaid'
    return 'prepaid' // Final fallback
  }

  const methods = useForm<B2BFormData>({
    defaultValues: {
      boxes: [
        {
          lengthCm: 0,
          breadthCm: 0,
          heightCm: 0,
          weightKg: 0,
        },
      ],
      invoices: [
        {
          invoiceNumber: '',
          invoiceDate: '',
          invoiceValue: 0,
          invoiceFileUrl: '',
        },
      ],
      weight: 0,
      length: 0,
      breadth: 0,
      height: 0,
      orderType: getDefaultOrderType(),
    },
  })

  const {
    watch,
    setValue,
    handleSubmit,
    trigger,
    formState: { errors },
  } = methods

  const transactionFee = Number(watch('transactionFee') || 0)
  const discount = Number(watch('discount') || 0)
  const prepaidAmount = Number(watch('prepaidAmount') || 0)
  const orderType = watch('orderType')

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

  // Calculate subtotal from invoices
  const subtotal = (watch('invoices') || []).reduce(
    (sum, invoice) => sum + Number(invoice.invoiceValue || 0),
    0,
  )

  const totalOrderValue = subtotal + transactionFee - discount
  const totalCollectable = totalOrderValue - prepaidAmount
  const onSubmit = async (data: B2BFormData) => {
    try {
      const normalizedOrderId = data.orderId.trim()

      if (!normalizedOrderId) {
        methods.setError('orderId', {
          type: 'manual',
          message: 'Order ID is required',
        })
        return
      }

      // Prepare B2B shipment payload
      const payload: CreateB2BShipmentParams = {
        order_number: normalizedOrderId,
        order_date: data.orderDate,
        payment_type: data.orderType,
        order_amount: totalCollectable,
        shipping_charges: 0,
        freight_charges: data.forwardCharges ?? 0, // What platform charges seller (based on rate card)
        courier_cost: data.courierCost ? Number(data.courierCost) : undefined, // Estimated courier cost from serviceability (what platform pays courier)
        transaction_fee: data.transactionFee ?? 0,
        discount: data.discount ?? 0,
        gift_wrap: 0,
        prepaid_amount: data.prepaidAmount ?? 0,
        consignee: {
          name: data.buyerName,
          phone: data.buyerPhone,
          email: data.buyerEmail,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          company_name: data.companyName,
          gstin: data.gstin,
        },

        pickup: {
          warehouse_name: data.pickupLocationName ?? '',
          address: data.pickupAddress ?? '',
          name: data.pickupLocationPOCName ?? '',
          city: data.city,
          state: data.state,
          pincode: data.pickupLocationPincode ?? data.pincode,
          phone: data.buyerPhone,
        },
        pickup_location_id: data.pickupLocationId,
        // Boxes array
        boxes:
          data?.boxes?.map((box) => ({
            lengthCm: Number(box.lengthCm || 0),
            breadthCm: Number(box.breadthCm || 0),
            heightCm: Number(box.heightCm || 0),
            weightKg: Number(box.weightKg || 0),
          })) ?? [],

        // Invoices array
        invoices:
          data?.invoices?.map((invoice) => ({
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.invoiceDate,
            invoiceValue: Number(invoice.invoiceValue || 0),
            invoiceFileUrl: invoice.invoiceFileUrl || undefined,
          })) ?? [],
        courier_id: Number(data.courierPartnerId),
        courier_partner: data.courierPartner,
        is_insurance: !!data.isInsurance,
        is_rto_different: data.isRtoSame === false ? 'yes' : 'no',
        request_auto_pickup: 'no',
        tags: '',
        delivery_location: data.zone,
        zone_id: data.zoneId,
      }

      // Add RTO details if RTO is different from pickup
      if (data.isRtoSame === false && data.rtoLocationPincode) {
        payload.rto = {
          warehouse_name: data.rtoLocationName ?? '',
          name: data.rtoLocationPOCName ?? '',
          address: data.rtoAddress ?? '',
          city: data.rtoCity ?? '',
          state: data.rtoState ?? '',
          pincode: data.rtoLocationPincode ?? '',
          phone: data.rtoLocationPOCPhone ?? data.buyerPhone,
        }
      }

      // Add pickup date/time if provided
      if (data.pickupDate) {
        payload.pickup_date = data.pickupDate
      }
      if (data.pickupTime) {
        payload.pickup_time = data.pickupTime
      }

      // Add integration type if provided
      if (data.integrationType) {
        payload.integration_type = data.integrationType
      }

      console.log('B2B Shipment Payload:', payload)

      // Call the mutation
      createShipmentMutation.mutate(payload, {
        onSuccess: () => {
          if (location.pathname === '/orders/create') {
            navigate('/orders/list?status=pending')
          }
        },
      })
    } catch (error) {
      console.error('Error preparing B2B shipment payload:', error)
    }
  }

  const nextStep = async () => {
    const valid = await trigger()
    if (valid) setCurrentStep((prev) => Math.min(prev + 1, 2))
  }

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0))

  useEffect(() => {
    setValue('orderAmount', totalCollectable, { shouldValidate: true })
  }, [totalCollectable])

  return (
    <FormProvider {...methods}>
      <Stack gap={2} sx={{ height: '100%', position: 'relative' }}>
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ flex: 1, overflowY: 'auto', p: 2 }}
        >
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)',
              borderRadius: '16px',
              mb: 3,
              boxShadow: '0 8px 24px rgba(26, 35, 126, 0.4), 0 4px 8px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Stepper
              activeStep={currentStep}
              alternativeLabel
              sx={{
                '& .MuiStepConnector-root': {
                  top: '22px',
                  left: 'calc(-50% + 20px)',
                  right: 'calc(50% + 20px)',
                },
                '& .MuiStepConnector-line': {
                  borderTopWidth: '3px',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '& .Mui-active .MuiStepConnector-line': {
                  borderColor: '#4caf50',
                },
                '& .Mui-completed .MuiStepConnector-line': {
                  borderColor: '#4caf50',
                },
              }}
            >
              {steps.map((label, index) => (
                <Step key={label} completed={index < currentStep} active={index === currentStep}>
                  <StepLabel
                    StepIconComponent={({ active, completed, icon }) => (
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: active
                            ? '#4caf50'
                            : completed
                            ? '#4caf50'
                            : 'rgba(255, 255, 255, 0.2)',
                          border: active
                            ? '3px solid #ffffff'
                            : completed
                            ? '3px solid #ffffff'
                            : '3px solid rgba(255, 255, 255, 0.4)',
                          boxShadow: active
                            ? '0 0 0 4px rgba(76, 175, 80, 0.3), 0 4px 12px rgba(76, 175, 80, 0.4)'
                            : completed
                            ? '0 4px 8px rgba(76, 175, 80, 0.3)'
                            : '0 2px 4px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.3s ease',
                          fontSize: '18px',
                          fontWeight: 700,
                          color: '#ffffff',
                        }}
                      >
                        {completed ? '✓' : icon}
                      </Box>
                    )}
                    sx={{
                      '& .MuiStepLabel-label': {
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: 600,
                        fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                        mt: 1,
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                      },
                      '& .MuiStepLabel-label.Mui-active': {
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1.05rem' },
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                      },
                      '& .MuiStepLabel-label.Mui-completed': {
                        color: '#c8e6c9',
                        fontWeight: 600,
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {currentStep === 0 && (
            <Stack gap={2} mb={2}>
              <FormSectionAccordion title="Order Details" icon={<FaBox />} defaultExpanded>
                <OrderDetailsForm />
              </FormSectionAccordion>

              <FormSectionAccordion title="Recipient Details" icon={<FaUser />} defaultExpanded>
                <DeliveryDetailsForm type="b2b" />
              </FormSectionAccordion>

              {/* Boxes */}
              <FormSectionAccordion title="Boxes" icon={<FaBox />} defaultExpanded>
                <B2BProductsForm />
              </FormSectionAccordion>

              {/* Invoices */}
              <FormSectionAccordion title="Invoices" icon={<FaFileInvoice />} defaultExpanded>
                <B2BInvoicesForm />
              </FormSectionAccordion>

              {/* Products */}
              <FormSectionAccordion title="Products & Boxes" icon={<FaBox />} defaultExpanded>
                <B2BProductsForm />
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
                errors={errors as FieldErrors<B2BFormData>}
              />
            </Stack>
          )}

          {currentStep === 1 && <PickupLocationForm />}

          {currentStep === 2 && (
            <FormSectionAccordion title="Courier Selection" icon={<FaTruck />} defaultExpanded>
              <SelectCourierForm shipment_type="b2b" />
            </FormSectionAccordion>
          )}

          <Box
            sx={{
              py: 2,
              px: 2,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '15px',
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <Stack direction="row" justifyContent="space-between">
              {currentStep > 0 && (
                <Button
                  loading={createShipmentMutation?.isPending}
                  variant="outlined"
                  onClick={prevStep}
                >
                  Back
                </Button>
              )}
              {currentStep < 2 ? (
                <Button variant="contained" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  onClick={handleSubmit(onSubmit)}
                  color="primary"
                  loading={createShipmentMutation?.isPending}
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
