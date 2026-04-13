import { alpha, Box, Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'

const NAVY = '#171310'
const BLUE = '#C8A989'
const ORANGE = '#D97943'
const CREAM = '#F7EFE5'
const TEXT = '#171310'

const MotionGroup = motion.g
const MotionCircle = motion.circle
const MotionLine = motion.line

function SceneShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 4.5,
        border: `1px solid ${alpha(NAVY, 0.14)}`,
        background: `
          radial-gradient(circle at 14% 10%, ${alpha(BLUE, 0.2)} 0%, transparent 34%),
          radial-gradient(circle at 88% 12%, ${alpha(ORANGE, 0.14)} 0%, transparent 32%),
          linear-gradient(180deg, #fffaf4 0%, ${CREAM} 100%)
        `,
        boxShadow: `0 18px 40px ${alpha(TEXT, 0.08)}`,
        px: { xs: 2.2, md: 2.8 },
        py: { xs: 2.2, md: 2.6 },
      }}
    >
      <Stack spacing={0.8} sx={{ mb: 2.2, maxWidth: 300 }}>
        <Typography
          sx={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: NAVY,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </Typography>
        <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.45rem' }, fontWeight: 800, color: TEXT }}>
          {title}
        </Typography>
        <Typography sx={{ color: alpha(TEXT, 0.72), fontSize: '0.9rem', lineHeight: 1.6 }}>
          {description}
        </Typography>
      </Stack>
      {children}
    </Box>
  )
}

export function RollingVanScene({ compact = false }: { compact?: boolean }) {
  return (
    <SceneShell
      eyebrow="Dispatch lane"
      title="Rolling dispatch lane"
      description="A calmer operations surface for quotes, pickups, and delivery motion."
    >
      <Box
        component={motion.div}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 360 210" width="100%" height={compact ? 152 : 174} role="img" aria-label="Animated delivery van">
          <defs>
            <linearGradient id="skyrush-van-body" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#4A3C34" />
              <stop offset="100%" stopColor="#171310" />
            </linearGradient>
            <linearGradient id="skyrush-van-cargo" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#EAA972" />
              <stop offset="100%" stopColor="#D97943" />
            </linearGradient>
          </defs>

          <motion.rect
            x="22"
            y="170"
            width="316"
            height="4"
            rx="2"
            fill={alpha(TEXT, 0.16)}
            animate={{ opacity: [0.15, 0.35, 0.15], scaleX: [0.96, 1, 0.96] }}
            transition={{ duration: 2.3, repeat: Infinity, ease: 'easeInOut' }}
          />

          <MotionGroup
            animate={{ x: [-8, 12, -8] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path
              d="M88 122h122c7 0 13 6 13 13v17H64v-10c0-11 9-20 20-20h4z"
              fill="url(#skyrush-van-cargo)"
            />
            <path
              d="M217 110h44c13 0 21 7 28 20l18 22h17v-1c0-16-12-29-28-29h-6l-10-15c-5-7-13-11-21-11h-42z"
              fill="url(#skyrush-van-body)"
            />
            <rect x="116" y="128" width="84" height="16" rx="8" fill={alpha('#ffffff', 0.18)} />
            <path
              d="M229 117h32c7 0 12 3 16 9l6 9h-54z"
              fill={alpha('#F8E7D7', 0.96)}
            />
            <rect x="68" y="152" width="250" height="9" rx="4.5" fill={NAVY} />
            <rect x="148" y="132" width="22" height="12" rx="4" fill={alpha('#ffffff', 0.24)} />
            <rect x="84" y="145" width="56" height="16" rx="8" fill={NAVY} />
            <rect x="244" y="145" width="56" height="16" rx="8" fill={NAVY} />
            <MotionGroup
              animate={{ rotate: 360 }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '112px 161px', transformBox: 'fill-box' }}
            >
              <circle cx="112" cy="161" r="22" fill="#2A2420" />
              <circle cx="112" cy="161" r="15" fill="#FFF6EC" />
              <circle cx="112" cy="161" r="5" fill={ORANGE} />
              <MotionLine x1="112" y1="145" x2="112" y2="177" stroke={ORANGE} strokeWidth="3" />
              <MotionLine x1="96" y1="161" x2="128" y2="161" stroke={ORANGE} strokeWidth="3" />
            </MotionGroup>

            <MotionGroup
              animate={{ rotate: 360 }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '272px 161px', transformBox: 'fill-box' }}
            >
              <circle cx="272" cy="161" r="22" fill="#2A2420" />
              <circle cx="272" cy="161" r="15" fill="#FFF6EC" />
              <circle cx="272" cy="161" r="5" fill={ORANGE} />
              <MotionLine x1="272" y1="145" x2="272" y2="177" stroke={ORANGE} strokeWidth="3" />
              <MotionLine x1="256" y1="161" x2="288" y2="161" stroke={ORANGE} strokeWidth="3" />
            </MotionGroup>
          </MotionGroup>

          <motion.path
            d="M18 82c36-16 74-21 122-18"
            fill="none"
            stroke={alpha(ORANGE, 0.72)}
            strokeWidth="6"
            strokeLinecap="round"
            animate={{ pathLength: [0.4, 1, 0.4], opacity: [0.35, 0.9, 0.35] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M214 44c32-6 71-4 110 8"
            fill="none"
            stroke={alpha(BLUE, 0.72)}
            strokeWidth="5"
            strokeLinecap="round"
            animate={{ pathLength: [0.35, 1, 0.35], opacity: [0.2, 0.75, 0.2] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          />
          <motion.path
            d="M304 128h20"
            fill="none"
            stroke={alpha(TEXT, 0.22)}
            strokeWidth="4"
            strokeLinecap="round"
            animate={{ opacity: [0.15, 0.55, 0.15], x: [0, 10, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M314 141h16"
            fill="none"
            stroke={alpha(TEXT, 0.18)}
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ opacity: [0.1, 0.42, 0.1], x: [0, 10, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.08 }}
          />
        </svg>
      </Box>
    </SceneShell>
  )
}

export function DoorstepCourierScene({ compact = false }: { compact?: boolean }) {
  return (
    <SceneShell
      eyebrow="Doorstep moment"
      title="Knock-and-deliver flow"
      description="Keep recipient confirmation, handoff timing, and courier visibility in one place."
    >
      <Box
        component={motion.div}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 360 210" width="100%" height={compact ? 152 : 174} role="img" aria-label="Animated courier knocking on a door">
          <rect x="222" y="44" width="88" height="118" rx="12" fill={alpha(NAVY, 0.1)} />
          <rect x="232" y="52" width="68" height="108" rx="10" fill={NAVY} />
          <circle cx="287" cy="106" r="4" fill={alpha('#ffffff', 0.72)} />
          <rect x="92" y="148" width="176" height="14" rx="7" fill={alpha(TEXT, 0.08)} />

          <MotionGroup
            animate={{ x: [-2, 2, -2] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <circle cx="132" cy="86" r="18" fill={ORANGE} />
            <path d="M110 115c3-18 16-28 30-28s27 10 30 28l8 39h-76z" fill="#B99372" />
            <rect x="156" y="109" width="16" height="10" rx="5" fill={alpha('#ffffff', 0.18)} />
            <rect x="153" y="128" width="28" height="26" rx="6" fill="#D08B44" />
            <rect x="159" y="132" width="16" height="4" rx="2" fill={alpha('#ffffff', 0.32)} />
            <path d="M116 133h18v18h-12z" fill={NAVY} />
            <MotionGroup
              animate={{ rotate: [-12, 10, -12] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '206px 126px', transformBox: 'fill-box' }}
            >
              <path d="M167 122c18-6 28-3 39 5" fill="none" stroke={ORANGE} strokeWidth="7" strokeLinecap="round" />
            </MotionGroup>
          </MotionGroup>

          <motion.path
            d="M215 102c8-10 15-10 24 0"
            fill="none"
            stroke={alpha(ORANGE, 0.9)}
            strokeWidth="4"
            strokeLinecap="round"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.9, 1, 0.9] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '227px 102px' }}
          />
          <motion.path
            d="M226 92c9-12 18-12 27 0"
            fill="none"
            stroke={alpha(ORANGE, 0.74)}
            strokeWidth="4"
            strokeLinecap="round"
            animate={{ opacity: [0.1, 0.8, 0.1], scale: [0.94, 1.04, 0.94] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.12 }}
            style={{ transformOrigin: '239px 92px' }}
          />

          <MotionCircle
            cx="74"
            cy="48"
            r="16"
            fill={alpha(BLUE, 0.2)}
            animate={{ y: [0, -10, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <MotionCircle
            cx="302"
            cy="34"
            r="10"
            fill={alpha(ORANGE, 0.18)}
            animate={{ y: [0, -6, 0], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </Box>
    </SceneShell>
  )
}
