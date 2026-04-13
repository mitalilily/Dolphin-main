import { alpha, Box, Button, Chip, Grid, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { TbBolt, TbChartArcs3, TbMapPinBolt, TbRoute, TbSparkles, TbTruckDelivery } from 'react-icons/tb'
import Sidebar, { COLLAPSED_WIDTH } from '../../components/UI/Sidebar'
import { brand, brandFonts, brandGradients } from '../../theme/brand'
import { DRAWER_WIDTH } from '../../utils/constants'

const PLUM = brand.ink
const TEXT = brand.ink
const MUTED = brand.inkSoft
const IVORY = brand.page
const MINT = brand.success
const TYPEFACE = brandFonts.display

const metricCards = [
  { label: 'Shipments in motion', value: '1,284', note: 'Across B2C and B2B lanes', icon: <TbTruckDelivery size={18} /> },
  { label: 'Courier savings', value: '18.6%', note: 'Compared with last week', icon: <TbChartArcs3 size={18} /> },
  { label: 'Top destination', value: 'Delhi NCR', note: 'Highest volume zone today', icon: <TbMapPinBolt size={18} /> },
]

const focusCards = [
  {
    title: 'Shipment Control',
    text: 'Create labels, monitor movement, and keep every order lane visible from one desk.',
  },
  {
    title: 'Finance Desk',
    text: 'Track wallet activity, COD remittance, and invoice flows in the same workspace.',
  },
  {
    title: 'Help Center',
    text: 'Support tickets, public pages, and policy surfaces now follow the same Dolphin visual system.',
  },
]

export default function ClientPreview() {
  const [hovered, setHovered] = useState(false)
  const pinned = true
  const sidebarWidth = pinned ? DRAWER_WIDTH : COLLAPSED_WIDTH

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: IVORY,
        backgroundImage: brandGradients.page,
      }}
    >
      <Sidebar
        pinned={pinned}
        hovered={hovered}
        setHovered={setHovered}
        handleDrawerToggle={() => undefined}
      />

      <Box
        sx={{
          ml: { xs: 0, md: `${sidebarWidth}px` },
          minHeight: '100vh',
          px: { xs: 2, md: 3 },
          py: { xs: 2, md: 2.5 },
        }}
      >
        <Stack spacing={3}>
          <Box
            sx={{
              borderRadius: 4,
              border: `1px solid ${alpha(PLUM, 0.12)}`,
              bgcolor: alpha('#fffaf4', 0.92),
              backdropFilter: 'blur(20px)',
              boxShadow: `0 12px 30px ${alpha(TEXT, 0.07)}`,
              px: { xs: 2, md: 3 },
              py: { xs: 1.8, md: 2.2 },
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={{ xs: 2, md: 3 }}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              justifyContent="space-between"
            >
              <Stack spacing={1.1}>
                <Box
                  component="img"
                  src="/logo/dolphin-logo-transparent.png"
                  alt="Dolphin Enterprise"
                  sx={{ width: { xs: 165, md: 210 }, height: 'auto' }}
                />
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      bgcolor: alpha(MINT, 0.18),
                      color: '#2F8E77',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TbSparkles size={16} />
                  </Box>
                  <Typography
                    sx={{
                      color: MUTED,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.16em',
                    }}
                  >
                    Client preview mode
                  </Typography>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label="Dolphin theme"
                  icon={<TbBolt size={14} />}
                  sx={{
                    bgcolor: alpha(PLUM, 0.08),
                    color: PLUM,
                    fontWeight: 700,
                    borderRadius: 999,
                  }}
                />
                <Chip
                  label="No auth required"
                  sx={{
                    bgcolor: alpha(MINT, 0.14),
                    color: '#2F8E77',
                    fontWeight: 700,
                    borderRadius: 999,
                  }}
                />
              </Stack>
            </Stack>
          </Box>

          <Box
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              border: `1px solid ${alpha(PLUM, 0.14)}`,
              boxShadow: `0 18px 44px ${alpha(TEXT, 0.08)}`,
              background: `
                radial-gradient(420px 180px at 0% 0%, ${alpha(PLUM, 0.1)} 0%, transparent 72%),
                radial-gradient(340px 180px at 100% 0%, ${alpha(MINT, 0.12)} 0%, transparent 68%),
                linear-gradient(135deg, ${alpha('#FFFFFF', 0.96)} 0%, ${alpha('#F8EAF0', 0.96)} 58%, ${alpha('#ECF8F4', 0.98)} 100%)
              `,
              color: TEXT,
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -80,
                right: -80,
                width: 260,
                height: 260,
                borderRadius: '50%',
                background: alpha(PLUM, 0.05),
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -100,
                left: -60,
                width: 240,
                height: 240,
                borderRadius: '50%',
                background: alpha(MINT, 0.08),
              }}
            />

            <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1, p: { xs: 3, md: 5 } }}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <Stack spacing={2.2}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {['Shipping platform for ecommerce sellers', 'Shipment control', 'Finance visibility'].map((chip) => (
                      <Box
                        key={chip}
                        sx={{
                          px: 1.5,
                          py: 0.72,
                          borderRadius: 1.5,
                          border: `1px solid ${alpha(PLUM, 0.12)}`,
                          bgcolor: alpha('#ffffff', 0.58),
                        }}
                      >
                        <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: MUTED }}>{chip}</Typography>
                      </Box>
                    ))}
                  </Stack>

                  <Typography
                    sx={{
                      fontFamily: TYPEFACE,
                      fontSize: { xs: '1.95rem', md: '3.1rem' },
                      fontWeight: 700,
                      lineHeight: 0.99,
                      letterSpacing: '-0.025em',
                    }}
                  >
                    Ship smarter.
                    <Box component="span" sx={{ display: 'block', color: PLUM }}>
                      Save more on every order.
                    </Box>
                  </Typography>

                  <Typography sx={{ maxWidth: 620, color: MUTED, lineHeight: 1.65 }}>
                    This preview skips sign-in so you can review the client UI shell, Dolphin color
                    system, logo treatment, sidebar labels, and the overall layout direction first.
                  </Typography>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button
                      variant="contained"
                      sx={{
                        bgcolor: PLUM,
                        color: '#fffdf9',
                        fontWeight: 700,
                        borderRadius: 1.5,
                        px: 3,
                        '&:hover': { bgcolor: '#6f1736' },
                      }}
                    >
                      Review Client Shell
                    </Button>
                    <Button
                      variant="outlined"
                      sx={{
                        borderColor: alpha(PLUM, 0.2),
                        color: TEXT,
                        borderRadius: 1.5,
                        px: 3,
                        fontWeight: 700,
                        backgroundColor: alpha('#ffffff', 0.52),
                      }}
                    >
                      Compare Theme
                    </Button>
                  </Stack>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, lg: 5 }}>
                <Stack spacing={1.5}>
                  {metricCards.map((card) => (
                    <Box
                      key={card.label}
                      sx={{
                        borderRadius: 3,
                        border: `1px solid ${alpha(PLUM, 0.12)}`,
                        bgcolor: alpha('#ffffff', 0.62),
                        backdropFilter: 'blur(8px)',
                        px: 2,
                        py: 1.6,
                      }}
                    >
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 2,
                            bgcolor: alpha(PLUM, 0.08),
                            color: PLUM,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {card.icon}
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: MUTED }}>
                            {card.label}
                          </Typography>
                          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.1, color: TEXT }}>
                            {card.value}
                          </Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: MUTED }}>
                            {card.note}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Box>

          <Grid container spacing={2.2}>
            {focusCards.map((card) => (
              <Grid key={card.title} size={{ xs: 12, md: 4 }}>
                <Box
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    border: `1px solid ${alpha(PLUM, 0.12)}`,
                    bgcolor: alpha('#ffffff', 0.8),
                    boxShadow: `0 10px 24px ${alpha(TEXT, 0.05)}`,
                    px: 2.2,
                    py: 1.95,
                  }}
                >
                  <Stack spacing={1.1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 2,
                          bgcolor: alpha(PLUM, 0.08),
                          color: PLUM,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        >
                          <TbRoute size={17} />
                        </Box>
                      <Typography sx={{ fontFamily: TYPEFACE, fontWeight: 700, color: TEXT }}>{card.title}</Typography>
                    </Stack>
                    <Typography sx={{ color: MUTED, lineHeight: 1.7 }}>{card.text}</Typography>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Box>
    </Box>
  )
}
