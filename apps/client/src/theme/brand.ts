import { alpha } from '@mui/material/styles'

export const brand = {
  ink: '#10324A',
  inkSoft: '#5F7A8F',
  page: '#FBFBFB',
  cream: '#F7F1DF',
  sky: '#C6E7FF',
  aqua: '#D4F6FF',
  accent: '#FFDDAE',
  gold: '#F3D971',
  line: '#DCE8F1',
  surface: '#FFFFFF',
  surfaceGlass: 'rgba(255,255,255,0.82)',
  success: '#56C0A5',
  warning: '#F59E0B',
  danger: '#D14343',
  shadow: '0 24px 70px rgba(15, 44, 67, 0.08)',
}

export const brandFonts = {
  body: '"Poppins", ui-sans-serif, system-ui, sans-serif',
  display: '"Poppins", ui-sans-serif, system-ui, sans-serif',
}

export const brandGradients = {
  page: `
    radial-gradient(circle at 0% 0%, rgba(249, 239, 202, 0.82), transparent 28%),
    radial-gradient(circle at 100% 0%, rgba(212, 246, 255, 0.62), transparent 28%),
    linear-gradient(180deg, #F7F1DF 0%, #FBFBFB 28%, #F5FBFF 62%, #FBFBFB 100%)
  `,
  button: 'linear-gradient(135deg, #8FD8FF 0%, #FFD8A8 100%)',
  hero: 'linear-gradient(135deg, rgba(198,231,255,0.92) 0%, rgba(255,255,255,0.94) 48%, rgba(255,221,174,0.75) 100%)',
  surface: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,251,255,0.98) 100%)',
  softSurface: 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,248,239,0.92) 100%)',
  analytics: 'linear-gradient(145deg, rgba(212,246,255,0.84) 0%, rgba(255,255,255,0.92) 50%, rgba(255,221,174,0.66) 100%)',
}

export const brandEffects = {
  ring: `0 0 0 4px ${alpha(brand.sky, 0.34)}`,
  border: `1px solid ${alpha(brand.line, 0.92)}`,
  focusBorder: `1px solid ${alpha(brand.ink, 0.34)}`,
  mutedBorder: `1px solid ${alpha(brand.ink, 0.08)}`,
}
