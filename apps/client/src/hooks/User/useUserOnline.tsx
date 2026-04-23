import { io, type Socket } from 'socket.io-client'

const DEFAULT_SOCKET_URL = 'https://dolphin-main-production-4236.up.railway.app'

const getSocketUrl = () => {
  const rawSocketUrl = import.meta.env.VITE_APP_SOCKET_URL

  try {
    if (!rawSocketUrl) return DEFAULT_SOCKET_URL

    const candidate = new URL(rawSocketUrl, window.location.origin)
    const currentHost = window.location.hostname
    const isNetlifyPreview = currentHost.endsWith('netlify.app')
    const pointsBackToFrontend = candidate.hostname === currentHost

    if (isNetlifyPreview && pointsBackToFrontend) {
      return DEFAULT_SOCKET_URL
    }

    return candidate.origin
  } catch {
    return DEFAULT_SOCKET_URL
  }
}

let socket: Socket | null = null

const getSocket = () => {
  if (!socket) {
    socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] })
  }

  return socket
}

let pingInterval: number | null = null

export const registerUserSocket = (user: { id: string; role: string }) => {
  if (user.role !== 'employee') return

  const socketClient = getSocket()

  socketClient.emit('register', user.id)

  // Ping every 10 seconds to maintain online status
  pingInterval = window.setInterval(() => {
    socketClient.emit('employee_ping', user.id)
  }, 10000)

  socketClient.on('new_notification', (msg) => {
    console.log('Received notification:', msg)
  })
}

export const disconnectSocket = () => {
  if (pingInterval) {
    clearInterval(pingInterval)
    pingInterval = null
  }

  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export default getSocket
