// AppRoutes.tsx
import { lazy, Suspense, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import {
  Navigate,
  Route,
  Router,
  Routes,
  UNSAFE_createBrowserHistory,
  useLocation,
} from 'react-router-dom'
import RequireAuth from '../components/auth/wrapper/RequireAuth'
import RequireMerchantReady from '../components/auth/wrapper/RequireMerchantReady'
import RequireOnboard from '../components/auth/wrapper/RequireOnboard'
import ErrorBoundary from '../components/UI/ErrorBoundary'
import FullScreenLoader from '../components/UI/loader/FullScreenLoader'
import NavigationLoader from '../components/UI/loader/NavigationLoader'
import AppEntry from './AppEntry'
import {
  loadAboutUs,
  loadApiIntegration,
  loadB2bOrders,
  loadB2COrdersList,
  loadBankAccountsSection,
  loadCancellationPolicy,
  loadChannelList,
  loadChannels,
  loadClientPreview,
  loadCodRemittancesList,
  loadCompanyDetails,
  loadCompanyInfoForm,
  loadCourierPriorityPage,
  loadCouriers,
  loadCreateOrderWrapper,
  loadDashboard,
  loadDiscrepancyDetails,
  loadHome,
  loadInvoices,
  loadInvoicePreferences,
  loadKeyboardShortcutsPage,
  loadKycSection,
  loadLabelSettingsPage,
  loadLandingLayout,
  loadLandingPage,
  loadLayout,
  loadLogin,
  loadNdrList,
  loadOrderTrackingForm,
  loadOrders,
  loadPickupAddresses,
  loadPoliciesLayout,
  loadPrivacyPolicy,
  loadProfileLayout,
  loadRateCalculator,
  loadRateCalculatorLandingPage,
  loadRateCard,
  loadReports,
  loadRtoList,
  loadSettings,
  loadSupportTicketsPage,
  loadTermsOfService,
  loadTicketDetailsPage,
  loadTrackingLandingPage,
  loadUserOnboarding,
  loadUserProfileSettings,
  loadUsersManagement,
  loadVolumetricCalculatorPage,
  loadWalletTransactions,
  loadWeightReconciliation,
  loadWeightReconciliationSettings,
} from './routePreload'
import GlobalRedirectHandler from './WalletRedirectHandler'
import {
  AUTH_APP_URL,
  CLIENT_APP_URL,
  MARKETING_SITE_URL,
  buildExternalUrl,
  isMarketingSurface,
  isSellerAppSurface,
} from '../config/deployment'

/* ---------- Lazy-loaded components ---------- */
const LandingMainLayout = lazy(loadLandingLayout)
const LandingPage = lazy(loadLandingPage)
const RateCalculatorLandingPage = lazy(loadRateCalculatorLandingPage)
const TrackingLandingPage = lazy(loadTrackingLandingPage)
const VolumetricCalculatorPage = lazy(loadVolumetricCalculatorPage)
const Login = lazy(loadLogin)
const ClientPreview = lazy(loadClientPreview)
const Layout = lazy(loadLayout)

// Onboarding & Dashboard
const UserOnboarding = lazy(loadUserOnboarding)
const Dashboard = lazy(loadDashboard)

// Orders
const Orders = lazy(loadOrders)
const B2COrdersList = lazy(loadB2COrdersList)
const B2bOrders = lazy(loadB2bOrders)
const CreateOrderWrapper = lazy(loadCreateOrderWrapper)

// Settings
const Settings = lazy(loadSettings)
const PickupAddresses = lazy(loadPickupAddresses)
const InvoicePreferences = lazy(loadInvoicePreferences)
const LabelSettingsPage = lazy(loadLabelSettingsPage)
const UsersManagement = lazy(loadUsersManagement)
const CourierPriorityPage = lazy(loadCourierPriorityPage)
const ApiIntegration = lazy(loadApiIntegration)

// Billing
const WalletTransactions = lazy(loadWalletTransactions)
const Invoices = lazy(loadInvoices)

// Channels
const Channels = lazy(loadChannels)
const ChannelList = lazy(loadChannelList)

// Policies
const PoliciesLayout = lazy(loadPoliciesLayout)
const AboutUs = lazy(loadAboutUs)
const CancellationPolicy = lazy(loadCancellationPolicy)
const CompanyDetails = lazy(loadCompanyDetails)
const PrivacyPolicy = lazy(loadPrivacyPolicy)
const TermsOfService = lazy(loadTermsOfService)

// Profile
const ProfileLayout = lazy(loadProfileLayout)
const UserProfileSettings = lazy(loadUserProfileSettings)
const CompanyInfoForm = lazy(loadCompanyInfoForm)
const BankAccountsSection = lazy(loadBankAccountsSection)
const KycSection = lazy(loadKycSection)

// Tools
const RateCard = lazy(loadRateCard)
const RateCalculator = lazy(loadRateCalculator)
const OrderTrackingForm = lazy(loadOrderTrackingForm)

// Support
const SupportTicketsPage = lazy(loadSupportTicketsPage)
const TicketDetailsPage = lazy(loadTicketDetailsPage)

// Other
const Home = lazy(loadHome)
const Couriers = lazy(loadCouriers)
const CodRemittancesList = lazy(loadCodRemittancesList)
const KeyboardShortcutsPage = lazy(loadKeyboardShortcutsPage)
const Reports = lazy(loadReports)

// Weight Reconciliation
const WeightReconciliation = lazy(loadWeightReconciliation)
const DiscrepancyDetails = lazy(loadDiscrepancyDetails)
const WeightReconciliationSettings = lazy(loadWeightReconciliationSettings)
// Ops (NDR/RTO)
const NdrList = lazy(loadNdrList)
const RtoList = lazy(loadRtoList)

interface SyncBrowserRouterProps {
  basename?: string
  children: ReactNode
  window?: Window
}

function SyncBrowserRouter({ basename, children, window }: SyncBrowserRouterProps) {
  const historyRef = useRef<ReturnType<typeof UNSAFE_createBrowserHistory> | null>(null)

  if (historyRef.current === null) {
    historyRef.current = UNSAFE_createBrowserHistory({ window, v5Compat: true })
  }

  const history = historyRef.current
  const [state, setState] = useState({
    action: history.action,
    location: history.location,
  })

  // Keep the router location in lockstep with the address bar during lazy route loads.
  useLayoutEffect(() => history.listen(setState), [history])

  return (
    <Router
      basename={basename}
      location={state.location}
      navigationType={state.action}
      navigator={history}
    >
      {children}
    </Router>
  )
}

function ExternalRedirect({ to }: { to: string }) {
  useLayoutEffect(() => {
    window.location.replace(to)
  }, [to])

  return <FullScreenLoader />
}

const appUrl = (path = '/') => buildExternalUrl(CLIENT_APP_URL, path)
const marketingUrl = (path = '/') => buildExternalUrl(MARKETING_SITE_URL, path)

function RoutedAppContent() {
  const location = useLocation()

  return (
    <>
      <NavigationLoader />
      <GlobalRedirectHandler />
      <ErrorBoundary resetKey={`${location.pathname}${location.search}`}>
        <Suspense fallback={<FullScreenLoader />}>
          <Routes>
            {!isSellerAppSurface && (
              <Route element={<LandingMainLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/rate-calculator" element={<RateCalculatorLandingPage />} />
                <Route path="/tracking" element={<TrackingLandingPage />} />
                <Route path="/volumetric-weight-calculator" element={<VolumetricCalculatorPage />} />
              </Route>
            )}

            {isSellerAppSurface && (
              <>
                <Route path="/" element={<AppEntry />} />
                <Route
                  path="/rate-calculator"
                  element={<ExternalRedirect to={marketingUrl('/rate-calculator')} />}
                />
                <Route path="/tracking" element={<ExternalRedirect to={marketingUrl('/tracking')} />} />
                <Route
                  path="/volumetric-weight-calculator"
                  element={<ExternalRedirect to={marketingUrl('/volumetric-weight-calculator')} />}
                />
              </>
            )}

            {isMarketingSurface ? (
              <>
                <Route path="/login" element={<ExternalRedirect to={AUTH_APP_URL} />} />
                <Route path="/signup" element={<ExternalRedirect to={AUTH_APP_URL} />} />
                <Route path="/app" element={<ExternalRedirect to={CLIENT_APP_URL} />} />
                <Route path="/app/*" element={<ExternalRedirect to={CLIENT_APP_URL} />} />
                <Route path="/preview" element={<ExternalRedirect to={appUrl('/preview')} />} />
                <Route
                  path="/onboarding-questions"
                  element={<ExternalRedirect to={appUrl('/onboarding-questions')} />}
                />
                <Route path="/dashboard" element={<ExternalRedirect to={appUrl('/dashboard')} />} />
                <Route path="/home" element={<ExternalRedirect to={appUrl('/home')} />} />
                <Route path="/orders/*" element={<ExternalRedirect to={appUrl('/orders/list')} />} />
                <Route path="/settings/*" element={<ExternalRedirect to={appUrl('/settings')} />} />
                <Route
                  path="/billing/*"
                  element={<ExternalRedirect to={appUrl('/billing/wallet_transactions')} />}
                />
                <Route
                  path="/channels/*"
                  element={<ExternalRedirect to={appUrl('/channels/connected')} />}
                />
                <Route path="/policies/*" element={<ExternalRedirect to={appUrl('/policies')} />} />
                <Route path="/profile/*" element={<ExternalRedirect to={appUrl('/profile')} />} />
                <Route path="/tools/*" element={<ExternalRedirect to={appUrl('/tools/rate_card')} />} />
                <Route path="/support/*" element={<ExternalRedirect to={appUrl('/support/tickets')} />} />
                <Route
                  path="/couriers/*"
                  element={<ExternalRedirect to={appUrl('/couriers/partners')} />}
                />
                <Route
                  path="/cod-remittance"
                  element={<ExternalRedirect to={appUrl('/cod-remittance')} />}
                />
                <Route path="/reports" element={<ExternalRedirect to={appUrl('/reports')} />} />
                <Route
                  path="/reconciliation/*"
                  element={<ExternalRedirect to={appUrl('/reconciliation/weight')} />}
                />
                <Route path="/ops/*" element={<ExternalRedirect to={appUrl('/ops/ndr')} />} />
                <Route path="/help/*" element={<ExternalRedirect to={appUrl('/help/shortcuts')} />} />
              </>
            ) : (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Navigate to="/login" replace />} />
                <Route path="/app" element={<AppEntry />} />
                <Route path="/preview" element={<ClientPreview />} />
                <Route
                  path="/onboarding-questions"
                  element={
                    <RequireOnboard>
                      <UserOnboarding />
                    </RequireOnboard>
                  }
                />
                <Route
                  element={
                    <RequireAuth>
                      <Layout />
                    </RequireAuth>
                  }
                >
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/settings/manage_pickups" element={<PickupAddresses />} />
                  <Route path="/billing/wallet_transactions" element={<WalletTransactions />} />
                  <Route path="/billing/invoice_management" element={<Invoices />} />
                  <Route path="/orders/list" element={<Orders />} />
                  <Route
                    path="/orders/create"
                    element={
                      <RequireMerchantReady>
                        <CreateOrderWrapper />
                      </RequireMerchantReady>
                    }
                  />
                  <Route path="/orders/b2c/list" element={<B2COrdersList />} />
                  <Route path="/support/about_us" element={<AboutUs />} />
                  <Route path="/orders/b2b/list" element={<B2bOrders />} />
                  <Route path="/settings/invoice_preferences" element={<InvoicePreferences />} />
                  <Route path="/settings/label_config" element={<LabelSettingsPage />} />
                  <Route path="/settings/users_management" element={<UsersManagement />} />
                  <Route path="/settings/courier_priority" element={<CourierPriorityPage />} />
                  <Route path="/settings/api-integration" element={<ApiIntegration />} />
                  <Route path="/channels/connected" element={<Channels />} />
                  <Route path="/channels/channel_list" element={<ChannelList />} />
                  <Route path="/policies/*" element={<PoliciesLayout />}>
                    <Route path="refund_cancellation" element={<CancellationPolicy />} />
                    <Route path="privacy_policy" element={<PrivacyPolicy />} />
                    <Route path="terms_of_service" element={<TermsOfService />} />
                    <Route path="contact_us" element={<CompanyDetails />} />
                  </Route>
                  <Route path="/help/shortcuts" element={<KeyboardShortcutsPage />} />
                  <Route path="/profile/*" element={<ProfileLayout />}>
                    <Route path="user_profile/*" element={<UserProfileSettings />} />
                    <Route index element={<Navigate to="user_profile" replace />} />
                    <Route path="user_profile" element={<UserProfileSettings />} />
                    <Route path="company" element={<CompanyInfoForm />} />
                    <Route path="password" element={<UserProfileSettings />} />
                    <Route path="bank_details" element={<BankAccountsSection />} />
                    <Route path="kyc_details" element={<KycSection />} />
                  </Route>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/tools" element={<Navigate to="/tools/rate_card" replace />} />
                  <Route path="/tools/rate-card" element={<Navigate to="/tools/rate_card" replace />} />
                  <Route
                    path="/tools/rate-calculator"
                    element={<Navigate to="/tools/rate_calculator" replace />}
                  />
                  <Route path="/tools/rate_card" element={<RateCard />} />
                  <Route path="/tools/rate_calculator" element={<RateCalculator />} />
                  <Route path="/tools/order_tracking" element={<OrderTrackingForm />} />
                  <Route path="/support/tickets" element={<SupportTicketsPage />} />
                  <Route path="/support/tickets/:id" element={<TicketDetailsPage />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/couriers/partners" element={<Couriers />} />
                  <Route path="/cod-remittance" element={<CodRemittancesList />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/reconciliation/weight" element={<WeightReconciliation />} />
                  <Route path="/reconciliation/weight/:id" element={<DiscrepancyDetails />} />
                  <Route
                    path="/reconciliation/weight/settings"
                    element={<WeightReconciliationSettings />}
                  />
                  <Route path="/ops/ndr" element={<NdrList />} />
                  <Route path="/ops/rto" element={<RtoList />} />
                </Route>
              </>
            )}
            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  )
}

export default function AppRoutes() {
  return (
    <SyncBrowserRouter>
      <RoutedAppContent />
    </SyncBrowserRouter>
  )
}
