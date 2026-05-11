import { Box, Stack, Typography } from '@mui/material'
import { Navigate, Link as RouterLink } from 'react-router-dom'
import AuthShell from '../../components/auth/AuthShell'
import CredentialAuthForm from '../../components/auth/CredentialAuthForm'
import FullScreenLoader from '../../components/UI/loader/FullScreenLoader'
import { useAuth } from '../../context/auth/AuthContext'
import { brand } from '../../theme/brand'

export default function Signup() {
  const { loading, isAuthenticated } = useAuth()

  if (loading) return <FullScreenLoader />
  if (isAuthenticated) return <Navigate to="/app" replace />

  return (
    <AuthShell
      eyebrow="Create Account"
      title="Get started with Dolphin in minutes."
      subtitle="Create your account, add your warehouse details, and start shipping your orders from a single easy-to-use dashboard."
      helperTitle="Built for growing businesses"
      helperText="Dolphin helps you manage pickups, shipping labels, invoices, tracking, and customer support faster and more easily."
      showChrome={false}
    >
      <Stack spacing={2.4}>
        <Stack spacing={0.8}>
          <Typography
            sx={{
              color: brand.ink,
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.05em',
            }}
          >
            Made for everyday shipping
          </Typography>
          <Typography sx={{ color: brand.inkSoft, lineHeight: 1.72 }}>
            Handle shipping, billing, and order fulfillment smoothly from a single platform.
          </Typography>
        </Stack>

        <CredentialAuthForm mode="signup" />

        <Typography sx={{ color: brand.inkSoft, textAlign: 'center', fontSize: '0.88rem' }}>
          Already have an account?{' '}
          <Box component={RouterLink} to="/login" sx={{ color: brand.ink, fontWeight: 700 }}>
            Login here
          </Box>
        </Typography>
      </Stack>
    </AuthShell>
  )
}
