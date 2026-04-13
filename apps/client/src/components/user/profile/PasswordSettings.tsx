import {
  alpha,
  Box,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { BiHide, BiShow } from 'react-icons/bi'
import { FiLock } from 'react-icons/fi'
import CustomIconLoadingButton from '../../UI/button/CustomLoadingButton'
import CustomInput from '../../UI/inputs/CustomInput'
import { toast } from '../../UI/Toast'
import { useChangePassword } from '../../../hooks/Auth/useChangePassword'
import { useUserInfo } from '../../../hooks/useUserInfo'

const DE_BLUE = '#0052CC'

interface PasswordFormValues {
  currentPassword?: string
  newPassword: string
  confirmPassword: string
}

export default function PasswordSettingsForm() {
  const { mutateAsync, isPending: saving } = useChangePassword()
  const { data } = useUserInfo()

  const hasPassword = !!data?.data?.passwordHash

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>()

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const newPassword = watch('newPassword')

  const onSubmit = async (values: PasswordFormValues) => {
    try {
      await mutateAsync({
        ...(values?.currentPassword && { currentPassword: values?.currentPassword }),
        newPassword: values.newPassword,
      })
      toast.open({
        message: hasPassword ? 'Password updated successfully' : 'Password set successfully',
        severity: 'success',
      })
      reset()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.open({
        message: err?.response?.data?.message ?? 'Password update failed',
        severity: 'error',
      })
    }
  }

  const PasswordToggle = ({
    visible,
    setVisible,
  }: {
    visible: boolean
    setVisible: (v: boolean) => void
  }) => (
    <InputAdornment position="end">
      <IconButton
        aria-label={visible ? 'Hide password' : 'Show password'}
        onClick={() => setVisible(!visible)}
        edge="end"
        sx={{ color: '#6b6b6b', '&:hover': { color: DE_BLUE, bgcolor: alpha(DE_BLUE, 0.08) } }}
      >
        {visible ? <BiHide /> : <BiShow />}
      </IconButton>
    </InputAdornment>
  )

  return (
    <Paper
      component="form"
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.8 },
        borderRadius: 1,
        border: `1px solid ${alpha(DE_BLUE, 0.13)}`,
        backgroundColor: '#fff',
        boxShadow: '0 8px 24px rgba(0, 82, 204, 0.08)',
      }}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              p: 1.2,
              borderRadius: 1,
              bgcolor: alpha(DE_BLUE, 0.08),
              color: DE_BLUE,
              display: 'flex',
            }}
          >
            <FiLock size={22} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: DE_BLUE }}>
              Password Security
            </Typography>
            <Typography variant="body2" sx={{ color: '#5e759a' }}>
              Update your account password regularly to keep your business data secure.
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ opacity: 0.6 }} />

        <Stack spacing={2.2}>
          {hasPassword && (
            <CustomInput
              label="Current Password"
              type={showCurrent ? 'text' : 'password'}
              {...register('currentPassword', { required: 'Current password is required.' })}
              error={!!errors.currentPassword}
              helperText={errors.currentPassword?.message}
              fullWidth
              prefix={<FiLock color={DE_BLUE} size={15} />}
              postfix={<PasswordToggle visible={showCurrent} setVisible={setShowCurrent} />}
            />
          )}

          <CustomInput
            label="New Password"
            type={showNew ? 'text' : 'password'}
            {...register('newPassword', {
              required: 'New password is required.',
              minLength: { value: 6, message: 'Minimum 6 characters.' },
            })}
            error={!!errors.newPassword}
            helperText={errors.newPassword?.message}
            fullWidth
            prefix={<FiLock color={DE_BLUE} size={15} />}
            postfix={<PasswordToggle visible={showNew} setVisible={setShowNew} />}
          />

          <CustomInput
            label="Confirm New Password"
            type={showConfirm ? 'text' : 'password'}
            {...register('confirmPassword', {
              required: 'Confirm your new password.',
              validate: (value) => value === newPassword || 'Passwords do not match.',
            })}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            fullWidth
            prefix={<FiLock color={DE_BLUE} size={15} />}
            postfix={<PasswordToggle visible={showConfirm} setVisible={setShowConfirm} />}
          />
        </Stack>

        <Box sx={{ pt: 1, alignSelf: 'flex-start' }}>
          <CustomIconLoadingButton
            type="submit"
            text={hasPassword ? 'Update Password' : 'Set Password'}
            loading={saving}
            styles={{
              px: 4,
              borderRadius: 1,
              bgcolor: DE_BLUE,
              '&:hover': { bgcolor: '#0043A4' },
            }}
          />
        </Box>
      </Stack>
    </Paper>
  )
}
