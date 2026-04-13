import { alpha, createTheme } from '@mui/material/styles'
import { brand, brandFonts, brandGradients } from './brand'

export const BRAND_NAVY = brand.ink
export const BRAND_PLUM = brand.ink
export const BRAND_YELLOW = brand.gold
export const BRAND_BLUE = brand.sky
export const TEXT = brand.inkSoft
export const BRAND_LIGHT_NAVY = alpha(brand.ink, 0.12)
export const BRAND_PURPLE = brand.ink

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 300,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    mode: 'light',
    background: {
      default: brand.page,
      paper: brand.surface,
    },
    primary: {
      main: brand.ink,
      light: brand.sky,
      dark: '#0B2232',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: brand.accent,
      light: '#FFEAD0',
      dark: '#E7B671',
      contrastText: brand.ink,
    },
    error: {
      main: brand.danger,
      light: '#FCA5A5',
      dark: '#991B1B',
    },
    warning: {
      main: brand.warning,
      light: '#FDE7C5',
      dark: '#B45309',
    },
    info: {
      main: '#60A5FA',
      light: '#D4F6FF',
      dark: '#1D4ED8',
    },
    success: {
      main: brand.success,
      light: '#D6F5EC',
      dark: '#1F7F68',
    },
    text: {
      primary: brand.ink,
      secondary: brand.inkSoft,
      disabled: alpha(brand.inkSoft, 0.58),
    },
    divider: alpha(brand.ink, 0.08),
  },
  shape: {
    borderRadius: 22,
  },
  typography: {
    fontFamily: brandFonts.body,
    h1: {
      fontFamily: brandFonts.display,
      color: brand.ink,
      fontWeight: 800,
      fontSize: '3rem',
      lineHeight: 1,
      letterSpacing: '-0.05em',
    },
    h2: {
      fontFamily: brandFonts.display,
      color: brand.ink,
      fontWeight: 800,
      fontSize: '2.35rem',
      lineHeight: 1.04,
      letterSpacing: '-0.05em',
    },
    h3: {
      fontFamily: brandFonts.display,
      color: brand.ink,
      fontWeight: 800,
      fontSize: '1.85rem',
      lineHeight: 1.08,
      letterSpacing: '-0.04em',
    },
    h4: {
      fontFamily: brandFonts.display,
      color: brand.ink,
      fontWeight: 700,
      fontSize: '1.55rem',
      lineHeight: 1.12,
    },
    h5: {
      fontFamily: brandFonts.display,
      color: brand.ink,
      fontWeight: 700,
      fontSize: '1.24rem',
      lineHeight: 1.16,
    },
    h6: {
      fontFamily: brandFonts.display,
      color: brand.ink,
      fontWeight: 700,
      fontSize: '1.04rem',
      lineHeight: 1.2,
    },
    subtitle1: {
      color: brand.ink,
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle2: {
      color: brand.inkSoft,
      fontWeight: 600,
      fontSize: '0.84rem',
      letterSpacing: '0.02em',
    },
    body1: {
      color: brand.ink,
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.72,
    },
    body2: {
      color: brand.inkSoft,
      fontWeight: 400,
      fontSize: '0.92rem',
      lineHeight: 1.7,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      letterSpacing: '0.01em',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: brandGradients.page,
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          color: brand.ink,
          fontFamily: brandFonts.body,
        },
        '#root': {
          minHeight: '100vh',
        },
        '::selection': {
          backgroundColor: alpha(brand.sky, 0.92),
          color: brand.ink,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 30,
          boxShadow: brand.shadow,
          border: `1px solid ${alpha('#FFFFFF', 0.82)}`,
          background: brandGradients.surface,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          flexGrow: 1,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: brandGradients.surface,
          borderRadius: 30,
        },
        elevation1: {
          boxShadow: '0 18px 38px rgba(15, 44, 67, 0.06)',
        },
        elevation4: {
          boxShadow: brand.shadow,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          padding: '11px 22px',
          fontSize: '0.88rem',
          fontWeight: 700,
          boxShadow: 'none',
        },
        containedPrimary: {
          background: brandGradients.button,
          color: brand.ink,
          boxShadow: '0 16px 32px rgba(130,194,255,0.24)',
          '&:hover': {
            background: brandGradients.button,
            transform: 'translateY(-1px)',
            boxShadow: '0 20px 40px rgba(130,194,255,0.3)',
          },
        },
        containedSecondary: {
          backgroundColor: brand.ink,
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#163E59',
          },
        },
        outlined: {
          borderColor: alpha(brand.sky, 0.98),
          color: brand.ink,
          backgroundColor: alpha('#FFFFFF', 0.78),
          '&:hover': {
            borderColor: brand.sky,
            backgroundColor: '#FFFFFF',
          },
        },
        text: {
          color: brand.ink,
          '&:hover': {
            backgroundColor: alpha('#FFFFFF', 0.68),
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 20,
            backgroundColor: alpha('#FFFFFF', 0.88),
            '& fieldset': {
              borderColor: alpha(brand.ink, 0.12),
            },
            '&:hover fieldset': {
              borderColor: alpha(brand.ink, 0.24),
            },
            '&.Mui-focused fieldset': {
              borderColor: brand.ink,
            },
          },
          '& .MuiInputLabel-root': {
            color: brand.inkSoft,
            fontWeight: 500,
            '&.Mui-focused': {
              color: brand.ink,
            },
          },
          '& .MuiOutlinedInput-input': {
            color: brand.ink,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
        },
        filled: {
          backgroundColor: alpha(brand.sky, 0.62),
          color: brand.ink,
        },
        outlined: {
          borderColor: alpha(brand.ink, 0.12),
          color: brand.ink,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 30,
          border: `1px solid ${alpha(brand.ink, 0.1)}`,
          boxShadow: '0 32px 68px rgba(15, 44, 67, 0.16)',
          background: brandGradients.surface,
          overflow: 'hidden',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: brand.ink,
          fontFamily: brandFonts.display,
          fontWeight: 700,
          fontSize: '1.14rem',
          padding: '22px 24px 12px',
          borderBottom: `1px solid ${alpha(brand.ink, 0.08)}`,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '18px 24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '14px 20px',
          borderTop: `1px solid ${alpha(brand.ink, 0.08)}`,
          backgroundColor: alpha(brand.sky, 0.08),
          gap: 10,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(brand.ink, 0.36),
          backdropFilter: 'blur(8px)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: alpha(brand.sky, 0.26),
          color: brand.ink,
          fontWeight: 700,
          borderBottom: `1px solid ${alpha(brand.ink, 0.08)}`,
        },
        root: {
          borderBottom: `1px solid ${alpha(brand.ink, 0.08)}`,
          color: brand.ink,
        },
      },
    },
  },
})

export default theme
