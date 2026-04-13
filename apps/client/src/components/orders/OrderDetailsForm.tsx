import { Grid, Tooltip } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { FaSync } from 'react-icons/fa'
import { checkOrderNumberAvailability } from '../../api/order.service'
import { usePaymentOptions } from '../../hooks/usePaymentOptions'
import CustomDatePicker from '../UI/inputs/CustomDatePicker'
import CustomInput from '../UI/inputs/CustomInput'
import CustomSelect from '../UI/inputs/CustomSelect'
import type { B2BFormData } from './b2b/B2BOrderForm'
import type { B2CFormData } from './b2c/B2COrderForm'

type OrderFormData = B2CFormData | B2BFormData

const getTodayDate = () => new Date().toISOString().split('T')[0]
const generateOrderId = () => `ORD-${Date.now()}`
const allOrderTypes = [
  { key: 'prepaid', label: 'Prepaid' },
  { key: 'cod', label: 'Cash on Delivery' },
]

const OrderDetailsForm = () => {
  const {
    control,
    clearErrors,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<OrderFormData>()
  const [orderIdStatus, setOrderIdStatus] = useState<
    'idle' | 'checking' | 'available' | 'unavailable' | 'error'
  >('idle')
  const [lastCheckedOrderId, setLastCheckedOrderId] = useState('')

  const { data: paymentOptions } = usePaymentOptions()

  // Filter order types based on payment options settings
  const orderTypes = useMemo(() => {
    if (!paymentOptions) return allOrderTypes

    return allOrderTypes.filter((type) => {
      if (type.key === 'cod') return paymentOptions.codEnabled
      if (type.key === 'prepaid') return paymentOptions.prepaidEnabled
      return true
    })
  }, [paymentOptions])

  const currentOrderType = watch('orderType')
  const currentOrderId = String(watch('orderId') || '').trim()

  useEffect(() => {
    setValue('orderId', generateOrderId())
    setValue('orderDate', getTodayDate())
  }, [setValue])

  useEffect(() => {
    if (!currentOrderId) {
      setOrderIdStatus('idle')
      setLastCheckedOrderId('')
      return
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setOrderIdStatus('checking')
      try {
        const response = await checkOrderNumberAvailability(currentOrderId)
        if (cancelled) return

        const available = Boolean(response?.data?.available)
        setLastCheckedOrderId(currentOrderId)
        setOrderIdStatus(available ? 'available' : 'unavailable')

        if (available) {
          if (errors?.orderId?.type === 'duplicate') {
            clearErrors('orderId')
          }
          return
        }

        setError('orderId', {
          type: 'duplicate',
          message: response?.data?.message || 'This Order ID is already used. Please choose another.',
        })
      } catch {
        if (cancelled) return
        setLastCheckedOrderId(currentOrderId)
        setOrderIdStatus('error')
      }
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [clearErrors, currentOrderId, errors?.orderId?.type, setError])

  const orderIdHelperText =
    (errors?.orderId?.message as string) ||
    (currentOrderId && orderIdStatus === 'checking'
      ? 'Checking Order ID...'
      : currentOrderId && orderIdStatus === 'available' && lastCheckedOrderId === currentOrderId
      ? 'Order ID is available.'
      : currentOrderId && orderIdStatus === 'error' && lastCheckedOrderId === currentOrderId
      ? 'Could not verify right now. Final duplicate check will run on submit.'
      : '')

  // If current order type is disabled, reset to first available option
  useEffect(() => {
    if (paymentOptions && currentOrderType) {
      const isCurrentTypeEnabled =
        (currentOrderType === 'cod' && paymentOptions.codEnabled) ||
        (currentOrderType === 'prepaid' && paymentOptions.prepaidEnabled)

      if (!isCurrentTypeEnabled && orderTypes.length > 0) {
        setValue('orderType', orderTypes[0].key as 'prepaid' | 'cod')
      }
    }
  }, [paymentOptions, currentOrderType, orderTypes, setValue])

  return (
    <Grid container spacing={2}>
      {/* Order ID */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Controller
          name="orderId"
          control={control}
          rules={{ required: 'Order ID is required' }}
          render={({ field }) => (
            <CustomInput
              label="Order ID"
              required
              {...field}
              error={!!errors?.orderId || orderIdStatus === 'unavailable'}
              helperText={orderIdHelperText}
              postfix={
                <Tooltip title="Regenerate Order ID">
                  <FaSync
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      setValue('orderId', generateOrderId(), {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                    size={12}
                  />
                </Tooltip>
              }
            />
          )}
        />
      </Grid>

      {/* Order Date */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Controller
          name="orderDate"
          control={control}
          rules={{ required: 'Order Date is required' }}
          render={({ field }) => (
            <CustomDatePicker
              label="Order Date"
              {...field}
              error={!!errors?.orderDate}
              helperText={errors?.orderDate?.message as string}
            />
          )}
        />
      </Grid>

      {/* Order Type */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Controller
          name="orderType"
          control={control}
          rules={{ required: 'Order Type is required' }}
          render={({ field }) => (
            <CustomSelect
              required
              label="Order Type"
              value={field.value || ''}
              onSelect={(value) => field.onChange(value)}
              items={orderTypes}
              helperText={(errors?.orderType?.message as string) || 'Select type'}
              error={!!errors?.orderType}
            />
          )}
        />
      </Grid>
    </Grid>
  )
}

export default OrderDetailsForm
