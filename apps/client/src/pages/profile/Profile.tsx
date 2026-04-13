import { Box, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Suspense } from 'react'
import { FiCreditCard, FiFileText, FiShield, FiUser } from 'react-icons/fi'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import FullScreenLoader from '../../components/UI/loader/FullScreenLoader'

type TopSection = 'user_profile' | 'company' | 'bank_details' | 'kyc_details'

const DE_BLUE = '#0052CC'
const DE_AMBER = '#FFAB00'

const sectionTabs: Array<{ label: string; value: TopSection; icon: React.ReactNode }> = [
  { label: 'User', value: 'user_profile', icon: <FiUser size={15} /> },
  { label: 'Company', value: 'company', icon: <FiFileText size={15} /> },
  { label: 'Bank', value: 'bank_details', icon: <FiCreditCard size={15} /> },
  { label: 'KYC', value: 'kyc_details', icon: <FiShield size={15} /> },
]

function resolveActiveSection(pathname: string): TopSection {
  if (pathname.includes('/profile/company')) return 'company'
  if (pathname.includes('/profile/bank_details')) return 'bank_details'
  if (pathname.includes('/profile/kyc_details')) return 'kyc_details'
  return 'user_profile'
}

export default function ProfileLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const active = resolveActiveSection(location.pathname)

  return (
    <Stack spacing={2.2} sx={{ width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 1,
          border: `1px solid ${alpha(DE_BLUE, 0.14)}`,
          background: `
            radial-gradient(720px 220px at 0% 0%, ${alpha(DE_AMBER, 0.11)} 0%, transparent 70%),
            radial-gradient(620px 200px at 100% 0%, ${alpha(DE_BLUE, 0.12)} 0%, transparent 65%),
            #ffffff
          `,
        }}
      >
        <Stack spacing={1.5}>
          <Box>
            <Typography sx={{ fontSize: '0.75rem', letterSpacing: 2, fontWeight: 700, color: DE_AMBER }}>
              ACCOUNT CENTER
            </Typography>
            <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.6rem' }, fontWeight: 800, color: DE_BLUE }}>
              Profile & Verification
            </Typography>
            <Typography variant="body2" sx={{ color: '#5d769e', mt: 0.3 }}>
              Manage personal details, business identity, bank accounts, and KYC status.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.2 }}>
            {sectionTabs.map((tab) => {
              const isActive = tab.value === active
              return (
                <Box
                  key={tab.value}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/profile/${tab.value}`)}
                  onKeyUp={(e) => e.key === 'Enter' && navigate(`/profile/${tab.value}`)}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.8,
                    px: 1.4,
                    py: 0.8,
                    borderRadius: 1,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    border: `1px solid ${isActive ? alpha(DE_BLUE, 0.4) : alpha(DE_BLUE, 0.18)}`,
                    backgroundColor: isActive ? alpha(DE_BLUE, 0.08) : '#fff',
                    color: isActive ? DE_BLUE : '#5c759b',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    transition: 'all .2s ease',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </Box>
              )
            })}
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ width: '100%' }}>
        <Suspense fallback={<FullScreenLoader />}>
          <Outlet />
        </Suspense>
      </Box>
    </Stack>
  )
}
