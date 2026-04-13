import { Box, Chip, Container, Grid, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { FiCheckCircle, FiShield } from 'react-icons/fi'
import { TbChartBar, TbRouteSquare, TbTruckDelivery } from 'react-icons/tb'
import BrandSurface from '../brand/BrandSurface'
import PublicNavbar from '../public/PublicNavbar'
import PublicFooter from '../public/PublicFooter'
import { brand, brandGradients } from '../../theme/brand'

interface AuthShellProps {
  eyebrow: string
  title: string
  subtitle: string
  helperTitle: string
  helperText: string
  variant?: 'default' | 'compact'
  showChrome?: boolean
  children: React.ReactNode
}

const authHighlights = [
  {
    title: 'Smart shipping workspace',
    text: 'Orders, couriers, tracking, billing, and support in one clean seller panel.',
    icon: <TbTruckDelivery size={18} />,
  },
  {
    title: 'Live verification preview',
    text: 'Inline OTP and verification codes are surfaced on-screen for local and console-driven auth flows.',
    icon: <FiShield size={18} />,
  },
  {
    title: 'Actionable insights',
    text: 'The app shell mirrors the landing page look while preserving the current auth and dashboard logic.',
    icon: <TbChartBar size={18} />,
  },
]

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  helperTitle,
  helperText,
  variant = 'default',
  showChrome = true,
  children,
}: AuthShellProps) {
  if (variant === 'compact') {
    return (
      <Box sx={{ minHeight: '100vh' }}>
        {showChrome && (
          <PublicNavbar
            links={[
              { label: 'Home', to: '/' },
              { label: 'Tracking', to: '/tracking' },
            ]}
          />
        )}

        <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, pb: 6 }}>
          <BrandSurface
            variant="card"
            sx={{
              p: { xs: 2.4, md: 3.2 },
              mt: showChrome ? { xs: 2.5, md: 3 } : { xs: 3, md: 5 },
            }}
          >
            <Stack spacing={2.4}>
              <Stack spacing={1.1}>
                <Typography
                  sx={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: brand.inkSoft,
                  }}
                >
                  {eyebrow}
                </Typography>
                <Typography
                  sx={{
                    color: brand.ink,
                    fontSize: { xs: '2rem', sm: '2.6rem' },
                    fontWeight: 800,
                    lineHeight: 1.05,
                    letterSpacing: '-0.05em',
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  sx={{
                    color: brand.inkSoft,
                    fontSize: { xs: '0.95rem', md: '1rem' },
                    lineHeight: 1.75,
                  }}
                >
                  {subtitle}
                </Typography>
              </Stack>

              <BrandSurface
                variant="soft"
                sx={{
                  p: 1.8,
                  borderRadius: '24px',
                  border: `1px solid ${alpha(brand.sky, 0.34)}`,
                }}
              >
                <Stack spacing={0.6}>
                  <Typography sx={{ fontWeight: 700, color: brand.ink }}>
                    {helperTitle}
                  </Typography>
                  <Typography sx={{ color: brand.inkSoft, fontSize: '0.9rem', lineHeight: 1.65 }}>
                    {helperText}
                  </Typography>
                </Stack>
              </BrandSurface>

              <Box>{children}</Box>
            </Stack>
          </BrandSurface>
        </Container>

        {showChrome && <PublicFooter />}
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {showChrome && (
        <PublicNavbar
          links={[
            { label: 'Home', to: '/' },
            { label: 'Tracking', to: '/tracking' },
          ]}
        />
      )}

      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 }, pb: 4 }}>
        <BrandSurface variant="glass" sx={{ p: { xs: 2, md: 3 }, overflow: 'hidden' }}>
          <Grid container spacing={{ xs: 2, md: 3 }}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <BrandSurface
                variant="hero"
                sx={{
                  height: '100%',
                  p: { xs: 2.5, md: 4 },
                  background: `
                    radial-gradient(circle at 15% 12%, rgba(255,255,255,0.76), transparent 24%),
                    radial-gradient(circle at 90% 0%, rgba(255,221,174,0.68), transparent 28%),
                    ${brandGradients.hero}
                  `,
                }}
              >
                <Stack spacing={3.2} sx={{ position: 'relative', zIndex: 1 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {['Built for ecommerce teams', 'Secure account access', 'Dolphin dashboard'].map((pill) => (
                      <Chip
                        key={pill}
                        label={pill}
                        sx={{
                          bgcolor: alpha('#FFFFFF', 0.66),
                          color: brand.ink,
                          border: `1px solid ${alpha('#FFFFFF', 0.6)}`,
                          fontWeight: 700,
                        }}
                      />
                    ))}
                  </Stack>

                  <Stack spacing={1.5}>
                    <Typography
                      sx={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: brand.inkSoft,
                      }}
                    >
                      {eyebrow}
                    </Typography>
                    <Typography
                      sx={{
                        color: brand.ink,
                        fontSize: { xs: '2.35rem', sm: '3.1rem', lg: '4.45rem' },
                        fontWeight: 800,
                        lineHeight: { xs: 1.02, lg: 0.96 },
                        letterSpacing: '-0.05em',
                        maxWidth: 740,
                      }}
                    >
                      {title}
                    </Typography>
                    <Typography
                      sx={{
                        color: brand.inkSoft,
                        fontSize: { xs: '0.98rem', md: '1.05rem' },
                        lineHeight: 1.75,
                        maxWidth: 640,
                      }}
                    >
                      {subtitle}
                    </Typography>
                  </Stack>

                  <Grid container spacing={1.6}>
                    {authHighlights.map((item) => (
                      <Grid key={item.title} size={{ xs: 12, sm: 4 }}>
                        <BrandSurface variant="soft" sx={{ height: '100%', p: 2.1, borderRadius: '28px' }}>
                          <Stack spacing={1.2}>
                            <Box
                              sx={{
                                width: 42,
                                height: 42,
                                borderRadius: '16px',
                                display: 'grid',
                                placeItems: 'center',
                                bgcolor: alpha(brand.sky, 0.76),
                                color: brand.ink,
                              }}
                            >
                              {item.icon}
                            </Box>
                            <Typography sx={{ fontWeight: 700, color: brand.ink, lineHeight: 1.2 }}>
                              {item.title}
                            </Typography>
                            <Typography sx={{ color: brand.inkSoft, fontSize: '0.88rem', lineHeight: 1.68 }}>
                              {item.text}
                            </Typography>
                          </Stack>
                        </BrandSurface>
                      </Grid>
                    ))}
                  </Grid>

                  <BrandSurface variant="glass" sx={{ p: 2.1, borderRadius: '28px' }}>
                    <Stack direction="row" spacing={1.2} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: '16px',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: alpha(brand.warning, 0.16),
                          color: brand.ink,
                          flexShrink: 0,
                        }}
                      >
                        <TbRouteSquare size={18} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: brand.ink, mb: 0.5 }}>
                          {helperTitle}
                        </Typography>
                        <Typography sx={{ color: brand.inkSoft, lineHeight: 1.72, fontSize: '0.92rem' }}>
                          {helperText}
                        </Typography>
                        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 1.25 }}>
                          <FiCheckCircle size={14} color={brand.success} />
                          <Typography sx={{ color: brand.ink, fontSize: '0.82rem', fontWeight: 600 }}>
                            Existing token storage and auth guards remain unchanged
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </BrandSurface>
                </Stack>
              </BrandSurface>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <BrandSurface
                variant="card"
                sx={{
                  height: '100%',
                  p: { xs: 2.4, md: 3 },
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ width: '100%' }}>{children}</Box>
              </BrandSurface>
            </Grid>
          </Grid>
        </BrandSurface>
      </Container>

      {showChrome && <PublicFooter />}
    </Box>
  )
}
