// components/wallet/AddMoneyDialog.tsx
import {
  Alert,
  alpha,
  Box,
  Button,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState, type Dispatch, type SetStateAction } from 'react'
import { BiWallet } from 'react-icons/bi'
import { useAuth } from '../context/auth/AuthContext'
import { useUserProfile } from '../hooks/User/useUserProfile'
import { usePaymentOptions } from '../hooks/usePaymentOptions'
import { useRechargeWallet } from '../hooks/useRechargeWallets'
import { toast } from './UI/Toast'
import CustomIconLoadingButton from './UI/button/CustomLoadingButton'
import CustomDialog from './UI/modal/CustomModal'

const DE_BLUE = '#0052CC'
const DE_AMBER = '#FFAB00'
const BRAND_GRADIENT = `linear-gradient(135deg, ${DE_BLUE} 0%, ${DE_AMBER} 100%)`

interface AddMoneyDialogProps {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  currentBalance: number
}

const quickAmounts = [500, 1000, 2000, 10000]

const AddMoneyDialog: React.FC<AddMoneyDialogProps> = ({ open, setOpen, currentBalance }) => {
  const { user } = useAuth()
  const [amount, setAmount] = useState<number>(500)
  //   const [showCoupon, setShowCoupon] = useState<boolean>(false);
  //   const [coupon, setCoupon] = useState<string>("");
  const recharge = useRechargeWallet()
  const { data: paymentOptions } = usePaymentOptions()
  const { data: profile } = useUserProfile(true)

  const minWalletRecharge = paymentOptions?.minWalletRecharge ?? 0

  const effectiveAmount = amount || 0
  const isBelowMin = minWalletRecharge > 0 && effectiveAmount < minWalletRecharge
  const kycStatus = profile?.domesticKyc?.status
  const isKycBlocked = kycStatus !== 'verified'

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
        message: `Minimum wallet recharge amount is ₹${minWalletRecharge.toLocaleString('en-IN')}`,
        severity: 'warning',
      })
      return
    }

    try {
      await recharge.mutateAsync({
        amount,
        prefill: {
          name: user?.companyInfo?.businessName,
          email: user.companyInfo?.contactEmail ?? '',
          contact: user.companyInfo?.contactNumber ?? '',
        },
      })
      // ✅ Don't toast here, Razorpay modal handles UI
      // Payment success is handled in useRechargeWallets hook
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Recharge error:', err)
      toast.open({ message: 'Recharge failed!', severity: 'error' })
    }
  }

  return (
    <CustomDialog
      maxWidth="xs"
      title={
        <Stack direction={'row'} spacing={2} justifyContent={'space-between'} alignItems={'center'}>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              background: BRAND_GRADIENT,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Add Money to Wallet
          </Typography>

          <Box
            display={'flex'}
            gap={1}
            alignItems={'center'}
            sx={{
              bgcolor: alpha(DE_BLUE, 0.08),
              px: 2,
              py: 1,
              borderRadius: 1,
              border: `1px solid ${alpha(DE_BLUE, 0.15)}`,
            }}
          >
            <BiWallet size={18} color={DE_BLUE} />
            <Typography variant="body2" fontWeight={800} color={DE_BLUE}>
              ₹{currentBalance.toLocaleString('en-IN')}
            </Typography>
          </Box>
        </Stack>
      }
      open={open}
      onClose={() => setOpen(false)}
    >
      <Box display={'flex'} flexDirection={'column'} width={'100%'}>
        {/* Custom Amount */}
        <Box
          width={'100%'}
          display={'flex'}
          justifyContent={'center'}
          sx={{
            bgcolor: alpha(DE_BLUE, 0.04),
            borderRadius: 1,
            p: 3,
            mb: 3,
            border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
          }}
        >
          <TextField
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            variant="standard"
            placeholder="Enter Amount"
            slotProps={{
              input: {
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position="start" sx={{ fontSize: '2.5rem', color: DE_BLUE }}>
                    ₹
                  </InputAdornment>
                ),
                sx: {
                  fontSize: '2.2rem',
                  fontWeight: 900,
                  borderBottom: `2px solid ${alpha(DE_BLUE, 0.15)}`,
                  width: '100%',
                  maxWidth: 280,
                  color: DE_BLUE,
                  pb: 1,
                  mx: 'auto',
                  transition: 'all 0.3s ease',
                  '&:focus-within': {
                    borderBottomColor: DE_BLUE,
                  },
                },
                inputProps: {
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  style: {
                    textAlign: 'center',
                    color: DE_BLUE,
                    MozAppearance: 'textfield',
                  },
                },
              },
            }}
            sx={{
              '& .MuiInputBase-input::placeholder': {
                color: alpha(DE_BLUE, 0.3),
                opacity: 0.7,
              },
              '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '& input[type=number]': { MozAppearance: 'textfield' },
            }}
          />
        </Box>
        <Box mb={3}>
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{ color: '#42526E', mb: 1.5, textAlign: 'center', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}
          >
            Quick Select Amount
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1.5} width={'100%'} justifyContent={'center'}>
            {quickAmounts.map((v) => (
              <Button
                key={v}
                variant={amount === v ? 'contained' : 'outlined'}
                onClick={() => setAmount(v)}
                sx={{
                  borderRadius: 1,
                  minWidth: 85,
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  px: 3,
                  py: 1.2,
                  bgcolor: amount === v ? DE_BLUE : '#FFFFFF',
                  color: amount === v ? '#FFFFFF' : DE_BLUE,
                  border: amount === v ? 'none' : `1px solid ${alpha(DE_BLUE, 0.2)}`,
                  background: amount === v ? DE_BLUE : '#FFFFFF',
                  boxShadow: amount === v ? `0 8px 16px ${alpha(DE_BLUE, 0.25)}` : 'none',
                  transition: 'all 0.2s ease',
                  textTransform: 'none',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow:
                      amount === v
                        ? `0 10px 20px ${alpha(DE_BLUE, 0.35)}`
                        : `0 4px 12px ${alpha(DE_BLUE, 0.15)}`,
                    bgcolor: amount === v ? '#0043A4' : alpha(DE_BLUE, 0.06),
                    borderColor: amount === v ? undefined : DE_BLUE,
                  },
                }}
              >
                ₹{v.toLocaleString('en-IN')}
              </Button>
            ))}
          </Stack>
        </Box>

        {/* Coupon toggle */}
        {/* {!showCoupon ? (
          <Button
            variant="text"
            onClick={() => setShowCoupon(true)}
            startIcon={<FaGift />}
            sx={{ textTransform: "none", mb: 1 }}
          >
            Have a coupon code?
          </Button>
        ) : (
          <Collapse in={showCoupon}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <TextField
                label="Coupon Code"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaGift />
                    </InputAdornment>
                  ),
                }}
              />
              <IconButton onClick={() => setShowCoupon(false)}>
                <MdClose />
              </IconButton>
            </Stack>
          </Collapse>
        )} */}

        <Divider sx={{ my: 3, borderColor: alpha(DE_BLUE, 0.1) }} />

        {isKycBlocked && (
          <Alert
            severity="warning"
            sx={{
              mb: 2,
              borderRadius: 2,
              border: `1px solid ${alpha('#f59e0b', 0.3)}`,
              bgcolor: alpha('#f59e0b', 0.05),
              color: '#92400e',
              fontSize: '0.85rem',
              '& .MuiAlert-icon': { color: '#f59e0b' },
            }}
          >
            {kycStatus === 'pending' || kycStatus === 'verification_in_progress'
              ? 'Your KYC is under review. You will be able to recharge once it is verified.'
              : 'Please complete your KYC to recharge your wallet.'}
          </Alert>
        )}

        {/* Payment Info */}
        <Box
          sx={{
            bgcolor: alpha(DE_BLUE, 0.04),
            border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
            borderRadius: 1,
            p: 2.5,
            mb: 3,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" sx={{ color: '#6b6b6b', fontWeight: 600 }}>
              Amount to Pay
            </Typography>
            <Typography
              variant="h6"
              sx={{
                background: BRAND_GRADIENT,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
              }}
            >
              ₹{effectiveAmount.toLocaleString('en-IN')}
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: '#6b6b6b', fontSize: '0.8rem' }}>
            {minWalletRecharge > 0
              ? `Minimum recharge amount is ₹${minWalletRecharge.toLocaleString(
                  'en-IN',
                )}. This amount will be added to your wallet instantly.`
              : 'This amount will be added to your wallet instantly.'}
          </Typography>
        </Box>

        {/* Action Button */}
        <Box sx={{ mt: 2 }}>
          <CustomIconLoadingButton
            onClick={handleRecharge}
            disabled={recharge.isPending || effectiveAmount <= 0 || isBelowMin || isKycBlocked}
            text={`Add ₹${amount.toLocaleString('en-IN')} to Wallet`}
            loading={recharge.isPending}
            fullWidth
            styles={{
              py: 1.6,
              borderRadius: 1,
              bgcolor: DE_BLUE,
              fontWeight: 800,
              fontSize: '1rem',
              boxShadow: `0 8px 20px ${alpha(DE_BLUE, 0.3)}`,
              '&:hover': { bgcolor: '#0043A4' },
            }}
          />
          <Typography variant="caption" sx={{ color: '#6B778C', textAlign: 'center', display: 'block', mt: 2, fontWeight: 500 }}>
            Secure payment powered by <b>Razorpay</b>
          </Typography>
        </Box>
      </Box>
    </CustomDialog>
  )
}

export default AddMoneyDialog
