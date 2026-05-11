import { Box, Button, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { Navigate, Link as RouterLink } from 'react-router-dom'
import AuthShell from '../../components/auth/AuthShell'
import CredentialAuthForm from '../../components/auth/CredentialAuthForm'
import OtpLoginPanel from '../../components/auth/OtpLoginPanel'
import FullScreenLoader from '../../components/UI/loader/FullScreenLoader'
import { useAuth } from '../../context/auth/AuthContext'
import { brand, brandGradients } from '../../theme/brand'

export default function Login() {
  const { loading, isAuthenticated } = useAuth()
  const [mode, setMode] = useState<'otp' | 'password'>('otp')

  if (loading) return <FullScreenLoader />
  if (isAuthenticated) return <Navigate to="/app" replace />

  return (
    <AuthShell
      eyebrow="Seller Login"
      title="Welcome back to your shipping command center."
      subtitle="Manage orders, couriers, invoices, pickups, and tracking from one simple workspace built for growing ecommerce teams."
      helperTitle="Everything stays connected"
      helperText="Sign in to continue where you left off, with your warehouses, rate cards, shipments, invoices, and reports ready in one place."
      showChrome={false}
    >
      <Stack spacing={2.4}>
        <Stack spacing={0.8}>
          <Typography sx={{ color: brand.ink, fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.05em' }}>
            Login
          </Typography>
          <Typography sx={{ color: brand.inkSoft, lineHeight: 1.72 }}>
            Use your registered email to securely access your Dolphin account.
          </Typography>
        </Stack>

        <Box
          sx={{
            p: 0.6,
            borderRadius: 1,
            backgroundColor: 'rgba(198,231,255,0.18)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 0.6,
          }}
        >
          {[
            { value: 'otp', label: 'Email OTP' },
            { value: 'password', label: 'Password' },
          ].map((item) => (
            <Button
              key={item.value}
              type="button"
              onClick={() => setMode(item.value as 'otp' | 'password')}
              sx={{
                borderRadius: 1,
                py: 1.2,
                background: mode === item.value ? brandGradients.button : 'transparent',
                color: brand.ink,
                fontWeight: 700,
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {mode === 'otp' ? <OtpLoginPanel /> : <CredentialAuthForm mode="login" />}

        <Typography sx={{ color: brand.inkSoft, textAlign: 'center', fontSize: '0.88rem' }}>
          New to Dolphin?{' '}
          <Box component={RouterLink} to="/signup" sx={{ color: brand.ink, fontWeight: 700 }}>
            Create an account
          </Box>
        </Typography>
      </Stack>
    </AuthShell>
  )
}
