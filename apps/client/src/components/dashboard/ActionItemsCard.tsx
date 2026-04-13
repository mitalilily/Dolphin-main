import { alpha, Box, Card, CardContent, Stack, Typography } from '@mui/material'
import { MdKeyboardReturn, MdNotificationsActive } from 'react-icons/md'
import { TbAlertTriangle, TbInvoice } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'

interface ActionItemsCardProps {
  actions: {
    ndrCount: number
    rtoCount: number
    pendingInvoices: number
    pendingInvoiceAmount: number
  }
  formatCurrency: (amount: number) => string
}

const DE_BLUE = '#0052CC'
const DE_AMBER = '#FFAB00'

export default function ActionItemsCard({ actions, formatCurrency }: ActionItemsCardProps) {
  const navigate = useNavigate()

  if (actions.ndrCount === 0 && actions.rtoCount === 0 && actions.pendingInvoices === 0) return null

  const items = [
    actions.ndrCount > 0
      ? {
          title: `${actions.ndrCount} NDR Pending`,
          subtitle: 'Review failed attempts',
          icon: <TbAlertTriangle size={18} />,
          color: '#DE350B',
          bg: alpha('#DE350B', 0.06),
          path: '/ops/ndr',
        }
      : null,
    actions.rtoCount > 0
      ? {
          title: `${actions.rtoCount} RTO Cases`,
          subtitle: 'Manage return flow',
          icon: <MdKeyboardReturn size={18} />,
          color: DE_AMBER,
          bg: alpha(DE_AMBER, 0.08),
          path: '/ops/rto',
        }
      : null,
    actions.pendingInvoices > 0
      ? {
          title: `${actions.pendingInvoices} Invoices`,
          subtitle: `Due: ${formatCurrency(actions.pendingInvoiceAmount || 0)}`,
          icon: <TbInvoice size={18} />,
          color: DE_BLUE,
          bg: alpha(DE_BLUE, 0.06),
          path: '/billing/invoice_management',
        }
      : null,
  ].filter(Boolean) as Array<{
    title: string
    subtitle: string
    icon: React.ReactNode
    color: string
    bg: string
    path: string
  }>

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 1,
        border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
        boxShadow: `0 8px 20px ${alpha(DE_BLUE, 0.05)}`,
      }}
    >
      <CardContent sx={{ p: 2.2 }}>
        <Stack direction="row" spacing={1.2} alignItems="center" mb={2.2}>
          <Box
            sx={{
              p: 0.9,
              borderRadius: 1,
              bgcolor: alpha(DE_BLUE, 0.08),
              color: DE_BLUE,
              display: 'flex',
            }}
          >
            <MdNotificationsActive size={20} />
          </Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: '#172B4D', letterSpacing: -0.2 }}>
            Action Required
          </Typography>
        </Stack>

        <Stack spacing={1.5}>
          {items.map((item) => (
            <Box
              key={item.title}
              onClick={() => navigate(item.path)}
              sx={{
                p: 1.4,
                borderRadius: 1,
                border: `1px solid ${alpha(item.color, 0.2)}`,
                bgcolor: item.bg,
                cursor: 'pointer',
                transition: 'all .2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  borderColor: item.color,
                },
              }}
            >
              <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', color: '#172B4D', fontWeight: 800 }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#42526E', fontWeight: 500, mt: 0.2 }}>
                    {item.subtitle}
                  </Typography>
                </Box>
                <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
