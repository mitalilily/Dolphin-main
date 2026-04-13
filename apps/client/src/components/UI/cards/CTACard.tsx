import {
  alpha,
  Box,
  Button,
  Card,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import React from 'react'
import StatusChip from '../chip/StatusChip'

interface CTACardProps {
  icon: React.ReactNode
  title: string
  isDone?: boolean
  description: string
  buttonText: string
  onClick: () => void
  backgroundColor?: string
  glassColor?: string
  height?: string
  showButton?: boolean
  showBadge?: boolean
  loading?: boolean
}

const CTACard: React.FC<CTACardProps> = ({
  icon,
  title,
  description,
  buttonText,
  isDone,
  onClick,
  showButton = true,
  showBadge = true,
  loading = false,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 6,
        background: `
          radial-gradient(circle at top left, ${alpha(theme.palette.primary.light, 0.16)} 0%, transparent 32%),
          radial-gradient(circle at bottom right, ${alpha(theme.palette.secondary.main, 0.18)} 0%, transparent 34%),
          linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,247,238,0.94) 100%)
        `,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        boxShadow: `0 20px 38px ${alpha(theme.palette.text.primary, 0.07)}`,
        width: '100%',
        minHeight: isMobile ? 200 : 220,
        overflow: 'hidden',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 28px 52px ${alpha(theme.palette.text.primary, 0.1)}`,
        },
      }}
    >
      <Stack direction="column" width="100%" height="100%" justifyContent="space-between" spacing={2.2}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <Box
            sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.22)} 100%)`,
              borderRadius: '22px',
              p: 1.35,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 48, sm: 54 },
              height: { xs: 48, sm: 54 },
              color: theme.palette.primary.main,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              boxShadow: `0 14px 28px ${alpha(theme.palette.text.primary, 0.08)}`,
            }}
          >
            {loading ? <Skeleton variant="circular" width={24} height={24} /> : icon}
          </Box>

          <Stack flex={1} spacing={0.8}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              {loading ? (
                <Skeleton width={isMobile ? 120 : 160} height={24} />
              ) : (
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.text.primary,
                    fontSize: { xs: '1rem', sm: '1.15rem' },
                    letterSpacing: '-0.02em',
                  }}
                >
                  {title}
                </Typography>
              )}
              {showBadge && (
                <StatusChip status={isDone ? 'success' : 'pending'} label={isDone ? 'Ready' : 'Pending'} />
              )}
            </Stack>
            {loading ? (
              <>
                <Skeleton width="100%" height={18} />
                <Skeleton width="82%" height={18} />
              </>
            ) : (
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.55, fontWeight: 500 }}>
                {description}
              </Typography>
            )}
          </Stack>
        </Stack>

        {showButton && (
          <Button
            variant="contained"
            fullWidth
            onClick={onClick}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: '#ffffff',
              borderRadius: '999px',
              py: 1.15,
              fontWeight: 800,
              textTransform: 'none',
              fontSize: '0.9rem',
              boxShadow: `0 16px 28px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                transform: 'translateY(-1px)',
              },
            }}
          >
            {buttonText}
          </Button>
        )}
      </Stack>
    </Card>
  )
}

export default CTACard
