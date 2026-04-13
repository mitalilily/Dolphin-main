import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  alpha,
} from '@mui/material'
import React from 'react'
import { FiX } from 'react-icons/fi'

const INK = '#171310'
const CLAY = '#C96A3C'
const TEXT = '#241A1B'
const SURFACE = '#FFFDFC'
const SURFACE_ALT = '#F7F1EC'

interface CustomDialogProps {
  open: boolean
  onClose: () => void
  title?: string | React.ReactElement
  children: React.ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  borderRadius?: number
  footer?: React.ReactNode
  width?: string
  fullScreen?: boolean
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 'sm',
  borderRadius = 24,
  footer,
  fullScreen,
  width,
}) => {
  return (
    <Dialog
      open={open}
      fullScreen={fullScreen}
      onClose={onClose}
      fullWidth
      maxWidth={width ? false : maxWidth}
      BackdropProps={{
        sx: {
          backgroundColor: alpha('#1A1411', 0.52),
          backdropFilter: 'blur(8px)',
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : `${borderRadius}px`,
          p: 0,
          background: `
            linear-gradient(180deg, ${alpha('#FFFFFF', 0.92)} 0%, ${SURFACE} 100%),
            radial-gradient(560px 220px at 100% 0%, ${alpha(CLAY, 0.08)} 0%, transparent 72%)
          `,
          border: `1px solid ${alpha(INK, 0.1)}`,
          color: TEXT,
          boxShadow: '0 32px 80px rgba(23, 19, 16, 0.18)',
          minWidth: { xs: 'unset', sm: 380 },
          mx: { xs: 1.25, sm: 0 },
          width: width || 'auto',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: fullScreen ? 0 : 96,
            background: `linear-gradient(180deg, ${alpha(CLAY, 0.08)} 0%, transparent 100%)`,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${alpha(CLAY, 0.9)} 0%, ${alpha(CLAY, 0.22)} 60%, transparent 100%)`,
            opacity: fullScreen ? 0 : 1,
          },
        },
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: { xs: 14, sm: 16 },
          top: { xs: 14, sm: 16 },
          color: alpha(INK, 0.76),
          bgcolor: alpha('#FFFFFF', 0.78),
          width: { xs: 36, sm: 38 },
          height: { xs: 36, sm: 38 },
          border: `1px solid ${alpha(INK, 0.08)}`,
          backdropFilter: 'blur(10px)',
          zIndex: 2,
          '&:hover': {
            bgcolor: alpha(CLAY, 0.12),
            color: CLAY,
            borderColor: alpha(CLAY, 0.2),
          },
          transition: 'all 0.25s ease',
        }}
        aria-label="Close dialog"
      >
        <FiX size={18} />
      </IconButton>

      {title && (
        <DialogTitle
          sx={{
            pt: { xs: 3.3, sm: 3.5 },
            pb: { xs: 1.5, sm: 1.75 },
            px: { xs: 2.2, sm: 3 },
            pr: { xs: 7, sm: 8 },
            color: INK,
            borderBottom: `1px solid ${alpha(INK, 0.08)}`,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.8,
            }}
          >
            <Box
              sx={{
                width: 54,
                height: 4,
                borderRadius: 999,
                background: `linear-gradient(90deg, ${CLAY} 0%, ${alpha(CLAY, 0.18)} 100%)`,
              }}
            />
            <Box
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.04rem', sm: '1.2rem' },
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
              }}
            >
              {title}
            </Box>
          </Box>
        </DialogTitle>
      )}
      <DialogContent
        sx={{
          px: { xs: 2.2, sm: 3 },
          py: title ? { xs: 2, sm: 2.35 } : { xs: 3.2, sm: 3.4 },
          borderBottom: footer ? `1px solid ${alpha(INK, 0.06)}` : 'none',
          bgcolor: title ? 'transparent' : SURFACE,
        }}
      >
        {children}
      </DialogContent>
      {footer && (
        <DialogActions
          sx={{
            px: { xs: 2.2, sm: 3 },
            py: { xs: 1.6, sm: 1.85 },
            borderTop: 'none',
            bgcolor: alpha(SURFACE_ALT, 0.92),
            backdropFilter: 'blur(10px)',
            justifyContent: 'flex-end',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          {footer}
        </DialogActions>
      )}
    </Dialog>
  )
}

export default CustomDialog
