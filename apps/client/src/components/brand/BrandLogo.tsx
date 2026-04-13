import { Box, type BoxProps } from '@mui/material'

interface BrandLogoProps extends Omit<BoxProps, 'component'> {
  compact?: boolean
}

export default function BrandLogo({ compact = false, sx, ...rest }: BrandLogoProps) {
  return (
    <Box
      component="img"
      src={compact ? '/logo/dolphin-logo.png' : '/logo/dolphin-logo-transparent.png'}
      alt="Dolphin Enterprise"
      sx={{
        width: compact ? 44 : { xs: 160, sm: 190 },
        height: 'auto',
        objectFit: 'contain',
        display: 'block',
        ...sx,
      }}
      {...rest}
    />
  )
}
