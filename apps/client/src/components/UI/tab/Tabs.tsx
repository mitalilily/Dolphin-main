import {
  alpha,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Divider,
  Menu,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  styled,
  useMediaQuery,
  useTheme,
  type TabsProps,
} from '@mui/material'
import * as React from 'react'
import { FiMoreHorizontal } from 'react-icons/fi'

type StatusColor = 'primary' | 'success' | 'warning' | 'error' | undefined

export interface TabItem<T extends string = string> {
  label: string
  value: T
  icon?: React.ReactElement
  badgeCount?: number
  statusColor?: StatusColor
  to?: string
}

interface SmartTabsProps<T extends string = string> {
  tabs: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  muiTabsProps?: Omit<TabsProps, 'value' | 'onChange'>
}

const StyledTabs = styled(Tabs)(() => ({
  minHeight: 0,
  '& .MuiTabs-flexContainer': {
    gap: 10,
    flexWrap: 'wrap',
  },
  '& .MuiTabs-indicator': {
    display: 'none',
  },
}))

const StyledTab = styled(Tab)(({ theme }) => ({
  minHeight: 0,
  minWidth: 0,
  textTransform: 'none',
  borderRadius: 999,
  padding: '10px 18px',
  fontWeight: 700,
  fontSize: '0.92rem',
  color: theme.palette.text.secondary,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
  backgroundColor: alpha('#ffffff', 0.72),
  boxShadow: `0 10px 24px ${alpha(theme.palette.text.primary, 0.04)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.secondary.main, 0.12),
    color: theme.palette.text.primary,
  },
  '&.Mui-selected': {
    color: theme.palette.text.primary,
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.14)} 100%)`,
    borderColor: alpha(theme.palette.primary.main, 0.18),
    boxShadow: `0 16px 30px ${alpha(theme.palette.text.primary, 0.08)}`,
  },
}))

const CounterChip = styled('span')(({ theme }) => ({
  fontSize: '0.72rem',
  padding: '3px 8px',
  borderRadius: 999,
  background: alpha(theme.palette.primary.main, 0.08),
  color: theme.palette.primary.main,
  fontWeight: 800,
}))

export function SmartTabs<T extends string = string>({
  tabs,
  value,
  onChange,
  muiTabsProps,
}: SmartTabsProps<T>) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const open = Boolean(anchorEl)
  const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const visibleCount = isMobile ? 3 : 6
  const visibleTabs = tabs.slice(0, visibleCount)
  const overflowTabs = tabs.slice(visibleCount)
  const isOverflowSelected = overflowTabs.some((t) => t.value === value)
  const controlledValue = isOverflowSelected ? '__more__' : value

  const handleChange = (_: React.SyntheticEvent, val: unknown) => {
    if (val === '__more__') return
    onChange(val as T)
  }

  if (isMobile) {
    return (
      <Paper
        sx={{
          position: 'fixed',
          bottom: 14,
          left: 14,
          right: 14,
          zIndex: 999,
          borderRadius: 999,
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          background: alpha('#fff9f3', 0.92),
          boxShadow: `0 24px 48px ${alpha(theme.palette.text.primary, 0.16)}`,
          backdropFilter: 'blur(18px)',
        }}
        elevation={0}
      >
        <BottomNavigation
          showLabels
          value={controlledValue}
          onChange={handleChange}
          sx={{
            background: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              color: theme.palette.text.secondary,
              transition: 'all 0.2s ease',
            },
            '& .Mui-selected': {
              color: theme.palette.primary.main,
            },
          }}
        >
          {visibleTabs.map((t, index) => (
            <BottomNavigationAction
              key={`${t.label}-${index}`}
              label={
                <Box display="flex" alignItems="center" gap={0.5}>
                  {t.label}
                  {typeof t.badgeCount === 'number' && <CounterChip>{t.badgeCount}</CounterChip>}
                </Box>
              }
              value={t.value}
              icon={t.icon}
              sx={{
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.secondary.main, 0.12),
                  borderRadius: 999,
                },
              }}
            />
          ))}

          {overflowTabs.length > 0 && (
            <>
              <BottomNavigationAction
                label="More"
                value="__more__"
                icon={<FiMoreHorizontal />}
                onClick={handleOpen}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    borderRadius: 999,
                  },
                }}
              />
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                PaperProps={{
                  sx: {
                    mt: -1,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                    background: alpha('#fffaf4', 0.96),
                    boxShadow: `0 20px 42px ${alpha(theme.palette.text.primary, 0.12)}`,
                    minWidth: 200,
                  },
                }}
              >
                {overflowTabs.map((t) => (
                  <MenuItem
                    key={t.value}
                    selected={value === t.value}
                    onClick={() => {
                      onChange(t.value)
                      handleClose()
                    }}
                    sx={{ fontWeight: 700, gap: 1 }}
                  >
                    {t.label}
                    {typeof t.badgeCount === 'number' && <CounterChip>{t.badgeCount}</CounterChip>}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </BottomNavigation>
      </Paper>
    )
  }

  return (
    <Box>
      <Box
        sx={{
          p: 1,
          borderRadius: 999,
          display: 'inline-flex',
          alignItems: 'center',
          background: alpha('#fff9f3', 0.86),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          boxShadow: `0 18px 32px ${alpha(theme.palette.text.primary, 0.06)}`,
        }}
      >
        <StyledTabs value={controlledValue} onChange={handleChange} {...muiTabsProps}>
          {visibleTabs.map((tab) => {
            const labelContent = (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {tab.icon ? <Box sx={{ display: 'flex', alignItems: 'center' }}>{tab.icon}</Box> : null}
                {tab.label}
                {typeof tab.badgeCount === 'number' && <CounterChip>{tab.badgeCount}</CounterChip>}
              </Box>
            )
            return <StyledTab key={tab.value} value={tab.value} label={labelContent} disableRipple />
          })}

          {overflowTabs.length > 0 && (
            <>
              <StyledTab
                label={<FiMoreHorizontal />}
                value="__more__"
                onClick={handleOpen}
                disableRipple
                sx={
                  isOverflowSelected
                    ? {
                        color: theme.palette.text.primary,
                        background: alpha(theme.palette.primary.main, 0.12),
                      }
                    : undefined
                }
              />
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                    background: alpha('#fffaf4', 0.96),
                    boxShadow: `0 24px 48px ${alpha(theme.palette.text.primary, 0.12)}`,
                    minWidth: 220,
                  },
                }}
              >
                {overflowTabs.map((t) => (
                  <MenuItem
                    key={t.value}
                    selected={value === t.value}
                    onClick={() => {
                      onChange(t.value)
                      handleClose()
                    }}
                    sx={{ fontWeight: 700, gap: 1 }}
                  >
                    {t.label}
                    {typeof t.badgeCount === 'number' && <CounterChip>{t.badgeCount}</CounterChip>}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </StyledTabs>
      </Box>
      <Divider sx={{ mt: 1.4, borderColor: alpha(theme.palette.primary.main, 0.08) }} />
    </Box>
  )
}
