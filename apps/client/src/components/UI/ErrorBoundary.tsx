import { Box, Button, Stack, Typography } from '@mui/material'
import { useTheme, type Theme } from '@mui/material/styles'
import React, { type ErrorInfo, type ReactNode } from 'react'
import { MdErrorOutline } from 'react-icons/md'
import { isChunkLoadError, recoverFromChunkLoadError } from '../../utils/chunkRecovery'

type InnerProps = { children: ReactNode; theme: Theme; resetKey?: string }
type State = { hasError: boolean; error: Error | null; recoveringChunk: boolean }

class ErrorBoundaryCore extends React.Component<InnerProps, State> {
  state: State = { hasError: false, error: null, recoveringChunk: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, recoveringChunk: false }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 👉🏽 Hook up Sentry / LogRocket etc. in prod
    console.error('Uncaught error:', error, errorInfo)
    if (isChunkLoadError(error.message)) {
      const recoveringChunk = recoverFromChunkLoadError()
      if (recoveringChunk) this.setState({ recoveringChunk })
    }
  }

  componentDidUpdate(prevProps: InnerProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null, recoveringChunk: false })
    }
  }

  private handleReload = () => window.location.reload()

  render() {
    if (!this.state.hasError) return this.props.children

    const isDev = import.meta.env.DEV
    const isRecoveringChunk =
      this.state.recoveringChunk && isChunkLoadError(this.state.error?.message)

    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(245, 247, 250, 0.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <Stack
          spacing={3}
          sx={{
            p: { xs: 4, sm: 6 },
            borderRadius: 3,
            textAlign: 'center',
            background: '#FFFFFF',
            border: '1px solid #E0E6ED',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            maxWidth: { xs: '90%', sm: 600 },
            width: '100%',
            overflowY: 'auto',
            maxHeight: '90vh',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
                boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)',
              }}
            >
              <MdErrorOutline size={32} color="#FFFFFF" />
            </Box>
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: '#1A1A1A',
              mb: 0.5,
            }}
          >
            {isRecoveringChunk ? 'Updating Dolphin workspace' : 'Oops! Something went wrong'}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: '#4A5568',
              lineHeight: 1.6,
            }}
          >
            {isRecoveringChunk
              ? 'A fresh app version is being loaded so the page can continue without manual reload.'
              : 'We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.'}
          </Typography>

          {isDev && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 1, textAlign: 'left' }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#C53030', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {this.state.error?.stack || this.state.error?.message || 'Unknown error'}
              </Typography>
            </Box>
          )}

          {!isRecoveringChunk ? (
            <Box display="flex" justifyContent="center" gap={2}>
              <Button
                variant="contained"
                onClick={this.handleReload}
                sx={{
                  background: 'linear-gradient(135deg, #333369 0%, #2F3B5F 100%)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  px: 4,
                  py: 1.25,
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(51, 51, 105, 0.2)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2F3B5F 0%, #1A1A4A 100%)',
                    boxShadow: '0 6px 16px rgba(51, 51, 105, 0.3)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Refresh Page
              </Button>
            </Box>
          ) : null}
        </Stack>
      </Box>
    )
  }
}

/* ------------------  FUNCTION WRAPPER  ------------------ */
/** Grabs the current theme with a hook (allowed) and passes it down
 *  to the class component (where hooks aren’t allowed). */
const ErrorBoundary: React.FC<{ children: ReactNode; resetKey?: string }> = ({
  children,
  resetKey,
}) => {
  const theme = useTheme()
  return (
    <ErrorBoundaryCore theme={theme} resetKey={resetKey}>
      {children}
    </ErrorBoundaryCore>
  )
}

export default ErrorBoundary
