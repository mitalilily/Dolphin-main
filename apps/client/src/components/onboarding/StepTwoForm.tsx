import { Box, Checkbox, FormControlLabel, Grid, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useMemo, useState } from 'react'
import { MdBusiness } from 'react-icons/md'
import type { FormErrors } from '../../pages/onboarding/UserOnboarding'
import type { UserInfoData } from '../../types/user.types'
import { createSyntheticEvent } from '../../utils/functions'
import CustomInput from '../UI/inputs/CustomInput'
import CustomSelect from '../UI/inputs/CustomSelect'

interface StepTwoFormProps {
  formData: UserInfoData
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    subKey: keyof UserInfoData,
  ) => void
  errors: FormErrors
}

const DE_BLUE = '#0052CC'
const DE_AMBER = '#FFAB00'

const BUSINESS_OPTIONS = [
  {
    key: 'b2b',
    title: 'B2B',
    subtitle: 'I sell to other businesses',
  },
  {
    key: 'b2c',
    title: 'Marketplace B2C',
    subtitle: 'I sell on Amazon, Flipkart, etc.',
  },
  {
    key: 'd2c',
    title: 'D2C',
    subtitle: 'I sell via website, social, or store',
  },
]

export default function StepTwoForm({ formData, onChange, errors }: StepTwoFormProps) {
  const [sameAsCompany, setSameAsCompany] = useState(false)

  const selectedCategories = useMemo(
    () =>
      Array.isArray(formData?.businessLegal?.businessCategory)
        ? formData.businessLegal.businessCategory
        : [],
    [formData?.businessLegal?.businessCategory],
  )

  useEffect(() => {
    if (!sameAsCompany) return

    const companyName = formData.basicInfo?.companyName || ''
    onChange(createSyntheticEvent('brandName', companyName), 'businessLegal')
  }, [sameAsCompany, formData.basicInfo?.companyName, onChange])

  const toggleCategory = (value: string) => {
    const next = selectedCategories.includes(value)
      ? selectedCategories.filter((item) => item !== value)
      : [...selectedCategories, value]

    onChange(createSyntheticEvent('businessCategory', next), 'businessLegal')
  }

  return (
    <Stack spacing={{ xs: 2.2, md: 2.8 }}>
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: DE_BLUE,
            mb: 0.7,
            fontSize: { xs: '1.22rem', md: '1.5rem' },
          }}
        >
          Shipping Profile
        </Typography>
        <Typography variant="body2" sx={{ color: '#60789f', lineHeight: 1.55 }}>
          Choose your business model and shipment volume so we can configure panel defaults
          correctly.
        </Typography>
      </Box>

      <Box
        sx={{
          p: { xs: 1.6, md: 2 },
          borderRadius: 1,
          border: `1px solid ${alpha(DE_BLUE, 0.12)}`,
          backgroundColor: '#fff',
        }}
      >
        <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: DE_BLUE, mb: 1.2 }}>
          Select one or more shipment models
        </Typography>

        <Grid container spacing={1.3}>
          {BUSINESS_OPTIONS.map((option) => {
            const active = selectedCategories.includes(option.key)

            return (
              <Grid key={option.key} size={{ xs: 12, md: 4 }}>
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleCategory(option.key)}
                  onKeyUp={(e) => {
                    if (e.key === 'Enter') toggleCategory(option.key)
                  }}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    border: `1px solid ${active ? alpha(DE_BLUE, 0.4) : alpha(DE_BLUE, 0.12)}`,
                    backgroundColor: active ? alpha(DE_BLUE, 0.06) : '#fff',
                    cursor: 'pointer',
                    transition: 'all .2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    minHeight: { xs: 'auto', md: 112 },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.94rem',
                      fontWeight: 800,
                      color: active ? DE_BLUE : '#2f4e77',
                    }}
                  >
                    {option.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.78rem',
                      color: '#6b82a8',
                      mt: 0.2,
                      lineHeight: 1.35,
                      minHeight: { xs: 'auto', md: 34 },
                    }}
                  >
                    {option.subtitle}
                  </Typography>
                </Box>
              </Grid>
            )
          })}
        </Grid>
      </Box>

      <Box
        sx={{
          p: { xs: 1.6, md: 2 },
          borderRadius: 1,
          border: `1px solid ${alpha(DE_BLUE, 0.12)}`,
          backgroundColor: '#fff',
        }}
      >
        <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: DE_BLUE, mb: 1.6 }}>
          Shipment Volume & Brand Identity
        </Typography>

        <Grid container spacing={2.2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <CustomSelect
              label="Expected Orders / Month"
              items={[
                { key: '', label: 'Select volume range' },
                { key: '0-100', label: '0 - 100' },
                { key: '101-500', label: '101 - 500' },
                { key: '501-2000', label: '501 - 2,000' },
                { key: '2000+', label: '2,000+' },
              ]}
              value={formData?.businessLegal?.monthlyShipments}
              onSelect={(value) =>
                onChange(
                  createSyntheticEvent('monthlyShipments', String(value)) as React.ChangeEvent<
                    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
                  >,
                  'businessLegal',
                )
              }
              required
              error={!!errors.businessLegal.monthlyShipments}
              helperText={errors.businessLegal.monthlyShipments}
              placeholder="Select volume range"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={1}>
              <CustomInput
                label="Brand Name"
                name="brandName"
                value={formData?.businessLegal?.brandName}
                onChange={(e) => onChange(e, 'businessLegal')}
                required
                error={!!errors.businessLegal.brandName}
                helperText={errors.businessLegal.brandName}
                prefix={<MdBusiness color={DE_BLUE} />}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={sameAsCompany}
                    onChange={(e) => setSameAsCompany(e.target.checked)}
                    sx={{ color: alpha(DE_BLUE, 0.4), '&.Mui-checked': { color: DE_BLUE } }}
                  />
                }
                label={
                  <Typography variant="caption" sx={{ color: '#60789f', fontWeight: 600 }}>
                    Same as company name
                  </Typography>
                }
              />
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          bgcolor: alpha(DE_AMBER, 0.06),
          border: `1px solid ${alpha(DE_AMBER, 0.2)}`,
        }}
      >
        <Typography variant="caption" sx={{ color: DE_AMBER, fontWeight: 700, display: 'block' }}>
          These shipping profile details help us show the most relevant couriers and defaults across
          the panel.
        </Typography>
      </Box>
    </Stack>
  )
}
