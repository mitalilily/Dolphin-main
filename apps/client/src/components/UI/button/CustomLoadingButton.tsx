import { Button, CircularProgress, Typography, alpha, type ButtonProps } from '@mui/material'
import React from 'react'
import { brand, brandGradients } from '../../../theme/brand'

type ButtonVisualVariant = 'solid' | 'text'

interface CustomIconLoadingButtonProps
  extends Omit<ButtonProps, 'color' | 'type' | 'disabled' | 'onClick' | 'variant'> {
  text: string
  icon?: React.ReactNode
  loading?: boolean
  onClick?: () => void
  disabled?: boolean
  loadingText?: string
  type?: 'button' | 'submit' | 'reset'
  styles?: Record<string, unknown>
  variant?: ButtonVisualVariant
  textColor?: string
}

export default function CustomIconLoadingButton({
  text,
  icon,
  loading = false,
  onClick,
  disabled = false,
  loadingText = 'Loading...',
  type = 'button',
  styles,
  textColor,
  variant = 'solid',
  ...rest
}: CustomIconLoadingButtonProps) {
  const isDisabled = loading || disabled

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      sx={{
        ...styles,
        px: 3,
        py: 1.25,
        textTransform: 'none',
        fontWeight: 700,
        gap: 1,
        borderRadius: 999,
        background: variant === 'solid' ? brandGradients.button : 'rgba(255,255,255,0.72)',
        color: textColor ?? (variant === 'solid' ? brand.ink : brand.ink),
        border:
          variant === 'text'
            ? `1px solid ${alpha(brand.ink, 0.12)}`
            : '1px solid rgba(255,255,255,0.3)',
        boxShadow:
          variant === 'solid'
            ? '0 16px 32px rgba(130,194,255,0.24)'
            : '0 10px 20px rgba(15,44,67,0.05)',
        '&:hover': {
          background:
            variant === 'solid'
              ? brandGradients.button
              : 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,251,255,1) 100%)',
          transform: variant === 'solid' ? 'translateY(-1px)' : 'none',
        },
        '&:disabled': {
          opacity: 0.58,
          cursor: 'not-allowed',
          background: variant === 'solid' ? brandGradients.button : 'rgba(255,255,255,0.72)',
          color: textColor ?? alpha(brand.ink, 0.62),
          borderColor: variant === 'text' ? alpha(brand.ink, 0.08) : alpha('#FFFFFF', 0.18),
        },
      }}
      {...rest}
    >
      {loading ? (
        <>
          <CircularProgress size={16} thickness={4} sx={{ color: 'currentColor' }} />
          <Typography variant="body2" sx={{ color: 'inherit', fontWeight: 700 }}>
            {loadingText}
          </Typography>
        </>
      ) : (
        <>
          {icon}
          <Typography variant="body2" sx={{ color: 'inherit', fontWeight: 700 }}>
            {text}
          </Typography>
        </>
      )}
    </Button>
  )
}
