import { alpha, Box, IconButton, InputAdornment, TextField, Typography } from '@mui/material'
import type { TextFieldProps } from '@mui/material/TextField'
import React, { forwardRef, useEffect, useRef, useState } from 'react'
import { MdVisibility, MdVisibilityOff } from 'react-icons/md'
import { brand } from '../../../theme/brand'

interface CustomInputProps extends Omit<TextFieldProps, 'variant' | 'prefix' | 'postfix'> {
  label?: string
  placeholder?: string
  prefix?: React.ReactNode
  postfix?: React.ReactNode
  required?: boolean
  width?: string | number
  helpText?: string
  topMargin?: boolean
  maxLength?: number
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  (
    {
      value,
      onChange,
      type = 'text',
      label = '',
      placeholder = '',
      prefix,
      postfix,
      required = false,
      helperText,
      width = '100%',
      helpText,
      topMargin = true,
      maxLength,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const internalRef = useRef<HTMLInputElement>(null)

    const isPasswordType = type === 'password'

    useEffect(() => {
      if (value) setIsFocused(true)
    }, [value])

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
              color: isFocused ? brand.ink : brand.inkSoft,
              cursor: 'pointer',
              transition: 'color 0.2s ease',
            }}
            onClick={() => internalRef.current?.focus()}
          >
            {label}
            {required && <Box component="span" sx={{ ml: 0.5, color: brand.warning }}>*</Box>}
          </Typography>
        )}

        <TextField
          type={isPasswordType && showPassword ? 'text' : type}
          value={value}
          onChange={onChange}
          helperText={helperText}
          fullWidth
          placeholder={placeholder}
          inputRef={(el) => {
            if (typeof ref === 'function') ref(el)
            else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el
            internalRef.current = el
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            if (!internalRef.current?.value) setIsFocused(false)
          }}
          sx={{
            width,
            '& .MuiOutlinedInput-root': {
              borderRadius: '24px',
              bgcolor: alpha('#FFFFFF', 0.9),
              backgroundImage:
                'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.98) 100%)',
              boxShadow: isFocused
                ? '0 0 0 4px rgba(198,231,255,0.34), 0 16px 30px rgba(15,44,67,0.08)'
                : '0 10px 24px rgba(15,44,67,0.045)',
              transition: 'all 0.2s ease',
              '& fieldset': {
                borderColor: isFocused ? alpha(brand.ink, 0.28) : alpha(brand.ink, 0.1),
                borderWidth: isFocused ? 1.5 : 1,
              },
              '&:hover fieldset': {
                borderColor: alpha(brand.ink, 0.24),
              },
              '&.Mui-error': {
                boxShadow: '0 0 0 3px rgba(209, 67, 67, 0.08)',
              },
              '&.Mui-error fieldset': {
                borderColor: alpha(brand.danger, 0.4),
              },
              '&.Mui-focused.Mui-error fieldset': {
                borderColor: alpha(brand.danger, 0.5),
              },
            },
            '& .MuiInputBase-input': {
              py: 1.22,
              color: brand.ink,
              fontWeight: 600,
              fontSize: '0.94rem',
              lineHeight: 1.4,
            },
            '& .MuiFormHelperText-root': {
              ml: 0.3,
              mt: 0.75,
              fontWeight: 600,
              fontSize: '0.76rem',
            },
          }}
          slotProps={{
            input: {
              startAdornment: prefix ? (
                <InputAdornment position="start">
                  <Box sx={{ display: 'flex', color: isFocused ? brand.ink : alpha(brand.ink, 0.72) }}>
                    {prefix}
                  </Box>
                </InputAdornment>
              ) : undefined,
              endAdornment: (
                <InputAdornment position="end">
                  {isPasswordType ? (
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      sx={{
                        color: isFocused ? brand.warning : brand.inkSoft,
                        '&:hover': { bgcolor: alpha(brand.warning, 0.08) },
                      }}
                    >
                      {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                    </IconButton>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', color: alpha(brand.ink, 0.72) }}>
                      {postfix}
                    </Box>
                  )}
                </InputAdornment>
              ),
            },
            htmlInput: {
              maxLength: maxLength ?? 100,
            },
          }}
          {...props}
        />

        {helpText ? (
          <Box sx={{ mt: 0.8, display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: '11px',
                color: brand.inkSoft,
                textAlign: 'right',
              }}
            >
              {helpText}
            </Typography>
          </Box>
        ) : null}
      </Box>
    )
  },
)

CustomInput.displayName = 'CustomInput'

export default CustomInput
