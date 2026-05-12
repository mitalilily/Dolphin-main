type RouteLoader = () => Promise<unknown>

export const loadLandingLayout = () => import('../landing/components/dolphin/MainLayout.jsx')
export const loadLandingPage = () => import('../landing/pages/LandingPage.jsx')
export const loadRateCalculatorLandingPage = () => import('../landing/pages/RateCalculatorPage.jsx')
export const loadTrackingLandingPage = () => import('../landing/pages/TrackingPage.jsx')
export const loadVolumetricCalculatorPage = () => import('../landing/pages/VolumetricCalculatorPage.jsx')
export const loadLogin = () => import('../pages/auth/Login')
export const loadSignup = () => import('../pages/auth/Signup')
export const loadClientPreview = () => import('../pages/preview/ClientPreview')
export const loadLayout = () => import('../components/UI/Layout')
export const loadUserOnboarding = () => import('../pages/onboarding/UserOnboarding')
export const loadDashboard = () => import('../pages/dashboard/Dashboard')
export const loadOrders = () => import('../pages/orders/Orders')
export const loadB2COrdersList = () => import('../components/orders/b2c/B2COrdersList')
export const loadB2bOrders = () => import('../pages/orders/B2bOrders')
export const loadCreateOrderWrapper = () => import('../components/orders/CreateOrderWrapper')
export const loadOrderTracking = () => import('../pages/orders/OrderTracking')
export const loadSettings = () => import('../pages/settings/Settings')
export const loadPickupAddresses = () => import('../pages/pickup-addresses/PickupAddresses')
export const loadInvoicePreferences = () => import('../components/settings/InvoicePreference')
export const loadLabelSettingsPage = () => import('../components/settings/Label/LabelSettings')
export const loadUsersManagement = () => import('../pages/users-management/UsersManagement')
export const loadCourierPriorityPage = () =>
  import('../components/settings/CourierPriority/CourierPriorityPage')
export const loadApiIntegration = () => import('../pages/settings/ApiIntegration')
export const loadWalletTransactions = () => import('../pages/billings/WalletTransactions')
export const loadInvoices = () => import('../pages/billings/Invoices')
export const loadChannels = () => import('../pages/channels/Channels')
export const loadChannelList = () => import('../pages/channels/ChannelList')
export const loadPoliciesLayout = () => import('../pages/policy/PoliciesLayout')
export const loadAboutUs = () => import('../pages/policy/AboutUs')
export const loadCancellationPolicy = () => import('../pages/policy/CancellationPolicy')
export const loadCompanyDetails = () => import('../pages/policy/CompanyDetails')
export const loadPrivacyPolicy = () => import('../pages/policy/PrivacyPolicy')
export const loadTermsOfService = () => import('../pages/policy/TermsOfService')
export const loadProfileLayout = () => import('../pages/profile/Profile')
export const loadUserProfileSettings = () => import('../components/user/UserProfileSettings')
export const loadCompanyInfoForm = () => import('../components/user/profile/CompanyInfoForm')
export const loadBankAccountsSection = () =>
  import('../components/user/profile/bankAccounts/BankAccountsSection').then((m) => ({
    default: m.BankAccountsSection,
  }))
export const loadKycSection = () => import('../components/user/profile/Kyc/KycSection')
export const loadRateCard = () => import('../pages/tools/RateCard')
export const loadRateCalculator = () =>
  import('../pages/tools/RateCalculator').then((m) => ({ default: m.RateCalculator }))
export const loadOrderTrackingForm = () => import('../pages/tools/OrderTrackingForm')
export const loadSupportTicketsPage = () =>
  import('../pages/support/SupportTicketsPage').then((m) => ({
    default: m.SupportTicketsPage,
  }))
export const loadTicketDetailsPage = () =>
  import('../pages/support/TicketDetailsPage').then((m) => ({ default: m.TicketDetailsPage }))
export const loadHome = () => import('../pages/home/Home')
export const loadCouriers = () => import('../pages/couriers/Couriers')
export const loadCodRemittancesList = () => import('../pages/cod-remittance/CodRemittancesList')
export const loadKeyboardShortcutsPage = () => import('../pages/KeyboardShortcutsPage')
export const loadReports = () => import('../pages/reports/Reports')
export const loadWeightReconciliation = () =>
  import('../pages/weight-reconciliation/WeightReconciliation')
export const loadDiscrepancyDetails = () =>
  import('../pages/weight-reconciliation/DiscrepancyDetails')
export const loadWeightReconciliationSettings = () =>
  import('../pages/weight-reconciliation/WeightReconciliationSettings')
export const loadNdrList = () => import('../pages/ops/NdrList')
export const loadRtoList = () => import('../pages/ops/RtoList')

const loadedRoutes = new Map<string, Promise<unknown>>()

const preloadOnce = (key: string, loader: RouteLoader) => {
  const cached = loadedRoutes.get(key)
  if (cached) return cached

  const promise = loader().catch((error) => {
    loadedRoutes.delete(key)
    throw error
  })

  loadedRoutes.set(key, promise)
  return promise
}

const withAppShell = (key: string, loader: RouteLoader) => [
  ['app-shell', loadLayout],
  [key, loader],
] as const

const routePreloaders: Array<{
  match: (pathname: string) => boolean
  loaders: readonly (readonly [string, RouteLoader])[]
}> = [
  {
    match: (pathname) => pathname === '/',
    loaders: [
      ['landing-shell', loadLandingLayout],
      ['landing-home', loadLandingPage],
    ],
  },
  {
    match: (pathname) => pathname === '/rate-calculator',
    loaders: [
      ['landing-shell', loadLandingLayout],
      ['landing-rate', loadRateCalculatorLandingPage],
    ],
  },
  {
    match: (pathname) => pathname === '/volumetric-weight-calculator',
    loaders: [
      ['landing-shell', loadLandingLayout],
      ['landing-volumetric', loadVolumetricCalculatorPage],
    ],
  },
  { match: (pathname) => pathname === '/login', loaders: [['login', loadLogin]] },
  { match: (pathname) => pathname === '/signup', loaders: [['signup', loadSignup]] },
  { match: (pathname) => pathname === '/preview', loaders: [['preview', loadClientPreview]] },
  {
    match: (pathname) => pathname === '/tracking',
    loaders: [
      ['landing-shell', loadLandingLayout],
      ['landing-tracking', loadTrackingLandingPage],
    ],
  },
  {
    match: (pathname) => pathname === '/onboarding-questions',
    loaders: [['onboarding', loadUserOnboarding]],
  },
  { match: (pathname) => pathname === '/dashboard', loaders: withAppShell('dashboard', loadDashboard) },
  { match: (pathname) => pathname === '/home', loaders: withAppShell('home', loadHome) },
  { match: (pathname) => pathname === '/orders/list', loaders: withAppShell('orders-list', loadOrders) },
  {
    match: (pathname) => pathname === '/orders/create',
    loaders: withAppShell('orders-create', loadCreateOrderWrapper),
  },
  {
    match: (pathname) => pathname === '/orders/b2c/list',
    loaders: withAppShell('orders-b2c', loadB2COrdersList),
  },
  {
    match: (pathname) => pathname === '/orders/b2b/list',
    loaders: withAppShell('orders-b2b', loadB2bOrders),
  },
  {
    match: (pathname) => pathname === '/couriers/partners',
    loaders: withAppShell('couriers', loadCouriers),
  },
  { match: (pathname) => pathname === '/ops/ndr', loaders: withAppShell('ndr', loadNdrList) },
  { match: (pathname) => pathname === '/ops/rto', loaders: withAppShell('rto', loadRtoList) },
  {
    match: (pathname) => pathname === '/billing/wallet_transactions',
    loaders: withAppShell('wallet', loadWalletTransactions),
  },
  {
    match: (pathname) => pathname === '/billing/invoice_management',
    loaders: withAppShell('invoices', loadInvoices),
  },
  {
    match: (pathname) => pathname === '/cod-remittance',
    loaders: withAppShell('cod', loadCodRemittancesList),
  },
  {
    match: (pathname) => pathname === '/reconciliation/weight/settings',
    loaders: withAppShell('weight-settings', loadWeightReconciliationSettings),
  },
  {
    match: (pathname) => pathname.startsWith('/reconciliation/weight/'),
    loaders: withAppShell('weight-details', loadDiscrepancyDetails),
  },
  {
    match: (pathname) => pathname === '/reconciliation/weight',
    loaders: withAppShell('weight', loadWeightReconciliation),
  },
  {
    match: (pathname) => pathname === '/tools' || pathname === '/tools/rate_card' || pathname === '/tools/rate-card',
    loaders: withAppShell('rate-card', loadRateCard),
  },
  {
    match: (pathname) =>
      pathname === '/tools/rate_calculator' || pathname === '/tools/rate-calculator',
    loaders: withAppShell('rate-calculator', loadRateCalculator),
  },
  {
    match: (pathname) => pathname === '/tools/order_tracking',
    loaders: withAppShell('order-tracking-form', loadOrderTrackingForm),
  },
  { match: (pathname) => pathname === '/reports', loaders: withAppShell('reports', loadReports) },
  { match: (pathname) => pathname === '/settings', loaders: withAppShell('settings', loadSettings) },
  {
    match: (pathname) => pathname === '/settings/manage_pickups',
    loaders: withAppShell('pickup-addresses', loadPickupAddresses),
  },
  {
    match: (pathname) => pathname === '/settings/invoice_preferences',
    loaders: withAppShell('invoice-preferences', loadInvoicePreferences),
  },
  {
    match: (pathname) => pathname === '/settings/label_config',
    loaders: withAppShell('label-settings', loadLabelSettingsPage),
  },
  {
    match: (pathname) => pathname === '/settings/users_management',
    loaders: withAppShell('users-management', loadUsersManagement),
  },
  {
    match: (pathname) => pathname === '/settings/courier_priority',
    loaders: withAppShell('courier-priority', loadCourierPriorityPage),
  },
  {
    match: (pathname) => pathname === '/settings/api-integration',
    loaders: withAppShell('api-integration', loadApiIntegration),
  },
  {
    match: (pathname) => pathname === '/channels/connected',
    loaders: withAppShell('channels-connected', loadChannels),
  },
  {
    match: (pathname) => pathname === '/channels/channel_list',
    loaders: withAppShell('channels-list', loadChannelList),
  },
  {
    match: (pathname) => pathname.startsWith('/support/tickets/'),
    loaders: withAppShell('support-ticket-details', loadTicketDetailsPage),
  },
  {
    match: (pathname) => pathname === '/support/tickets',
    loaders: withAppShell('support-tickets', loadSupportTicketsPage),
  },
  {
    match: (pathname) => pathname === '/support/about_us',
    loaders: withAppShell('about-us', loadAboutUs),
  },
  {
    match: (pathname) => pathname === '/help/shortcuts',
    loaders: withAppShell('shortcuts', loadKeyboardShortcutsPage),
  },
  {
    match: (pathname) => pathname.startsWith('/profile'),
    loaders: [
      ['app-shell', loadLayout],
      ['profile-shell', loadProfileLayout],
      ['profile-user', loadUserProfileSettings],
      ['profile-company', loadCompanyInfoForm],
      ['profile-bank', loadBankAccountsSection],
      ['profile-kyc', loadKycSection],
    ],
  },
  {
    match: (pathname) => pathname.startsWith('/policies'),
    loaders: [
      ['app-shell', loadLayout],
      ['policies-shell', loadPoliciesLayout],
      ['policy-cancellation', loadCancellationPolicy],
      ['policy-privacy', loadPrivacyPolicy],
      ['policy-terms', loadTermsOfService],
      ['policy-company', loadCompanyDetails],
    ],
  },
]

const normalizePath = (path: string) => {
  const pathname = path.split('?')[0]?.split('#')[0] || '/'
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
}

export const preloadRouteModule = (path: string) => {
  const pathname = normalizePath(path)
  const match = routePreloaders.find((route) => route.match(pathname))
  if (!match) return Promise.resolve()

  return Promise.all(match.loaders.map(([key, loader]) => preloadOnce(key, loader))).then(
    () => undefined,
  )
}

export const warmCommonRoutes = () => {
  const commonRoutes = [
    '/dashboard',
    '/home',
    '/orders/list',
    '/orders/create',
    '/billing/wallet_transactions',
    '/tools/rate_calculator',
    '/settings',
  ]

  let cancelled = false
  const warmNext = (index: number) => {
    if (cancelled || index >= commonRoutes.length) return
    preloadRouteModule(commonRoutes[index]).finally(() => {
      window.setTimeout(() => warmNext(index + 1), 450)
    })
  }

  const start = () => warmNext(0)
  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
    cancelIdleCallback?: (handle: number) => void
  }
  const requestIdle = idleWindow.requestIdleCallback?.bind(window)
  const cancelIdle = idleWindow.cancelIdleCallback?.bind(window)
  let idleId: number | undefined
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined

  if (requestIdle) {
    idleId = requestIdle(start, { timeout: 2500 })
  } else {
    timeoutId = globalThis.setTimeout(start, 1200)
  }

  return () => {
    cancelled = true
    if (idleId !== undefined && cancelIdle) {
      cancelIdle(idleId)
    }
    if (timeoutId !== undefined) {
      globalThis.clearTimeout(timeoutId)
    }
  }
}
