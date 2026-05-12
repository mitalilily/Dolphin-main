import { Box, Button, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
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
      title="Get started with Dolphin in minutes."
      subtitle="Create your account, add your warehouse details, and start shipping your orders from a single easy-to-use dashboard."
      helperTitle="Built for growing businesses"
      helperText="Dolphin helps you manage pickups, shipping labels, invoices, tracking, and customer support faster and more easily."
      showChrome={false}
    >
      <Stack spacing={2.4}>
        <Stack spacing={0.8}>
          <Typography sx={{ color: brand.ink, fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.05em' }}>
            Safe & secure access
          </Typography>
          <Typography sx={{ color: brand.inkSoft, lineHeight: 1.72 }}>
            Verify your email, log in securely, and keep your shipping account protected.
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
      </Stack>
    </AuthShell>
  )
}
