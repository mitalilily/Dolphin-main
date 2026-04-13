import {
  alpha,
  Box,
  ClickAwayListener,
  Grow,
  IconButton,
  Paper,
  Popper,
  Stack,
  Typography,
} from '@mui/material'
import { useRef, useState } from 'react'
import { AiTwotoneThunderbolt } from 'react-icons/ai'
import { CgCalculator, CgTrack } from 'react-icons/cg'
import { FaTicket } from 'react-icons/fa6'
import { MdLockOutline } from 'react-icons/md'
import { TbTruckDelivery } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import { useMerchantReadiness } from '../../hooks/useMerchantReadiness'

const INK = '#172033'
const TEXT = '#243146'
const TEXT_SECONDARY = '#66758D'
const ACCENT = '#D66F3D'
const SKY = '#2E79D3'
const TEAL = '#1E8B6B'

const QuickActions = () => {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()
  const { isReady, firstIncompleteStep } = useMerchantReadiness()

  const actions = [
    {
      icon: <TbTruckDelivery size={18} />,
      name: 'Create Shipment',
      caption: 'Start a new order flow',
      path: '/orders/create',
      color: ACCENT,
      bg: alpha(ACCENT, 0.12),
    },
    {
      icon: <CgCalculator size={18} />,
      name: 'Rate Calculator',
      caption: 'Estimate courier charges',
      path: '/tools/rate_calculator',
      color: INK,
      bg: alpha(INK, 0.08),
    },
    {
      icon: <CgTrack size={18} />,
      name: 'Track AWB',
      caption: 'Locate a shipment fast',
      path: '/tools/order_tracking',
      color: SKY,
      bg: alpha(SKY, 0.12),
    },
    {
      icon: <FaTicket size={17} />,
      name: 'Support Ticket',
      caption: 'Raise an issue or request',
      path: '/support/tickets',
      color: TEAL,
      bg: alpha(TEAL, 0.12),
    },
  ]

  return (
    <>
      <Box ref={anchorRef} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        <IconButton
          aria-label="Quick actions"
          sx={{
            width: 42,
            height: 42,
            borderRadius: 3,
            border: `1px solid ${alpha(INK, 0.08)}`,
            bgcolor: alpha('#FFFFFF', 0.82),
            color: ACCENT,
            boxShadow: `0 10px 20px ${alpha(INK, 0.05)}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: alpha(ACCENT, 0.1),
              borderColor: alpha(ACCENT, 0.24),
              transform: 'translateY(-1px)',
            },
          }}
        >
          <AiTwotoneThunderbolt size={18} />
        </IconButton>
      </Box>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        transition
        sx={{ zIndex: 2200 }}
        modifiers={[{ name: 'offset', options: { offset: [0, 10] } }]}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} timeout={200}>
            <Box>
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <Paper
                  elevation={0}
                  onMouseEnter={() => setOpen(true)}
                  onMouseLeave={() => setOpen(false)}
                  sx={{
                    minWidth: 280,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: `1px solid ${alpha(INK, 0.08)}`,
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
                    boxShadow: `0 20px 40px ${alpha(INK, 0.12)}`,
                  }}
                >
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1.2,
                      borderBottom: `1px solid ${alpha(INK, 0.06)}`,
                      bgcolor: alpha(INK, 0.02),
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        color: alpha(INK, 0.5),
                      }}
                    >
                      Quick Actions
                    </Typography>
                    <Typography sx={{ mt: 0.35, fontSize: '0.82rem', fontWeight: 600, color: TEXT_SECONDARY }}>
                      Shortcuts for common shipping workflows
                    </Typography>
                  </Box>

                  <Stack spacing={0.45} sx={{ p: 1 }}>
                    {actions.map((action) => {
                      const locked = action.path === '/orders/create' && !isReady

                      return (
                        <Box
                          key={action.name}
                          onClick={() => {
                            navigate(locked ? firstIncompleteStep?.path || '/home' : action.path)
                            setOpen(false)
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.2,
                            px: 1.2,
                            py: 1.05,
                            borderRadius: 2,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: alpha(action.color, 0.08),
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: locked ? alpha(INK, 0.06) : action.bg,
                              color: locked ? alpha(INK, 0.34) : action.color,
                              border: `1px solid ${locked ? alpha(INK, 0.08) : alpha(action.color, 0.12)}`,
                              flexShrink: 0,
                            }}
                          >
                            {action.icon}
                          </Box>

                          <Stack spacing={0.12} sx={{ minWidth: 0, flex: 1 }}>
                            <Typography sx={{ fontSize: '0.86rem', fontWeight: 800, color: TEXT }}>
                              {action.name}
                            </Typography>
                            <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: TEXT_SECONDARY }} noWrap>
                              {locked ? 'Complete merchant setup to unlock' : action.caption}
                            </Typography>
                          </Stack>

                          {locked ? <MdLockOutline size={15} color={alpha(INK, 0.4)} /> : null}
                        </Box>
                      )
                    })}
                  </Stack>
                </Paper>
              </ClickAwayListener>
            </Box>
          </Grow>
        )}
      </Popper>
    </>
  )
}

export default QuickActions
