import { alpha, Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import { MdLocationOn } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import type { TopDestination } from '../../api/dashboard.api'

const DE_BLUE = '#0052CC'
const TEXT_PRIMARY = '#172B4D'
const TEXT_SECONDARY = '#42526E'

type TopDestinationsProps = {
  data?: TopDestination[]
  isLoading?: boolean
  error?: string | null
}

const TopDestinations = ({ data: overrideData, isLoading: overrideLoading, error: overrideError }: TopDestinationsProps) => {
  const navigate = useNavigate()
  const destinations = overrideData
  const isLoading = overrideLoading ?? false
  const errorMessage = overrideError ?? null

  return (
    <Stack spacing={1.8}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography sx={{ fontSize: '1.02rem', fontWeight: 800, color: TEXT_PRIMARY }}>
          Top Destinations
        </Typography>
        <Typography sx={{ fontSize: '12px', color: TEXT_SECONDARY, fontWeight: 700 }}>Top lanes</Typography>
      </Stack>
      {errorMessage && (
        <Typography sx={{ fontSize: '0.75rem', color: '#DE350B', fontWeight: 600 }}>
          {errorMessage}
        </Typography>
      )}

      {isLoading ? (
        <Stack spacing={1.2}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={60} variant="rectangular" sx={{ borderRadius: 1 }} />
          ))}
        </Stack>
      ) : !destinations || destinations.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            borderRadius: 1,
            border: `1px dashed ${alpha(DE_BLUE, 0.2)}`,
            bgcolor: alpha(DE_BLUE, 0.02),
          }}
        >
          <MdLocationOn size={34} style={{ color: DE_BLUE, opacity: 0.5 }} />
          <Typography sx={{ mt: 0.8, fontSize: '0.88rem', color: TEXT_SECONDARY, fontWeight: 600 }}>
            No destination data available
          </Typography>
        </Box>
      ) : (
        <Stack spacing={0.9}>
          {destinations.map((destination, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.4,
                borderRadius: 1,
                border: `1px solid ${alpha(DE_BLUE, index === 0 ? 0.24 : 0.08)}`,
                bgcolor: index === 0 ? alpha(DE_BLUE, 0.04) : '#ffffff',
                transition: 'all .2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  borderColor: DE_BLUE,
                  bgcolor: alpha(DE_BLUE, 0.02),
                },
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 0.5,
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 900,
                  fontSize: '0.78rem',
                  color: index < 3 ? '#ffffff' : DE_BLUE,
                  bgcolor: index < 3 ? DE_BLUE : alpha(DE_BLUE, 0.1),
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </Box>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap sx={{ fontSize: '0.9rem', fontWeight: 800, color: TEXT_PRIMARY }}>
                  {destination.city}
                </Typography>
                <Typography noWrap sx={{ fontSize: '0.77rem', color: TEXT_SECONDARY, fontWeight: 500 }}>
                  {destination.state}
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 900, color: DE_BLUE }}>
                  {destination.count}
                </Typography>
                <Typography sx={{ fontSize: '10px', color: TEXT_SECONDARY, fontWeight: 700, textTransform: 'uppercase' }}>
                  Orders
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      <Button
        fullWidth
        variant="outlined"
        size="small"
        onClick={() => navigate('/orders/list')}
        sx={{
          mt: 1,
          borderColor: alpha(DE_BLUE, 0.2),
          color: DE_BLUE,
          borderRadius: 0.5,
          fontWeight: 800,
          fontSize: '11px',
          py: 1,
          textTransform: 'uppercase',
          '&:hover': {
            borderColor: DE_BLUE,
            bgcolor: alpha(DE_BLUE, 0.04),
          },
        }}
      >
        View Analytics
      </Button>
    </Stack>
  )
}

export default TopDestinations
