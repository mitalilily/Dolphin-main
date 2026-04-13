import {
  alpha,
  Box,
  ButtonBase,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import type { ReactNode } from 'react'
import { FaBuilding, FaFileInvoice, FaTruck, FaUsers } from 'react-icons/fa'
import { FaLink } from 'react-icons/fa6'
import { IoDocumentTextOutline } from 'react-icons/io5'
import {
  MdOutlineRequestQuote,
  MdPriorityHigh,
  MdSecurity,
  MdTune,
} from 'react-icons/md'
import { PiPassword } from 'react-icons/pi'
import { RiBankFill } from 'react-icons/ri'
import { TbArrowRight, TbChecklist, TbPlugConnected, TbShieldCog } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import CustomSelectSearchable from '../../components/UI/inputs/CustomSelectSearchable'

type SettingItem = {
  title: string
  description: string
  key: string
  icon: ReactNode
}

type Section = {
  title: string
  badge: string
  summary: string
  tone: string
  icon: ReactNode
  items: SettingItem[]
}

const INK = '#171310'
const CLAY = '#D97943'
const TEAL = '#2D7A63'
const TEXT_MUTED = '#74685D'
const SURFACE = '#FFFDF8'

const sections: Section[] = [
  {
    title: 'Account Control',
    badge: 'Identity',
    summary: 'Business profile, access credentials, KYC, payout accounts, and team permissions.',
    tone: INK,
    icon: <TbShieldCog size={20} />,
    items: [
      {
        title: 'Company Details',
        description: 'Manage business profile and brand identity',
        key: '/profile/company',
        icon: <FaBuilding />,
      },
      {
        title: 'Change Password',
        description: 'Update your login credentials securely',
        key: '/profile/user_profile/settings/password',
        icon: <PiPassword />,
      },
      {
        title: 'KYC Details',
        description: 'Review verification status and submitted documents',
        key: '/profile/kyc_details',
        icon: <MdSecurity />,
      },
      {
        title: 'Bank Accounts',
        description: 'Manage payout and settlement bank accounts',
        key: '/profile/bank_details',
        icon: <RiBankFill />,
      },
      {
        title: 'Manage Users',
        description: 'Create team access and control user permissions',
        key: '/settings/users_management',
        icon: <FaUsers />,
      },
    ],
  },
  {
    title: 'Shipping Operations',
    badge: 'Execution',
    summary: 'Pickup network, billing logic, invoice output, and shipping label configuration.',
    tone: CLAY,
    icon: <TbChecklist size={20} />,
    items: [
      {
        title: 'Pickup Addresses',
        description: 'Add and manage all pickup locations',
        key: '/settings/manage_pickups',
        icon: <FaTruck />,
      },
      {
        title: 'Invoice Preferences',
        description: 'Configure invoice branding and output preferences',
        key: '/settings/invoice_preferences',
        icon: <FaFileInvoice />,
      },
      {
        title: 'Billing Preferences',
        description: 'Set billing cycles and automation preferences',
        key: '/settings/billing_preferences',
        icon: <MdOutlineRequestQuote />,
      },
      {
        title: 'Label Settings',
        description: 'Customize label fields with live preview',
        key: '/settings/label_config',
        icon: <IoDocumentTextOutline />,
      },
    ],
  },
  {
    title: 'Integrations And Routing',
    badge: 'Connectivity',
    summary: 'Sales channels, courier priority rules, API keys, and webhook connectivity.',
    tone: TEAL,
    icon: <TbPlugConnected size={20} />,
    items: [
      {
        title: 'Connected Channels',
        description: 'View, manage, and update linked sales channels',
        key: '/channels/connected',
        icon: <FaLink />,
      },
      {
        title: 'Courier Priority',
        description: 'Set courier preference rules by speed or cost',
        key: '/settings/courier_priority',
        icon: <MdPriorityHigh />,
      },
      {
        title: 'API Integration',
        description: 'Manage API keys, webhooks, and external access',
        key: '/settings/api-integration',
        icon: <FaLink />,
      },
    ],
  },
]

const heroStats = [
  {
    label: 'Settings domains',
    value: String(sections.length),
    tone: INK,
  },
  {
    label: 'Config modules',
    value: String(sections.reduce((sum, section) => sum + section.items.length, 0)),
    tone: CLAY,
  },
  {
    label: 'Ops focus',
    value: 'Account + Shipping + Integrations',
    tone: TEAL,
  },
]

const SettingCard = ({ item, tone }: { item: SettingItem; tone: string }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <ButtonBase sx={{ width: '100%', height: '100%', borderRadius: 4 }}>
      <Box
        sx={{
          p: isMobile ? 2 : 2.25,
          borderRadius: 4,
          bgcolor: alpha('#ffffff', 0.94),
          border: `1px solid ${alpha(INK, 0.08)}`,
          boxShadow: `0 14px 28px ${alpha(INK, 0.05)}`,
          height: '100%',
          width: '100%',
          minHeight: isMobile ? 146 : 162,
          transition: 'all .22s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          textAlign: 'left',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 22px 38px ${alpha(INK, 0.08)}`,
            borderColor: alpha(tone, 0.32),
          },
        }}
      >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1.5}>
          <Box
            sx={{
              borderRadius: 3,
              width: isMobile ? 40 : 44,
              height: isMobile ? 40 : 44,
              display: 'grid',
              placeItems: 'center',
              fontSize: isMobile ? 18 : 19,
              color: tone,
              bgcolor: alpha(tone, 0.12),
              border: `1px solid ${alpha(tone, 0.18)}`,
              flexShrink: 0,
            }}
          >
            {item.icon}
          </Box>

          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 999,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(tone, 0.08),
              color: tone,
              flexShrink: 0,
            }}
          >
            <TbArrowRight size={15} />
          </Box>
        </Stack>

        <Box>
          <Typography fontWeight={800} fontSize={isMobile ? '14px' : '15px'} color={INK} mb={0.7}>
            {item.title}
          </Typography>

          <Typography
            variant="body2"
            color={TEXT_MUTED}
            fontSize={isMobile ? '13px' : '13.5px'}
            lineHeight={1.55}
          >
            {item.description}
          </Typography>
        </Box>
      </Box>
    </ButtonBase>
  )
}

export default function SettingsPage() {
  const theme = useTheme()
  const navigate = useNavigate()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const flattenedItems = sections.flatMap((section) =>
    section.items.map((item) => ({
      key: item.key,
      label: item.title,
      description: item.description,
      icon: item.icon,
      section: section.title,
    })),
  )

  return (
    <Box sx={{ minHeight: '100%', py: { xs: 2.2, md: 3 } }}>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box
            sx={{
              p: { xs: 2.3, md: 3.1 },
              borderRadius: 5,
              border: `1px solid ${alpha(INK, 0.08)}`,
              background: `
                radial-gradient(circle at 14% 18%, ${alpha(CLAY, 0.16)} 0%, transparent 24%),
                radial-gradient(circle at 82% 14%, ${alpha(TEAL, 0.1)} 0%, transparent 20%),
                linear-gradient(135deg, #fffdf8 0%, #f7efe5 100%)
              `,
              boxShadow: `0 22px 44px ${alpha(INK, 0.08)}`,
            }}
          >
            <Stack spacing={2.4}>
              <Stack
                direction={{ xs: 'column', lg: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', lg: 'center' }}
                gap={2}
              >
                <Box sx={{ maxWidth: 760 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1.1}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 3,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha(INK, 0.08),
                        color: INK,
                      }}
                    >
                      <MdTune size={20} />
                    </Box>
                    <Chip
                      label="Control Center"
                      sx={{
                        bgcolor: alpha(INK, 0.08),
                        color: INK,
                        border: `1px solid ${alpha(INK, 0.1)}`,
                        fontWeight: 800,
                      }}
                    />
                  </Stack>

                  <Typography
                    sx={{
                      fontSize: { xs: '2rem', md: '3rem' },
                      lineHeight: 0.98,
                      fontWeight: 800,
                      letterSpacing: '-0.05em',
                      color: INK,
                    }}
                  >
                    Settings built like an operations workspace, not a flat menu.
                  </Typography>

                  <Typography
                    sx={{
                      mt: 1.2,
                      fontSize: '1rem',
                      color: TEXT_MUTED,
                      lineHeight: 1.7,
                      maxWidth: 680,
                    }}
                  >
                    Manage account controls, shipping configuration, payout logic, and integrations from
                    a single professional admin surface.
                  </Typography>
                </Box>

                <Box sx={{ width: { xs: '100%', lg: 360 } }}>
                  <CustomSelectSearchable
                    label="Jump To Setting"
                    items={flattenedItems}
                    onSelect={(key) => navigate(key)}
                    placeholder="Search settings..."
                  />
                </Box>
              </Stack>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                  gap: 1.4,
                }}
              >
                {heroStats.map((stat) => (
                  <Box
                    key={stat.label}
                    sx={{
                      p: 2,
                      borderRadius: 4,
                      bgcolor: alpha('#ffffff', 0.86),
                      border: `1px solid ${alpha(INK, 0.08)}`,
                      boxShadow: `0 10px 22px ${alpha(INK, 0.04)}`,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: alpha(INK, 0.46),
                        mb: 0.7,
                      }}
                    >
                      {stat.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: { xs: '1.1rem', md: '1.28rem' },
                        fontWeight: 900,
                        color: stat.tone,
                        lineHeight: 1.2,
                      }}
                    >
                      {stat.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Stack>
          </Box>

          <Stack spacing={2.5}>
            {sections.map((section) => (
              <Box
                key={section.title}
                sx={{
                  p: { xs: 1.7, md: 2.2 },
                  borderRadius: 5,
                  bgcolor: alpha(SURFACE, 0.98),
                  border: `1px solid ${alpha(INK, 0.08)}`,
                  boxShadow: `0 16px 30px ${alpha(INK, 0.05)}`,
                }}
              >
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  gap={1.5}
                  mb={2.1}
                >
                  <Stack direction="row" spacing={1.4} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 3,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha(section.tone, 0.12),
                        color: section.tone,
                        border: `1px solid ${alpha(section.tone, 0.16)}`,
                        flexShrink: 0,
                      }}
                    >
                      {section.icon}
                    </Box>

                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={800} color={INK}>
                          {section.title}
                        </Typography>
                        <Chip
                          label={section.badge}
                          sx={{
                            bgcolor: alpha(section.tone, 0.1),
                            color: section.tone,
                            border: `1px solid ${alpha(section.tone, 0.18)}`,
                            fontWeight: 800,
                            fontSize: '11px',
                            height: 26,
                          }}
                        />
                      </Stack>

                      <Typography sx={{ mt: 0.6, color: TEXT_MUTED, fontSize: '0.92rem', lineHeight: 1.6 }}>
                        {section.summary}
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography sx={{ fontSize: '0.84rem', color: alpha(INK, 0.56), fontWeight: 700 }}>
                    {section.items.length} modules
                  </Typography>
                </Stack>

                <Grid container spacing={2}>
                  {section.items.map((item) => (
                    <Grid
                      onClick={() => navigate(item.key)}
                      size={{ xs: 12, md: 6, xl: 4 }}
                      key={item.title}
                    >
                      <SettingCard item={item} tone={section.tone} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
