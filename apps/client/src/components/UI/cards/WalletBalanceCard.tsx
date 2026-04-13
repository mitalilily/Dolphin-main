import { alpha, Box, Button, Chip, Stack, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import React, { useState } from 'react'
import { BsWallet2 } from 'react-icons/bs'
import AddMoneyDialog from '../../AddMoneyDialog'
import StatusChip from '../chip/StatusChip'

interface WalletBalanceCardProps {
  balance: number
  buttonText?: string
  description?: string
  additionalOffers?: number
  showCashback?: boolean
  cashbackText?: string
}

const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({
  balance,
  buttonText = 'Recharge',
  description = '',
  additionalOffers = 0,
  showCashback = false,
  cashbackText = '25% cashback on minimum recharge of INR 200',
}) => {
  const isRecharged = balance > 0
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Box
        sx={{
          borderRadius: 6,
          p: { xs: 2.7, md: 3.2 },
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          boxShadow: `0 24px 46px ${alpha(theme.palette.text.primary, 0.08)}`,
          position: 'relative',
          overflow: 'hidden',
          background: `
            radial-gradient(circle at top left, ${alpha(theme.palette.primary.light, 0.18)} 0%, transparent 28%),
            radial-gradient(circle at top right, ${alpha(theme.palette.secondary.main, 0.2)} 0%, transparent 24%),
            linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,248,240,0.94) 100%)
          `,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between" mb={2.4}>
          <Stack direction="row" spacing={1.5} alignItems="center" flex={1}>
            <Box
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`,
                borderRadius: '24px',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              }}
            >
              <BsWallet2 size={24} />
            </Box>
            <Stack spacing={0.6}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.text.primary,
                    fontSize: { xs: '1rem', md: '1.14rem' },
                  }}
                >
                  Wallet balance
                </Typography>
                {isRecharged ? <StatusChip status="success" label="Live" /> : <StatusChip status="pending" label="Low" />}
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.82rem', md: '0.9rem' },
                  fontWeight: 500,
                }}
              >
                Available funds ready for your next shipping cycle
              </Typography>
            </Stack>
          </Stack>

          {additionalOffers > 0 && (
            <Chip
              label={`${additionalOffers} offers`}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.secondary.main, 0.14),
                color: theme.palette.secondary.dark,
                fontWeight: 800,
                borderRadius: '999px',
                fontSize: '0.72rem',
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.24)}`,
              }}
            />
          )}
        </Stack>

        <Stack spacing={2.5}>
          <Box>
            <Typography
              variant={isMobile ? 'h4' : 'h3'}
              sx={{
                fontWeight: 900,
                color: theme.palette.text.primary,
                letterSpacing: '-0.04em',
              }}
            >
              INR {balance.toLocaleString('en-IN')}
            </Typography>
            {description && (
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.6 }}>
                {description}
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={() => setDialogOpen(true)}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: '#ffffff',
              borderRadius: '999px',
              py: 1.25,
              fontWeight: 800,
              textTransform: 'none',
              fontSize: '0.95rem',
              boxShadow: `0 18px 30px ${alpha(theme.palette.primary.main, 0.28)}`,
              '&:hover': {
                transform: 'translateY(-1px)',
              },
            }}
          >
            {buttonText}
          </Button>

          {showCashback && (
            <Box
              sx={{
                backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                p: 1.25,
                borderRadius: 4,
                border: `1px dashed ${alpha(theme.palette.secondary.main, 0.28)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.secondary.dark,
                  fontWeight: 800,
                  textAlign: 'center',
                }}
              >
                {cashbackText}
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

      <AddMoneyDialog open={dialogOpen} setOpen={setDialogOpen} currentBalance={balance} />
    </>
  )
}

export default WalletBalanceCard
