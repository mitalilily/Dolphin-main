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
      title="Start with a faster, cleaner seller onboarding flow."
      subtitle="Signup is now wired directly from the landing page and still reuses the backend’s existing password setup and verification endpoints."
      helperTitle="Name capture stays frontend-only"
      helperText="The backend schema is unchanged, so your name is simply used to prefill onboarding after verification instead of changing any API contracts."
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
            Enter your name, email, and password to create access using the current backend flow.
            Verification codes will show inline when available.
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
