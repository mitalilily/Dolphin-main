import {
  alpha,
  Button,
  Chip,
  Collapse,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { BiCheckCircle } from 'react-icons/bi'
import { usePickupAddresses } from '../../hooks/Pickup/usePickupAddresses'
import type { B2BFormData } from './b2b/B2BOrderForm'
import type { B2CFormData } from './b2c/B2COrderForm'

const ACCENT = '#0D3B8E'
const TEXT_PRIMARY = '#102A54'

const PickupLocationForm = () => {
  const { control, setValue, watch } = useFormContext<B2BFormData | B2CFormData>()
  const {
    data: locations,
    isLoading,
    isError,
  } = usePickupAddresses({ isPickupEnabled: 'active' as unknown as boolean })

  const [openRto, setOpenRto] = useState<Record<string, boolean>>({})

  const pickupDate = watch('pickupDate') as string | undefined
  const pickupTime = watch('pickupTime') as string | undefined

  const toggleRto = (id: string) => {
    setOpenRto((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const primaryLocation = locations?.pickupAddresses?.find((l) => l.isPrimary)

  useEffect(() => {
    if (!pickupDate) {
      setValue('pickupDate', new Date().toISOString().split('T')[0])
    }
    if (!pickupTime) {
      setValue('pickupTime', '10:00')
    }
  }, [pickupDate, pickupTime, setValue])

  useEffect(() => {
    if (primaryLocation) {
      setValue('pickupLocationId', primaryLocation?.pickupId)
      setValue('pickupLocationPincode', primaryLocation.pickup?.pincode)
      setValue('pickupLocationName', primaryLocation.pickup?.addressNickname)
      setValue('pickupLocationPOCName', primaryLocation.pickup?.contactName)
      setValue('pickupLocationPOCPhone', primaryLocation.pickup?.contactPhone)
      setValue('pickupAddress', primaryLocation.pickup?.addressLine1)
      setValue('pickupCity', primaryLocation.pickup?.city)
      setValue('pickupState', primaryLocation.pickup?.state)

      if (primaryLocation?.isRTOSame) {
        setValue('isRtoSame', true)
        setValue('rtoLocationPincode', primaryLocation.pickup?.pincode)
        setValue('rtoLocationName', primaryLocation.pickup?.addressNickname)
        setValue('rtoLocationPOCName', primaryLocation.pickup?.contactName)
        setValue('rtoLocationPOCPhone', primaryLocation.pickup?.contactPhone)
        setValue('rtoAddress', primaryLocation.pickup?.addressLine1)
        setValue('rtoCity', primaryLocation.pickup?.city)
        setValue('rtoState', primaryLocation.pickup?.state)
      } else if (primaryLocation?.rto) {
        setValue('isRtoSame', false)
        setValue('rtoLocationPincode', primaryLocation?.rto?.pincode)
        setValue('rtoLocationName', primaryLocation.rto?.addressNickname)
        setValue('rtoLocationPOCName', primaryLocation?.rto?.contactName)
        setValue('rtoLocationPOCPhone', primaryLocation?.rto?.contactPhone)
        setValue('rtoAddress', primaryLocation?.rto?.addressLine1)
        setValue('rtoCity', primaryLocation?.rto?.city)
        setValue('rtoState', primaryLocation?.rto?.state)
      } else {
        setValue('isRtoSame', false)
        setValue('rtoLocationPincode', '')
        setValue('rtoLocationName', '')
        setValue('rtoLocationPOCName', '')
        setValue('rtoLocationPOCPhone', '')
        setValue('rtoAddress', '')
        setValue('rtoCity', '')
        setValue('rtoState', '')
      }
    }
  }, [primaryLocation, setValue])

  if (isLoading) return <Typography>Loading pickup locations...</Typography>
  if (isError) return <Typography color="error">Failed to load pickup locations</Typography>
  if (!locations?.pickupAddresses || locations.pickupAddresses.length === 0)
    return <Typography>No pickup locations found</Typography>

  return (
    <Controller
      name="pickupLocationId"
      control={control}
      rules={{ required: 'Please select a pickup location' }}
      render={({ field, fieldState }) => (
        <Grid container spacing={3} mb={4}>
          {locations.pickupAddresses.map((loc) => {
            const isSelected = field.value === loc.pickupId
            const isOpen = openRto[loc.id] || false

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={loc.id} display="flex">
                <Paper
                  onClick={() => {
                    field.onChange(loc?.pickupId)

                    // 🔹 Update pickup fields
                    setValue('pickupLocationPincode', loc?.pickup?.pincode)
                    setValue('pickupLocationName', loc?.pickup?.addressNickname)
                    setValue('pickupLocationPOCName', loc?.pickup?.contactName)
                    setValue('pickupLocationPOCPhone', loc?.pickup?.contactPhone)
                    setValue('pickupAddress', loc?.pickup?.addressLine1)
                    setValue('pickupCity', loc?.pickup?.city)
                    setValue('pickupState', loc?.pickup?.state)

                    // 🔹 Update RTO fields
                    if (loc?.isRTOSame) {
                      setValue('isRtoSame', true)
                      setValue('rtoLocationPincode', loc?.pickup?.pincode)
                      setValue('rtoLocationName', loc?.pickup?.addressNickname)
                      setValue('rtoLocationPOCName', loc?.pickup?.contactName)
                      setValue('rtoLocationPOCPhone', loc?.pickup?.contactPhone)
                      setValue('rtoAddress', loc?.pickup?.addressLine1)
                      setValue('rtoCity', loc?.pickup?.city)
                      setValue('rtoState', loc?.pickup?.state)
                    } else if (loc?.rto) {
                      setValue('isRtoSame', false)
                      setValue('rtoLocationPincode', loc?.rto?.pincode)
                      setValue('rtoLocationName', loc.rto?.addressNickname)
                      setValue('rtoLocationPOCName', loc?.rto?.contactName)
                      setValue('rtoLocationPOCPhone', loc?.rto?.contactPhone)
                      setValue('rtoAddress', loc?.rto?.addressLine1)
                      setValue('rtoCity', loc?.rto?.city)
                      setValue('rtoState', loc?.rto?.state)
                    } else {
                      setValue('isRtoSame', false)
                      setValue('rtoLocationPincode', '')
                      setValue('rtoLocationName', '')
                      setValue('rtoLocationPOCName', '')
                      setValue('rtoLocationPOCPhone', '')
                      setValue('rtoAddress', '')
                      setValue('rtoCity', '')
                      setValue('rtoState', '')
                    }
                  }}
                  sx={{
                    p: 2.5,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    cursor: 'pointer',
                    border: isSelected
                      ? `2px solid ${alpha(ACCENT, 0.55)}`
                      : `1px solid ${alpha(ACCENT, 0.2)}`,
                    borderRadius: 3,
                    bgcolor: isSelected ? alpha(ACCENT, 0.06) : '#ffffff',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {/* Pickup info */}
                  <Stack spacing={0.5} mb={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: TEXT_PRIMARY }}>
                        {loc.pickup?.addressNickname}
                      </Typography>
                      {loc.isPrimary && (
                        <Chip
                          label="Primary"
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: alpha(ACCENT, 0.35),
                            color: ACCENT,
                            bgcolor: alpha(ACCENT, 0.03),
                          }}
                        />
                      )}
                    </Stack>
                    <Typography variant="body2">{loc.pickup?.addressLine1}</Typography>
                    {loc.pickup?.addressLine2 && (
                      <Typography variant="body2">{loc.pickup?.addressLine2}</Typography>
                    )}
                    <Typography variant="body2">
                      {loc.pickup?.city}, {loc.pickup?.state} - {loc.pickup?.pincode}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {loc.pickup?.contactName} • {loc.pickup?.contactPhone}
                    </Typography>
                  </Stack>

                  {/* Divider */}
                  <Divider sx={{ my: 1 }} />

                  {/* RTO section */}
                  {loc.isRTOSame ? (
                    <Chip
                      label="RTO same as pickup"
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: alpha(ACCENT, 0.32), color: ACCENT }}
                    />
                  ) : loc.rto ? (
                    <>
                      <Button
                        size="small"
                        variant="text"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleRto(loc.id)
                        }}
                        sx={{
                          alignSelf: 'flex-start',
                          textTransform: 'none',
                          fontSize: 13,
                          color: ACCENT,
                        }}
                      >
                        {isOpen ? 'Hide RTO details' : 'Show RTO details'}
                      </Button>
                      <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <Stack spacing={0.5} mt={1}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {loc.rto?.addressNickname}
                          </Typography>
                          <Typography variant="body2">{loc.rto?.addressLine1}</Typography>
                          {loc.rto?.addressLine2 && (
                            <Typography variant="body2">{loc.rto?.addressLine2}</Typography>
                          )}
                          <Typography variant="body2">
                            {loc.rto?.city}, {loc.rto?.state} - {loc.rto?.pincode}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {loc.rto?.contactName} • {loc.rto?.contactPhone}
                          </Typography>
                        </Stack>
                      </Collapse>
                    </>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No RTO address set
                    </Typography>
                  )}

                  {isSelected && (
                    <BiCheckCircle
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        fontSize: 22,
                        color: ACCENT,
                      }}
                    />
                  )}
                </Paper>
              </Grid>
            )
          })}
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="pickupDate"
              control={control}
              rules={{ required: 'Pickup date is required' }}
              render={({ field: dateField, fieldState: dateState }) => (
                <TextField
                  {...dateField}
                  type="date"
                  label="Preferred Pickup Date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  error={!!dateState.error}
                  helperText={dateState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="pickupTime"
              control={control}
              rules={{ required: 'Pickup time window is required' }}
              render={({ field: timeField, fieldState: timeState }) => (
                <TextField
                  {...timeField}
                  type="time"
                  label="Preferred Pickup Time"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  error={!!timeState.error}
                  helperText={timeState.error?.message ?? 'Use local warehouse timezone'}
                />
              )}
            />
          </Grid>
          {fieldState.error && (
            <Grid size={12}>
              <Typography color="error" fontSize={12}>
                {fieldState.error.message}
              </Typography>
            </Grid>
          )}
        </Grid>
      )}
    />
  )
}

export default PickupLocationForm
