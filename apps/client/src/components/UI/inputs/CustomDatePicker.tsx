import { alpha, Box, Typography } from '@mui/material'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import React from 'react'
import { brand } from '../../../theme/brand'

interface CustomDatePickerProps {
  label?: string
  required?: boolean
  value?: string | Date | null
  onChange?: (e: { target: { value: string } }) => void
  placeholder?: string
  helperText?: string
  width?: string | number
  topMargin?: boolean
  error?: boolean
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label = '',
  required = false,
  value,
  onChange,
  placeholder = '',
  helperText,
  width = '100%',
  topMargin = true,
  error = false,
}) => {
  const pickerValue = value
    ? value instanceof Date
      ? value
      : new Date(String(value))
    : null

  return (
    <Box sx={{ mt: topMargin ? 2 : 0, width }}>
      {label && (
        <Typography
          sx={{
            mb: 0.9,
            fontSize: '0.74rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: brand.inkSoft,
          }}
        >
          {label}
          {required && <Box component="span" sx={{ ml: 0.5, color: brand.warning }}>*</Box>}
        </Typography>
      )}

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          orientation="landscape"
          value={pickerValue && !Number.isNaN(pickerValue.getTime()) ? pickerValue : null}
          onChange={(newValue: Date | null) => {
            if (onChange) {
              const formatted = newValue
                ? newValue.toISOString().split('T')[0] // yyyy-MM-dd
                : ''
              onChange({ target: { value: formatted } })
            }
          }}
          slotProps={{
            textField: {
              fullWidth: true,
              sx: {
                width,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  bgcolor: alpha('#FFFFFF', 0.9),
                  backgroundImage:
                    'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.98) 100%)',
                  boxShadow: '0 10px 24px rgba(15,44,67,0.045)',
                  transition: 'all 0.2s ease',
                  '& fieldset': {
                    borderColor: alpha(brand.ink, 0.1),
                  },
                  '&:hover fieldset': {
                    borderColor: alpha(brand.ink, 0.24),
                  },
                  '&.Mui-focused': {
                    boxShadow:
                      '0 0 0 4px rgba(198,231,255,0.34), 0 16px 30px rgba(15,44,67,0.08)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: alpha(brand.ink, 0.28),
                    borderWidth: 1.5,
                  },
                },
                '& .MuiInputBase-input': {
                  py: 1.22,
                  px: 1.75,
                  height: 'auto',
                  color: brand.ink,
                  fontWeight: 600,
                  fontSize: '0.94rem',
                  lineHeight: 1.4,
                  zIndex: 2,
                },
                '& .MuiFormHelperText-root': {
                  ml: 0.3,
                  mt: 0.75,
                  fontWeight: 600,
                  fontSize: '0.76rem',
                },
              },
              placeholder,
              helperText,
              error: Boolean(error),
            },
          }}
          enableAccessibleFieldDOMStructure={false} // fix slot error
        />
      </LocalizationProvider>

      {helperText && (
        <Box sx={{ mt: 0.5, textAlign: 'right' }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: '11px',
              opacity: 0.7,
              fontStyle: 'italic',
            }}
          >
            {helperText}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default CustomDatePicker
