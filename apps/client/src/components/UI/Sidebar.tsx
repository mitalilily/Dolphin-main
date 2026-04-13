import {
  alpha,
  Box,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { BiInfoCircle, BiListPlus } from 'react-icons/bi'
import { CgTrack } from 'react-icons/cg'
import { FaBalanceScaleLeft } from 'react-icons/fa'
import { FaClipboardList as FaFileAlt, FaMoneyBill, FaToolbox } from 'react-icons/fa6'
import { HiDocumentReport } from 'react-icons/hi'
import {
  MdAccountBalanceWallet,
  MdApps,
  MdDashboard,
  MdExpandMore,
  MdHelp,
  MdHome,
  MdKeyboardReturn,
  MdLocalShipping,
  MdOutlineAddBusiness,
  MdOutlineRateReview,
  MdShoppingCart,
  MdSyncProblem,
} from 'react-icons/md'
import { RiSettings2Fill } from 'react-icons/ri'
import { TbInvoice, TbReportAnalytics, TbTransactionRupee } from 'react-icons/tb'
import { NavLink, useLocation } from 'react-router-dom'

import type { JSX } from '@emotion/react/jsx-runtime'
import BrandLogo from '../brand/BrandLogo'
import { brand, brandGradients } from '../../theme/brand'
import { DRAWER_WIDTH } from '../../utils/constants'
import { isActive } from '../../utils/functions'

export type Role = 'customer' | 'admin'

export interface SubItem {
  text: string
  path: string
  icon?: JSX.Element
}

export interface NavItem {
  text: string
  icon: JSX.Element
  path: string
  roles: Role[]
  children?: SubItem[]
}

interface SidebarProps {
  role?: Role
  pinned: boolean
  handleDrawerToggle: () => void
  setHovered: Dispatch<SetStateAction<boolean>>
  hovered: boolean
}

export const COLLAPSED_WIDTH = 80

const STANDARD_ICON_SIZE = 19
const navItems: NavItem[] = [
  {
    text: 'Dashboard',
    icon: <MdDashboard size={STANDARD_ICON_SIZE} />,
    path: '/dashboard',
    roles: ['customer', 'admin'],
  },
  {
    text: 'Home',
    icon: <MdHome size={STANDARD_ICON_SIZE} />,
    path: '/home',
    roles: ['customer', 'admin'],
  },
  {
    text: 'Channels',
    icon: <MdApps size={STANDARD_ICON_SIZE} />,
    path: '/channels',
    roles: ['customer', 'admin'],
    children: [
      {
        text: 'Connected Channels',
        path: '/channels/connected',
        icon: <MdApps size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'Channel Integrations',
        path: '/channels/channel_list',
        icon: <MdOutlineAddBusiness size={STANDARD_ICON_SIZE} />,
      },
    ],
  },
  {
    text: 'Orders',
    icon: <MdShoppingCart size={STANDARD_ICON_SIZE} />,
    path: '/orders',
    roles: ['customer', 'admin'],
    children: [
      { text: 'All Orders', path: '/orders/list', icon: <FaFileAlt size={STANDARD_ICON_SIZE} /> },
      {
        text: 'Create Order',
        path: '/orders/create',
        icon: <BiListPlus size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'B2C Orders',
        path: '/orders/b2c/list',
        icon: <MdOutlineAddBusiness size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'B2B Orders',
        path: '/orders/b2b/list',
        icon: <MdOutlineAddBusiness size={STANDARD_ICON_SIZE} />,
      },
    ],
  },
  {
    text: 'Couriers',
    icon: <MdLocalShipping size={STANDARD_ICON_SIZE} />,
    path: '/couriers/partners',
    roles: ['customer', 'admin'],
  },
  {
    text: 'NDR',
    icon: <MdSyncProblem size={STANDARD_ICON_SIZE} />,
    path: '/ops/ndr',
    roles: ['customer', 'admin'],
  },
  {
    text: 'RTO',
    icon: <MdKeyboardReturn size={STANDARD_ICON_SIZE} />,
    path: '/ops/rto',
    roles: ['customer', 'admin'],
  },
  {
    text: 'Billing',
    icon: <FaMoneyBill size={STANDARD_ICON_SIZE} />,
    path: '/billing',
    roles: ['customer', 'admin'],
    children: [
      {
        text: 'Wallet Transactions',
        path: '/billing/wallet_transactions',
        icon: <TbTransactionRupee size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'Billing Invoices',
        path: '/billing/invoice_management',
        icon: <TbInvoice size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'COD Remittance',
        path: '/cod-remittance',
        icon: <MdAccountBalanceWallet size={STANDARD_ICON_SIZE} />,
      },
    ],
  },
  {
    text: 'Weight Discrepancy',
    icon: <FaBalanceScaleLeft size={STANDARD_ICON_SIZE} />,
    path: '/reconciliation',
    roles: ['customer', 'admin'],
    children: [
      {
        text: 'All Discrepancies',
        path: '/reconciliation/weight',
        icon: <FaBalanceScaleLeft size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'Discrepancy Settings',
        path: '/reconciliation/weight/settings',
        icon: <RiSettings2Fill size={STANDARD_ICON_SIZE} />,
      },
    ],
  },
  {
    text: 'Tools',
    icon: <FaToolbox size={STANDARD_ICON_SIZE} />,
    path: '/tools',
    roles: ['customer', 'admin'],
    children: [
      {
        text: 'Rate Card',
        path: '/tools/rate_card',
        icon: <MdOutlineRateReview size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'Rate Calculator',
        path: '/tools/rate_calculator',
        icon: <TbReportAnalytics size={STANDARD_ICON_SIZE} />,
      },
      {
        text: 'Order Tracking',
        path: '/tools/order_tracking',
        icon: <CgTrack size={STANDARD_ICON_SIZE} />,
      },
    ],
  },
  {
    text: 'Reports',
    icon: <HiDocumentReport size={STANDARD_ICON_SIZE} />,
    path: '/reports',
    roles: ['customer', 'admin'],
  },
  {
    text: 'Settings',
    icon: <RiSettings2Fill size={STANDARD_ICON_SIZE} />,
    path: '/settings',
    roles: ['customer', 'admin'],
  },
  {
    text: 'Support',
    icon: <MdHelp size={STANDARD_ICON_SIZE} />,
    path: '/support',
    roles: ['customer', 'admin'],
    children: [
      { text: 'Tickets', path: '/support/tickets', icon: <BiListPlus size={STANDARD_ICON_SIZE} /> },
      {
        text: 'About Us',
        path: '/support/about_us',
        icon: <BiInfoCircle size={STANDARD_ICON_SIZE} />,
      },
    ],
  },
]

export default function Sidebar({ role = 'customer', pinned, hovered, setHovered }: SidebarProps) {
  const location = useLocation()
  const theme = useTheme()
  const isSidebarExpanded = pinned || hovered

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!isSidebarExpanded) setExpandedItems({})
  }, [isSidebarExpanded])

  const toggleExpand = (key: string) => {
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const activeItemSx = {
    background: brandGradients.button,
    color: brand.ink,
    '& .MuiListItemIcon-root': { color: brand.ink },
    '& .MuiListItemText-primary': { fontWeight: 800 },
    boxShadow: '0 16px 28px rgba(130,194,255,0.22)',
  }

  const navItemSx = {
    mx: 0,
    my: 0.35,
    borderRadius: 999,
    py: 0.95,
    px: 1.6,
    color: brand.inkSoft,
    border: '1px solid transparent',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      bgcolor: alpha('#FFFFFF', 0.72),
      color: brand.ink,
      borderColor: alpha(brand.ink, 0.06),
      '& .MuiListItemIcon-root': { color: brand.ink },
    },
  }

  const renderNavList = (items: NavItem[]) => (
    <List disablePadding>
      {items.map((item) => {
        const isSelected = isActive(location.pathname, item.path)
        const hasChildren = Boolean(item.children?.length)
        const isExpanded = expandedItems[item.text]
        const childSelected = Boolean(
          item.children?.some((sub) => isActive(location.pathname, sub.path)),
        )
        const showExpanded = isSidebarExpanded && isExpanded

        const listItem = (
          <ListItemButton
            component={hasChildren ? 'div' : NavLink}
            to={hasChildren ? undefined : item.path}
            onClick={hasChildren ? () => toggleExpand(item.text) : undefined}
            sx={{
              ...navItemSx,
              justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
              px: isSidebarExpanded ? 1.4 : 0.95,
              ...(isSelected && !hasChildren ? activeItemSx : {}),
              ...(hasChildren && childSelected
                ? {
                    bgcolor: alpha('#FFFFFF', 0.72),
                    color: brand.ink,
                    '& .MuiListItemIcon-root': { color: brand.ink },
                  }
                : {}),
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: isSidebarExpanded ? 36 : 0,
                justifyContent: 'center',
                color: isSelected || childSelected ? brand.ink : 'inherit',
                transition: 'color 0.2s',
              }}
            >
              {item.icon}
            </ListItemIcon>
            {isSidebarExpanded ? (
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.85rem',
                  fontWeight: isSelected || childSelected ? 800 : 600,
                  letterSpacing: '-0.01em',
                }}
              />
            ) : null}
            {hasChildren && isSidebarExpanded ? (
              <MdExpandMore
                style={{
                  transform: showExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s',
                  color: showExpanded ? brand.ink : 'inherit',
                }}
              />
            ) : null}
          </ListItemButton>
        )

        return (
          <Box key={item.text}>
            {isSidebarExpanded ? (
              listItem
            ) : (
              <Tooltip title={item.text} placement="right">
                <Box>{listItem}</Box>
              </Tooltip>
            )}

            {hasChildren && isSidebarExpanded && (
              <Collapse in={showExpanded} timeout="auto" unmountOnExit>
                <List disablePadding sx={{ ml: 3.9, mt: 0.5, mb: 0.85 }}>
                  {item.children?.map((sub) => {
                    const subActive = isActive(location.pathname, sub.path)
                    return (
                      <ListItemButton
                        key={sub.text}
                        component={NavLink}
                        to={sub.path}
                        sx={{
                          py: 0.65,
                          px: 1.3,
                          borderRadius: 999,
                          color: subActive ? brand.ink : alpha(brand.ink, 0.72),
                          bgcolor: subActive ? alpha(brand.sky, 0.46) : 'transparent',
                          '&:hover': {
                            bgcolor: alpha('#FFFFFF', 0.72),
                            color: brand.ink,
                          },
                          mb: 0.4,
                        }}
                      >
                        <ListItemText
                          primary={sub.text}
                          primaryTypographyProps={{
                            fontSize: '0.8rem',
                            fontWeight: subActive ? 800 : 500,
                          }}
                        />
                      </ListItemButton>
                    )
                  })}
                </List>
              </Collapse>
            )}
          </Box>
        )
      })}
    </List>
  )

  return (
    <Box
      sx={{
        width: isSidebarExpanded ? DRAWER_WIDTH : COLLAPSED_WIDTH,
        height: '100vh',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(248,251,255,0.96) 100%)',
        borderRight: `1px solid ${alpha(brand.ink, 0.08)}`,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: theme.zIndex.drawer,
        position: 'fixed',
        left: 0,
        top: 0,
        overflowX: 'hidden',
        boxShadow: '16px 0 40px rgba(15,44,67,0.08)',
        backdropFilter: 'blur(18px)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Box sx={{ p: 1.25, mb: 0.85 }}>
        <Box
          sx={{
            p: isSidebarExpanded ? 1.7 : 1,
            borderRadius: '30px',
            background: brandGradients.hero,
            color: brand.ink,
            minHeight: isSidebarExpanded ? 118 : 58,
            display: 'flex',
            alignItems: isSidebarExpanded ? 'stretch' : 'center',
            justifyContent: 'center',
            flexDirection: isSidebarExpanded ? 'column' : 'row',
            border: `1px solid ${alpha('#FFFFFF', 0.6)}`,
          }}
        >
          <BrandLogo
            compact={!isSidebarExpanded}
            sx={{
              width: isSidebarExpanded ? 160 : 38,
              alignSelf: isSidebarExpanded ? 'flex-start' : 'center',
            }}
          />
          {isSidebarExpanded && (
            <Box sx={{ mt: 1.1 }}>
              <Typography
                sx={{
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: alpha(brand.inkSoft, 0.92),
                  mb: 0.55,
                }}
              >
                Seller panel
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '0.96rem', lineHeight: 1.1 }}>
                Dolphin workspace
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: isSidebarExpanded ? 1 : 0.8 }}>
        <Box
          sx={{
            p: isSidebarExpanded ? 0.7 : 0.2,
            borderRadius: '30px',
            bgcolor: alpha('#FFFFFF', 0.52),
            border: `1px solid ${alpha(brand.ink, 0.05)}`,
          }}
        >
          {renderNavList(navItems.filter((item) => item.roles.includes(role || 'customer')))}
        </Box>
      </Box>

      <Box
        sx={{
          p: 1.1,
          borderTop: `1px solid ${alpha(brand.ink, 0.08)}`,
          bgcolor: alpha('#FFFFFF', 0.72),
        }}
      >
        <ListItemButton
          component={NavLink}
          to="/settings"
          sx={{
            ...navItemSx,
            justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
            px: isSidebarExpanded ? 1.4 : 0.95,
            ...(isActive(location.pathname, '/settings') ? activeItemSx : {}),
          }}
        >
          <ListItemIcon sx={{ minWidth: isSidebarExpanded ? 36 : 0, justifyContent: 'center' }}>
            <RiSettings2Fill size={STANDARD_ICON_SIZE} />
          </ListItemIcon>
          {isSidebarExpanded ? (
            <ListItemText
              primary="Settings"
              primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
            />
          ) : null}
        </ListItemButton>
      </Box>
    </Box>
  )
}
