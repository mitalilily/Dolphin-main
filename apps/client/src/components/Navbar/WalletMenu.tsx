import { alpha, Box, Skeleton, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { FaWallet } from 'react-icons/fa'
import { useAuth } from '../../context/auth/AuthContext'
import { useWalletBalance } from '../../hooks/useWalletBalance'
import AddMoneyDialog from '../AddMoneyDialog'

const INK = '#182235'
const ACCENT = '#D66F3D'

const WalletMenu = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { walletBalance, setWalletBalance } = useAuth()
  const { data, isLoading } = useWalletBalance(true)

  useEffect(() => {
    const balance = Number((data as any)?.data?.balance ?? data)
    if (!isNaN(balance)) {
      setWalletBalance(balance)
    } else {
      setWalletBalance(0)
    }
  }, [data, setWalletBalance])

  return (
    <>
      <Box
        onClick={() => setDialogOpen(true)}
        sx={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 0.85,
          px: { xs: 0.95, sm: 1.05 },
          py: 0.78,
          borderRadius: 3,
          border: `1px solid ${alpha(INK, 0.08)}`,
          bgcolor: alpha('#FFFFFF', 0.84),
          minWidth: { xs: 'auto', sm: 156 },
          boxShadow: `0 8px 18px ${alpha(INK, 0.05)}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: alpha(ACCENT, 0.24),
            transform: 'translateY(-1px)',
          },
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(ACCENT, 0.12),
            color: ACCENT,
            border: `1px solid ${alpha(ACCENT, 0.14)}`,
            flexShrink: 0,
          }}
        >
          <FaWallet size={14} />
        </Box>

        <Stack spacing={0.02} sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '0.64rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: alpha(INK, 0.46),
            }}
          >
            Wallet
          </Typography>
          {isLoading || walletBalance === null ? (
            <Skeleton variant="text" width={70} height={20} sx={{ bgcolor: alpha(INK, 0.08) }} />
          ) : (
            <Typography
              sx={{
                fontSize: '0.86rem',
                fontWeight: 900,
                color: INK,
                letterSpacing: '-0.02em',
              }}
            >
              INR {walletBalance?.toLocaleString('en-IN')}
            </Typography>
          )}
        </Stack>
      </Box>

      <AddMoneyDialog
        currentBalance={walletBalance ?? 0}
        open={dialogOpen}
        setOpen={setDialogOpen}
      />
    </>
  )
}

export default WalletMenu
