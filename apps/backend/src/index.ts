import * as dotenv from 'dotenv'
import { server } from './app'
import './crons'
import { testDatabaseConnection } from './models/client'

// Determine environment
const env = process.env.NODE_ENV || 'development'
console.log('node env', env)

// Load environment variables (platform-injected in production).
dotenv.config()
console.log('PORT from env:', process.env.PORT)

// Platforms like Railway/Render provide PORT as a string env var.
const PORT = Number(process.env.PORT) || 8080
let isShuttingDown = false

const shutdownGracefully = (signal: NodeJS.Signals) => {
  if (isShuttingDown) return
  isShuttingDown = true
  console.log(`Received ${signal}. Closing server gracefully...`)

  server.close((err) => {
    if (err) {
      console.error('Error while closing server:', err)
      process.exit(1)
    }

    console.log('HTTP server closed. Exiting process.')
    process.exit(0)
  })

  setTimeout(() => {
    console.warn('Graceful shutdown timeout reached. Forcing process exit.')
    process.exit(1)
  }, 10000).unref()
}

process.on('SIGTERM', () => shutdownGracefully('SIGTERM'))
process.on('SIGINT', () => shutdownGracefully('SIGINT'))

// Test database connection before starting server
async function startServer() {
  console.log('🔍 Testing database connection...')
  const dbConnected = await testDatabaseConnection()

  if (!dbConnected) {
    console.error('❌ Failed to connect to database. Server will not start.')
    process.exit(1)
  }

  // Set server timeout to 3.5 minutes (210000ms) to allow for slow external API calls
  // Default Node.js server timeout is 2 minutes (120000ms)
  server.timeout = 210000 // 3.5 minutes

  server.listen(PORT, '0.0.0.0', () => {
    const url =
      env === 'production'
        ? process.env.API_URL || 'https://dolphin-main-production-4236.up.railway.app'
        : `http://localhost:${PORT}`
    console.log(`🚀 Server running on port ${PORT} in ${env} mode at ${url}`)
  })
}

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err)
  process.exit(1)
})
