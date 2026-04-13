import { alpha, Box, Button, Chip, Divider, Grid, Paper, Stack, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { BiCheckCircle, BiErrorCircle } from 'react-icons/bi'
import { FiSave } from 'react-icons/fi'
import { useAuth } from '../../../context/auth/AuthContext'
import { useUpdateUserProfile } from '../../../hooks/User/useUpdateUserProfile'
import { usePresignedDownloadUrls } from '../../../hooks/Uploads/usePresignedDownloadUrls'
import type { CompanyInfo, IUserProfileDB } from '../../../types/user.types'
import type { UploadedFileInfo } from '../../UI/uploader/FileUploader'
import CustomIconLoadingButton from '../../UI/button/CustomLoadingButton'
import StatusChip from '../../UI/chip/StatusChip'
import CustomInput from '../../UI/inputs/CustomInput'
import { toast } from '../../UI/Toast'
import FileUploader from '../../UI/uploader/FileUploader'
import ProfileEmailVerificationModal from './ProfileEmailVerificationModal'
import PhoneVerificationModal from './ProfilePhoneVerificationModal'

export const DE_BLUE = '#0052CC'
export const DE_AMBER = '#FFAB00'
export const BRAND_GRADIENT = `linear-gradient(135deg, ${DE_BLUE} 0%, #2a5fbe 100%)`

export default function UserProfileForm() {
  const { user, loading } = useAuth()
  const { mutateAsync, isPending: saving } = useUpdateUserProfile()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<Partial<CompanyInfo>>()

  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showPhoneModal, setShowPhoneModal] = useState(false)

  const watchedEmail = watch('contactEmail')
  const watchedPhone = watch('contactNumber')
  const avatarKey = watch('profilePicture')
  const accountStatus = user?.approved ? 'success' : 'pending'

  useEffect(() => {
    if (user && !loading) {
      reset({
        profilePicture: user.companyInfo?.profilePicture,
        contactPerson: user.companyInfo?.contactPerson ?? '',
        contactEmail: user.companyInfo?.contactEmail ?? '',
        contactNumber: user.companyInfo?.contactNumber ?? '',
      })
    }
  }, [user, loading, reset])

  const { data: avatarUrl } = usePresignedDownloadUrls({
    keys: avatarKey,
    enabled: !!avatarKey,
  })

  const handleAvatarUploaded = useCallback(
    (files: UploadedFileInfo[]) => {
      if (files.length) {
        setValue('profilePicture', files[0].key, { shouldValidate: true })
      }
    },
    [setValue],
  )

  const onSubmit = async (values: Partial<CompanyInfo>) => {
    try {
      await mutateAsync({ companyInfo: values } as IUserProfileDB)
      toast.open({ message: 'Profile updated successfully', severity: 'success' })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.open({
        message: error?.response?.data?.message ?? 'Update failed',
        severity: 'error',
      })
    }
  }

  const VerifiedChip = ({ ok }: { ok: boolean }) =>
    ok ? (
      <Chip
        icon={<BiCheckCircle size={15} />}
        label="Verified"
        size="small"
        sx={{
          bgcolor: alpha(DE_BLUE, 0.12),
          color: DE_BLUE,
          border: `1px solid ${alpha(DE_BLUE, 0.3)}`,
          fontWeight: 700,
          '& .MuiChip-icon': { color: DE_BLUE },
        }}
      />
    ) : (
      <Chip
        icon={<BiErrorCircle size={15} />}
        label="Unverified"
        size="small"
        sx={{
          bgcolor: alpha(DE_AMBER, 0.12),
          color: DE_AMBER,
          border: `1px solid ${alpha(DE_AMBER, 0.3)}`,
          fontWeight: 700,
          '& .MuiChip-icon': { color: DE_AMBER },
        }}
      />
    )

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
        background: `radial-gradient(circle at 100% 0%, ${alpha(DE_BLUE, 0.03)} 0%, transparent 40%), #fff`,
      }}
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="flex-start">
          {/* Left: Avatar Upload */}
          <Box sx={{ textAlign: 'center', width: { xs: '100%', md: 200 } }}>
            <FileUploader
              variant="avatar"
              accept="image/*,.png,.jpg,.jpeg"
              placeholder={avatarUrl?.[0]}
              showPlaceholderImgByDefault
              loadingPreview={loading}
              onUploaded={handleAvatarUploaded}
            />
            <Typography variant="caption" sx={{ color: '#6b778c', mt: 1.5, display: 'block', fontWeight: 600 }}>
              Profile Picture
            </Typography>
          </Box>

          {/* Right: Form Fields */}
          <Stack spacing={3} flex={1} width="100%">
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: DE_BLUE }}>
                  Account Information
                </Typography>
                <Typography variant="body2" sx={{ color: '#5e759a' }}>
                  Update your contact details and identity.
                </Typography>
              </Box>
              <StatusChip status={accountStatus} label={user?.approved ? 'Approved' : 'Pending'} />
            </Stack>

            <Divider sx={{ opacity: 0.6 }} />

            <Grid container spacing={2.5} component="div">
              <Grid size={{ xs: 12, md: 6 }} component="div">
                <CustomInput
                  label="Contact Name"
                  {...register('contactPerson', { required: 'Name is required' })}
                  error={!!errors.contactPerson}
                  helperText={errors.contactPerson?.message}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }} component="div">
                <Stack spacing={1}>
                  <CustomInput
                    label="Work Email"
                    {...register('contactEmail', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
                    })}
                    error={!!errors.contactEmail}
                    helperText={errors.contactEmail?.message}
                    disabled
                    fullWidth
                    postfix={<VerifiedChip ok={!!user?.companyInfo?.POCEmailVerified} />}
                  />
                  {!user?.companyInfo?.POCEmailVerified && (
                    <Button
                      size="small"
                      onClick={() => setShowEmailModal(true)}
                      sx={{ alignSelf: 'flex-start', color: DE_BLUE, fontWeight: 700, fontSize: '0.75rem' }}
                    >
                      Verify Email
                    </Button>
                  )}
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }} component="div">
                <Stack spacing={1}>
                  <CustomInput
                    label="Phone Number"
                    {...register('contactNumber', { required: 'Phone is required' })}
                    error={!!errors.contactNumber}
                    helperText={errors.contactNumber?.message}
                    fullWidth
                    disabled
                    postfix={<VerifiedChip ok={!!user?.companyInfo?.POCPhoneVerified} />}
                  />
                  {!user?.companyInfo?.POCPhoneVerified && (
                    <Button
                      size="small"
                      onClick={() => setShowPhoneModal(true)}
                      sx={{ alignSelf: 'flex-start', color: DE_BLUE, fontWeight: 700, fontSize: '0.75rem' }}
                    >
                      Verify Phone
                    </Button>
                  )}
                </Stack>
              </Grid>
            </Grid>

            <Box sx={{ pt: 2, alignSelf: 'flex-start' }}>
              <CustomIconLoadingButton
                type="submit"
                text="Save Changes"
                loading={saving}
                icon={<FiSave size={18} />}
                styles={{
                  px: 4,
                  borderRadius: 1,
                  bgcolor: DE_BLUE,
                  boxShadow: `0 8px 20px ${alpha(DE_BLUE, 0.3)}`,
                  '&:hover': { bgcolor: '#0043A4' },
                }}
              />
            </Box>
          </Stack>
        </Stack>
      </Box>

      {/* Verification Modals */}
      <ProfileEmailVerificationModal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        email={watchedEmail || ''}
      />
      <PhoneVerificationModal
        open={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        phone={watchedPhone || ''}
      />
    </Paper>
  )
}
