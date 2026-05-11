import { Box, FormControlLabel, Link, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { FiMail, FiShield, FiUser } from 'react-icons/fi'
import { MdPassword } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'
import { useRequestPasswordLogin, useVerifyEmailOtp } from '../../hooks/useRequestPasswordLogin'
import { TERMS_AND_CONDITIONS } from '../../utils/constants'
import { setOnboardingPrefill } from '../../utils/onboardingPrefill'
import CustomIconLoadingButton from '../UI/button/CustomLoadingButton'
import CustomCheckbox from '../UI/inputs/CustomCheckbox'
import CustomInput from '../UI/inputs/CustomInput'
import CustomModal from '../UI/modal/CustomModal'
import { toast } from '../UI/Toast'
import { getAuthErrorMessage } from './getAuthErrorMessage'
import AuthCodePreview from './AuthCodePreview'
import CodeInput from './CodeInput'
import { extractInlineCode } from './inlineCode'
import { brand } from '../../theme/brand'

interface CredentialAuthFormProps {
  mode: 'login' | 'signup'
}

type PasswordAccessResponse = {
  token?: string
  refreshToken?: string
  user?: {
    id?: string
  }
  message?: string
}

export default function CredentialAuthForm({ mode }: CredentialAuthFormProps) {
  const navigate = useNavigate()
  const { setTokens, setUserId } = useAuth()
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState(sessionStorage.getItem('activeEmail') ?? '')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [termsChecked, setTermsChecked] = useState(false)
  const [inlineCode, setInlineCode] = useState('')
  const [openTerms, setOpenTerms] = useState(false)
  const [error, setError] = useState('')

  const { mutate: requestPasswordAccess, isPending: requesting } = useRequestPasswordLogin()
  const { mutate: verifyEmailOtp, isPending: verifying } = useVerifyEmailOtp()

  const emailError = useMemo(() => {
    if (!email) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
    return ''
  }, [email])

  const passwordError = useMemo(() => {
    if (!password) return 'Password is required.'
    if (password.length < 6) return 'Minimum 6 characters required.'
    return ''
  }, [password])

  const nameError = useMemo(() => {
    if (mode !== 'signup') return ''
    if (!name.trim()) return 'Name is required.'
    return ''
  }, [mode, name])

  const handleRequest = (event?: React.FormEvent) => {
    event?.preventDefault()

    if (nameError || emailError || passwordError) {
      setError(nameError || emailError || passwordError)
      return
    }

    if (!termsChecked) {
      toast.open({
        message: 'Accept the Terms and Conditions to continue.',
        severity: 'warning',
      })
      return
    }

    setError('')
    if (mode === 'signup') {
      setOnboardingPrefill(name)
    }

    requestPasswordAccess(
      {
        email: email.trim().toLowerCase(),
        password,
        intent: mode,
      },
      {
        onSuccess: (response: unknown) => {
          const responseRecord = response as Record<string, unknown>
          const authResponse = response as PasswordAccessResponse
          const verificationCode = extractInlineCode(responseRecord)
          setInlineCode(verificationCode)

          if (authResponse?.token && authResponse?.refreshToken) {
            sessionStorage.setItem('activeEmail', email.trim().toLowerCase())
            if (authResponse?.user?.id) {
              setUserId(authResponse.user.id)
            }
            setTokens(authResponse.token, authResponse.refreshToken)
            navigate('/app', { replace: true })
            return
          }

          if (verificationCode || authResponse?.message?.includes('Verification')) {
            setStep('verify')
            setCode('')
            toast.open({
              message: verificationCode
                ? 'Verification code generated. Use the inline preview below.'
                : 'Verification code sent to your email.',
              severity: 'success',
            })
            return
          }

          if (authResponse?.message) {
            toast.open({
              message: authResponse.message,
              severity: 'success',
            })
          }
        },
        onError: (err: unknown) => {
          setError(getAuthErrorMessage(err, 'Authentication failed'))
        },
      },
    )
  }

  const handleVerify = (event?: React.FormEvent) => {
    event?.preventDefault()

    if (code.length !== 8) {
      setError('Enter the full 8-character verification code.')
      return
    }

    setError('')
    verifyEmailOtp(
      {
        email: email.trim().toLowerCase(),
        otp: code,
        password,
      },
      {
        onSuccess: ({ token, refreshToken, user }) => {
          sessionStorage.setItem('activeEmail', email.trim().toLowerCase())
          setUserId(user?.id)
          setTokens(token, refreshToken)
          navigate('/app', { replace: true })
        },
        onError: (err: unknown) => {
          setError(getAuthErrorMessage(err, 'Verification failed'))
        },
      },
    )
  }

  const heading =
    mode === 'signup' ? 'Create your Dolphin account' : 'Sign in with email and password'
  const description =
    mode === 'signup'
      ? 'Set up your seller profile and start managing shipping, pickups, rates, labels, and invoices from one place.'
      : 'Enter your account details to open your dashboard and continue shipping without friction.'

  return (
    <Stack spacing={2.2}>
      <Stack spacing={0.8}>
        <Typography sx={{ color: brand.ink, fontWeight: 800, fontSize: '1.18rem' }}>
          {heading}
        </Typography>
        <Typography sx={{ color: brand.inkSoft, lineHeight: 1.7, fontSize: '0.92rem' }}>
          {description}
        </Typography>
      </Stack>

      <AuthCodePreview
        title={mode === 'signup' ? 'Verify your new account' : 'Verify your sign in'}
        code={inlineCode}
        helper="Use this code to complete verification."
      />

      {step === 'form' ? (
        <Stack component="form" spacing={1.1} onSubmit={handleRequest}>
          {mode === 'signup' ? (
            <CustomInput
              label="Full Name"
              name="fullName"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setError('')
              }}
              helperText={name ? nameError : ''}
              error={Boolean(name) && Boolean(nameError)}
              prefix={<FiUser color={brand.ink} size={15} />}
              autoFocus
              required
              topMargin={false}
            />
          ) : null}

          <CustomInput
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError('')
            }}
            helperText={email ? emailError : ''}
            error={Boolean(email) && Boolean(emailError)}
            prefix={<FiMail color={brand.ink} size={15} />}
            required
            topMargin={mode !== 'signup'}
          />

          <CustomInput
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError('')
            }}
            helperText={password ? passwordError : ''}
            error={Boolean(password) && Boolean(passwordError)}
            prefix={<MdPassword color={brand.ink} size={16} />}
            required
          />

          {error ? (
            <Typography sx={{ color: brand.danger, fontSize: '0.82rem', fontWeight: 700, mt: 0.5 }}>
              {error}
            </Typography>
          ) : null}

          <FormControlLabel
            sx={{ mt: 0.5, mb: 1.2, alignItems: 'flex-start' }}
            control={
              <CustomCheckbox
                checked={termsChecked}
                onChange={(event) => setTermsChecked(event.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography sx={{ color: brand.inkSoft, fontSize: '0.86rem', mt: 0.25 }}>
                I agree to{' '}
                <Link
                  component="button"
                  underline="hover"
                  onClick={() => setOpenTerms(true)}
                  sx={{ color: brand.ink, fontWeight: 700 }}
                >
                  Terms and Conditions
                </Link>
              </Typography>
            }
          />

          <CustomIconLoadingButton
            type="submit"
            text={mode === 'signup' ? 'Create account' : 'Continue with password'}
            loading={requesting}
            loadingText={mode === 'signup' ? 'Creating...' : 'Checking...'}
            disabled={Boolean(nameError || emailError || passwordError) || !termsChecked}
            styles={{ width: '100%' }}
          />
        </Stack>
      ) : (
        <Stack component="form" spacing={2} onSubmit={handleVerify}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              border: `1px solid rgba(16,50,74,0.08)`,
              backgroundColor: 'rgba(198,231,255,0.18)',
            }}
          >
            <Typography sx={{ color: brand.ink, lineHeight: 1.68, fontSize: '0.9rem' }}>
              Enter the 8-character verification code for <strong>{email}</strong>.
            </Typography>
          </Box>

          <CodeInput length={8} mode="alphanumeric" value={code} onChange={setCode} />

          {error ? (
            <Typography sx={{ color: brand.danger, textAlign: 'center', fontSize: '0.82rem', fontWeight: 700 }}>
              {error}
            </Typography>
          ) : null}

          <CustomIconLoadingButton
            type="submit"
            text={mode === 'signup' ? 'Verify and open dashboard' : 'Verify and continue'}
            loading={verifying}
            loadingText="Verifying..."
            disabled={code.length !== 8}
            styles={{ width: '100%' }}
          />

          <CustomIconLoadingButton
            type="button"
            text="Resend verification code"
            variant="text"
            loading={requesting}
            loadingText="Sending..."
            onClick={() => handleRequest()}
            styles={{ width: '100%' }}
          />
        </Stack>
      )}

      <Stack direction="row" spacing={1} alignItems="center">
        <FiShield size={14} color={brand.success} />
        <Typography sx={{ color: brand.inkSoft, fontSize: '0.82rem', lineHeight: 1.6 }}>
          Your shipping data, invoices, and courier settings stay protected behind secure account access.
        </Typography>
      </Stack>

      <CustomModal
        open={openTerms}
        onClose={() => setOpenTerms(false)}
        title="Terms and Conditions"
      >
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'pre-line',
            maxHeight: '60vh',
            overflowY: 'auto',
            pr: 1,
          }}
        >
          {TERMS_AND_CONDITIONS}
        </Typography>
      </CustomModal>
    </Stack>
  )
}
