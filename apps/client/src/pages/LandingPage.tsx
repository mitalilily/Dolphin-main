import { Box, Button, Chip, Container, Grid, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi'
import { TbChartBar, TbCurrencyRupee, TbPlugConnected, TbTruckDelivery } from 'react-icons/tb'
import { Link as RouterLink } from 'react-router-dom'
import BrandSurface from '../components/brand/BrandSurface'
import PublicFooter from '../components/public/PublicFooter'
import PublicNavbar from '../components/public/PublicNavbar'
import { brand, brandGradients } from '../theme/brand'

const integrationBadges = [
  'Shopify',
  'WooCommerce',
  'Amazon',
  'Magento',
  'Delhivery',
  'DTDC',
  'Xpressbees',
  'Ekart',
]

const operationsCards = [
  {
    title: 'Order Management',
    text: 'Create shipments, print labels, and track fulfillment from one clean control center.',
  },
  {
    title: 'Next-Day Delivery',
    text: 'Compare couriers quickly and pick the best service lane for every shipment.',
  },
  {
    title: 'Order Verification',
    text: 'Use the existing auth and profile flows with clearer status, validation, and feedback.',
  },
  {
    title: 'Order Tracking',
    text: 'Monitor live movements, NDR actions, RTO updates, and delivery health in one place.',
  },
  {
    title: 'Channel Connection',
    text: 'Sync stores, marketplaces, and courier partners without switching tabs all day.',
  },
  {
    title: 'Courier Connection',
    text: 'Stay on top of billing, COD remittance, and wallet visibility with improved hierarchy.',
  },
]

const platformCards = [
  {
    title: 'Multi-channel order sync',
    text: 'Bring store and marketplace demand into the same seller workflow.',
  },
  {
    title: 'Courier recommendations',
    text: 'Use the existing platform data with clearer decision cards and trend context.',
  },
  {
    title: 'Seller page flows',
    text: 'Refined layouts, better spacing, and more reusable UI across the app shell.',
  },
  {
    title: 'Automated label processing',
    text: 'Surface the right operational actions without changing your business rules.',
  },
  {
    title: 'Unified dashboard',
    text: 'Landing, auth, and the protected workspace now share one visual system.',
  },
]

const intelligenceStats = [
  { label: 'Delivery performance', value: '92%', icon: <TbTruckDelivery size={18} /> },
  { label: 'Financial snapshots', value: '18%', icon: <TbCurrencyRupee size={18} /> },
  { label: 'Courier insights', value: '24/7', icon: <TbChartBar size={18} /> },
]

export default function LandingPage() {
  return (
    <Box className="site-shell">
      <PublicNavbar
        links={[
          { label: 'Home', to: '/' },
          { label: 'Platform', to: '#platform' },
          { label: 'Automation', to: '#automation' },
          { label: 'Insights', to: '#insights' },
          { label: 'Tracking', to: '/tracking' },
        ]}
      />

      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 }, pb: 8 }}>
        <Stack spacing={{ xs: 7, md: 9 }}>
          <Box
            component={motion.section}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Grid container spacing={{ xs: 3, lg: 5 }} alignItems="center">
              <Grid size={{ xs: 12, lg: 6 }}>
                <Box sx={{ maxWidth: 700 }}>
                  <Chip
                    label="Built for high-growth eCommerce teams"
                    sx={{
                      bgcolor: '#FFFFFF',
                      color: brand.ink,
                      border: `1px solid ${alpha(brand.sky, 0.9)}`,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontSize: '0.72rem',
                    }}
                  />
                  <Typography
                    sx={{
                      mt: 3,
                      color: brand.ink,
                      fontSize: { xs: '2.7rem', sm: '4.1rem', lg: '5.45rem' },
                      lineHeight: { xs: 1.02, lg: 0.96 },
                      fontWeight: 800,
                      letterSpacing: '-0.06em',
                    }}
                  >
                    <span style={{ display: 'block' }}>Smart Shipping</span>
                    <span style={{ display: 'block' }}>For Smarter Sellers</span>
                  </Typography>
                  <Typography
                    sx={{
                      mt: 3,
                      maxWidth: 620,
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      lineHeight: 1.85,
                      color: brand.inkSoft,
                    }}
                  >
                    Simplify your logistics with a branded seller platform that connects your store, streamlines deliveries, and keeps your dashboard workflows clean without touching backend logic.
                  </Typography>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
                    <Button
                      component={RouterLink}
                      to="/signup"
                      variant="contained"
                      endIcon={<FiArrowRight size={16} />}
                      sx={{
                        background: brandGradients.button,
                        color: brand.ink,
                        boxShadow: '0 18px 34px rgba(130,194,255,0.24)',
                        '&:hover': {
                          background: brandGradients.button,
                          transform: 'translateY(-1px)',
                          boxShadow: '0 22px 40px rgba(130,194,255,0.3)',
                        },
                      }}
                    >
                      Get Started
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/login"
                      variant="outlined"
                      sx={{
                        borderColor: alpha(brand.sky, 0.94),
                        color: brand.ink,
                        backgroundColor: alpha('#FFFFFF', 0.82),
                        '&:hover': {
                          borderColor: brand.sky,
                          backgroundColor: '#FFFFFF',
                        },
                      }}
                    >
                      Login
                    </Button>
                  </Stack>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <BrandSurface variant="hero" sx={{ p: { xs: 2.5, md: 3.4 } }}>
                  <Grid container spacing={2.2}>
                    <Grid size={{ xs: 12, md: 7 }}>
                      <BrandSurface
                        variant="glass"
                        sx={{
                          p: 2.1,
                          borderRadius: '28px',
                          minHeight: { xs: 260, sm: 320 },
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Box
                          component="img"
                          src="/images/website-illustration.png"
                          alt="Seller dashboard illustration"
                          sx={{
                            width: '100%',
                            maxWidth: 280,
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 20px 30px rgba(15, 44, 67, 0.12))',
                          }}
                        />
                      </BrandSurface>
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <Stack spacing={1.4}>
                        {[
                          { label: 'Orders synced', value: '1.2k', note: 'Across seller channels' },
                          { label: 'Delivery health', value: '92%', note: 'Based on recent operations' },
                          { label: 'Courier savings', value: '18%', note: 'Average route optimization' },
                        ].map((card) => (
                          <BrandSurface key={card.label} variant="soft" sx={{ p: 1.7, borderRadius: '24px' }}>
                            <Typography sx={{ color: brand.inkSoft, fontSize: '0.76rem', fontWeight: 700 }}>
                              {card.label}
                            </Typography>
                            <Typography sx={{ color: brand.ink, fontSize: '1.5rem', fontWeight: 800 }}>
                              {card.value}
                            </Typography>
                            <Typography sx={{ color: brand.inkSoft, fontSize: '0.82rem', lineHeight: 1.6 }}>
                              {card.note}
                            </Typography>
                          </BrandSurface>
                        ))}
                      </Stack>
                    </Grid>
                  </Grid>
                </BrandSurface>
              </Grid>
            </Grid>
          </Box>

          <Box id="platform">
            <Grid container spacing={{ xs: 2.5, md: 4 }} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography
                  sx={{
                    color: brand.ink,
                    fontSize: { xs: '2rem', md: '2.7rem' },
                    lineHeight: 1.02,
                    fontWeight: 800,
                    letterSpacing: '-0.05em',
                    maxWidth: 460,
                  }}
                >
                  Seamlessly integrate with 10+ ecommerce platforms
                </Typography>
                <Typography sx={{ mt: 2, color: brand.inkSoft, lineHeight: 1.85, maxWidth: 460 }}>
                  Connect stores, marketplaces, and courier partners from a single landing experience that now flows directly into signup, login, and the protected app.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <BrandSurface variant="glass" sx={{ p: { xs: 2.2, md: 3 }, borderRadius: '36px' }}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                      gap: 1.2,
                    }}
                  >
                    {integrationBadges.map((badge, index) => (
                      <BrandSurface
                        key={badge}
                        variant="soft"
                        sx={{
                          p: 1.2,
                          borderRadius: '22px',
                          textAlign: 'center',
                          transform: {
                            xs: 'none',
                            sm: index % 2 === 0 ? 'translateY(8px)' : 'translateY(-8px)',
                          },
                        }}
                      >
                        <Stack spacing={0.8} alignItems="center">
                          <Box
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: '14px',
                              display: 'grid',
                              placeItems: 'center',
                              background: alpha(brand.sky, 0.74),
                              color: brand.ink,
                            }}
                          >
                            <TbPlugConnected size={18} />
                          </Box>
                          <Typography sx={{ color: brand.ink, fontWeight: 700, fontSize: '0.88rem' }}>
                            {badge}
                          </Typography>
                        </Stack>
                      </BrandSurface>
                    ))}
                  </Box>
                </BrandSurface>
              </Grid>
            </Grid>
          </Box>

          <Box id="automation">
            <BrandSurface variant="card" sx={{ p: { xs: 2.5, md: 3.2 } }}>
              <Stack spacing={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    sx={{
                      color: brand.ink,
                      fontSize: { xs: '1.9rem', md: '2.45rem' },
                      fontWeight: 800,
                      letterSpacing: '-0.05em',
                    }}
                  >
                    Everything you need to streamline your shipping operations and grow your business
                  </Typography>
                  <Typography sx={{ mt: 1.4, color: brand.inkSoft, maxWidth: 760, mx: 'auto', lineHeight: 1.8 }}>
                    Every core app area now sits inside a more consistent spacing, card, and navigation system while the original logic, API contracts, and validations stay the same.
                  </Typography>
                </Box>

                <Grid container spacing={1.6}>
                  {operationsCards.map((card) => (
                    <Grid key={card.title} size={{ xs: 12, sm: 6, lg: 4 }}>
                      <BrandSurface variant="soft" sx={{ p: 2, height: '100%', borderRadius: '26px' }}>
                        <Typography sx={{ color: brand.ink, fontWeight: 700, mb: 0.75 }}>
                          {card.title}
                        </Typography>
                        <Typography sx={{ color: brand.inkSoft, lineHeight: 1.72, fontSize: '0.92rem' }}>
                          {card.text}
                        </Typography>
                      </BrandSurface>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </BrandSurface>
          </Box>

          <Box>
            <Grid container spacing={1.8}>
              <Grid size={{ xs: 12, lg: 4 }}>
                <BrandSurface
                  variant="hero"
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    height: '100%',
                  }}
                >
                  <Typography
                    sx={{
                      color: brand.ink,
                      fontSize: { xs: '1.9rem', md: '2.35rem' },
                      fontWeight: 800,
                      lineHeight: 1.02,
                      letterSpacing: '-0.05em',
                    }}
                  >
                    Everything you need to streamline your shipping operations in one powerful platform.
                  </Typography>
                  <Typography sx={{ mt: 1.8, color: brand.inkSoft, lineHeight: 1.8 }}>
                    Refactored routing connects the landing page, auth, and dashboard through one branded frontend flow.
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/signup"
                    variant="contained"
                    sx={{
                      mt: 2.4,
                      background: brandGradients.button,
                      color: brand.ink,
                    }}
                  >
                    Start shipping
                  </Button>
                </BrandSurface>
              </Grid>
              <Grid size={{ xs: 12, lg: 8 }}>
                <Grid container spacing={1.6}>
                  {platformCards.map((card) => (
                    <Grid key={card.title} size={{ xs: 12, sm: 6, xl: 4 }}>
                      <BrandSurface variant="soft" sx={{ p: 2, height: '100%', borderRadius: '26px' }}>
                        <Typography sx={{ color: brand.ink, fontWeight: 700, mb: 0.75 }}>
                          {card.title}
                        </Typography>
                        <Typography sx={{ color: brand.inkSoft, lineHeight: 1.72, fontSize: '0.92rem' }}>
                          {card.text}
                        </Typography>
                      </BrandSurface>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Box>

          <Box id="insights">
            <BrandSurface variant="card" sx={{ p: { xs: 2.5, md: 3.2 } }}>
              <Grid container spacing={{ xs: 2, md: 4 }} alignItems="center">
                <Grid size={{ xs: 12, lg: 5 }}>
                  <Typography
                    sx={{
                      color: brand.ink,
                      fontSize: { xs: '2rem', md: '2.7rem' },
                      lineHeight: 1.02,
                      fontWeight: 800,
                      letterSpacing: '-0.05em',
                    }}
                  >
                    Make data-driven decisions with real-time shipping intelligence.
                  </Typography>
                  <Stack spacing={1.2} sx={{ mt: 2.2 }}>
                    {[
                      'Delivery performance is easier to scan with refined hierarchy and cleaner cards.',
                      'Financial snapshots, wallet activity, and COD visibility stay in the same frontend workflow.',
                      'Courier and operations insights reuse the same theme tokens across landing and dashboard surfaces.',
                    ].map((item) => (
                      <Stack key={item} direction="row" spacing={1.1} alignItems="flex-start">
                        <FiCheckCircle size={16} color={brand.success} style={{ marginTop: 2 }} />
                        <Typography sx={{ color: brand.inkSoft, lineHeight: 1.72 }}>{item}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, lg: 7 }}>
                  <BrandSurface
                    variant="hero"
                    sx={{
                      p: { xs: 2.2, md: 3 },
                      background: `
                        radial-gradient(circle at 100% 0%, rgba(255,221,174,0.66), transparent 24%),
                        ${brandGradients.analytics}
                      `,
                    }}
                  >
                    <Grid container spacing={1.6}>
                      {intelligenceStats.map((stat) => (
                        <Grid key={stat.label} size={{ xs: 12, sm: 4 }}>
                          <BrandSurface variant="glass" sx={{ p: 1.5, borderRadius: '24px', height: '100%' }}>
                            <Stack spacing={0.8}>
                              <Box
                                sx={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: '14px',
                                  display: 'grid',
                                  placeItems: 'center',
                                  bgcolor: alpha(brand.sky, 0.74),
                                  color: brand.ink,
                                }}
                              >
                                {stat.icon}
                              </Box>
                              <Typography sx={{ color: brand.inkSoft, fontWeight: 700, fontSize: '0.8rem' }}>
                                {stat.label}
                              </Typography>
                              <Typography sx={{ color: brand.ink, fontSize: '1.45rem', fontWeight: 800 }}>
                                {stat.value}
                              </Typography>
                            </Stack>
                          </BrandSurface>
                        </Grid>
                      ))}
                    </Grid>

                    <BrandSurface variant="soft" sx={{ mt: 1.8, p: 2, borderRadius: '28px' }}>
                      <Typography sx={{ color: brand.ink, fontWeight: 700, mb: 1.5 }}>
                        Operational snapshot
                      </Typography>
                      <Stack direction="row" spacing={1.2} alignItems="end" sx={{ height: 180 }}>
                        {[62, 88, 74, 96, 82, 58, 90].map((height, index) => (
                          <Box
                            key={`${height}-${index}`}
                            sx={{
                              flex: 1,
                              height: `${height}%`,
                              borderRadius: '18px 18px 10px 10px',
                              background:
                                index % 2 === 0
                                  ? 'linear-gradient(180deg, #8FD8FF 0%, #4E90CA 100%)'
                                  : 'linear-gradient(180deg, #FFD8A8 0%, #F3D971 100%)',
                            }}
                          />
                        ))}
                      </Stack>
                    </BrandSurface>
                  </BrandSurface>
                </Grid>
              </Grid>
            </BrandSurface>
          </Box>
        </Stack>
      </Container>

      <PublicFooter />
    </Box>
  )
}
