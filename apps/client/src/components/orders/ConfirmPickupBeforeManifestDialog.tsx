import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import CustomDialog from '../UI/modal/CustomModal'

export type PickupManifestSchedule = {
  pickupDate: string
  pickupTime: string
}

type ConfirmPickupBeforeManifestDialogProps = {
  open: boolean
  orderLabel?: string
  orderCount?: number
  loading?: boolean
  onClose: () => void
  onConfirm: (schedule: PickupManifestSchedule) => void | Promise<void>
}

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10)

const getDefaultPickupDate = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return toDateInputValue(tomorrow)
}

const ConfirmPickupBeforeManifestDialog = ({
  open,
  orderLabel,
  orderCount = 1,
  loading = false,
  onClose,
  onConfirm,
}: ConfirmPickupBeforeManifestDialogProps) => {
  const todayInput = useMemo(() => toDateInputValue(new Date()), [])
  const [pickupDate, setPickupDate] = useState(getDefaultPickupDate)
  const [pickupTime, setPickupTime] = useState('11:00')

  useEffect(() => {
    if (!open) return
    setPickupDate(getDefaultPickupDate())
    setPickupTime('11:00')
  }, [open])

  const helperText =
    orderCount > 1
      ? `Set the pickup date and time for ${orderCount} selected orders before generating the manifest.`
      : `Set the pickup date and time for ${orderLabel || 'this order'} before generating the manifest.`

  const canConfirm = Boolean(pickupDate && pickupTime) && !loading

  return (
    <CustomDialog open={open} onClose={loading ? () => undefined : onClose} maxWidth="xs" title="Confirm Pickup Before Manifest">
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault()
          if (!canConfirm) return
          onConfirm({ pickupDate, pickupTime })
        }}
      >
        <Stack spacing={2}>
          <Typography sx={{ color: 'text.secondary', fontSize: 13.5, lineHeight: 1.55 }}>
            {helperText}
          </Typography>

          <TextField
            fullWidth
            required
            type="date"
            label="Pickup Date"
            value={pickupDate}
            onChange={(event) => setPickupDate(event.target.value)}
            disabled={loading}
            slotProps={{ htmlInput: { min: todayInput } }}
          />

          <TextField
            fullWidth
            required
            type="time"
            label="Pickup Time"
            value={pickupTime}
            onChange={(event) => setPickupTime(event.target.value)}
            disabled={loading}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button variant="outlined" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={!canConfirm}>
              {loading ? 'Manifesting...' : 'Finish Manifest Setup'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </CustomDialog>
  )
}

export default ConfirmPickupBeforeManifestDialog
