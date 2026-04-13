import React from 'react'
import { alpha, Box, Card, CardContent, Stack, Typography } from '@mui/material'
import { MdCheckCircle, MdInfo, MdLightbulb, MdTrendingDown, MdTrendingUp, MdWarning } from 'react-icons/md'

interface InsightsCardProps {
  operational: {
    deliverySuccessRate: number
    ndrRate: number
    rtoRate: number
    avgDeliveryTime: number
  }
  trends: {
    ordersGrowth: number
    revenueGrowth: number
  }
  actions: {
    ndrCount: number
    rtoCount: number
    weightDiscrepancyCount: number
  }
}

type InsightType = 'good' | 'warning' | 'notice'

const DE_BLUE = '#0052CC'
const DE_AMBER = '#FFAB00'

export default function InsightsCard({ operational, trends, actions }: InsightsCardProps) {
  const insights: Array<{
    type: InsightType
    message: string
    icon: React.ReactNode
  }> = []

  if (operational.deliverySuccessRate >= 90) {
    insights.push({
      type: 'good',
      message: `Delivery success is strong at ${operational.deliverySuccessRate}%.`,
      icon: <MdCheckCircle size={18} />,
    })
  } else if (operational.deliverySuccessRate < 75) {
    insights.push({
      type: 'warning',
      message: `Delivery success dropped to ${operational.deliverySuccessRate}%. Prioritize interventions.`,
      icon: <MdWarning size={18} />,
    })
  }

  if (trends.ordersGrowth > 0) {
    insights.push({
      type: 'good',
      message: `Orders are growing by ${trends.ordersGrowth}% vs previous week.`,
      icon: <MdTrendingUp size={18} />,
    })
  } else if (trends.ordersGrowth < 0) {
    insights.push({
      type: 'warning',
      message: `Orders are down ${Math.abs(trends.ordersGrowth)}% this week.`,
      icon: <MdTrendingDown size={18} />,
    })
  }

  if (actions.ndrCount > 0 || actions.rtoCount > 0) {
    insights.push({
      type: 'notice',
      message: `${actions.ndrCount} NDR and ${actions.rtoCount} RTO orders need action.`,
      icon: <MdInfo size={18} />,
    })
  }

  if (operational.avgDeliveryTime > 7) {
    insights.push({
      type: 'warning',
      message: `Average delivery time is ${operational.avgDeliveryTime} days. Consider faster lanes.`,
      icon: <MdWarning size={18} />,
    })
  }

  const palette: Record<InsightType, { bg: string; border: string; color: string }> = {
    good: { bg: alpha('#36B37E', 0.08), border: alpha('#36B37E', 0.2), color: '#00875A' },
    warning: { bg: alpha('#DE350B', 0.08), border: alpha('#DE350B', 0.2), color: '#DE350B' },
    notice: { bg: alpha(DE_BLUE, 0.06), border: alpha(DE_BLUE, 0.2), color: DE_BLUE },
  }

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 1,
        border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
        boxShadow: `0 8px 20px ${alpha(DE_BLUE, 0.05)}`,
      }}
    >
      <CardContent sx={{ p: 2.2 }}>
        <Stack direction="row" spacing={1.2} alignItems="center" mb={2.2}>
          <Box
            sx={{
              p: 0.9,
              borderRadius: 1,
              bgcolor: alpha(DE_AMBER, 0.1),
              color: DE_AMBER,
              display: 'flex',
            }}
          >
            <MdLightbulb size="20" />
          </Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: '#172B4D', letterSpacing: -0.2 }}>
            Performance Insights
          </Typography>
        </Stack>

        <Stack spacing={1.5}>
          {insights.slice(0, 4).map((insight, idx) => (
            <Box
              key={idx}
              sx={{
                p: 1.4,
                borderRadius: 1,
                border: `1px solid ${palette[insight.type].border}`,
                bgcolor: palette[insight.type].bg,
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'translateX(4px)' },
              }}
            >
              <Stack direction="row" spacing={1.2} alignItems="flex-start">
                <Box sx={{ color: palette[insight.type].color, mt: 0.2 }}>{insight.icon}</Box>
                <Typography sx={{ fontSize: '0.82rem', color: '#172B4D', fontWeight: 600, lineHeight: 1.4 }}>
                  {insight.message}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
