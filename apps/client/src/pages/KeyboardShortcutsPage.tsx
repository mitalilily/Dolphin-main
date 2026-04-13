import { alpha, Box, Container, Grid, Paper, Stack, styled, Typography } from '@mui/material'
import { FiDollarSign, FiGrid, FiPackage, FiSearch, FiSettings, FiTool } from 'react-icons/fi'
import PageHeading from '../components/UI/heading/PageHeading'
import { brand, brandGradients } from '../theme/brand'

const INK = brand.ink
const SKY = '#4E90CA'
const MUTED = brand.inkSoft

const Kbd = styled(Box)(({ theme }) => ({
  fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
  padding: '6px 12px',
  borderRadius: '16px',
  border: `1px solid ${alpha(INK, 0.12)}`,
  borderBottom: `3px solid ${alpha(SKY, 0.32)}`,
  background: '#FFFFFF',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
  fontSize: '0.85rem',
  fontWeight: 800,
  color: INK,
  boxShadow: '0 6px 16px rgba(15, 44, 67, 0.08)',
  transition: 'all 0.1s ease',
  cursor: 'default',
  userSelect: 'none',
  minWidth: '32px',
  textAlign: 'center',
  '&:hover': {
    transform: 'translateY(1px)',
    borderBottomWidth: '2px',
  },
}))

interface Shortcut {
  keys: string[]
  label: string
}

interface Category {
  title: string
  icon: React.ReactNode
  shortcuts: Shortcut[]
}

const categories: Category[] = [
  {
    title: 'Navigation',
    icon: <FiGrid size={24} color={INK} />,
    shortcuts: [
      { label: 'Dashboard', keys: ['Ctrl/Cmd', 'Shift', 'D'] },
      { label: 'Home', keys: ['Ctrl/Cmd', 'Shift', 'H'] },
    ],
  },
  {
    title: 'Shipments',
    icon: <FiPackage size={24} color={INK} />,
    shortcuts: [
      { label: 'New Order', keys: ['Ctrl/Cmd', 'Shift', 'N'] },
      { label: 'All Orders', keys: ['Ctrl/Cmd', 'Shift', 'O'] },
    ],
  },
  {
    title: 'Search',
    icon: <FiSearch size={24} color={INK} />,
    shortcuts: [{ label: 'Global Search', keys: ['/'] }],
  },
  {
    title: 'Finance',
    icon: <FiDollarSign size={24} color={INK} />,
    shortcuts: [{ label: 'Wallet', keys: ['Ctrl/Cmd', 'Shift', 'W'] }],
  },
  {
    title: 'Settings',
    icon: <FiSettings size={24} color={INK} />,
    shortcuts: [{ label: 'Account Settings', keys: ['Ctrl/Cmd', 'Shift', 'S'] }],
  },
  {
    title: 'Tools',
    icon: <FiTool size={24} color={INK} />,
    shortcuts: [{ label: 'Rate Calculator', keys: ['Ctrl/Cmd', 'Shift', 'R'] }],
  },
]

export default function KeyboardShortcutsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeading
        eyebrow="Workspace Tools"
        title="Keyboard Shortcuts"
        subtitle="Speed up the Dolphin workspace with quick navigation and booking shortcuts."
      />

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {categories.map((category) => (
          <Grid size={{ xs: 12, md: 6 }} key={category.title}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                borderRadius: '28px',
                border: `1px solid ${alpha('#FFFFFF', 0.72)}`,
                background: brandGradients.surface,
                boxShadow: '0 18px 38px rgba(15, 44, 67, 0.08)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 22px 44px rgba(15, 44, 67, 0.1)',
                  borderColor: alpha(SKY, 0.32),
                },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '18px',
                    bgcolor: alpha(SKY, 0.16),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {category.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: INK }}>
                  {category.title}
                </Typography>
              </Stack>

              <Stack spacing={2}>
                {category.shortcuts.map((shortcut) => (
                  <Stack
                    key={shortcut.label}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      py: 1.2,
                      px: 2,
                      borderRadius: '20px',
                      bgcolor: alpha('#FFFFFF', 0.86),
                      border: `1px solid ${alpha(INK, 0.08)}`,
                      transition: 'all 0.1s ease',
                      '&:hover': {
                        borderColor: alpha(SKY, 0.28),
                        bgcolor: alpha('#FFFFFF', 0.96),
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, color: MUTED }}>
                      {shortcut.label}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {shortcut.keys.map((key) => (
                        <Kbd key={key}>{key}</Kbd>
                      ))}
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}
