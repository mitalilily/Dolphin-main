import {
  alpha,
  Box,
  Button,
  Fade,
  IconButton,
  Popover,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useState } from 'react'
import { AiOutlineUserSwitch } from 'react-icons/ai'
import { MdClose } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'

export default function SwitchAccountButton() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const { logout } = useAuth()
  const navigate = useNavigate()

  /* ---------- handlers ---------- */
  const openPopover = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget)
  const closePopover = () => setAnchorEl(null)

  const handleConfirm = async () => {
    closePopover()
    await logout()
    navigate('/')
  }

  const DE_BLUE = '#0052CC'

  /* ---------- styles (glass) ----- */
  const glass = {
    backdropFilter: 'blur(17px)',
    background: '#ffffff',
    border: `1px solid ${alpha(DE_BLUE, 0.15)}`,
    boxShadow: `0 12px 40px ${alpha(DE_BLUE, 0.1)}`,
    borderRadius: 1,
    p: 3,
    width: { xs: 280, sm: 320 },
  }

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={!isMobile && <AiOutlineUserSwitch />}
        sx={{
          textTransform: 'none',
          borderColor: alpha(DE_BLUE, 0.25),
          color: DE_BLUE,
          fontWeight: 800,
          borderRadius: 1,
          px: 2,
          '&:hover': {
            borderColor: DE_BLUE,
            backgroundColor: alpha(DE_BLUE, 0.06),
          },
        }}
        onClick={openPopover}
        aria-haspopup="dialog"
        aria-label="Switch account"
      >
        {isMobile ? <AiOutlineUserSwitch /> : 'Switch Account'}
      </Button>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        sx={{ mt: 1 }}
        onClose={closePopover}
        slots={{ transition: Fade }}
        transitionDuration={200}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: glass } }}
      >
        <Stack spacing={2.5}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={800} color="#172B4D">
              Switch Account?
            </Typography>
            <IconButton
              size="small"
              onClick={closePopover}
              aria-label="Close"
              sx={{ color: '#6B778C', bgcolor: alpha('#6B778C', 0.08) }}
            >
              <MdClose size={18} />
            </IconButton>
          </Box>

          {/* Body */}
          <Typography variant="body2" color="#42526E" sx={{ fontWeight: 500 }}>
            This will log you out of the current seller panel so you can sign in with a different account.
          </Typography>

          {/* Actions */}
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
            <Button
              size="small"
              onClick={closePopover}
              sx={{
                color: '#6B778C',
                textTransform: 'none',
                fontWeight: 700,
              }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleConfirm}
              sx={{
                bgcolor: DE_BLUE,
                color: '#fff',
                fontWeight: 800,
                px: 2.5,
                borderRadius: 1,
                textTransform: 'none',
                boxShadow: `0 4px 12px ${alpha(DE_BLUE, 0.3)}`,
                '&:hover': { bgcolor: '#0043A4' },
              }}
            >
              Logout & Switch
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </>
  )
}
