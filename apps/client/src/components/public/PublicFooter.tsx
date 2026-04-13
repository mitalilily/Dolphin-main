import { Box, Container, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'
import BrandLogo from '../brand/BrandLogo'
import { brand } from '../../theme/brand'

export default function PublicFooter() {
  return (
    <Box component="footer" sx={{ mt: 8, pb: 4, px: 2 }}>
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          sx={{
            borderTop: `1px solid ${alpha(brand.ink, 0.08)}`,
            pt: 3,
          }}
        >
          <Stack spacing={1}>
            <RouterLink to="/" aria-label="Dolphin Enterprise home">
              <BrandLogo sx={{ width: { xs: 150, sm: 170 } }} />
            </RouterLink>
            <Typography sx={{ color: brand.inkSoft, fontSize: '0.9rem', maxWidth: 420 }}>
              Smart shipping, live tracking, and better delivery decisions from one seller-ready dashboard.
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2.25} flexWrap="wrap" useFlexGap>
            {[
              { label: 'Home', to: '/' },
              { label: 'Signup', to: '/signup' },
              { label: 'Login', to: '/login' },
              { label: 'Tracking', to: '/tracking' },
            ].map((item) => (
              <Box
                key={item.to}
                component={RouterLink}
                to={item.to}
                sx={{
                  color: brand.ink,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  '&:hover': {
                    color: brand.inkSoft,
                  },
                }}
              >
                {item.label}
              </Box>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
