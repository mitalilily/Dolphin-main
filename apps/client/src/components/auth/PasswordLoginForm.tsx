/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, FormControlLabel, Link, Stack, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useState, type Dispatch, type SetStateAction } from 'react'
import { FiMail, FiShield } from 'react-icons/fi'
import { MdInfoOutline, MdPassword } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'
import { useRequestPasswordLogin } from '../../hooks/useRequestPasswordLogin'
import CustomIconLoadingButton from '../UI/button/CustomLoadingButton'
import CustomCheckbox from '../UI/inputs/CustomCheckbox'
import CustomInput from '../UI/inputs/CustomInput'
import { toast } from '../UI/Toast'
import EmailVerificationForm from './EmailVerificationForm'
import { getAuthErrorMessage } from './getAuthErrorMessage'

const DE_BLUE = '#171310'
const DE_AMBER = '#2D7A63'

const primaryButtonStyles = {
  width: '100%',
  borderRadius: 1,
  bgcolor: DE_BLUE,
  boxShadow: `0 8px 24px ${alpha(DE_BLUE, 0.3)}`,
  '&:hover': { bgcolor: '#0D0A08' },
}

interface IPasswordFormProps {
  setStep: Dispatch<SetStateAction<number>>
  step: number
  setOpenTerms: Dispatch<SetStateAction<boolean>>
}

export default function PasswordLoginForm({ setStep, step, setOpenTerms }: IPasswordFormProps) {
  const { setTokens, setUserId } = useAuth()
  const navigate = useNavigate()
  const { mutate: requestPasswordLogin, isPending } = useRequestPasswordLogin()

  const [emailForm, setEmailForm] = useState({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  })

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  })

  const [termsChecked, setTermsChecked] = useState(false)

  const validateEmail = (email: string): string => {
    if (!email) return 'Email is required.'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Enter a valid email format.'
    return ''
  }

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required.'
    if (password.length < 6) return 'Minimum 6 characters required.'
    return ''
  }

  const handleChange = (field: 'email' | 'password', value: string) => {
    setEmailForm((prev) => ({ ...prev, [field]: value }))

    if (touched[field]) {
      const error = field === 'email' ? validateEmail(value) : validatePassword(value)
      setErrors((prev) => ({ ...prev, [field]: error }))
    }
  }

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const value = emailForm[field]
    const error = field === 'email' ? validateEmail(value) : validatePassword(value)
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const termsLabel = (
    <Typography fontSize="13px" display="flex" alignItems="center" gap="3px" color="#6A616A">
      I agree to{' '}
      <Link
        component="button"
        underline="hover"
        onClick={() => setOpenTerms(true)}
        sx={{ cursor: 'pointer', color: DE_BLUE, fontWeight: 700 }}
      >
        Terms and Conditions
      </Link>
    </Typography>
  )

  const isFormValid = !validateEmail(emailForm.email) && !validatePassword(emailForm.password)

  const handleSubmit = () => {
    if (!termsChecked) {
      toast.open({
        message: 'Please accept the Terms and Conditions to continue.',
        severity: 'warning',
        position: { vertical: 'top', horizontal: 'center' },
      })
      return
    }

    const emailError = validateEmail(emailForm.email)
    const passwordError = validatePassword(emailForm.password)

    setErrors({ email: emailError, password: passwordError })
    setTouched({ email: true, password: true })

    if (!emailError && !passwordError) {
      sessionStorage.setItem('preferredMethod', 'password')

      requestPasswordLogin(
        {
          email: emailForm.email,
          password: emailForm.password,
        },
        {
          onSuccess: ({ message, token, refreshToken, user, verificationToken }) => {
            if (message) {
              toast.open({
                message:
                  verificationToken || message.includes('Verification code generated')
                    ? 'Verification code sent to your email.'
                    : message,
                severity: 'success',
                position: { vertical: 'top', horizontal: 'center' },
              })
            }

            if (message.includes('Verification email sent') || message.includes('Verification code generated')) {
              setStep(1)
              return
            }

            setUserId(user?.id)
            setTokens(token, refreshToken)
            navigate('/onboarding-questions', { replace: true })
          },
          onError: (error: any) => {
            toast.open({
              message: getAuthErrorMessage(error, 'Something went wrong'),
              severity: 'error',
              position: { vertical: 'top', horizontal: 'center' },
            })
          },
        },
      )
    }
  }

  return step === 0 ? (
    <Stack width="100%" spacing={2.4}>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
          backgroundColor: alpha(DE_BLUE, 0.04),
        }}
      >
        <Typography variant="body2" sx={{ color: '#6A616A', lineHeight: 1.6, fontWeight: 500 }}>
          Enter your registered email and password. If verification is required, the code will
          be sent to your email.
        </Typography>
      </Box>

      <Stack spacing={1.1}>
        <CustomInput
          prefix={<FiMail color={DE_BLUE} size={15} />}
          type="email"
          name="email"
          id="email"
          label="Email"
          value={emailForm.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          required
          helperText={touched.email && errors.email}
          error={touched.email && !!errors.email}
        />

        <CustomInput
          label="Password"
          name="password"
          id="password"
          type="password"
          prefix={<MdPassword color={DE_BLUE} size={16} />}
          postfix={
            <Tooltip
              title={
                <Typography fontSize="12px">
                  For enhanced security, we recommend using the One-Time Passcode method.
                </Typography>
              }
              arrow
            >
              <Box sx={{ display: 'inline-flex', alignItems: 'center', color: '#FFAB00' }}>
                <MdInfoOutline size={17} />
              </Box>
            </Tooltip>
          }
          value={emailForm.password}
          onChange={(e) => handleChange('password', e.target.value)}
          onBlur={() => handleBlur('password')}
          required
          helperText={touched.password && errors.password}
          error={touched.password && !!errors.password}
        />
      </Stack>

      <FormControlLabel
        sx={{ mt: 0.4, alignItems: 'flex-start' }}
        control={
          <CustomCheckbox
            checked={termsChecked}
            onChange={(e) => setTermsChecked(e.target.checked)}
            color="primary"
          />
        }
        label={
          <Typography mt={0.4} variant="body2">
            {termsLabel}
          </Typography>
        }
      />

      <CustomIconLoadingButton
        type="button"
        text="Sign in with password"
        styles={primaryButtonStyles}
        onClick={handleSubmit}
        disabled={!isFormValid}
        loading={isPending}
        loadingText="Signing in..."
        textColor="#fff"
      />

      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
        <FiShield size={13} color={DE_AMBER} />
        <Typography variant="caption" sx={{ color: '#6A616A', fontWeight: 600 }}>
          Verification safeguards are applied for suspicious login attempts.
        </Typography>
      </Stack>
    </Stack>
  ) : (
    <EmailVerificationForm
      onEditEmail={() => setStep(0)}
      email={emailForm?.email}
      resendMail={handleSubmit}
      password={emailForm?.password}
    />
  )
}
