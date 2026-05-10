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
      title="Start shipping with Dolphin."
      subtitle="Create your seller account, complete onboarding, add your warehouse, and begin booking courier orders from one connected dashboard."
      helperTitle="Made for growing sellers"
      helperText="Dolphin brings rate cards, pickups, manifests, labels, invoices, tracking, and support together so your team can move faster."
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
            Create your account
          </Typography>
          <Typography sx={{ color: brand.inkSoft, lineHeight: 1.72 }}>
            Enter your name, email, and password. We will guide you through onboarding after your account is verified.
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
