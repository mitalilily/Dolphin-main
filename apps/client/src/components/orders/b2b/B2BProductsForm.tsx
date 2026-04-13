import { Box, Button, CircularProgress, IconButton, Paper, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { AiOutlineDelete } from 'react-icons/ai'
import axiosInstance from '../../../api/axiosInstance'
import { useDebouncedEffect } from '../../../hooks/useDebounceEffect'
import CustomInput from '../../UI/inputs/CustomInput'
import type { B2BFormData } from './B2BOrderForm'

const ProductBoxesForm = () => {
  const { control, setValue, trigger, watch } = useFormContext<B2BFormData>()
  const [weightCalculations, setWeightCalculations] = useState<{
    totalChargeableWeight: number
    cftFactor: number
    loading: boolean
  }>({
    totalChargeableWeight: 0,
    cftFactor: 5000,
    loading: false,
  })

  // Ensure boxes array exists
  const boxes = useWatch({ control, name: 'boxes' })
  if (!boxes || boxes.length === 0) {
    setValue('boxes', [
      {
        lengthCm: 0,
        breadthCm: 0,
        heightCm: 0,
        weightKg: 0,
      },
    ])
  }

  const {
    fields: boxFields,
    append: appendBox,
    remove: removeBox,
  } = useFieldArray({
    control,
    name: 'boxes',
  })

  // Watch pickup and delivery pincodes for rate calculation
  const pickupPincode = watch('pickupLocationPincode')
  const deliveryPincode = watch('pincode')
  // planId might not be in form, so we'll use undefined
  const planId = undefined

  // Calculate weight from backend using rate calculation API with debounce
  useDebouncedEffect(
    () => {
      const calculateWeights = async () => {
        // Need at least one box with dimensions
        if (!boxes || boxes.length === 0) {
          return
        }

        // Check if we have at least one box with valid dimensions
        const hasValidBox = boxes.some(
          (box) =>
            Number(box.lengthCm || 0) > 0 &&
            Number(box.breadthCm || 0) > 0 &&
            Number(box.heightCm || 0) > 0,
        )

        if (!hasValidBox) {
          // If no dimensions, use total actual weight as chargeable weight
          const totalActual = boxes.reduce((sum, box) => sum + Number(box.weightKg || 0), 0)
          setWeightCalculations({
            totalChargeableWeight: totalActual,
            cftFactor: 5000,
            loading: false,
          })
          return
        }

        setWeightCalculations((prev) => ({ ...prev, loading: true }))

        try {
          // Calculate total actual weight for API call
          const totalActualWeight = boxes.reduce((sum, box) => sum + Number(box.weightKg || 0), 0)

          // For rate calculation, we need to send dimensions
          // We'll use the largest box dimensions as representative
          let maxLength = 0
          let maxBreadth = 0
          let maxHeight = 0

          boxes.forEach((box) => {
            const length = Number(box.lengthCm || 0)
            const breadth = Number(box.breadthCm || 0)
            const height = Number(box.heightCm || 0)
            if (length > 0 && breadth > 0 && height > 0) {
              maxLength = Math.max(maxLength, length)
              maxBreadth = Math.max(maxBreadth, breadth)
              maxHeight = Math.max(maxHeight, height)
            }
          })

          // Use largest dimensions
          const length = maxLength > 0 ? maxLength : undefined
          const width = maxBreadth > 0 ? maxBreadth : undefined
          const height = maxHeight > 0 ? maxHeight : undefined

          // Call backend to get chargeable weight
          // Use default pincodes if not available (for weight calculation only)
          const apiPayload: {
            originPincode: string
            destinationPincode: string
            weightKg: number
            length?: number
            width?: number
            height?: number
            planId?: string
          } = {
            originPincode: pickupPincode || '110001',
            destinationPincode: deliveryPincode || '110001',
            weightKg: totalActualWeight,
          }

          if (length) apiPayload.length = length
          if (width) apiPayload.width = width
          if (height) apiPayload.height = height
          // planId is always undefined for now, so we skip it

          const response = await axiosInstance.post('/admin/b2b/calculate-rate', apiPayload)

          if (response.data?.data) {
            const calc = response.data.data.calculation || {}
            const config = response.data.data.config || {}

            // Get chargeable weight from backend (billableWeight)
            const totalChargeableWeight = Number(calc.billableWeight || totalActualWeight)
            const cftFactor = Number(config.cftFactor || calc.cftFactor || 5000)

            setWeightCalculations({
              totalChargeableWeight,
              cftFactor,
              loading: false,
            })
          } else {
            // Fallback if API response structure is different
            setWeightCalculations({
              totalChargeableWeight: totalActualWeight,
              cftFactor: 5000,
              loading: false,
            })
          }
        } catch (error: unknown) {
          console.error('Error calculating weights from backend:', error)
          // Fallback if API fails - calculate locally
          const totalActual = boxes.reduce((sum, box) => sum + Number(box.weightKg || 0), 0)

          // Calculate volumetric weight locally as fallback
          let totalVolume = 0
          boxes.forEach((box) => {
            const length = Number(box.lengthCm || 0)
            const breadth = Number(box.breadthCm || 0)
            const height = Number(box.heightCm || 0)
            if (length > 0 && breadth > 0 && height > 0) {
              totalVolume += (length * breadth * height) / 5000
            }
          })

          const totalChargeableWeight = Math.max(totalActual, totalVolume)

          setWeightCalculations({
            totalChargeableWeight,
            cftFactor: 5000,
            loading: false,
          })
        }
      }

      calculateWeights()
    },
    [boxes, pickupPincode, deliveryPincode, planId],
    500, // 500ms debounce delay
  )

  const columns: { name: keyof B2BFormData['boxes'][0]; label: string; type: 'text' | 'number' }[] =
    [
      { name: 'lengthCm', label: 'Length (cm)', type: 'number' },
      { name: 'breadthCm', label: 'Breadth (cm)', type: 'number' },
      { name: 'heightCm', label: 'Height (cm)', type: 'number' },
      { name: 'weightKg', label: 'Weight (kg)', type: 'number' },
    ]

  // Function to check if last row is valid
  const canAddNewRow = async () => {
    const lastIndex = boxFields.length - 1
    if (lastIndex < 0) return true

    const valid = await trigger(columns.map((col) => `boxes.${lastIndex}.${col.name}` as const))
    return valid
  }

  const handleAddBox = async () => {
    const valid = await canAddNewRow()
    if (!valid) return

    appendBox({
      lengthCm: 0,
      breadthCm: 0,
      heightCm: 0,
      weightKg: 0,
    })
  }

  const allBoxes = useWatch({ control, name: 'boxes' }) || []

  return (
    <Box mt={2}>
      {/* Table Header */}
      <Box display="grid" gridTemplateColumns="repeat(5, 1fr)" gap={2} mb={1}>
        {columns.map((col) => (
          <Typography key={col.name} fontWeight="bold">
            {col.label}
          </Typography>
        ))}
        <Typography fontWeight="bold">Action</Typography>
      </Box>

      {/* Box Rows */}
      {boxFields.map((box, bIndex) => (
        <Box key={box.id} display="grid" gridTemplateColumns="repeat(5, 1fr)" gap={2} mb={1}>
          {columns.map((col) => (
            <Controller
              key={`${box.id}-${col.name}`}
              name={`boxes.${bIndex}.${col.name}` as const}
              control={control}
              rules={{
                required: `${col.label} is required`,
                min:
                  col.type === 'number' ? { value: 0, message: 'Cannot be negative' } : undefined,
              }}
              render={({ field, fieldState }) => (
                <CustomInput
                  {...field}
                  fullWidth
                  type={col.type}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          ))}

          <IconButton color="error" sx={{ mb: 4 }} onClick={() => removeBox(bIndex)}>
            <AiOutlineDelete />
          </IconButton>
        </Box>
      ))}

      {/* Add Box Button */}
      <Box mt={1}>
        <Button variant="outlined" onClick={handleAddBox}>
          + Add Box
        </Button>
      </Box>

      {/* Total Weight Summary Section */}
      {allBoxes.length > 0 && (
        <Paper
          sx={{
            p: 3,
            mt: 3,
            borderRadius: 3,
            border: '1px solid #E0E6ED',
            background: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #333369 0%, #3DD598 100%)',
              borderRadius: '12px 12px 0 0',
            },
          }}
          elevation={0}
        >
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: '#F5F7FA',
              border: '1px solid #E0E6ED',
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" fontWeight={600} color="#333369">
                  Chargeable Weight
                </Typography>
                {weightCalculations.loading ? (
                  <CircularProgress size={20} />
                ) : (
                  <Typography variant="h6" fontWeight={700} color="#333369">
                    {weightCalculations.totalChargeableWeight.toFixed(2)} kg
                  </Typography>
                )}
              </Stack>
              <Typography variant="caption" color="#4A5568">
                Formula: max(Actual Weight, Volumetric Weight) | Volumetric = (L×B×H) ÷{' '}
                {weightCalculations.cftFactor}
              </Typography>
            </Stack>
          </Box>
        </Paper>
      )}
    </Box>
  )
}

export default ProductBoxesForm
