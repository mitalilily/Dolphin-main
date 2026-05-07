import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|@tanstack)[\\/]/.test(id)) {
            return 'vendor-react'
          }

          if (/[\\/]node_modules[\\/](@mui|@emotion)[\\/]/.test(id)) {
            return 'vendor-mui'
          }

          if (/[\\/]node_modules[\\/](framer-motion|lottie-react)[\\/]/.test(id)) {
            return 'vendor-motion'
          }

          if (/[\\/]node_modules[\\/](apexcharts|react-apexcharts)[\\/]/.test(id)) {
            return 'vendor-charts'
          }

          if (/[\\/]node_modules[\\/](@mediapipe|react-webcam)[\\/]/.test(id)) {
            return 'vendor-media'
          }

          if (/[\\/]node_modules[\\/](moment|date-fns|papaparse|file-saver|qs|lodash\.debounce)[\\/]/.test(id)) {
            return 'vendor-utils'
          }

          if (/[\\/]node_modules[\\/]react-icons[\\/]/.test(id)) {
            return 'vendor-icons'
          }

          return undefined
        },
      },
    },
  },
})
