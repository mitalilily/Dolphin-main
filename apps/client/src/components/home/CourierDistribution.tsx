import { alpha, Box, LinearProgress, Skeleton, Stack, Typography } from '@mui/material'
import { FaTruck } from 'react-icons/fa6'
import type { CourierDistribution as CourierDistributionType } from '../../api/dashboard.api'

const DE_BLUE = '#0052CC'
const TEXT_PRIMARY = '#172B4D'
const TEXT_SECONDARY = '#42526E'

const barColors = ['#0052CC', '#0065FF', '#FFAB00', '#FFC400', '#36B37E', '#172B4D']

type CourierDistributionProps = {
  data?: CourierDistributionType[]
  isLoading?: boolean
  error?: string | null
}

const CourierDistribution = ({
  data: overrideData,
  isLoading: overrideLoading,
  error: overrideError,
}: CourierDistributionProps) => {
  const distribution = overrideData
  const isLoading = overrideLoading ?? false
  const errorMessage = overrideError ?? null
  const totalOrders = distribution?.reduce((sum, item) => sum + item.count, 0) || 0

  return (
    <Stack gap={1.8}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography sx={{ fontSize: '1.02rem', fontWeight: 800, color: TEXT_PRIMARY }}>
          Courier Distribution
        </Typography>
        <Typography sx={{ fontSize: '12px', color: TEXT_SECONDARY, fontWeight: 700 }}>Order Share</Typography>
      </Stack>
      {errorMessage && (
        <Typography sx={{ fontSize: '0.75rem', color: '#DE350B', fontWeight: 600 }}>
          {errorMessage}
        </Typography>
      )}

      {isLoading ? (
        <Stack gap={1.2}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={70} variant="rectangular" sx={{ borderRadius: 1 }} />
          ))}
        </Stack>
      ) : !distribution || distribution.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            borderRadius: 1,
            border: `1px dashed ${alpha(DE_BLUE, 0.2)}`,
            bgcolor: alpha(DE_BLUE, 0.02),
          }}
        >
          <FaTruck size={30} style={{ color: DE_BLUE, opacity: 0.5 }} />
          <Typography sx={{ mt: 0.8, fontSize: '0.88rem', color: TEXT_SECONDARY, fontWeight: 600 }}>
            No courier data found
          </Typography>
        </Box>
      ) : (
        <Stack gap={1.05}>
          {distribution.map((item, index) => {
            const percentage = totalOrders > 0 ? (item.count / totalOrders) * 100 : 0
            const color = barColors[index % barColors.length]

            return (
              <Box
                key={index}
                sx={{
                  p: 1.4,
                  borderRadius: 1,
                  border: `1px solid ${alpha(DE_BLUE, 0.08)}`,
                  bgcolor: '#ffffff',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.95}>
                  <Typography noWrap sx={{ maxWidth: '70%', fontSize: '0.88rem', color: TEXT_PRIMARY, fontWeight: 700 }}>
                    {item.courier || 'Unknown Courier'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.76rem', color: TEXT_SECONDARY, fontWeight: 700 }}>
                    {item.count} {item.count === 1 ? 'order' : 'orders'}
                  </Typography>
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 6,
                    borderRadius: 1,
                    bgcolor: alpha(DE_BLUE, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 1,
                      bgcolor: color,
                    },
                  }}
                />

                <Stack direction="row" justifyContent="space-between" mt={0.6}>
                  <Typography sx={{ fontSize: '11px', color: TEXT_SECONDARY }}>Share</Typography>
                  <Typography
                    sx={{
                      fontSize: '11px',
                      color: percentage > 35 ? '#8a3e00' : DE_BLUE,
                      fontWeight: 700,
                    }}
                  >
                    {percentage.toFixed(1)}%
                  </Typography>
                </Stack>
              </Box>
            )
          })}
        </Stack>
      )}

      {distribution && distribution.length > 0 && (
        <Box sx={{ p: 1.2, borderRadius: 1, bgcolor: alpha('#FFAB00', 0.1), border: `1px solid ${alpha('#FFAB00', 0.2)}` }}>
          <Typography sx={{ fontSize: '12px', color: '#8a3e00', fontWeight: 700 }}>
            Total orders processed: {totalOrders}
          </Typography>
        </Box>
      )}
    </Stack>
  )
}

export default CourierDistribution
