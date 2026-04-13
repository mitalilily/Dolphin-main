import { Alert, Box, Grid, Paper, Stack, Typography, alpha } from '@mui/material'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { FaWeightHanging } from 'react-icons/fa'
import CustomInput from '../../UI/inputs/CustomInput'
import type { B2CFormData } from './B2COrderForm'

const ACCENT = '#0D3B8E'
const TEXT_PRIMARY = '#102A54'
const TEXT_MUTED = '#496189'

const PackageDimensionsForm = () => {
  const { control } = useFormContext<B2CFormData>()

  const weight = useWatch({ control, name: 'weight' }) || 0
  const length = useWatch({ control, name: 'length' }) || 0
  const breadth = useWatch({ control, name: 'breadth' }) || 0
  const height = useWatch({ control, name: 'height' }) || 0

  const actualWeightKg = weight / 1000
  const volumetricWeight = (length * breadth * height) / 5000
  const chargedWeight = Math.max(actualWeightKg, volumetricWeight, 0.5)

  const fields = ['weight', 'length', 'breadth', 'height'] as const

  return (
    <>
      <Alert
        severity="info"
        sx={{
          mb: 2,
          backgroundColor: alpha(ACCENT, 0.05),
          border: `1px solid ${alpha(ACCENT, 0.16)}`,
          color: TEXT_PRIMARY,
          borderRadius: 2,
          '& .MuiAlert-icon': {
            color: ACCENT,
          },
        }}
      >
        Note: The minimum chargeable weight is 0.50 Kg
      </Alert>

      <Grid container spacing={2}>
        {fields.map((key) => (
          <Grid size={{ xs: 12, md: 3 }} key={key}>
            <Controller
              name={key}
              control={control}
              defaultValue={0}
              rules={{
                required: `${key.charAt(0).toUpperCase() + key.slice(1)} is required`,
                min: { value: 0.01, message: 'Cannot be zero or negative' },
              }}
              render={({ field, fieldState }) => (
                <CustomInput
                  label={
                    key.charAt(0).toUpperCase() +
                    key.slice(1) +
                    (key === 'weight' ? ' (g)' : ' (cm)')
                  }
                  type="number"
                  required
                  {...field}
                  value={field.value === 0 ? '' : field.value}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
        ))}
      </Grid>

      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mt: 2.5,
          borderRadius: 3,
          border: `1px solid ${alpha(ACCENT, 0.14)}`,
          background: '#FFFFFF',
        }}
      >
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, color: TEXT_PRIMARY }}
        >
          <FaWeightHanging size={18} color={ACCENT} />
          Package Weight Summary
        </Typography>
        <Typography variant="caption" sx={{ color: TEXT_MUTED, mb: 2.25, display: 'block' }}>
          Chargeable weight is calculated as max of actual, volumetric, or minimum weight (0.5 kg)
        </Typography>

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${alpha(ACCENT, 0.12)}`,
                background: alpha(ACCENT, 0.03),
              }}
            >
              <Typography variant="caption" fontWeight={700} sx={{ color: TEXT_MUTED }}>
                ACTUAL WEIGHT
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: TEXT_PRIMARY, mt: 0.75 }}>
                {actualWeightKg.toFixed(2)}
                <Typography component="span" variant="body2" sx={{ color: TEXT_MUTED, ml: 0.5 }}>
                  kg
                </Typography>
              </Typography>
              <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                {weight} grams
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${alpha(ACCENT, 0.12)}`,
                background: '#FFFFFF',
              }}
            >
              <Typography variant="caption" fontWeight={700} sx={{ color: TEXT_MUTED }}>
                VOLUMETRIC WEIGHT
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: TEXT_PRIMARY, mt: 0.75 }}>
                {volumetricWeight.toFixed(2)}
                <Typography component="span" variant="body2" sx={{ color: TEXT_MUTED, ml: 0.5 }}>
                  kg
                </Typography>
              </Typography>
              <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                L×B×H ÷ 5000
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `2px solid ${alpha(ACCENT, 0.4)}`,
                background: alpha(ACCENT, 0.05),
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" fontWeight={700} sx={{ color: ACCENT }}>
                  CHARGEABLE WEIGHT
                </Typography>
                <Box
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: alpha(ACCENT, 0.12),
                  }}
                >
                  <Typography variant="caption" fontWeight={700} sx={{ color: ACCENT }}>
                    {chargedWeight === 0.5
                      ? 'MIN'
                      : chargedWeight === actualWeightKg
                      ? 'ACTUAL'
                      : 'VOLUMETRIC'}
                  </Typography>
                </Box>
              </Stack>
              <Typography variant="h5" fontWeight={700} sx={{ color: TEXT_PRIMARY, mt: 0.75 }}>
                {chargedWeight.toFixed(2)}
                <Typography component="span" variant="body2" sx={{ color: TEXT_MUTED, ml: 0.5 }}>
                  kg
                </Typography>
              </Typography>
              <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                {chargedWeight === 0.5
                  ? 'Minimum weight applied'
                  : chargedWeight === actualWeightKg
                  ? 'Based on actual weight'
                  : 'Based on dimensions'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </>
  )
}

export default PackageDimensionsForm
