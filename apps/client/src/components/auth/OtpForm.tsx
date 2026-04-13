import { Box, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react'
import { FiEdit2, FiRefreshCcw } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'
import { useRequestOtp, useVerifyOtp } from '../../hooks/useOTP'
import CustomIconLoadingButton from '../UI/button/CustomLoadingButton'
import { toast } from '../UI/Toast'
import { getAuthErrorMessage } from './getAuthErrorMessage'

const OTP_LENGTH = 6
const OTP_RESEND_DELAY_MS = 30000
const DE_BLUE = '#171310'

const primaryButtonStyles = {
  width: '100%',
  borderRadius: 1,
  bgcolor: DE_BLUE,
  boxShadow: `0 8px 24px ${alpha(DE_BLUE, 0.3)}`,
  '&:hover': { bgcolor: '#0D0A08' },
}

const ghostButtonStyles = {
  width: '100%',
  border: `1px solid ${alpha(DE_BLUE, 0.2)}`,
  color: DE_BLUE,
  backgroundColor: alpha(DE_BLUE, 0.04),
  borderRadius: 1,
}

type Props = {
  email: string
  onEditEmail: () => void
}

export default function OtpForm({ email, onEditEmail }: Props) {
  const { setTokens, setUserId } = useAuth()
  const navigate = useNavigate()
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState<string>('')
  const [resendEnabled, setResendEnabled] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(OTP_RESEND_DELAY_MS / 1000)

  const { mutate: verifyOtp, isPending: verifying } = useVerifyOtp()
  const { mutate: resendOtp, isPending: resending } = useRequestOtp()

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setResendEnabled(false)
    setSecondsLeft(OTP_RESEND_DELAY_MS / 1000)

    if (timerRef.current) clearTimeout(timerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

    countdownIntervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    timerRef.current = setTimeout(() => {
      setResendEnabled(true)
      setSecondsLeft(0)

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }, OTP_RESEND_DELAY_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [email])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newDigits = [...otpDigits]
    newDigits[index] = value.slice(-1)
    setOtpDigits(newDigits)
    setError('')

    if (value && index < OTP_LENGTH - 1) {
      const next = document.getElementById(`otp-${index + 1}`)
      next?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`)
      prev?.focus()
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)

    if (!pasted) return

    const nextDigits = Array(OTP_LENGTH)
      .fill('')
      .map((_, index) => pasted[index] ?? '')

    setOtpDigits(nextDigits)
    setError('')

    const nextFocusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    const next = document.getElementById(`otp-${nextFocusIndex}`)
    next?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const otp = otpDigits.join('').trim()
    if (otp.length !== OTP_LENGTH) {
      setError(`Enter the full ${OTP_LENGTH}-digit verification code.`)
      return
    }

    setError('')

    verifyOtp(
      { email, otp },
      {
        onSuccess: ({ token, refreshToken, user }) => {
          sessionStorage.setItem('activeEmail', email)
          setUserId(user?.id)
          setTokens(token, refreshToken)
          navigate('/onboarding-questions', { replace: true })
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (err: any) => {
          const msg = getAuthErrorMessage(err, 'OTP verification failed')
          setError(msg)

          if (msg.toLowerCase().includes('otp expired')) {
            setResendEnabled(true)
            setSecondsLeft(0)
            if (timerRef.current) {
              clearTimeout(timerRef.current)
              timerRef.current = null
            }
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current)
              countdownIntervalRef.current = null
            }
          }
        },
      },
    )
  }

  const handleResendOtp = useCallback(() => {
    if (!resendEnabled || resending) return

    resendOtp(email.toLowerCase().trim(), {
      onSuccess: () => {
        setOtpDigits(Array(OTP_LENGTH).fill(''))
        setError('')
        setResendEnabled(false)
        setSecondsLeft(OTP_RESEND_DELAY_MS / 1000)

        if (timerRef.current) clearTimeout(timerRef.current)
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

        countdownIntervalRef.current = setInterval(() => {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current!)
              return 0
            }
            return prev - 1
          })
        }, 1000)

        timerRef.current = setTimeout(() => {
          setResendEnabled(true)
          setSecondsLeft(0)
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
        }, OTP_RESEND_DELAY_MS)

        toast.open({
          message: 'A new verification code has been sent to your email.',
          severity: 'success',
        })
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (err: any) => {
        const msg = getAuthErrorMessage(err, 'Failed to resend OTP')
        setError(msg)
      },
    })
  }, [email, resendOtp, resendEnabled, resending])

  return (
    <Stack component="form" noValidate onSubmit={handleSubmit} width="100%" mt={1} gap={2}>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 1,
          backgroundColor: alpha(DE_BLUE, 0.04),
          border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
        }}
      >
        <Typography variant="body2" sx={{ color: '#6A616A', lineHeight: 1.6, fontWeight: 500 }}>
          Enter the 6-digit code sent to <strong>{email}</strong>.
          <Box component="span" sx={{ ml: 0.7, display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: DE_BLUE }} onClick={onEditEmail}>
            <FiEdit2 size={13} style={{ marginRight: 4 }} />
            Edit
          </Box>
        </Typography>
      </Box>

      <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ my: 1 }}>
        {otpDigits.map((digit, idx) => (
          <TextField
            key={idx}
            id={`otp-${idx}`}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            variant="outlined"
            size="small"
            inputProps={{
              maxLength: 1,
              style: {
                textAlign: 'center',
                fontWeight: 800,
                fontSize: '1.25rem',
                padding: '12px 0',
                color: DE_BLUE,
              },
            }}
            sx={{
              width: { xs: 42, sm: 54 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                bgcolor: alpha(DE_BLUE, 0.02),
                '& fieldset': {
                  borderColor: digit ? DE_BLUE : alpha(DE_BLUE, 0.15),
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

      {error && (
        <Typography variant="caption" color="error" sx={{ textAlign: 'center', fontWeight: 700 }}>
          {error}
        </Typography>
      )}

      <Stack spacing={1.5}>
        <CustomIconLoadingButton
          type="submit"
          styles={primaryButtonStyles}
          textColor="#ffffff"
          disabled={otpDigits.some((d) => !d) || verifying}
          text="Verify and continue"
          loading={verifying}
          loadingText="Verifying..."
        />

        <Box sx={{ textAlign: 'center' }}>
          {resendEnabled ? (
            <CustomIconLoadingButton
              type="button"
              onClick={handleResendOtp}
              styles={ghostButtonStyles}
              textColor={DE_BLUE}
              text="Resend code"
              loading={resending}
              loadingText="Sending..."
              icon={<FiRefreshCcw size={14} style={{ marginRight: 8 }} />}
            />
          ) : (
            <Typography variant="caption" sx={{ color: '#6A616A', fontWeight: 600 }}>
              Resend available in {secondsLeft}s
            </Typography>
          )}
        </Box>
      </Stack>
    </Stack>
  )
}
