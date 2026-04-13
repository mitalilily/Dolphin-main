import {
  alpha,
  Avatar,
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { BsKeyboardFill } from 'react-icons/bs'
import { FaGavel } from 'react-icons/fa6'
import { MdAccountCircle, MdLogout, MdSettings } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'
import { usePresignedDownloadUrls } from '../../hooks/Uploads/usePresignedDownloadUrls'
import { brand } from '../../theme/brand'

const INK = brand.ink
const TEXT = brand.ink
const TEXT_SECONDARY = brand.inkSoft
const ACCENT = brand.warning
const SKY = '#4E90CA'
const TEAL = brand.success
const CRIMSON = brand.danger

const getInitials = (fullName?: string) => {
  if (!fullName) return 'U'
  const parts = fullName.trim().split(/\s+/)
  const firstInitial = parts[0]?.[0] ?? ''
  const lastInitial = parts.length > 1 ? parts.at(-1)?.[0] ?? '' : ''
  return `${firstInitial}${lastInitial}`.toUpperCase()
}

const UserMenu = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const { data: avatarUrl } = usePresignedDownloadUrls({
    keys: user?.companyInfo?.profilePicture,
    enabled: !!user?.companyInfo?.profilePicture,
  })

  const handleClose = () => setAnchorEl(null)

  const menuItems = [
    {
      key: 'profile',
      label: 'Profile',
      icon: MdAccountCircle,
      color: INK,
      onClick: () => {
        navigate('/profile/user_profile/settings/user')
        handleClose()
      },
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: MdSettings,
      color: ACCENT,
      onClick: () => {
        navigate('/settings')
        handleClose()
      },
    },
    {
      key: 'keyboard-shortcuts',
      label: 'Keyboard Shortcuts',
      icon: BsKeyboardFill,
      color: SKY,
      onClick: () => {
        navigate('/help/shortcuts')
        handleClose()
      },
    },
    {
      key: 'terms-conditions',
      label: 'Legal & Policies',
      icon: FaGavel,
      color: TEAL,
      onClick: () => {
        navigate('/policies/refund_cancellation')
        handleClose()
      },
    },
    { key: 'divider' },
    {
      key: 'logout',
      label: 'Logout',
      icon: MdLogout,
      color: CRIMSON,
      onClick: () => {
        logout()
        handleClose()
      },
    },
  ]

  return (
    <Box>
      <IconButton
        onClick={(event) => setAnchorEl(event.currentTarget)}
        size="small"
        sx={{
          p: 0.45,
          borderRadius: 2,
          border: `1px solid ${alpha(INK, 0.08)}`,
          bgcolor: alpha('#FFFFFF', 0.84),
          boxShadow: `0 8px 18px ${alpha(INK, 0.05)}`,
          '&:hover': {
            bgcolor: alpha(INK, 0.04),
          },
        }}
      >
        <Avatar
          src={avatarUrl?.[0] ?? ''}
          sx={{
            width: 32,
            height: 32,
            bgcolor: INK,
            fontSize: '0.82rem',
            fontWeight: 900,
            borderRadius: 2,
          }}
        >
          {getInitials(user?.companyInfo?.contactPerson || user?.name)}
        </Avatar>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 1.15,
            width: 280,
            borderRadius: 2,
            border: `1px solid ${alpha(INK, 0.08)}`,
            boxShadow: `0 18px 36px ${alpha(INK, 0.12)}`,
            overflow: 'hidden',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
          },
        }}
      >
        <Box
          sx={{
            p: 1.4,
            borderBottom: `1px solid ${alpha(INK, 0.06)}`,
            bgcolor: alpha(INK, 0.02),
          }}
        >
          <Typography sx={{ fontSize: '0.92rem', fontWeight: 900, color: TEXT }} noWrap>
            {user?.companyInfo?.contactPerson || user?.name || 'Dolphin User'}
          </Typography>
          <Typography sx={{ mt: 0.3, fontSize: '0.76rem', fontWeight: 600, color: TEXT_SECONDARY }} noWrap>
            {user?.companyInfo?.contactEmail || user?.email}
          </Typography>
        </Box>

        <List sx={{ p: 1 }}>
          {menuItems.map((item, index) => {
            if (item.key === 'divider') return <Divider key={index} sx={{ my: 0.8, opacity: 0.6 }} />

            const Icon = item.icon!
            return (
              <ListItemButton
                key={item.key}
                onClick={item.onClick}
                sx={{
                  borderRadius: 2,
                  py: 0.95,
                  px: 1.1,
                  '&:hover': {
                    bgcolor: alpha(item.color ?? INK, 0.08),
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: item.color ?? INK }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(item.color ?? INK, 0.1),
                    }}
                  >
                    <Icon size={17} />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    color: TEXT,
                  }}
                />
              </ListItemButton>
            )
          })}
        </List>
      </Popover>
    </Box>
  )
}

export default UserMenu
