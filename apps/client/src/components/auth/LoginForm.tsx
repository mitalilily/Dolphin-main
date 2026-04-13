import { alpha, Box, Grid, Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import {
  TbRouteSquare,
  TbShieldCheck,
  TbTruckDelivery,
} from 'react-icons/tb'
import { DoorstepCourierScene, RollingVanScene } from '../branding/AnimatedCourierScene'
import PhoneForm from './PhoneForm'

const INK = '#F6ECDD'
const INK_SOFT = '#FFF8F0'
const SKY = '#1D2842'
const CLAY = '#D97943'
const MIST = '#EEF3FB'
const SURFACE = '#FFFFFF'
const TEXT = '#1A2238'
const MUTED = '#68758B'
const DISPLAY_FONT = '"Plus Jakarta Sans", "Barlow", "Segoe UI", "Helvetica Neue", Arial, sans-serif'

const commandNotes = [
  'Sign in with your registered email to access your Dolphin account.',
  'Use OTP login or email and password based on your account access.',
  'Access orders, billing, support, channels, and courier tools after sign in.',
]

export default function LoginForm() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          radial-gradient(860px 360px at 0% 0%, ${alpha(CLAY, 0.14)} 0%, transparent 58%),
          radial-gradient(760px 360px at 100% 0%, ${alpha(SKY, 0.12)} 0%, transparent 56%),
          linear-gradient(180deg, #f8fbff 0%, ${MIST} 48%, #e9f0f8 100%)
        `,
        px: { xs: 1.2, sm: 2.2, md: 3 },
        py: { xs: 1.2, sm: 2, md: 2.4 },
      }}
    >
      <Grid
        container
        component={motion.div}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        sx={{
          minHeight: 'calc(100vh - 32px)',
          maxWidth: 1380,
          mx: 'auto',
          borderRadius: { xs: 4, md: 5 },
          overflow: 'hidden',
          border: `1px solid ${alpha(SKY, 0.08)}`,
          boxShadow: '0 30px 80px rgba(22, 32, 51, 0.12)',
          backgroundColor: alpha(SURFACE, 0.82),
          backdropFilter: 'blur(16px)',
        }}
      >
        <Grid
          size={{ xs: 12, lg: 7 }}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            background: `
              radial-gradient(320px 220px at 10% 12%, ${alpha('#ffffff', 0.72)} 0%, transparent 70%),
              radial-gradient(420px 260px at 100% 0%, ${alpha(CLAY, 0.16)} 0%, transparent 72%),
              linear-gradient(160deg, ${INK} 0%, ${INK_SOFT} 52%, #f5e7da 100%)
            `,
            color: TEXT,
            px: { xs: 1.6, sm: 2.2, md: 3.4, lg: 4.2 },
            py: { xs: 1.8, sm: 2.2, md: 3.2 },
            display: 'flex',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 38%, rgba(255,255,255,0.03) 100%)',
            }}
          />

          <Stack
            spacing={{ xs: 2.2, md: 3 }}
            sx={{ position: 'relative', zIndex: 1, width: '100%', justifyContent: 'space-between' }}
          >
            <Stack spacing={2.4}>
              <Box
                component="img"
                src="/logo/dolphin-logo-transparent.png"
                alt="Dolphin Enterprise"
                sx={{
                  width: { xs: 152, sm: 176, md: 198 },
                  height: 'auto',
                  display: 'block',
                }}
              />

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {['Dolphin platform', 'Dolphin brand colors', 'Secure login system'].map((chip) => (
                  <Box
                    key={chip}
                    sx={{
                      px: 1.35,
                      py: 0.7,
                      borderRadius: 999,
                      border: `1px solid ${alpha(SKY, 0.1)}`,
                      bgcolor: alpha('#ffffff', 0.76),
                    }}
                  >
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: alpha(SKY, 0.86) }}>
                      {chip}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              <Stack spacing={1.3} sx={{ maxWidth: 650 }}>
                <Typography
                  sx={{
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: alpha(SKY, 0.62),
                  }}
                >
                  Courier command access
                </Typography>
                <Typography
                  sx={{
                    fontFamily: DISPLAY_FONT,
                    fontSize: { xs: '2.2rem', sm: '2.9rem', lg: '4.35rem' },
                    lineHeight: { xs: 1.02, lg: 0.94 },
                    letterSpacing: '-0.05em',
                    fontWeight: 800,
                    maxWidth: 760,
                  }}
                >
                  Sign in to your
                  <Box component="span" sx={{ color: CLAY, display: 'block' }}>
                    Dolphin account.
                  </Box>
                </Typography>
                <Typography
                  sx={{
                    color: MUTED,
                    fontSize: { xs: '0.94rem', md: '1.02rem' },
                    lineHeight: 1.75,
                    maxWidth: 620,
                  }}
                >
                  Access your account and continue with orders, billing, support,
                  and shipping operations in Dolphin.
                </Typography>
              </Stack>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.3fr 0.95fr' },
                gap: 2,
                alignItems: 'stretch',
              }}
            >
              <Box
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${alpha(SKY, 0.1)}`,
                  background: alpha('#ffffff', 0.74),
                  p: { xs: 1.5, md: 2.1 },
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Stack spacing={1.4}>
                  <Stack direction="row" spacing={1.1} alignItems="center">
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 1.4,
                        bgcolor: alpha(CLAY, 0.18),
                        color: SKY,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <TbShieldCheck size={18} />
                    </Box>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 800 }}>
                      Account access
                    </Typography>
                  </Stack>

                  {commandNotes.map((note) => (
                    <Stack key={note} direction="row" spacing={1} alignItems="flex-start">
                      <Box
                        sx={{
                          mt: 0.7,
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: CLAY,
                          flexShrink: 0,
                        }}
                      />
                      <Typography sx={{ color: MUTED, lineHeight: 1.65, fontSize: '0.92rem' }}>
                        {note}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>

            </Box>

            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <RollingVanScene compact />
            </Box>
          </Stack>
        </Grid>

        <Grid
          size={{ xs: 12, lg: 5 }}
          sx={{
            position: 'relative',
            px: { xs: 1.4, sm: 2.2, md: 3, lg: 3.4 },
            py: { xs: 1.8, sm: 2.3, md: 3.1 },
            background: `
              radial-gradient(260px 180px at 100% 0%, ${alpha(CLAY, 0.12)} 0%, transparent 70%),
              radial-gradient(220px 120px at 0% 100%, ${alpha(SKY, 0.05)} 0%, transparent 70%),
              linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.98) 100%)
            `,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 520, mx: 'auto' }}>
            <Stack spacing={2.1} sx={{ mb: 2.6 }}>
              <Stack direction="row" spacing={1.1} alignItems="center">
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 1.4,
                    bgcolor: alpha(SKY, 0.08),
                    color: SKY,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TbRouteSquare size={19} />
                </Box>
                <Typography
                  sx={{
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    color: SKY,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                  }}
                >
                  Dolphin sign in
                </Typography>
              </Stack>

              <Stack spacing={0.8}>
                <Typography
                  sx={{
                    fontFamily: DISPLAY_FONT,
                    fontSize: { xs: '1.9rem', sm: '2.5rem' },
                    fontWeight: 800,
                    color: TEXT,
                    lineHeight: 1.02,
                    letterSpacing: '-0.04em',
                  }}
                >
                  Welcome back.
                </Typography>
                <Typography
                  sx={{
                    color: MUTED,
                    fontSize: '0.98rem',
                    lineHeight: 1.7,
                    maxWidth: 470,
                  }}
                >
                  Sign in with OTP or password to access your Dolphin dashboard and account tools.
                </Typography>
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              >
                {['OTP login', 'Password login', 'Email verification'].map((pill) => (
                  <Box
                    key={pill}
                    sx={{
                      px: 1.15,
                      py: 0.58,
                      borderRadius: 999,
                      border: `1px solid ${alpha(SKY, 0.1)}`,
                      bgcolor: alpha(SKY, 0.03),
                    }}
                  >
                    <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: SKY }}>
                      {pill}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>

            <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2.2 }}>
              <DoorstepCourierScene compact />
            </Box>

            <Box
              sx={{
                position: 'relative',
                borderRadius: 4,
                p: { xs: 1.5, sm: 2.1, md: 2.4 },
                bgcolor: alpha('#ffffff', 0.96),
                border: `1px solid ${alpha(SKY, 0.1)}`,
                boxShadow: '0 20px 42px rgba(26, 34, 56, 0.08)',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: `linear-gradient(90deg, ${SKY} 0%, ${CLAY} 100%)`,
                }}
              />

              <PhoneForm />
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.2}
              justifyContent="space-between"
              sx={{ mt: 2.2 }}
            >
              <Typography sx={{ color: MUTED, fontSize: '0.86rem', lineHeight: 1.6 }}>
                Secure account access for orders, billing, support, and shipping tools.
              </Typography>
              <Stack direction="row" spacing={0.8} alignItems="center" justifyContent="flex-start">
                <TbTruckDelivery size={16} color={CLAY} />
                <Typography sx={{ color: SKY, fontSize: '0.84rem', fontWeight: 700 }}>
                  Dolphin account access
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
