import axiosInstance from './axiosInstance'

export interface DashboardPreferences {
  widgetVisibility: Record<string, boolean>
  widgetOrder: string[]
  layout: {
    columns?: number
    spacing?: number
    cardStyle?: 'default' | 'compact' | 'spacious'
    showGridLines?: boolean
  }
  dateRange: {
    defaultRange?: '7days' | '30days' | '90days' | 'custom'
    customStart?: string
    customEnd?: string
  }
}

const defaultWidgetOrder = [
  'quickStats',
  'quickActions',
  'insights',
  'actionItems',
  'recommendations',
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
]

export const defaultDashboardPreferences: DashboardPreferences = {
  widgetVisibility: Object.fromEntries(defaultWidgetOrder.map((widgetId) => [widgetId, true])),
  widgetOrder: defaultWidgetOrder,
  layout: {
    columns: 12,
    spacing: 3,
    cardStyle: 'default',
    showGridLines: false,
  },
  dateRange: {
    defaultRange: '7days',
  },
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))

export const normalizeDashboardPreferences = (
  preferences?: Partial<DashboardPreferences> | null,
): DashboardPreferences => {
  const incomingOrder = Array.isArray(preferences?.widgetOrder) ? preferences.widgetOrder : []
  const knownWidgets = new Set(defaultDashboardPreferences.widgetOrder)
  const normalizedOrder = [
    ...incomingOrder.filter((widgetId) => knownWidgets.has(widgetId)),
    ...defaultDashboardPreferences.widgetOrder.filter(
      (widgetId) => !incomingOrder.includes(widgetId),
    ),
  ]
  const widgetVisibility = isPlainObject(preferences?.widgetVisibility)
    ? (Object.fromEntries(
        Object.entries(preferences.widgetVisibility).filter(
          ([, value]) => typeof value === 'boolean',
        ),
      ) as Record<string, boolean>)
    : {}
  const layout = isPlainObject(preferences?.layout)
    ? (preferences.layout as Partial<DashboardPreferences['layout']>)
    : {}
  const dateRange = isPlainObject(preferences?.dateRange)
    ? (preferences.dateRange as Partial<DashboardPreferences['dateRange']>)
    : {}

  return {
    widgetVisibility: {
      ...defaultDashboardPreferences.widgetVisibility,
      ...widgetVisibility,
    },
    widgetOrder: normalizedOrder,
    layout: {
      ...defaultDashboardPreferences.layout,
      ...layout,
    },
    dateRange: {
      ...defaultDashboardPreferences.dateRange,
      ...dateRange,
    },
  }
}

export const getDashboardPreferences = async (): Promise<DashboardPreferences> => {
  const { data } = await axiosInstance.get('/dashboard/preferences')
  return normalizeDashboardPreferences(data.success ? data.data : data)
}

export const saveDashboardPreferences = async (
  preferences: Partial<DashboardPreferences>,
): Promise<DashboardPreferences> => {
  const { data } = await axiosInstance.post('/dashboard/preferences', preferences)
  return normalizeDashboardPreferences(data.success ? data.data : data)
}

