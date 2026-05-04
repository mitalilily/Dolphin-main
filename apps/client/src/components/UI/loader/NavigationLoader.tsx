import { Box, LinearProgress } from '@mui/material'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const MIN_DISPLAY_TIME = 350

/**
 * Shows route progress without blocking the next click.
 */
export default function NavigationLoader() {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, MIN_DISPLAY_TIME)

    return () => {
      clearTimeout(timer)
    }
  }, [location.pathname]) // Trigger on route change

  if (!isLoading) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2400,
        pointerEvents: 'none',
      }}
    >
      <LinearProgress
        sx={{
          height: 3,
          bgcolor: 'rgba(130, 194, 255, 0.22)',
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(90deg, #82C2FF 0%, #FFE08A 100%)',
          },
        }}
      />
    </Box>
  )
}
