import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { MdDashboardCustomize, MdRefresh } from 'react-icons/md'
import { brand, brandGradients } from '../../theme/brand'

interface DashboardHeaderProps {
  isRefetching: boolean
  onRefresh: () => void
  onCustomize?: () => void
}

export default function DashboardHeader({
  isRefetching,
  onRefresh,
  onCustomize,
}: DashboardHeaderProps) {
  return (
    <Box
      sx={{
        mb: 2.8,
        p: { xs: 2.2, md: 2.8 },
        borderRadius: '34px',
        border: `1px solid ${alpha('#FFFFFF', 0.76)}`,
        background: `
          radial-gradient(circle at 100% 0%, rgba(255,221,174,0.6), transparent 24%),
          ${brandGradients.hero}
        `,
        color: brand.ink,
        boxShadow: '0 24px 52px rgba(15,44,67,0.1)',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={1.4}
      >
        <Box>
          <Typography
            sx={{
              fontSize: { xs: '1.45rem', md: '2.05rem' },
              fontWeight: 800,
              mb: 0.5,
              letterSpacing: '-0.05em',
            }}
          >
            Logistics Command Center
          </Typography>
          <Typography sx={{ fontSize: '0.94rem', color: brand.inkSoft, fontWeight: 500 }}>
            Real-time fulfillment metrics and operational insights.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.2}>
          {onCustomize && (
            <Button
              onClick={onCustomize}
              variant="outlined"
              startIcon={<MdDashboardCustomize size={18} />}
              sx={{
                borderColor: alpha(brand.ink, 0.12),
                color: brand.ink,
                backgroundColor: alpha('#FFFFFF', 0.68),
              }}
            >
              Customize
            </Button>
          )}

          <Button
            onClick={onRefresh}
            disabled={isRefetching}
            variant="contained"
            startIcon={
              isRefetching ? (
                <CircularProgress size={14} thickness={4} sx={{ color: brand.ink }} />
              ) : (
                <MdRefresh size={18} />
              )
            }
            sx={{
              background: brandGradients.button,
              color: brand.ink,
            }}
          >
            {isRefetching ? 'Updating...' : 'Refresh Feed'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
