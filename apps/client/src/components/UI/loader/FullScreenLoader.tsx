import { Box } from '@mui/material'
import React from 'react'
import './loader.css'
import Logo from '/logo/dolphin-logo-transparent.png'

type Props = {
  night?: boolean
}

const FullScreenLoader: React.FC<Props> = ({ night = false }) => {
  return (
    <Box className={`loader-overlay ${night ? 'night' : ''}`}>
      <Box className="loader-content">
        <div className="logo-container">
          <img src={Logo} alt="Dolphin Enterprise logo" className="loader-logo" />
        </div>
      </Box>
    </Box>
  )
}

export default FullScreenLoader
