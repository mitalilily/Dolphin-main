import { Box, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { BiLock, BiUserCircle } from 'react-icons/bi'
import { useLocation, useNavigate } from 'react-router-dom'
import PasswordSettingsForm from './profile/PasswordSettings'
import UserProfileForm from './profile/UserProfileForm'

const DE_BLUE = '#0052CC'
const DE_AMBER = '#FFAB00'

const tabs = [
  {
    id: 'profile',
    label: 'Account Details',
    icon: <BiUserCircle size={18} />,
    description: 'Edit user profile and contact information',
  },
  {
    id: 'password',
    label: 'Password & Security',
    icon: <BiLock size={18} />,
    description: 'Update login password and access security',
  },
] as const

export default function UserProfileSettings() {
  const location = useLocation()
  const navigate = useNavigate()

  const isPasswordTab = location.pathname.includes('/profile/password')
  const currentTab = isPasswordTab ? 'password' : 'profile'

  return (
    <Stack spacing={2.2} width="100%">
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.4, md: 1.8 },
          borderRadius: 1,
          border: `1px solid ${alpha(DE_BLUE, 0.13)}`,
          backgroundColor: '#fff',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.1}>
          {tabs.map((tab) => {
            const active = currentTab === tab.id
            return (
              <Box
                key={tab.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(tab.id === 'password' ? '/profile/password' : '/profile/user_profile')}
                onKeyUp={(e) => {
                  if (e.key === 'Enter') {
                    navigate(tab.id === 'password' ? '/profile/password' : '/profile/user_profile')
                  }
                }}
                sx={{
                  flex: 1,
                  borderRadius: 1,
                  p: 1.25,
                  border: `1px solid ${active ? alpha(DE_BLUE, 0.35) : alpha(DE_BLUE, 0.14)}`,
                  backgroundColor: active ? alpha(DE_BLUE, 0.08) : '#fff',
                  cursor: 'pointer',
                  transition: 'all .2s ease',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ color: active ? DE_BLUE : '#5f769d', display: 'flex', alignItems: 'center' }}>
                    {tab.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 800, color: active ? DE_BLUE : '#2f4e77', fontSize: '0.92rem' }}>
                    {tab.label}
                  </Typography>
                </Stack>
                <Typography sx={{ color: '#6b82a8', fontSize: '0.8rem', mt: 0.4 }}>
                  {tab.description}
                </Typography>
              </Box>
            )
          })}
        </Stack>

        <Typography variant="caption" sx={{ mt: 1.1, display: 'block', color: DE_AMBER, fontWeight: 700 }}>
          Keep your profile and credentials updated for uninterrupted account operations.
        </Typography>
      </Paper>

      {currentTab === 'password' ? <PasswordSettingsForm /> : <UserProfileForm />}
    </Stack>
  )
}
