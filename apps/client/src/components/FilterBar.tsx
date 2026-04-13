/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  alpha,
  Box,
  Button,
  CardContent,
  Collapse,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useState } from 'react'
import {
  Controller,
  useForm,
  type DefaultValues,
  type Path,
  type RegisterOptions,
} from 'react-hook-form'
import { FaFilter } from 'react-icons/fa6'
import { MdDelete } from 'react-icons/md'
import { RxDoubleArrowDown, RxDoubleArrowUp } from 'react-icons/rx'
import CustomDrawer from './UI/drawer/CustomDrawer'
import CustomDatePicker from './UI/inputs/CustomDatePicker'
import CustomInput from './UI/inputs/CustomInput'
import CustomSelect from './UI/inputs/CustomSelect'
import MultiSelect from './UI/inputs/MultiSelect'

type FieldType = 'text' | 'select' | 'date' | 'multiselect'

export interface FilterField {
  name: string
  label: string
  type?: FieldType
  required?: boolean
  isAdvanced?: boolean
  options?: { label: string; value: string | boolean }[]
  placeholder?: string
  rules?: RegisterOptions
}

interface GlassFilterBarProps<T extends Record<string, any>> {
  fields: FilterField[]
  onApply: (filters: T) => void
  defaultValues: T
  sticky?: boolean
  bgOverlayImg?: string
  loading?: boolean
  appliedCount?: number
}

const DE_BLUE = '#0052CC'
const DE_AMBER = '#FFAB00'

export const FilterBar = <T extends Record<string, any>>({
  fields,
  onApply,
  defaultValues,
  bgOverlayImg,
  loading,
  appliedCount,
}: GlassFilterBarProps<T>) => {
  const { control, handleSubmit, reset } = useForm<T>({
    defaultValues: defaultValues as DefaultValues<T>,
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const primaryFields = fields.filter((f) => !f.isAdvanced)
  const advancedFields = fields.filter((f) => f.isAdvanced)

  const renderFieldControl = (field: FilterField, controllerField: any) => {
    if (field.type === 'select') {
      return (
        <CustomSelect
          label={field.label}
          value={controllerField.value ?? ''}
          onSelect={(val) => controllerField.onChange(val)}
          items={field.options?.map((opt) => ({ key: opt.value, label: opt.label })) || []}
          placeholder={field.placeholder}
          helperText={field.required ? 'Required' : ''}
          width="100%"
          required={field.required}
        />
      )
    }

    if (field.type === 'date') {
      return (
        <CustomDatePicker
          label={field.label}
          value={controllerField.value || null}
          onChange={controllerField.onChange}
          placeholder={field.placeholder}
          required={field.required}
        />
      )
    }

    if (field.type === 'multiselect') {
      return (
        <MultiSelect
          label={field.label}
          value={controllerField.value || []}
          onChange={(val) => controllerField.onChange(val)}
          options={field.options || []}
          placeholder={field.placeholder}
        />
      )
    }

    return (
      <CustomInput
        label={field.label}
        fullWidth
        placeholder={field.placeholder}
        {...controllerField}
      />
    )
  }

  const renderSkeletonContent = () => (
    <Box>
      <Grid container spacing={2}>
        {fields?.slice(0, 3).map((_, idx) => (
          <Grid key={idx} size={{ md: 4, xs: 12 }}>
            <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={42} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  const submit = (data: T) => {
    onApply(data)
    if (isMobile) setDrawerOpen(false)
  }

  const desktopActionButtonSx = {
    border: `1px solid ${alpha(DE_BLUE, 0.25)}`,
    p: 1,
    borderRadius: 1,
    background: alpha(DE_BLUE, 0.06),
    color: DE_BLUE,
    '&:hover': {
      background: alpha(DE_BLUE, 0.12),
      borderColor: alpha(DE_BLUE, 0.45),
    },
  }

  const renderFormContent = () => (
    <form onSubmit={handleSubmit(submit)}>
      <Stack gap={1.2}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          alignItems={{ xs: 'stretch', lg: 'center' }}
          justifyContent="space-between"
          gap={1.2}
        >
          <Grid container spacing={1.4} sx={{ flex: 1 }}>
            {primaryFields.map((field) => (
              <Grid size={{ md: 4, xs: 12 }} key={field.name}>
                <Controller
                  name={field.name as Path<T>}
                  control={control}
                  render={({ field: controllerField }) => renderFieldControl(field, controllerField)}
                />
              </Grid>
            ))}
          </Grid>

          {!isMobile ? (
            <Stack mt={{ lg: 1.6 }} gap={0.8} direction="row" alignItems="center">
              {advancedFields.length ? (
                <Tooltip title={showAdvanced ? 'Hide advanced filters' : 'Show advanced filters'}>
                  <IconButton
                    sx={desktopActionButtonSx}
                    size="small"
                    onClick={() => setShowAdvanced((prev) => !prev)}
                  >
                    {showAdvanced ? <RxDoubleArrowUp /> : <RxDoubleArrowDown />}
                  </IconButton>
                </Tooltip>
              ) : null}

              <Button
                type="submit"
                variant="contained"
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 1,
                  minWidth: 92,
                  py: 1,
                  background: `linear-gradient(135deg, ${DE_BLUE} 0%, #2a5fbe 100%)`,
                }}
              >
                Apply
              </Button>

              <Tooltip title="Clear all filters">
                <IconButton
                  sx={desktopActionButtonSx}
                  size="small"
                  onClick={() => {
                    reset(defaultValues)
                    onApply({} as T)
                  }}
                >
                  <MdDelete />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : null}
        </Stack>

        {advancedFields.length > 0 && (
          <Collapse in={showAdvanced} timeout="auto" unmountOnExit>
            <Box
              sx={{
                p: { xs: 0.4, md: 1.1 },
                borderRadius: 1,
                border: `1px solid ${alpha(DE_BLUE, 0.14)}`,
                backgroundColor: alpha(DE_BLUE, 0.03),
              }}
            >
              <Grid container spacing={1.4}>
                {advancedFields.map((field) => (
                  <Grid size={{ md: 3, xs: 12 }} key={field.name}>
                    <Controller
                      name={field.name as Path<T>}
                      control={control}
                      render={({ field: controllerField }) => renderFieldControl(field, controllerField)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Collapse>
        )}
      </Stack>
    </form>
  )

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        {isMobile ? (
          <IconButton
            sx={{
              border: `1px solid ${alpha(DE_BLUE, 0.25)}`,
              p: 1,
              display: 'flex',
              gap: 1,
              borderRadius: 1,
              background: alpha(DE_BLUE, 0.06),
              color: DE_BLUE,
              '&:hover': {
                background: alpha(DE_BLUE, 0.12),
                borderColor: alpha(DE_BLUE, 0.45),
              },
            }}
            size="small"
            onClick={() => setDrawerOpen(true)}
          >
            <FaFilter />
            {appliedCount ? <Typography variant="caption">{appliedCount}</Typography> : null}
          </IconButton>
        ) : null}
      </Stack>

      {!isMobile && (
        <CardContent
          sx={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            background: `
              radial-gradient(560px 170px at 0% 0%, ${alpha(DE_AMBER, 0.08)} 0%, transparent 75%),
              radial-gradient(560px 170px at 100% 0%, ${alpha(DE_BLUE, 0.1)} 0%, transparent 75%),
              #ffffff
            `,
            border: `1px solid ${alpha(DE_BLUE, 0.16)}`,
            borderRadius: 1,
            boxShadow: '0 6px 18px rgba(0, 82, 204, 0.1)',
            px: { xs: 1.25, md: 1.5 },
            py: { xs: 1.1, md: 1.3 },
          }}
        >
          {bgOverlayImg && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${bgOverlayImg})`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                opacity: 0.08,
                zIndex: 0,
              }}
            />
          )}

          <Box sx={{ position: 'relative', zIndex: 2 }}>
            {loading ? renderSkeletonContent() : renderFormContent()}
          </Box>
        </CardContent>
      )}

      <CustomDrawer
        title="Filters"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        anchor="left"
      >
        <form
          onSubmit={handleSubmit((data) => {
            submit(data)
            setDrawerOpen(false)
          })}
        >
          <Stack spacing={2} px={1}>
            {[...primaryFields, ...advancedFields].map((field) => (
              <Controller
                key={field.name}
                name={field.name as Path<T>}
                control={control}
                render={({ field: controllerField }) => renderFieldControl(field, controllerField)}
              />
            ))}

            <Stack direction="row" spacing={2} mt={2} justifyContent="space-between">
              <Button
                fullWidth
                variant="outlined"
                startIcon={<MdDelete />}
                onClick={() => {
                  reset(defaultValues)
                  onApply({} as T)
                  setDrawerOpen(false)
                }}
                sx={{
                  borderColor: alpha(DE_BLUE, 0.3),
                  color: DE_BLUE,
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: 1,
                  '&:hover': {
                    borderColor: DE_BLUE,
                    backgroundColor: alpha(DE_BLUE, 0.08),
                  },
                }}
              >
                Clear
              </Button>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                sx={{
                  background: `linear-gradient(135deg, ${DE_BLUE} 0%, #2a5fbe 100%)`,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: 1,
                }}
              >
                Apply
              </Button>
            </Stack>
          </Stack>
        </form>
      </CustomDrawer>
    </>
  )
}
