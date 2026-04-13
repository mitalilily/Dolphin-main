import {
  Alert,
  type AlertColor,
  Box,
  IconButton,
  Slide,
  type SlideProps,
  Snackbar,
  styled,
} from '@mui/material'
import React from 'react'
import { MdCheckCircle, MdClose, MdError, MdInfo, MdWarning } from 'react-icons/md'

let openToastFn: (options: ToastOptions) => void = () => {}

export interface ToastOptions {
  message: string
  severity?: AlertColor
  duration?: number
  position?: {
    vertical: 'top' | 'bottom'
    horizontal: 'left' | 'center' | 'right'
  }
}

export const toast = {
  open: (options: ToastOptions) => openToastFn(options),
}

const bgMap: Record<AlertColor, string> = {
  success: 'linear-gradient(135deg, #D6F5EC 0%, #FFFFFF 100%)',
  error: 'linear-gradient(135deg, #FDE2E2 0%, #FFFFFF 100%)',
  warning: 'linear-gradient(135deg, #FDE7C5 0%, #FFFFFF 100%)',
  info: 'linear-gradient(135deg, #D4F6FF 0%, #FFFFFF 100%)',
}

const accentMap: Record<AlertColor, string> = {
  success: '#56C0A5',
  error: '#D14343',
  warning: '#F59E0B',
  info: '#4E90CA',
}

const iconMap: Record<AlertColor, React.ReactNode> = {
  success: <MdCheckCircle size={20} />,
  error: <MdError size={20} />,
  warning: <MdWarning size={20} />,
  info: <MdInfo size={20} />,
}

const GlassAlert = styled(Alert)<{ severity: AlertColor }>(({ severity }) => ({
  background: bgMap[severity] ?? bgMap.info,
  boxShadow: '0 20px 42px rgba(15,44,67,0.12)',
  borderRadius: 24,
  padding: '10px 16px',
  border: '1px solid rgba(255,255,255,0.72)',
  color: '#10324A',
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  overflow: 'hidden',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 4,
    borderRadius: 999,
    background: accentMap[severity] ?? accentMap.info,
  },
  '& .MuiAlert-icon': {
    color: accentMap[severity],
    opacity: 0.98,
    marginRight: 8,
    marginLeft: 4,
  },
  '& .MuiAlert-message': {
    padding: 0,
    fontWeight: 600,
    zIndex: 1,
    maxWidth: 320,
    whiteSpace: 'pre-line',
  },
}))

const ToastContainer = styled(Box)(() => ({
  maxWidth: 420,
  width: '100%',
  '& *': {
    boxSizing: 'border-box',
  },
}))

const transitionUp = (props: SlideProps) => <Slide {...props} direction="up" />

export const ToastProvider: React.FC = () => {
  const [open, setOpen] = React.useState(false)
  const [opts, setOpts] = React.useState<ToastOptions>({
    message: '',
    severity: 'info',
    duration: 5000,
    position: { vertical: 'bottom', horizontal: 'right' },
  })

  React.useEffect(() => {
    openToastFn = (o: ToastOptions) => {
      setOpen(false)
      setOpts((prev) => ({ ...prev, ...o }))
      setTimeout(() => setOpen(true), 0)
    }
  }, [])

  const { vertical, horizontal } = opts.position ?? {
    vertical: 'bottom',
    horizontal: 'center',
  }

  return (
    <Snackbar
      key={`${vertical}-${horizontal}`}
      open={open}
      autoHideDuration={opts.duration ?? 3500}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical, horizontal }}
      TransitionComponent={transitionUp}
      sx={{
        '& .MuiSnackbarContent-root': {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }}
    >
      <ToastContainer>
        <GlassAlert
          severity={opts.severity ?? 'info'}
          variant="standard"
          icon={iconMap[opts.severity ?? 'info']}
          action={
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
              sx={{
                color: '#10324A',
              }}
            >
              <MdClose size={18} />
            </IconButton>
          }
        >
          {opts.message}
        </GlassAlert>
      </ToastContainer>
    </Snackbar>
  )
}
