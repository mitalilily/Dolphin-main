import { useEffect, useState } from 'react'

/**
 * Custom hook for managing B2B Additional Charges form state
 */
export const useB2BChargesForm = (charges) => {
  const [formData, setFormData] = useState({
    // Overhead charge fields (with dual-value fields)
    awbCharges: '',
    cftFactor: '',
    minimumChargeableAmount: '',
    minimumChargeableWeight: '',
    minimumChargeableMethod: 'whichever_is_higher',
    freeStorageDays: '',
    demurragePerAwbDay: '',
    demurragePerKgDay: '',
    demurrageMethod: 'whichever_is_higher',
    publicHolidayPickupCharge: '',
    fuelSurchargePercentage: '',
    greenTax: '',
    odaCharges: '',
    odaPerKgCharge: '',
    odaMethod: 'whichever_is_higher',
    csdDeliveryCharge: '',
    timeSpecificPerKg: '',
    timeSpecificPerAwb: '',
    timeSpecificMethod: 'whichever_is_higher',
    mallDeliveryPerKg: '',
    mallDeliveryPerAwb: '',
    mallDeliveryMethod: 'whichever_is_higher',
    deliveryReattemptPerKg: '',
    deliveryReattemptPerAwb: '',
    deliveryReattemptMethod: 'whichever_is_higher',
    handlingSinglePiece: '',
    handlingBelow100Kg: '',
    handling100To200Kg: '',
    handlingAbove200Kg: '',
    insuranceCharge: '',
    codFixedAmount: '',
    codPercentage: '',
    codMethod: 'whichever_is_higher',
    rovFixedAmount: '',
    rovPercentage: '',
    rovMethod: 'whichever_is_higher',
    liabilityLimit: '',
    liabilityMethod: 'whichever_is_lower',
  })

  // Helper function to convert database value to form value
  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return ''
    const num = Number(value)
    return isNaN(num) ? '' : num.toString()
  }

  useEffect(() => {
    if (charges) {
      // Prefill form with existing database values (with dual-value fields)
      const baseFormData = {
        awbCharges: formatValue(charges.awb_charges),
        cftFactor: formatValue(charges.cft_factor),
        minimumChargeableAmount: formatValue(charges.minimum_chargeable_amount),
        minimumChargeableWeight: formatValue(charges.minimum_chargeable_weight),
        minimumChargeableMethod: charges.minimum_chargeable_method || 'whichever_is_higher',
        freeStorageDays: formatValue(charges.free_storage_days),
        demurragePerAwbDay: formatValue(charges.demurrage_per_awb_day),
        demurragePerKgDay: formatValue(charges.demurrage_per_kg_day),
        demurrageMethod: charges.demurrage_method || 'whichever_is_higher',
        publicHolidayPickupCharge: formatValue(charges.public_holiday_pickup_charge),
        fuelSurchargePercentage: formatValue(charges.fuel_surcharge_percentage),
        greenTax: formatValue(charges.green_tax),
        odaCharges: formatValue(charges.oda_charges),
        odaPerKgCharge: formatValue(charges.oda_per_kg_charge),
        odaMethod: charges.oda_method || 'whichever_is_higher',
        csdDeliveryCharge: formatValue(charges.csd_delivery_charge),
        timeSpecificPerKg: formatValue(charges.time_specific_per_kg),
        timeSpecificPerAwb: formatValue(charges.time_specific_per_awb || 500),
        timeSpecificMethod: charges.time_specific_method || 'whichever_is_higher',
        mallDeliveryPerKg: formatValue(charges.mall_delivery_per_kg),
        mallDeliveryPerAwb: formatValue(charges.mall_delivery_per_awb || 500),
        mallDeliveryMethod: charges.mall_delivery_method || 'whichever_is_higher',
        deliveryReattemptPerKg: formatValue(charges.delivery_reattempt_per_kg),
        deliveryReattemptPerAwb: formatValue(charges.delivery_reattempt_per_awb || 500),
        deliveryReattemptMethod: charges.delivery_reattempt_method || 'whichever_is_higher',
        handlingSinglePiece: formatValue(charges.handling_single_piece),
        handlingBelow100Kg: formatValue(charges.handling_below_100_kg),
        handling100To200Kg: formatValue(charges.handling_100_to_200_kg),
        handlingAbove200Kg: formatValue(charges.handling_above_200_kg),
        insuranceCharge: formatValue(charges.insurance_charge),
        codFixedAmount: formatValue(charges.cod_fixed_amount || 50),
        codPercentage: formatValue(charges.cod_percentage || 1),
        codMethod: charges.cod_method || 'whichever_is_higher',
        rovFixedAmount: formatValue(charges.rov_fixed_amount || 100),
        rovPercentage: formatValue(charges.rov_percentage || 0.5),
        rovMethod: charges.rov_method || 'whichever_is_higher',
        liabilityLimit: formatValue(charges.liability_limit || 5000),
        liabilityMethod: charges.liability_method || 'whichever_is_lower',
      }

      setFormData(baseFormData)
    } else {
      // If no charges exist, reset to empty (admin can fill in)
      setFormData({
        awbCharges: '',
        cftFactor: '',
        minimumChargeableAmount: '',
        minimumChargeableWeight: '',
        minimumChargeableMethod: 'whichever_is_higher',
        freeStorageDays: '',
        demurragePerAwbDay: '',
        demurragePerKgDay: '',
        demurrageMethod: 'whichever_is_higher',
        publicHolidayPickupCharge: '',
        fuelSurchargePercentage: '',
        greenTax: '',
        odaCharges: '',
        odaPerKgCharge: '',
        odaMethod: 'whichever_is_higher',
        csdDeliveryCharge: '',
        timeSpecificPerKg: '',
        timeSpecificPerAwb: '',
        timeSpecificMethod: 'whichever_is_higher',
        mallDeliveryPerKg: '',
        mallDeliveryPerAwb: '',
        mallDeliveryMethod: 'whichever_is_higher',
        deliveryReattemptPerKg: '',
        deliveryReattemptPerAwb: '',
        deliveryReattemptMethod: 'whichever_is_higher',
        handlingSinglePiece: '',
        handlingBelow100Kg: '',
        handling100To200Kg: '',
        handlingAbove200Kg: '',
        insuranceCharge: '',
        codFixedAmount: '',
        codPercentage: '',
        codMethod: 'whichever_is_higher',
        rovFixedAmount: '',
        rovPercentage: '',
        rovMethod: 'whichever_is_higher',
        liabilityLimit: '',
        liabilityMethod: 'whichever_is_lower',
      })
    }
  }, [charges])

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const buildPayload = () => {
    const payload = {}

    // Map all overhead charge fields
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== undefined) {
        if (key.endsWith('Method')) {
          // Enum fields: keep as string
          const defaultMethod =
            key.includes('minimumChargeable') ||
            key.includes('demurrage') ||
            key.includes('oda') ||
            key.includes('timeSpecific') ||
            key.includes('mallDelivery') ||
            key.includes('deliveryReattempt') ||
            key.includes('cod') ||
            key.includes('rov')
              ? 'whichever_is_higher'
              : key.includes('liability')
              ? 'whichever_is_lower'
              : ''
          payload[key] = formData[key] || defaultMethod
        } else {
          // Numeric fields
          const numValue = formData[key] === '' ? 0 : Number(formData[key])
          if (!isNaN(numValue)) {
            payload[key] = numValue
          }
        }
      }
    })

    return payload
  }

  return {
    formData,
    setFormData,
    updateField,
    buildPayload,
  }
}
