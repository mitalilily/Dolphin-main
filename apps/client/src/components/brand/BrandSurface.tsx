import { Box, type BoxProps } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'
import { brand, brandGradients } from '../../theme/brand'

type BrandSurfaceVariant = 'card' | 'glass' | 'hero' | 'soft' | 'dark'

interface BrandSurfaceProps extends BoxProps {
  variant?: BrandSurfaceVariant
}

const variantStyles: Record<BrandSurfaceVariant, SxProps<Theme>> = {
  card: {
    background: brandGradients.surface,
    border: `1px solid ${alpha(brand.line, 0.92)}`,
    boxShadow: brand.shadow,
  },
  glass: {
    backgroundColor: brand.surfaceGlass,
    border: `1px solid ${alpha('#FFFFFF', 0.72)}`,
    backdropFilter: 'blur(18px)',
    boxShadow: brand.shadow,
  },
  hero: {
    background: brandGradients.hero,
    border: `1px solid ${alpha('#FFFFFF', 0.76)}`,
    boxShadow: '0 28px 80px rgba(15, 44, 67, 0.12)',
  },
  soft: {
    background: brandGradients.softSurface,
    border: `1px solid ${alpha(brand.ink, 0.08)}`,
    boxShadow: '0 18px 38px rgba(15, 44, 67, 0.06)',
  },
  dark: {
    background: `linear-gradient(180deg, ${brand.ink} 0%, #163E59 100%)`,
    color: '#FFFFFF',
    border: `1px solid ${alpha('#FFFFFF', 0.16)}`,
    boxShadow: '0 28px 60px rgba(15, 44, 67, 0.22)',
  },
}

export default function BrandSurface({
  variant = 'card',
  sx,
  children,
  ...rest
}: BrandSurfaceProps) {
  return (
    <Box
      sx={[
        {
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          borderRadius: { xs: '28px', sm: '34px' },
        },
        variantStyles[variant],
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...rest}
    >
      {children}
    </Box>
  )
}
