import { Box, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { FiArrowRight, FiEdit2, FiMail, FiRefreshCcw } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'
import { useVerifyEmailOtp } from '../../hooks/useRequestPasswordLogin'
import CustomIconLoadingButton from '../UI/button/CustomLoadingButton'
import { toast } from '../UI/Toast'
import { getAuthErrorMessage } from './getAuthErrorMessage'

const DE_BLUE = '#171310'
const OTP_LENGTH = 8
const RESEND_DELAY_SECONDS = 30

const primaryButtonStyles = {
  width: '100%',
  borderRadius: 1,
  bgcolor: DE_BLUE,
  boxShadow: `0 8px 24px ${alpha(DE_BLUE, 0.3)}`,
  '&:hover': { bgcolor: '#0D0A08' },
}

const secondaryButtonStyles = {
  width: '100%',
  border: `1px solid ${alpha(DE_BLUE, 0.2)}`,
  color: DE_BLUE,
  backgroundColor: alpha(DE_BLUE, 0.04),
  borderRadius: 1,
}

interface IEmailVerificationProps {
  email: string
  onEditEmail: () => void
  password: string
  resendMail: () => void
}

const maskEmail = (value: string) => {
  const [localPart = '', domain = ''] = value.split('@')
  if (!localPart || !domain) return value
  if (localPart.length <= 2) return `${localPart[0] ?? '*'}*@${domain}`
  return `${localPart.slice(0, 2)}***@${domain}`
}

export default function EmailVerificationForm({
  email,
  password,
  onEditEmail,
  resendMail,
}: IEmailVerificationProps) {
  const { setTokens, setUserId } = useAuth()
  const navigate = useNavigate()

  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(RESEND_DELAY_SECONDS)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const { mutate: verifyEmailOtp, isPending } = useVerifyEmailOtp()

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  useEffect(() => {
    setOtpDigits(Array(OTP_LENGTH).fill(''))
    setError('')
    setTouched(false)
    setResendCooldown(RESEND_DELAY_SECONDS)
    inputRefs.current[0]?.focus()
  }, [email])

  const code = useMemo(() => otpDigits.join(''), [otpDigits])

  const handleChange = (index: number, value: string) => {
    if (!/^[a-zA-Z0-9]*$/.test(value)) return

    const nextValue = value.slice(-1).toUpperCase()
    const nextDigits = [...otpDigits]
    nextDigits[index] = nextValue
    setOtpDigits(nextDigits)
    setError('')

    if (nextValue && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData
      .getData('text')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, OTP_LENGTH)
      .toUpperCase()

    if (!pasted) return

    const nextDigits = Array(OTP_LENGTH)
      .fill('')
      .map((_, index) => pasted[index] ?? '')
    setOtpDigits(nextDigits)
    setError('')

    const nextFocusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[nextFocusIndex]?.focus()
  }

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault()
    setTouched(true)

    if (code.length !== OTP_LENGTH || otpDigits.some((digit) => !digit)) {
      setError(`Enter the full ${OTP_LENGTH}-character verification code.`)
      return
    }

    verifyEmailOtp(
      { email, otp: code, password },
      {
        onSuccess: ({ token, refreshToken, user }) => {
          setTokens(token, refreshToken)
          setUserId(user?.id)
          sessionStorage.setItem('activeEmail', email)
          setError('')
          toast.open({
            message: 'Email verified successfully',
            severity: 'success',
          })
          navigate('/onboarding-questions', { replace: true })
        },
        onError: (err: any) => {
          setError(getAuthErrorMessage(err, 'Invalid code. Please try again.'))
        },
      },
    )
  }

  const handleResend = () => {
    resendMail()
    setOtpDigits(Array(OTP_LENGTH).fill(''))
    setError('')
    setTouched(false)
    setResendCooldown(RESEND_DELAY_SECONDS)
    inputRefs.current[0]?.focus()
  }

  return (
    <Stack component="form" noValidate onSubmit={handleSubmit} spacing={2.3} width="100%">
      <Box
        sx={{
          p: { xs: 2, sm: 2.4 },
          borderRadius: 3,
          border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,246,238,0.92) 100%)',
          boxShadow: '0 18px 40px rgba(23,19,16,0.06)',
        }}
      >
        <Stack spacing={1.2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '14px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha(DE_BLUE, 0.08),
                color: DE_BLUE,
              }}
            >
              <FiMail size={18} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: DE_BLUE, lineHeight: 1.1 }}>
                Enter verification code
              </Typography>
              <Typography variant="body2" sx={{ color: '#6A616A', fontWeight: 600 }}>
                Code sent to {maskEmail(email)}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Box
              onClick={onEditEmail}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.8,
                px: 1.2,
                py: 0.8,
                borderRadius: 999,
                bgcolor: alpha(DE_BLUE, 0.05),
                color: DE_BLUE,
                cursor: 'pointer',
                border: `1px solid ${alpha(DE_BLUE, 0.08)}`,
              }}
            >
              <FiEdit2 size={13} />
              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                Edit email
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Box>

      <Stack direction="row" spacing={1.1} justifyContent="center" flexWrap="wrap" useFlexGap>
        {otpDigits.map((digit, index) => (
          <TextField
            key={index}
            value={digit}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            inputRef={(node) => {
              inputRefs.current[index] = node
            }}
            variant="outlined"
            size="small"
            inputProps={{
              maxLength: 1,
              style: {
                textAlign: 'center',
                fontWeight: 800,
                fontSize: '1.12rem',
                textTransform: 'uppercase',
                padding: '14px 0',
                color: DE_BLUE,
              },
            }}
            sx={{
              width: { xs: 48, sm: 54 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                bgcolor: alpha(DE_BLUE, 0.02),
                boxShadow: digit ? `0 10px 18px ${alpha(DE_BLUE, 0.1)}` : 'none',
                '& fieldset': {
                  borderColor: digit ? DE_BLUE : alpha(DE_BLUE, 0.14),
                  borderWidth: digit ? 2 : 1,
                },
                '&:hover fieldset': {
                  borderColor: DE_BLUE,
                },
                '&.Mui-focused fieldset': {
                  borderColor: DE_BLUE,
                },
              },
            }}
          />
        ))}
      </Stack>

      {touched && error ? (
        <Typography variant="caption" color="error" sx={{ textAlign: 'center', fontWeight: 700 }}>
          {error}
        </Typography>
      ) : null}

      <Stack spacing={1.4}>
        <CustomIconLoadingButton
          type="submit"
          styles={primaryButtonStyles}
          textColor="#ffffff"
          disabled={otpDigits.some((digit) => !digit) || isPending}
          text="Verify and continue"
          loading={isPending}
          loadingText="Verifying..."
          icon={<FiArrowRight size={15} />}
        />

        <CustomIconLoadingButton
          onClick={handleResend}
          styles={secondaryButtonStyles}
          disabled={resendCooldown > 0}
          text={resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
          icon={<FiRefreshCcw size={14} />}
          variant="text"
        />
      </Stack>
    </Stack>
  )
}
