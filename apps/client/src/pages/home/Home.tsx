import { alpha, Box, Button, Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TbArrowRight,
  TbChecklist,
  TbCreditCard,
  TbMapPins,
  TbPackageExport,
  TbReceiptRupee,
  TbRoute,
  TbShieldCheck,
  TbTruckDelivery,
} from 'react-icons/tb'
import AccountSetup from '../../components/home/AccountSetup'
import CourierDistribution from '../../components/home/CourierDistribution'
import GettingStarted from '../../components/home/GettingStarted'
import TopDestinations from '../../components/home/TopDestinations'
import UpcomingPickupsHome from '../../components/home/UpcomingPickupsHome'
import SectionHeading from '../../components/UI/SectionHeading'
import { useAuth } from '../../context/auth/AuthContext'
import { useRealtimeHomeDashboard } from '../../hooks/home/useRealtimeHomeDashboard'
import { useMerchantReadiness } from '../../hooks/useMerchantReadiness'
import { brand, brandGradients } from '../../theme/brand'

const INK = brand.ink
const CLAY = brand.warning
const TEAL = brand.success
const TEXT_SECONDARY = brand.inkSoft

const shellCard = {
  borderRadius: '30px',
  border: `1px solid ${alpha(INK, 0.08)}`,
  background: brandGradients.surface,
  boxShadow: `0 18px 38px ${alpha(INK, 0.06)}`,
}

export default function Home() {
  const navigate = useNavigate()
  const { walletBalance, user } = useAuth()
  const { progress, completedCount, totalCount, isReady } = useMerchantReadiness()
  const { incomingPickupsState, courierDistributionState, topDestinationsState } =
    useRealtimeHomeDashboard()

  const displayName = user?.companyInfo?.contactPerson || user?.name || 'Operator'
  const firstName = displayName.split(' ')[0]
  const businessName =
    user?.companyInfo?.businessName || user?.companyInfo?.brandName || 'your shipping desk'
  const kycVerified = user?.domesticKyc?.status === 'verified'

  const scheduledPickups = incomingPickupsState.data?.length ?? 0
  const activeCouriers = courierDistributionState.data?.length ?? 0
  const topLaneOrders = topDestinationsState.data?.reduce((sum, item) => sum + item.count, 0) ?? 0

  const heroMetrics = useMemo(
    () => [
      {
        label: 'Upcoming pickups',
        value: String(scheduledPickups),
        tone: CLAY,
        icon: <TbTruckDelivery size={18} />,
      },
      {
        label: 'Courier partners in rotation',
        value: String(activeCouriers),
        tone: INK,
        icon: <TbRoute size={18} />,
      },
      {
        label: 'Top-lane order volume',
        value: String(topLaneOrders),
        tone: TEAL,
        icon: <TbMapPins size={18} />,
      },
      {
        label: 'Setup readiness',
        value: `${progress}%`,
        tone: isReady ? TEAL : INK,
        icon: <TbChecklist size={18} />,
      },
    ],
    [activeCouriers, isReady, progress, scheduledPickups, topLaneOrders],
  )

  const quickActions = [
    {
      title: 'Create shipment',
      note: 'Book single or bulk orders and push them into dispatch.',
      path: '/orders/create',
      icon: <TbPackageExport size={19} />,
      tone: INK,
    },
    {
      title: 'Rate compare',
      note: 'Check courier charges before you commit a lane.',
      path: '/tools/rate_calculator',
      icon: <TbReceiptRupee size={19} />,
      tone: CLAY,
    },
    {
      title: 'Track AWB',
      note: 'Jump straight into tracking for stuck or urgent shipments.',
      path: '/tools/order_tracking',
      icon: <TbTruckDelivery size={19} />,
      tone: TEAL,
    },
    {
      title: 'Recharge wallet',
      note: 'Add balance so bookings and pickup flows don’t stall.',
      path: '/billing/wallet_transactions',
      icon: <TbCreditCard size={19} />,
      tone: brand.sky,
    },
  ]

  const statusPills = [
    `${completedCount}/${totalCount} setup checks complete`,
    kycVerified ? 'KYC verified' : 'KYC pending',
    `Wallet INR ${(walletBalance ?? 0).toLocaleString('en-IN')}`,
  ]

  return (
    <Stack spacing={{ xs: 3, md: 4 }} sx={{ pb: 5 }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box
          sx={{
            ...shellCard,
            p: { xs: 2.2, md: 3.2 },
            background: `
              radial-gradient(circle at 12% 18%, ${alpha(CLAY, 0.18)} 0%, transparent 28%),
              radial-gradient(circle at 88% 14%, ${alpha(TEAL, 0.14)} 0%, transparent 22%),
              ${brandGradients.hero}
            `,
            overflow: 'hidden',
          }}
        >
          <Stack spacing={2.6}>
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              alignItems={{ xs: 'flex-start', lg: 'center' }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: alpha(INK, 0.55),
                    mb: 1,
                  }}
                >
                  Dolphin shipping workspace
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: '2rem', md: '3.15rem' },
                    lineHeight: 0.98,
                    fontWeight: 800,
                    letterSpacing: '-0.05em',
                    color: INK,
                    maxWidth: 820,
                  }}
                >
                  Run pickups, courier allocation, rate checks, and shipping readiness from one home base.
                </Typography>
                <Typography
                  sx={{
                    mt: 1.3,
                    maxWidth: 720,
                    color: TEXT_SECONDARY,
                    fontSize: '1rem',
                    lineHeight: 1.7,
                  }}
                >
                  {firstName}, this workspace is tuned for day-to-day shipping operations at{' '}
                  <strong style={{ color: INK }}>{businessName}</strong>. Start with bookings, keep the
                  wallet active, watch pickup movement, and check which courier lanes are carrying the load.
                </Typography>
              </Box>

              <Stack
                spacing={1.1}
                sx={{
                  minWidth: { lg: 280 },
                  width: { xs: '100%', lg: 'auto' },
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<TbArrowRight size={18} />}
                  onClick={() => navigate('/orders/create')}
                  sx={{
                    background: brandGradients.button,
                    color: brand.ink,
                    borderRadius: 999,
                    fontWeight: 800,
                    px: 3,
                    '&:hover': { background: brandGradients.button },
                  }}
                >
                  Create shipment
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/orders/list')}
                  sx={{
                    borderRadius: 999,
                    borderColor: alpha(INK, 0.18),
                    color: INK,
                    bgcolor: alpha('#fff', 0.72),
                    fontWeight: 800,
                    '&:hover': {
                      borderColor: INK,
                      bgcolor: '#fff',
                    },
                  }}
                >
                  Open operations queue
                </Button>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {statusPills.map((pill) => (
                <Box
                  key={pill}
                  sx={{
                    px: 1.4,
                    py: 0.9,
                    borderRadius: 999,
                    bgcolor: alpha('#fff', 0.8),
                    border: `1px solid ${alpha(INK, 0.08)}`,
                    color: INK,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                  }}
                >
                  {pill}
                </Box>
              ))}
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
                gap: 1.4,
              }}
            >
              {heroMetrics.map((metric) => (
                <Box
                  key={metric.label}
                  sx={{
                    p: 2,
                    borderRadius: 3.5,
                    bgcolor: alpha('#fff', 0.86),
                    border: `1px solid ${alpha(INK, 0.08)}`,
                    boxShadow: `0 12px 22px ${alpha(INK, 0.04)}`,
                  }}
                >
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2.5,
                        bgcolor: alpha(metric.tone, 0.12),
                        color: metric.tone,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {metric.icon}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: '1.28rem', fontWeight: 900, color: INK }}>
                        {metric.value}
                      </Typography>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: TEXT_SECONDARY }}>
                        {metric.label}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Box>
          </Stack>
        </Box>
      </motion.div>

      <Box>
        <SectionHeading
          title="Operational Shortcuts"
          subtitle="Fast entry points for the shipping actions teams use all day."
          icon={<TbTruckDelivery size={22} />}
          color={CLAY}
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {quickActions.map((action) => (
            <Box
              key={action.title}
              onClick={() => navigate(action.path)}
              sx={{
                ...shellCard,
                p: 2.3,
                cursor: 'pointer',
                transition: 'all 0.24s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 24px 40px ${alpha(INK, 0.08)}`,
                  borderColor: alpha(action.tone, 0.28),
                },
              }}
            >
              <Stack spacing={1.4}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 3,
                    bgcolor: alpha(action.tone, 0.12),
                    color: action.tone,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {action.icon}
                </Box>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: INK }}>
                  {action.title}
                </Typography>
                <Typography sx={{ color: TEXT_SECONDARY, fontSize: '0.9rem', lineHeight: 1.65 }}>
                  {action.note}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Box>
      </Box>

      <Box>
        <SectionHeading
          title="Readiness And Funding"
          subtitle="Keep account setup, KYC, and wallet state visible before booking volume ramps up."
          icon={<TbShieldCheck size={22} />}
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: '1.02fr 0.98fr' },
            gap: 2.2,
          }}
        >
          <Box sx={{ ...shellCard, p: { xs: 2, md: 2.5 } }}>
            <GettingStarted />
          </Box>
          <Box sx={{ ...shellCard, p: { xs: 2, md: 2.5 } }}>
            <AccountSetup />
          </Box>
        </Box>
      </Box>

      <Box>
        <SectionHeading
          title="Network And Lane Intelligence"
          subtitle="See which zones are shipping most and which courier partners are carrying the mix."
          icon={<TbMapPins size={22} />}
          color={CLAY}
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: '1.2fr 0.8fr' },
            gap: 2.2,
          }}
        >
          <Box sx={{ ...shellCard, p: { xs: 2, md: 2.5 } }}>
            <TopDestinations
              data={topDestinationsState.data}
              isLoading={topDestinationsState.isLoading}
              error={topDestinationsState.error}
            />
          </Box>
          <Box sx={{ ...shellCard, p: { xs: 2, md: 2.5 } }}>
            <CourierDistribution
              data={courierDistributionState.data}
              isLoading={courierDistributionState.isLoading}
              error={courierDistributionState.error}
            />
          </Box>
        </Box>
      </Box>

      <Box>
        <SectionHeading
          title="Pickup Queue"
          subtitle="Track the live pickup pipeline so dispatch doesn’t fall behind."
          icon={<TbTruckDelivery size={22} />}
          color={TEAL}
        />
        <Box sx={{ ...shellCard, p: { xs: 2, md: 2.5 } }}>
          <UpcomingPickupsHome
            data={incomingPickupsState.data}
            isLoading={incomingPickupsState.isLoading}
            error={incomingPickupsState.error}
          />
        </Box>
      </Box>
    </Stack>
  )
}
