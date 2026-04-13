import {
  alpha,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Typography,
  useTheme,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import ActionItemsCard from '../../components/dashboard/ActionItemsCard'
import CourierComparisonChart from '../../components/dashboard/CourierComparisonChart'
import CourierPerformanceCard from '../../components/dashboard/CourierPerformanceCard'
import DashboardCustomizationDialog from '../../components/dashboard/DashboardCustomizationDialog'
import DashboardHeader from '../../components/dashboard/DashboardHeader'
import FinancialHealthCard from '../../components/dashboard/FinancialHealthCard'
import InsightsCard from '../../components/dashboard/InsightsCard'
import MetricsOverviewCard from '../../components/dashboard/MetricsOverviewCard'
import OrderStatusChart from '../../components/dashboard/OrderStatusChart'
import OrdersTrendChart from '../../components/dashboard/OrdersTrendChart'
import PerformanceMetricsCard from '../../components/dashboard/PerformanceMetricsCard'
import QuickActionsCard from '../../components/dashboard/QuickActionsCard'
import QuickStatsCards from '../../components/dashboard/QuickStatsCards'
import RecentActivityCard from '../../components/dashboard/RecentActivityCard'
import TodaysOperationsCard from '../../components/dashboard/TodaysOperationsCard'
import TopDestinationsCard from '../../components/dashboard/TopDestinationsCard'
import { useMerchantDashboardStats } from '../../hooks/useDashboard'
import { useDashboardPreferences } from '../../hooks/useDashboardPreferences'
import { brand, brandGradients } from '../../theme/brand'

// Widget mapping
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const widgetComponents: Record<string, React.ComponentType<any>> = {
  quickStats: QuickStatsCards,
  quickActions: QuickActionsCard,
  insights: InsightsCard,
  actionItems: ActionItemsCard,
  performanceMetrics: PerformanceMetricsCard,
  ordersTrend: OrdersTrendChart,
  financialHealth: FinancialHealthCard,
  recentActivity: RecentActivityCard,
  todaysOperations: TodaysOperationsCard,
  orderStatusChart: OrderStatusChart,
  courierComparison: CourierComparisonChart,
  metricsOverview: MetricsOverviewCard,
  courierPerformance: CourierPerformanceCard,
  topDestinations: TopDestinationsCard,
}

export default function Dashboard() {
  const theme = useTheme()
  const { data: stats, isLoading, error, refetch, isRefetching } = useMerchantDashboardStats()
  const { data: preferences } = useDashboardPreferences()
  const [ChartComponent, setChartComponent] = useState<
    typeof import('react-apexcharts').default | null
  >(null)
  const [customizeOpen, setCustomizeOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-apexcharts').then((mod) => {
        setChartComponent(() => mod.default)
      })
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const formatPercentage = (value: number) => `${value}%`

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '58vh',
          borderRadius: 1,
          display: 'grid',
          placeItems: 'center',
          border: `1px solid ${alpha(brand.ink, 0.08)}`,
          bgcolor: '#ffffff',
          boxShadow: '0 20px 42px rgba(15,44,67,0.08)',
        }}
      >
        <Box textAlign="center">
          <CircularProgress size={44} sx={{ color: brand.ink }} />
          <Typography color="text.secondary" sx={{ mt: 1.2, fontWeight: 600 }}>
            Optimizing your command center...
          </Typography>
        </Box>
      </Box>
    )
  }

  if (error || !stats) {
    return (
      <Box
        sx={{
          minHeight: '58vh',
          borderRadius: 1,
          display: 'grid',
          placeItems: 'center',
          border: `1px solid ${alpha(brand.danger, 0.14)}`,
          bgcolor: '#ffffff',
        }}
      >
        <Box textAlign="center" sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={800} color={brand.danger} gutterBottom>
            Connectivity Issue
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            We encountered an error while syncing your command center.
          </Typography>
          <Button
            variant="contained"
            onClick={() => refetch()}
            sx={{ background: brandGradients.button, color: brand.ink }}
          >
            Retry Connection
          </Button>
        </Box>
      </Box>
    )
  }

  const todayOps = stats.todayOperations || {}
  const financial = stats.financial || {}
  const operational = stats.operational || {}
  const actions = stats.actions || {}
  const couriers = stats.couriers || {}
  const charts = stats.charts || {}

  // Get widget order from preferences or use default
  const widgetOrder =
    preferences?.widgetOrder ||
    [
      'quickStats',
      'quickActions',
      'insights',
      'actionItems',
      'performanceMetrics',
      'ordersTrend',
      'financialHealth',
      'recentActivity',
      'todaysOperations',
      'orderStatusChart',
      'courierComparison',
      'metricsOverview',
      'courierPerformance',
      'topDestinations',
    ].filter((widget) => widget !== 'revenueChart' && widget !== 'revenueByTypeChart')

  const widgetVisibility = preferences?.widgetVisibility || {}

  // Filter out hidden widgets from widgetOrder so they don't take up space
  const visibleWidgetOrder = widgetOrder.filter((widgetId) => {
    if (widgetId === 'recommendations') return false
    // Default to visible if not set in preferences
    return widgetVisibility[widgetId] !== false
  })

  // Props for widgets
  const widgetProps: Record<string, Record<string, unknown>> = {
    quickStats: {
      todayOps,
      financial,
      trends: stats.trends || {
        ordersGrowth: 0,
        thisWeekOrders: 0,
        lastWeekOrders: 0,
      },
      formatCurrency,
    },
    quickActions: {},
    insights: {
      operational,
      trends: stats.trends || {
        ordersGrowth: 0,
        thisWeekOrders: 0,
        lastWeekOrders: 0,
      },
      actions,
    },
    actionItems: { actions, formatCurrency },
    performanceMetrics: { operational, formatPercentage },
    ordersTrend: {
      chartData: charts.ordersByDate || [],
      ChartComponent,
    },
    financialHealth: {
      financial,
      trends: stats.trends || {
        ordersGrowth: 0,
        thisWeekOrders: 0,
        lastWeekOrders: 0,
      },
      formatCurrency,
    },
    recentActivity: {
      recentActivity: stats.recentActivity || { transactions: [], recentOrders: [] },
      formatCurrency,
    },
    todaysOperations: { todayOps },
    orderStatusChart: {
      chartData: charts.ordersByStatus || [],
      ChartComponent,
    },
    courierComparison: {
      ordersData: charts.ordersByCourier || [],
      ChartComponent,
    },
    metricsOverview: {
      metrics: stats.metrics || {
        avgOrderValue: 0,
        totalPrepaidOrders: 0,
        totalCodOrders: 0,
      },
      formatCurrency,
    },
    courierPerformance: {
      courierPerformance: couriers.performance || {},
    },
    topDestinations: {
      topDestinations: stats.geographic?.topDestinations || [],
    },
  }

  // Grid sizing for different widgets - returns flexible sizes that fill available space
  const getGridSize = (
    widgetId: string,
    index: number,
    visibleWidgets: string[],
  ): { xs: number; md: number } => {
    const baseSizes: Record<string, { xs: number; md: number }> = {
      quickStats: { xs: 12, md: 12 },
      quickActions: { xs: 12, md: 6 },
      insights: { xs: 12, md: 6 },
      actionItems: { xs: 12, md: 8 },
      performanceMetrics: { xs: 12, md: 4 },
      ordersTrend: { xs: 12, md: 8 },
      financialHealth: { xs: 12, md: 6 },
      recentActivity: { xs: 12, md: 6 },
      todaysOperations: { xs: 12, md: 6 },
      orderStatusChart: { xs: 12, md: 6 },
      courierComparison: { xs: 12, md: 8 },
      metricsOverview: { xs: 12, md: 4 },
      courierPerformance: { xs: 12, md: 6 },
      topDestinations: { xs: 12, md: 6 },
    }

    const baseSize = baseSizes[widgetId] || { xs: 12, md: 6 }

    // Calculate current column position by tracking previous widgets
    let currentCol = 0
    for (let i = 0; i < index; i++) {
      const prevWidgetId = visibleWidgets[i]
      const prevSize = baseSizes[prevWidgetId] || { xs: 12, md: 6 }
      currentCol += prevSize.md
      // Wrap to next row if we exceed 12 columns
      if (currentCol >= 12) {
        currentCol = currentCol % 12
      }
    }

    // If widget would overflow, it will wrap to next row (return base size)
    if (currentCol + baseSize.md > 12) {
      return baseSize
    }

    // Calculate remaining space in current row
    const remainingSpace = 12 - (currentCol + baseSize.md)

    // If there's remaining space, check if any next widgets can fit
    if (remainingSpace > 0) {
      let nextWidgetsTotal = 0
      for (let i = index + 1; i < visibleWidgets.length; i++) {
        const nextWidgetId = visibleWidgets[i]
        const nextSize = baseSizes[nextWidgetId] || { xs: 12, md: 6 }
        // If next widget would wrap to new row, it won't fit in remaining space
        if (nextWidgetsTotal + nextSize.md > remainingSpace) {
          break
        }
        nextWidgetsTotal += nextSize.md
      }

      // If no widgets can fit in remaining space, expand current widget to fill it
      if (nextWidgetsTotal === 0 && remainingSpace > 0) {
        const expandedSize = Math.min(baseSize.md + remainingSpace, 12)
        // Only expand if it makes sense (don't expand very small widgets too much)
        if (expandedSize <= baseSize.md * 2 || baseSize.md >= 4) {
          return { xs: baseSize.xs, md: expandedSize }
        }
      }
    }

    return baseSize
  }

  const spacing = preferences?.layout?.spacing || 3
  const showGridLines = preferences?.layout?.showGridLines || false

  return (
    <Box
      sx={{
        minHeight: '100%',
        pb: 2.5,
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          pt: 1.2,
          '& .MuiCard-root': {
            borderRadius: '30px',
            border: `1px solid ${alpha('#FFFFFF', 0.7)}`,
            boxShadow: '0 20px 42px rgba(15,44,67,0.08)',
          },
        }}
      >
        {/* Header with Refresh Button */}
        <DashboardHeader
          isRefetching={isRefetching}
          onRefresh={() => refetch()}
          onCustomize={() => setCustomizeOpen(true)}
        />

        {/* Render widgets based on preferences */}
        <Box sx={{ position: 'relative' }}>
          {/* Grid Lines Background - Shows 12-column grid structure */}
          {showGridLines && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 0,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `
                    repeating-linear-gradient(
                      to right,
                      transparent 0,
                      transparent calc((100% / 12) - 0.5px),
                      ${alpha(theme.palette.divider, 0.2)} calc((100% / 12) - 0.5px),
                      ${alpha(theme.palette.divider, 0.2)} calc(100% / 12)
                    ),
                    repeating-linear-gradient(
                      to bottom,
                      transparent 0,
                      transparent calc(24px - 0.5px),
                      ${alpha(theme.palette.divider, 0.15)} calc(24px - 0.5px),
                      ${alpha(theme.palette.divider, 0.15)} 24px
                    )
                  `,
                },
              }}
            />
          )}
          <Grid container spacing={spacing} sx={{ position: 'relative', zIndex: 1 }}>
            {visibleWidgetOrder
              .filter(
                (widgetId) => widgetId !== 'revenueChart' && widgetId !== 'revenueByTypeChart',
              )
              .map((widgetId, index) => {
                const WidgetComponent = widgetComponents[widgetId]
                const gridSize = getGridSize(widgetId, index, visibleWidgetOrder)

                if (!WidgetComponent) {
                  return null
                }

                return (
                  <Grid size={gridSize} key={widgetId} sx={{ display: 'flex' }}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-50px' }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <WidgetComponent {...(widgetProps[widgetId] || {})} />
                    </motion.div>
                  </Grid>
                )
              })}
          </Grid>
        </Box>
      </Container>

      {/* Customization Dialog */}
      <DashboardCustomizationDialog open={customizeOpen} onClose={() => setCustomizeOpen(false)} />
    </Box>
  )
}
