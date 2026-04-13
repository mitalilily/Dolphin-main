import { Box, type BoxProps } from '@mui/material'
import BrandSurface from './BrandSurface'

interface BrandTopBarProps extends BoxProps {
  innerSx?: BoxProps['sx']
}

export default function BrandTopBar({
  children,
  sx,
  innerSx,
  ...rest
}: BrandTopBarProps) {
  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1200,
        px: { xs: 2, sm: 3 },
        py: { xs: 1.25, sm: 1.5 },
        ...sx,
      }}
      {...rest}
    >
      <BrandSurface
        variant="glass"
        sx={{
          px: { xs: 2, sm: 2.75, lg: 3.25 },
          py: { xs: 1.15, sm: 1.35 },
          ...innerSx,
        }}
      >
        {children}
      </BrandSurface>
    </Box>
  )
}
