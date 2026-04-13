import { Box, Button, IconButton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { FiArrowUpRight } from 'react-icons/fi'
import {
  TbLayoutSidebarLeftCollapseFilled,
  TbLayoutSidebarRightCollapseFilled,
} from 'react-icons/tb'
import { useLocation, useNavigate } from 'react-router-dom'
import BrandTopBar from '../brand/BrandTopBar'
import { brand, brandGradients } from '../../theme/brand'
import GlobalSearch from './GlobalSearch'
import QuickActions from './QuickActions'
import UserMenu from './UserMenu'
import WalletMenu from './WalletMenu'

interface NavbarProps {
  handleDrawerToggle: () => void
  pinned: boolean
  name?: string
}

const getSectionLabel = (pathname: string) =>
  (
    [
      { label: 'Dashboard', match: '/dashboard' },
      { label: 'Home', match: '/home' },
      { label: 'Orders', match: '/orders' },
      { label: 'Billing', match: '/billing' },
      { label: 'Support', match: '/support' },
      { label: 'Channels', match: '/channels' },
      { label: 'Couriers', match: '/couriers' },
      { label: 'Weight Discrepancy', match: '/reconciliation' },
      { label: 'Reports', match: '/reports' },
      { label: 'Tools', match: '/tools' },
      { label: 'Settings', match: '/settings' },
      { label: 'Profile', match: '/profile' },
    ] as const
  ).find((section) => pathname.startsWith(section.match))?.label || 'Dashboard'

export default function Navbar({ handleDrawerToggle, pinned }: NavbarProps) {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'))
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const activeSection = getSectionLabel(location.pathname)

  return (
    <BrandTopBar sx={{ zIndex: (muiTheme) => muiTheme.zIndex.appBar }}>
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ width: '100%' }}
      >
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={{ xs: 1, lg: 1.25 }}
          alignItems={{ xs: 'stretch', lg: 'center' }}
          justifyContent="space-between"
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ minWidth: 0, flex: { lg: '0 1 24rem' } }}
          >
            <IconButton
              size="small"
              onClick={handleDrawerToggle}
              sx={{
                bgcolor: alpha('#FFFFFF', 0.72),
                borderRadius: '18px',
                border: `1px solid ${alpha(brand.ink, 0.08)}`,
                color: brand.ink,
                width: 42,
                height: 42,
                flexShrink: 0,
              }}
            >
              {isTablet ? (
                <TbLayoutSidebarRightCollapseFilled size={18} />
              ) : pinned ? (
                <TbLayoutSidebarLeftCollapseFilled size={18} />
              ) : (
                <TbLayoutSidebarRightCollapseFilled size={18} />
              )}
            </IconButton>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: alpha(brand.inkSoft, 0.92),
                }}
              >
                Workspace
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '1rem', sm: '1.08rem' },
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: brand.ink,
                  lineHeight: 1.12,
                }}
              >
                {activeSection}
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ flex: { lg: '1 1 auto' }, minWidth: 0 }}>
            <GlobalSearch />
          </Box>

          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
            sx={{
              flexWrap: 'wrap',
              rowGap: 0.75,
              flex: { lg: '0 1 auto' },
            }}
          >
            {!isMobile && (
              <Button
                variant="contained"
                onClick={() => navigate('/orders/create')}
                sx={{
                  minWidth: 'fit-content',
                  px: 1.7,
                  py: 0.95,
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  background: brandGradients.button,
                  color: brand.ink,
                  boxShadow: '0 16px 32px rgba(130,194,255,0.24)',
                }}
                endIcon={<FiArrowUpRight size={16} />}
              >
                Create Order
              </Button>
            )}

            <QuickActions />
            <WalletMenu />
            <UserMenu />
          </Stack>
        </Stack>
      </motion.div>
    </BrandTopBar>
  )
}
