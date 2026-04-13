import { alpha, Divider, Grid, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { BiInfoCircle } from 'react-icons/bi'
import { useAuth } from '../../../context/auth/AuthContext'
import { usePresignedDownloadUrls } from '../../../hooks/Uploads/usePresignedDownloadUrls'
import { useUpdateUserProfile } from '../../../hooks/User/useUpdateUserProfile'
import type { CompanyInfo } from '../../../types/user.types'
import CustomIconLoadingButton from '../../UI/button/CustomLoadingButton'
import CustomInput from '../../UI/inputs/CustomInput'
import { toast } from '../../UI/Toast'
import type { UploadedFileInfo } from '../../UI/uploader/FileUploader'
import FileUploader from '../../UI/uploader/FileUploader'
import { BRAND_GRADIENT, DE_BLUE } from './UserProfileForm'

interface CompanyFormValues {
  brandName?: string
  businessName?: string
  website?: string
  email: string
  contact: string
  address: string
  city: string
  state: string
  pincode: string
  logo?: string
}

export default function CompanyInfoForm() {
  const { user } = useAuth()
  const { mutateAsync, isPending: saving } = useUpdateUserProfile()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    defaultValues: {
      brandName: user?.companyInfo?.brandName ?? '',
      businessName: user?.companyInfo?.businessName ?? '',
      website: user?.companyInfo?.website ?? '',
      email: user?.companyInfo?.companyEmail ?? '',
      contact: user?.companyInfo?.companyContactNumber ?? '',
      address: user?.companyInfo?.companyAddress ?? '',
      city: user?.companyInfo?.city ?? '',
      state: user?.companyInfo?.state ?? '',
      pincode: user?.companyInfo?.pincode ?? '',
      logo: user?.companyInfo?.companyLogoUrl ?? '',
    },
  })

  /* sync on user change */
  useEffect(() => {
    if (user?.companyInfo) {
      reset({
        brandName: user.companyInfo.brandName ?? '',
        businessName: user.companyInfo.businessName ?? '',
        website: user.companyInfo.website ?? '',
        email: user.companyInfo.companyEmail ?? '',
        contact: user.companyInfo.companyContactNumber ?? '',
        address: user.companyInfo.companyAddress ?? '',
        city: user.companyInfo.city ?? '',
        state: user.companyInfo.state ?? '',
        pincode: user.companyInfo.pincode ?? '',
        logo: user.companyInfo.companyLogoUrl ?? '',
      })
    }
  }, [user, reset])

  /* logo preview */
  const logoKey = watch('logo')
  const { data: logoUrl, isLoading } = usePresignedDownloadUrls({
    keys: logoKey,
    enabled: logoKey && logoKey !== '' ? true : false,
  })

  /* pincode lookup */
  const pincode = watch('pincode')
  const [pinFetching, setPinFetching] = useState(false)

  useEffect(() => {
    const fetchPin = async (pin: string) => {
      setPinFetching(true)
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
        const data = await res.json()
        if (data?.[0]?.Status !== 'Success') {
          setError('pincode', { type: 'manual', message: 'Invalid pincode' })
          setValue('city', '')
          setValue('state', '')
        } else {
          clearErrors('pincode')
          setValue('city', data[0].PostOffice[0].District)
          setValue('state', data[0].PostOffice[0].State)
        }
      } catch {
        setError('pincode', { type: 'manual', message: 'PIN lookup failed' })
      } finally {
        setPinFetching(false)
      }
    }
    if (/^\d{6}$/.test(pincode)) fetchPin(pincode)
  }, [pincode, setError, clearErrors, setValue])

  /* logo upload cb */
  const handleLogoUploaded = useCallback(
    (files: UploadedFileInfo[]) => {
      if (files.length) {
        setValue('logo', files[0].key, { shouldValidate: true })
      } else {
        setValue('logo', '', { shouldValidate: false })
      }
    },
    [setValue],
  )
  /* submit */
  const onSubmit = async (values: CompanyFormValues) => {
    try {
      await mutateAsync({
        companyInfo: {
          brandName: values.brandName ?? '',
          businessName: values.businessName,
          website: values.website,
          companyContactNumber: values.contact,
          companyEmail: values.email,
          companyAddress: values.address,
          pincode: values.pincode,
          state: values.state,
          city: values.city,
          companyLogoUrl: values.logo,
        } as CompanyInfo,
      })
      toast.open({ message: 'Company info updated', severity: 'success' })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.open({
        message: err?.response?.data?.message ?? 'Update failed',
        severity: 'error',
      })
    }
  }

  /* business‑name editability */
  const isBusinessNameEditable = user?.businessType?.includes('d2c')

  /* JSX */
  return (
    <Paper
      component="form"
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        mb: 4,
        bgcolor: '#FFFFFF',
        border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
        boxShadow: `0 4px 16px ${alpha(DE_BLUE, 0.08)}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: BRAND_GRADIENT,
          borderRadius: '4px 4px 0 0',
          opacity: 0.8,
        },
      }}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Grid container spacing={4}>
        {/* logo */}
        <Grid size={{ md: 3, xs: 12 }} mt={2}>
          <Stack alignItems={{ md: 'flex-start', xs: 'center' }} gap={1}>
            <Typography fontSize={'12px'} display={'flex'} alignItems={'center'} gap={1}>
              <Tooltip title="Please click save button to save the company logo">
                <BiInfoCircle color="#5a9de6" />
              </Tooltip>{' '}
              Company Logo (optional){' '}
            </Typography>
            <FileUploader
              variant="dnd"
              showPlaceholderImgByDefault
              accept="image/*"
              loadingPreview={isLoading}
              avatarSize={120}
              placeholder={logoUrl}
              onUploaded={handleLogoUploaded}
            />
          </Stack>
        </Grid>

        {/* form */}
        <Grid size={{ md: 9, xs: 12 }}>
          <Stack spacing={2}>
            {/* brand + business name */}
            <Grid container spacing={2}>
              <Grid size={{ md: 6, xs: 12 }}>
                <CustomInput
                  label="Brand name"
                  {...register('brandName')}
                  error={!!errors.brandName}
                  helperText={errors.brandName?.message}
                />
              </Grid>
              <Grid size={{ md: 6, xs: 12 }}>
                <CustomInput
                  label="Business name"
                  disabled={!isBusinessNameEditable}
                  {...register('businessName')}
                  error={!!errors.businessName}
                  helperText={
                    !isBusinessNameEditable
                      ? 'Contact support to change'
                      : errors.businessName?.message
                  }
                />
              </Grid>
            </Grid>

            {/* website + contact */}
            <Grid container spacing={2}>
              <Grid size={{ md: 6, xs: 12 }}>
                <CustomInput
                  label="Website"
                  placeholder="https://yourbrand.com"
                  {...register('website', {
                    pattern: {
                      value: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/i,
                      message: 'Invalid URL',
                    },
                  })}
                  error={!!errors.website}
                  helperText={errors.website?.message}
                />
              </Grid>
              <Grid size={{ md: 6, xs: 12 }}>
                <CustomInput
                  required
                  label="Contact number"
                  {...register('contact', {
                    required: 'Contact number is required',
                    pattern: {
                      value: /^\d{10}$/,
                      message: 'Must be 10 digits',
                    },
                  })}
                  error={!!errors.contact}
                  helperText={errors.contact?.message}
                />
              </Grid>
            </Grid>

            {/* support email */}
            <CustomInput
              required
              label="Support email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email',
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            {/* address */}
            <CustomInput
              required
              label="Address"
              multiline
              rows={2}
              maxLength={200}
              {...register('address', { required: 'Address is required' })}
              error={!!errors.address}
              helperText={errors.address?.message}
            />

            {/* pincode + city + state */}
            <Grid container spacing={2}>
              <Grid size={{ md: 6, xs: 12 }}>
                <CustomInput
                  required
                  label="Pincode"
                  {...register('pincode', {
                    pattern: {
                      value: /^\d{6}$/,
                      message: 'Must be 6 digits',
                    },
                  })}
                  error={!!errors.pincode}
                  helperText={errors.pincode?.message || (pinFetching ? 'Validating...' : '')}
                />
              </Grid>
              <Grid size={{ md: 6, xs: 12 }}>
                <CustomInput label="City" disabled {...register('city')} />
              </Grid>
              <Grid size={{ md: 6, xs: 12 }}>
                <CustomInput label="State" disabled {...register('state')} />
              </Grid>
            </Grid>
          </Stack>
        </Grid>
      </Grid>

      <Divider sx={{ my: 1 }} />

      <Stack direction="row" justifyContent="flex-end" gap={2}>
        <CustomIconLoadingButton
          type="submit"
          disabled={saving}
          text="Update Business Info"
          loading={saving}
          loadingText="Saving…"
          styles={{
            minWidth: 160,
            borderRadius: 1,
            bgcolor: DE_BLUE,
            boxShadow: `0 8px 20px ${alpha(DE_BLUE, 0.3)}`,
            '&:hover': {
              bgcolor: '#0043A4',
            },
          }}
        />
      </Stack>
    </Paper>
  )
}
