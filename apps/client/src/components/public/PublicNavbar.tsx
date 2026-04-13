import { Box, Button, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import BrandLogo from '../brand/BrandLogo'
import BrandTopBar from '../brand/BrandTopBar'
import { brand, brandGradients } from '../../theme/brand'

type NavItem = {
  label: string
  to: string
}

interface PublicNavbarProps {
  links?: NavItem[]
  primaryLabel?: string
  primaryTo?: string
  secondaryLabel?: string
  secondaryTo?: string
}

export default function PublicNavbar({
  links = [],
  primaryLabel = 'Get Started',
  primaryTo = '/signup',
  secondaryLabel = 'Login',
  secondaryTo = '/login',
}: PublicNavbarProps) {
  const location = useLocation()

  return (
    <BrandTopBar>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ minHeight: 56 }}
      >
        <RouterLink to="/" aria-label="Dolphin Enterprise home">
          <BrandLogo />
        </RouterLink>

        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{ display: { xs: 'none', lg: 'flex' } }}
        >
          {links.map((item) => {
            const isActive = location.pathname === item.to
            const isHash = item.to.startsWith('#')

            return (
              <Box
                key={`${item.label}-${item.to}`}
                component={isHash ? 'a' : RouterLink}
                href={isHash ? item.to : undefined}
                to={isHash ? undefined : item.to}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 999,
                  color: isActive ? brand.ink : brand.inkSoft,
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  background: isActive ? brandGradients.button : 'transparent',
                  boxShadow: isActive ? '0 10px 24px rgba(130,194,255,0.18)' : 'none',
                  '&:hover': {
                    color: brand.ink,
                    backgroundColor: alpha('#FFFFFF', 0.68),
                  },
                }}
              >
                {item.label}
              </Box>
            )
          })}
        </Stack>

        <Stack direction="row" spacing={1.1} alignItems="center">
          <Button
            component={RouterLink}
            to={secondaryTo}
            variant="text"
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              color: brand.ink,
              fontWeight: 700,
              '&:hover': {
                backgroundColor: alpha('#FFFFFF', 0.62),
              },
            }}
          >
            {secondaryLabel}
          </Button>
          <Button
            component={RouterLink}
            to={primaryTo}
            variant="contained"
            sx={{
              background: brandGradients.button,
              color: brand.ink,
              boxShadow: '0 16px 32px rgba(130,194,255,0.24)',
              '&:hover': {
                background: brandGradients.button,
                transform: 'translateY(-1px)',
                boxShadow: '0 20px 40px rgba(130,194,255,0.3)',
              },
            }}
          >
            {primaryLabel}
          </Button>
        </Stack>
      </Stack>
      <Typography
        sx={{
          display: { xs: 'block', lg: 'none' },
          mt: 0.8,
          color: alpha(brand.inkSoft, 0.92),
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        Shipping platform for growing ecommerce sellers
      </Typography>
    </BrandTopBar>
  )
}
