import { alpha, Box, Skeleton, Stack, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material'
import { MdAccessTime, MdLocationPin, MdLocalShipping } from 'react-icons/md'
import type { Pickup } from '../../api/dashboard.api'
import StatusChip from '../UI/chip/StatusChip'

const DE_BLUE = '#0052CC'
const TEXT_PRIMARY = '#172B4D'
const TEXT_SECONDARY = '#42526E'

const pickupStatusMap: Record<string, 'pending' | 'success' | 'info' | 'error'> = {
  scheduled: 'pending',
  pending: 'pending',
  picked: 'success',
  completed: 'success',
  cancelled: 'error',
}

type UpcomingPickupsHomeProps = {
  data?: Pickup[]
  isLoading?: boolean
  error?: string | null
}

const UpcomingPickupsHome = ({ data: overrideData, isLoading: overrideLoading, error: overrideError }: UpcomingPickupsHomeProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const pickups = overrideData
  const isLoading = overrideLoading ?? false
  const errorMessage = overrideError ?? null

  return (
    <Stack gap={1.8}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Typography sx={{ fontSize: '1.02rem', fontWeight: 800, color: TEXT_PRIMARY }}>
          Upcoming Pickups
        </Typography>
        <Typography sx={{ fontSize: '12px', color: TEXT_SECONDARY, fontWeight: 700 }}>
          Scheduled queue
        </Typography>
      </Stack>
      {errorMessage && (
        <Typography sx={{ fontSize: '0.75rem', color: '#DE350B', fontWeight: 600 }}>
          {errorMessage}
        </Typography>
      )}

      {isLoading && (
        <Stack gap={1.05}>
          {[1, 2, 3].map((i) => (
            <Box
              key={i}
              sx={{
                borderRadius: 1,
                p: 1.35,
                border: `1px solid ${alpha(DE_BLUE, 0.08)}`,
                bgcolor: '#ffffff',
              }}
            >
              <Skeleton variant="text" width={150} height={22} />
              <Skeleton variant="text" width={230} height={18} />
              <Skeleton variant="text" width={190} height={18} />
            </Box>
          ))}
        </Stack>
      )}

      {!isLoading && (!pickups || pickups.length === 0) && (
        <Box
          sx={{
            py: 3.3,
            textAlign: 'center',
            borderRadius: 1,
            border: `1px dashed ${alpha(DE_BLUE, 0.2)}`,
            bgcolor: alpha(DE_BLUE, 0.02),
          }}
        >
          <MdLocalShipping size={30} style={{ color: DE_BLUE, opacity: 0.5 }} />
          <Typography sx={{ mt: 0.8, fontSize: '0.88rem', color: TEXT_SECONDARY, fontWeight: 600 }}>
            No upcoming pickups found
          </Typography>
        </Box>
      )}

      {!isLoading && !errorMessage && pickups && pickups.length > 0 && (
        <Stack gap={1.05}>
          {pickups.map((pickup) => {
            const createdDate = pickup.created_at
              ? new Date(pickup.created_at).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })
              : '—'

            const createdTime = pickup.created_at
              ? new Date(pickup.created_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'

            const warehouseName = pickup.pickup_details?.warehouse_name ?? 'Warehouse'
            const courier = pickup?.courier_partner ?? 'Courier TBD'
            const address = pickup.pickup_details?.address ?? '—'

            return (
              <Box
                key={pickup.id}
                sx={{
                  p: 1.6,
                  borderRadius: 1,
                  border: `1px solid ${alpha(DE_BLUE, 0.08)}`,
                  bgcolor: '#ffffff',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: DE_BLUE,
                    boxShadow: `0 4px 12px ${alpha(DE_BLUE, 0.08)}`,
                  },
                }}
              >
                <Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" gap={1.5}>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                      <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: TEXT_PRIMARY }}>
                        {warehouseName}
                      </Typography>
                      <StatusChip
                        status={pickupStatusMap[String(pickup.status || '').toLowerCase()] || 'info'}
                        label={pickup.status || 'Scheduled'}
                      />
                    </Stack>
                    <Stack direction="row" spacing={0.8} alignItems="center" color={TEXT_SECONDARY}>
                      <MdLocationPin size={14} color={DE_BLUE} />
                      <Typography noWrap sx={{ fontSize: '0.78rem', fontWeight: 500 }}>
                        {address}
                      </Typography>
                    </Stack>
                  </Box>

                  <Box sx={{ textAlign: isMobile ? 'left' : 'right' }}>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: DE_BLUE, mb: 0.5 }}>
                      {courier}
                    </Typography>
                    <Tooltip title="Pickup Scheduled Time">
                      <Stack direction="row" spacing={0.8} alignItems="center" justifyContent={isMobile ? 'flex-start' : 'flex-end'} color={TEXT_SECONDARY}>
                        <MdAccessTime size={14} />
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
                          {createdDate} • {createdTime}
                        </Typography>
                      </Stack>
                    </Tooltip>
                  </Box>
                </Stack>
              </Box>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}

export default UpcomingPickupsHome
