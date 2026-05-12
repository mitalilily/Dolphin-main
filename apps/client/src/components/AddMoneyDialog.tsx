// components/wallet/AddMoneyDialog.tsx
import { Alert, alpha, Box, Button, Stack, Typography } from '@mui/material'
import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { BiWallet } from 'react-icons/bi'
import { FiCreditCard } from 'react-icons/fi'
import { brand, brandGradients } from '../theme/brand'
import { useAuth } from '../context/auth/AuthContext'
import { useUserProfile } from '../hooks/User/useUserProfile'
import { usePaymentOptions } from '../hooks/usePaymentOptions'
import { useRechargeWallet } from '../hooks/useRechargeWallets'
import { toast } from './UI/Toast'
import CustomIconLoadingButton from './UI/button/CustomLoadingButton'
import CustomInput from './UI/inputs/CustomInput'
import CustomDialog from './UI/modal/CustomModal'

interface AddMoneyDialogProps {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  currentBalance: number
}

const quickAmounts = [500, 1000, 2000, 10000]

const formatAmount = (value: number) => `INR ${Number(value || 0).toLocaleString('en-IN')}`

const AddMoneyDialog: React.FC<AddMoneyDialogProps> = ({ open, setOpen, currentBalance }) => {
  const { user } = useAuth()
  const [amount, setAmount] = useState<number>(500)
  const recharge = useRechargeWallet()
  const { data: paymentOptions } = usePaymentOptions()
  const { data: profile } = useUserProfile(true)

  const minWalletRecharge = paymentOptions?.minWalletRecharge ?? 0

  const effectiveAmount = amount || 0
  const projectedBalance = currentBalance + effectiveAmount
  const isBelowMin = minWalletRecharge > 0 && effectiveAmount < minWalletRecharge
  const kycStatus = profile?.domesticKyc?.status
  const isKycBlocked = kycStatus !== 'verified'

  const amountOptions = useMemo(() => {
    const options = new Set(quickAmounts)
    if (minWalletRecharge > 0) options.add(minWalletRecharge)
    return Array.from(options).sort((a, b) => a - b)
  }, [minWalletRecharge])

  const handleRecharge = async () => {
    if (isKycBlocked) {
      toast.open({
        message:
          kycStatus === 'pending' || kycStatus === 'verification_in_progress'
            ? 'KYC verification is not completed yet. You can recharge once your KYC is verified.'
            : 'Please complete your KYC to recharge your wallet.',
        severity: 'warning',
      })
      return
    }

    if (isBelowMin) {
      toast.open({
        message: `Minimum wallet recharge amount is ${formatAmount(minWalletRecharge)}`,
        severity: 'warning',
      })
      return
    }

    try {
      await recharge.mutateAsync({
        amount,
        prefill: {
          name: user?.companyInfo?.businessName || user?.companyInfo?.contactPerson || user?.name,
          email: user?.companyInfo?.contactEmail || user?.companyInfo?.companyEmail || user?.email,
          contact: user?.companyInfo?.contactNumber || user?.companyInfo?.companyContactNumber,
        },
      })
    } catch (err: unknown) {
      console.error('Recharge error:', err)
      const apiError = err as { response?: { data?: { error?: string } }; message?: string }
      toast.open({
        message: apiError?.response?.data?.error || apiError?.message || 'Recharge failed!',
        severity: 'error',
      })
    }
  }

  return (
    <CustomDialog
      maxWidth="sm"
      title={
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 1,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(brand.sky, 0.54),
              color: brand.ink,
              border: `1px solid ${alpha(brand.ink, 0.08)}`,
              flexShrink: 0,
            }}
          >
            <BiWallet size={19} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: brand.ink, fontWeight: 800, lineHeight: 1.15 }}>
              Add Money to Wallet
            </Typography>
            <Typography sx={{ color: brand.inkSoft, fontSize: '0.78rem', mt: 0.3 }}>
              Current balance: {formatAmount(currentBalance)}
            </Typography>
          </Box>
        </Stack>
      }
      open={open}
      onClose={() => setOpen(false)}
      footer={
        <Stack
          direction={{ xs: 'column-reverse', sm: 'row' }}
          spacing={1}
          sx={{ width: '100%', justifyContent: 'flex-end' }}
        >
          <Button variant="outlined" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <CustomIconLoadingButton
            onClick={handleRecharge}
            disabled={recharge.isPending || effectiveAmount <= 0 || isBelowMin || isKycBlocked}
            text={`Add ${formatAmount(effectiveAmount)}`}
            loading={recharge.isPending}
            loadingText="Opening payment..."
            icon={<FiCreditCard size={16} />}
            styles={{ minWidth: 180 }}
          />
        </Stack>
      }
    >
      <Stack spacing={2.2}>
        <Box
          sx={{
            p: { xs: 1.5, sm: 1.75 },
            borderRadius: 1,
            border: `1px solid ${alpha(brand.ink, 0.08)}`,
            background: brandGradients.surface,
            boxShadow: '0 12px 28px rgba(15,44,67,0.05)',
          }}
        >
          <Stack spacing={1.35}>
            <CustomInput
              label="Recharge Amount"
              type="number"
              value={amount || ''}
              onChange={(event) => {
                const nextAmount = Number(event.target.value)
                setAmount(Number.isFinite(nextAmount) ? Math.max(0, nextAmount) : 0)
              }}
              placeholder="Enter amount"
              prefix={<Typography sx={{ color: 'inherit', fontWeight: 800 }}>INR</Typography>}
              topMargin={false}
              error={isBelowMin}
              helperText={
                isBelowMin
                  ? `Minimum recharge is ${formatAmount(minWalletRecharge)}`
                  : 'Wallet balance updates after Razorpay confirms the payment.'
              }
              inputProps={{ min: 0, inputMode: 'numeric', pattern: '[0-9]*' }}
            />

            <Box>
              <Typography
                sx={{
                  mb: 1,
                  color: brand.inkSoft,
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                Quick amount
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {amountOptions.map((value) => {
                  const selected = amount === value

                  return (
                    <Button
                      key={value}
                      variant={selected ? 'contained' : 'outlined'}
                      onClick={() => setAmount(value)}
                      sx={{
                        minWidth: { xs: 'calc(50% - 4px)', sm: 94 },
                        justifyContent: 'center',
                        fontWeight: 800,
                        background: selected ? brandGradients.button : alpha('#FFFFFF', 0.78),
                        color: brand.ink,
                        borderColor: selected ? alpha('#FFFFFF', 0.36) : alpha(brand.ink, 0.12),
                        boxShadow: selected ? '0 12px 24px rgba(130,194,255,0.2)' : 'none',
                        '&:hover': {
                          background: selected ? brandGradients.button : '#FFFFFF',
                          borderColor: alpha(brand.ink, 0.22),
                        },
                      }}
                    >
                      {formatAmount(value)}
                    </Button>
                  )
                })}
              </Stack>
            </Box>
          </Stack>
        </Box>

        {isKycBlocked && (
          <Alert
            severity="warning"
            sx={{
              borderRadius: 1,
              border: `1px solid ${alpha(brand.warning, 0.26)}`,
              bgcolor: alpha(brand.warning, 0.08),
              color: brand.ink,
              fontSize: '0.85rem',
              '& .MuiAlert-icon': { color: brand.warning },
            }}
          >
            {kycStatus === 'pending' || kycStatus === 'verification_in_progress'
              ? 'Your KYC is under review. You will be able to recharge once it is verified.'
              : 'Please complete your KYC to recharge your wallet.'}
          </Alert>
        )}

        <Box
          sx={{
            p: { xs: 1.5, sm: 1.75 },
            borderRadius: 1,
            border: `1px solid ${alpha(brand.ink, 0.08)}`,
            bgcolor: alpha(brand.sky, 0.14),
          }}
        >
          <Stack spacing={1.1}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography sx={{ color: brand.inkSoft, fontWeight: 700, fontSize: '0.88rem' }}>
                Amount to pay
              </Typography>
              <Typography sx={{ color: brand.ink, fontWeight: 900 }}>
                {formatAmount(effectiveAmount)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography sx={{ color: brand.inkSoft, fontWeight: 700, fontSize: '0.88rem' }}>
                Balance after recharge
              </Typography>
              <Typography sx={{ color: brand.ink, fontWeight: 900 }}>
                {formatAmount(projectedBalance)}
              </Typography>
            </Stack>
            <Typography sx={{ color: brand.inkSoft, fontSize: '0.78rem', lineHeight: 1.6 }}>
              Secure payment powered by Razorpay. Recharge credits are applied only after payment
              confirmation.
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </CustomDialog>
  )
}

export default AddMoneyDialog
