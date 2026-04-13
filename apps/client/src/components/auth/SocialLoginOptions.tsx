import { Box, CircularProgress, Divider, IconButton, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type React from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'

const DE_BLUE = '#0052CC'

interface ISocialLoginOptions {
  onSelect: (method: 'phone' | 'whatsapp' | 'google' | 'shopify') => void
  googleLoading: boolean
}

export default function SocialLoginOptions({ onSelect, googleLoading }: ISocialLoginOptions) {
  const buttons: {
    aria: string
    method: 'phone' | 'whatsapp' | 'google' | 'shopify'
    icon: React.ReactElement
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sx: Record<string, any>
  }[] = [
    {
      aria: googleLoading ? 'Connecting to Google' : 'Continue with Google',
      icon: googleLoading ? (
        <CircularProgress size={20} sx={{ color: DE_BLUE }} />
      ) : (
        <FcGoogle size={20} />
      ),
      method: 'google',
      sx: {
        color: DE_BLUE,
        borderColor: alpha(DE_BLUE, 0.2),
        backgroundColor: '#ffffff',
        '&:hover': {
          borderColor: DE_BLUE,
          boxShadow: '0 8px 24px rgba(0, 82, 204, 0.12)',
          backgroundColor: alpha(DE_BLUE, 0.02),
        },
      },
    },
    {
      aria: 'Continue with WhatsApp',
      icon: <FaWhatsapp size={18} title="WhatsApp Login" />,
      method: 'whatsapp',
      sx: {
        color: '#25D366',
        borderColor: alpha('#25D366', 0.2),
        backgroundColor: alpha('#25D366', 0.04),
        '&:hover': {
          borderColor: '#25D366',
          backgroundColor: alpha('#25D366', 0.08),
          boxShadow: '0 8px 24px rgba(37, 211, 102, 0.12)',
        },
      },
    },
  ]

  return (
    <>
      <Divider sx={{ my: 1, width: '100%' }}>
        <Typography
          variant="subtitle2"
          color={alpha(DE_BLUE, 0.6)}
          sx={{ userSelect: 'none', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}
        >
          or
        </Typography>
      </Divider>

      <Box
        display="flex"
        flexDirection="row"
        gap={1.5}
        width="100%"
        justifyContent="center"
        mx="auto"
      >
        {buttons?.map(({ aria, method, icon, sx }) => (
          <Tooltip key={aria} title={aria}>
            <span>
              <IconButton
                aria-label={aria}
                onClick={() => onSelect(method)}
                disabled={method === 'google' && googleLoading}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '40%',
                  borderWidth: 1.6,
                  borderStyle: 'solid',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...sx,
                }}
              >
                {icon}
              </IconButton>
            </span>
          </Tooltip>
        ))}
      </Box>
    </>
  )
}
