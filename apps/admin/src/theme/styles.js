import { mode } from '@chakra-ui/theme-tools'
import colors from './foundations/colors'

export const globalStyles = {
  colors: {
    ...colors,
  },
  styles: {
    global: (props) => ({
      body: {
        bg: mode('#F5F0E8', '#171310')(props),
        color: mode('gray.900', 'whiteAlpha.900')(props),
        fontFamily: "'Barlow', 'Segoe UI', sans-serif",
        backgroundImage: mode(
          'radial-gradient(circle at 8% 6%, rgba(216,201,183,0.34) 0%, transparent 26%), radial-gradient(circle at 92% 4%, rgba(217,121,67,0.16) 0%, transparent 24%), linear-gradient(180deg, #fffdf8 0%, #f5f0e8 100%)',
          'radial-gradient(circle at 8% 6%, rgba(255,255,255,0.1) 0%, transparent 26%), radial-gradient(circle at 92% 4%, rgba(217,121,67,0.12) 0%, transparent 24%), linear-gradient(180deg, #171310 0%, #100d0b 100%)',
        ),
        backgroundAttachment: 'fixed',
      },
      html: {
        fontFamily: "'Barlow', 'Segoe UI', sans-serif",
        bg: mode('#F5F0E8', '#171310')(props),
      },
      '#root': {
        minHeight: '100vh',
      },
      '*': {
        boxSizing: 'border-box',
      },
      '::selection': {
        background: mode('brand.100', 'brand.600')(props),
      },
      '::-webkit-scrollbar': {
        width: '10px',
        height: '10px',
      },
      '::-webkit-scrollbar-track': {
        background: mode('rgba(23,19,16,0.06)', 'rgba(255,255,255,0.06)')(props),
      },
      '::-webkit-scrollbar-thumb': {
        background: mode('rgba(23,19,16,0.24)', 'rgba(255,255,255,0.22)')(props),
        borderRadius: '999px',
      },
    }),
  },
}
