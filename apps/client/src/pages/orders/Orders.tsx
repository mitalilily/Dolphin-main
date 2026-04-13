import { alpha, Alert, Box, Button, Container, Fade, Popover, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { MdAdd } from 'react-icons/md'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import AllOrders from '../../components/orders/AllOrders'
import B2COrderFormSteps from '../../components/orders/b2c/B2COrderForm'
import CustomDrawer from '../../components/UI/drawer/CustomDrawer'
import { useMerchantReadiness } from '../../hooks/useMerchantReadiness'

export default function Orders() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [orderType, setOrderType] = useState<'b2c' | 'b2b' | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { isReady, progress, firstIncompleteStep } = useMerchantReadiness()

  const openPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const closePopover = () => {
    setAnchorEl(null)
  }

  const handleSelectOrderType = (type: 'b2c' | 'b2b') => {
    if (!isReady) {
      navigate(firstIncompleteStep?.path || '/home')
      closePopover()
      return
    }

    setOrderType(type)
    setDrawerOpen(true)
    closePopover()
  }

  const glass = {
    backdropFilter: 'blur(16px)',
    background: 'rgba(255, 255, 255, 0.98)',
    border: '1px solid rgba(29, 40, 66, 0.12)',
    boxShadow: '0 14px 32px rgba(29, 40, 66, 0.12)',
    borderRadius: '14px',
    p: 3,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  }

  const orderTabs = [
    { label: 'All Orders', path: '/orders/list' },
    { label: 'B2C Orders', path: '/orders/b2c/list' },
    { label: 'B2B Orders', path: '/orders/b2b/list' },
  ]

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, md: 2.4 } }}>
      {!isReady && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => navigate(firstIncompleteStep?.path || '/home')}>
              Continue Setup
            </Button>
          }
          sx={{ mb: 3 }}
        >
          <Typography sx={{ fontWeight: 700 }}>Order creation is locked</Typography>
          <Typography variant="body2">
            Complete merchant readiness first. Current progress: {progress}%.
          </Typography>
        </Alert>
      )}

      <Box
        sx={{
          mb: 2.2,
          borderRadius: 2.5,
          overflow: 'hidden',
          border: '1px solid rgba(29, 40, 66, 0.1)',
          boxShadow: '0 12px 28px rgba(29, 40, 66, 0.08)',
          bgcolor: '#ffffff',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          gap={2}
          sx={{
            px: { xs: 1.5, md: 2.2 },
            py: { xs: 1.35, md: 1.6 },
            borderTop: '14px solid #1D2842',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.4}>
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: 0.4,
                border: '2px solid #1D2842',
                boxShadow: 'inset 0 0 0 2px #ffffff',
                bgcolor: '#1D2842',
              }}
            />
            <Typography sx={{ fontSize: { xs: '1.5rem', md: '1.9rem' }, fontWeight: 700, color: '#1D2842' }}>
              Orders
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap="wrap">
            <Button variant="outlined" onClick={() => window.location.reload()} sx={{ borderRadius: 1.2 }}>
              Refresh
            </Button>
            <Button
              startIcon={<MdAdd />}
              onClick={openPopover}
              variant="contained"
              size="medium"
              disabled={!isReady}
              sx={{
                bgcolor: '#1D2842',
                color: '#FFFFFF',
                fontWeight: 700,
                px: 2.6,
                py: 1,
                borderRadius: 1.2,
                '&:hover': {
                  bgcolor: '#152038',
                },
              }}
            >
              Create Order
            </Button>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          flexWrap="wrap"
          gap={0}
          sx={{
            px: { xs: 1.25, md: 1.8 },
            py: 1.8,
            borderTop: '1px solid rgba(29, 40, 66, 0.08)',
            bgcolor: '#ffffff',
          }}
        >
          {orderTabs.map((tab) => {
            const active = location.pathname === tab.path

            return (
              <Button
                key={tab.path}
                component={NavLink}
                to={tab.path}
                sx={{
                  borderRadius: 0,
                  px: 2.2,
                  py: 1.3,
                  mr: -0.5,
                  minWidth: 'unset',
                  border: '1px solid rgba(29, 40, 66, 0.28)',
                  color: active ? '#ffffff' : '#1D2842',
                  bgcolor: active ? '#1D2842' : '#ffffff',
                  fontWeight: active ? 800 : 700,
                  '&:hover': {
                    bgcolor: active ? '#1D2842' : alpha('#1D2842', 0.04),
                  },
                }}
              >
                {tab.label}
              </Button>
            )
          })}
        </Stack>
      </Box>

      <Box sx={{ mt: 1.5 }}>
        <AllOrders />
      </Box>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        sx={{ mt: 1 }}
        onClose={closePopover}
        slots={{ transition: Fade }}
        transitionDuration={200}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: glass } }}
      >
        <Button
          variant="outlined"
          onClick={() => handleSelectOrderType('b2c')}
          sx={{
            borderColor: '#1D2842',
            color: '#1D2842',
            fontWeight: 600,
            textTransform: 'none',
            px: 2.5,
            py: 1,
            borderRadius: '8px',
            '&:hover': {
              borderColor: '#152038',
              backgroundColor: 'rgba(29, 40, 66, 0.08)',
              color: '#152038',
            },
          }}
        >
          Create B2C Order
        </Button>
        <Button
          variant="outlined"
          onClick={() => handleSelectOrderType('b2b')}
          sx={{
            borderColor: '#1D2842',
            color: '#1D2842',
            fontWeight: 600,
            textTransform: 'none',
            px: 2.5,
            py: 1,
            borderRadius: '8px',
            '&:hover': {
              borderColor: '#152038',
              backgroundColor: 'rgba(29, 40, 66, 0.08)',
              color: '#152038',
            },
          }}
        >
          Create B2B Order
        </Button>
      </Popover>

      <CustomDrawer
        width={1400}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={orderType === 'b2c' ? 'Create New B2C Order' : 'Create New B2B Order'}
      >
        {orderType === 'b2c' ? <B2COrderFormSteps onClose={() => setDrawerOpen(false)} /> : null}
      </CustomDrawer>
    </Container>
  )
}
