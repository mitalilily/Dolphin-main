import { io, type Socket } from 'socket.io-client'

const SHOPNSHIP_SOCKET_URL = 'https://api.shopnship.in'

const getDefaultSocketUrl = () => {
  const host = window.location.hostname.toLowerCase()
  const shopnshipFrontendHosts = new Set([
    'shopnship.in',
    'www.shopnship.in',
    'app.shopnship.in',
  ])

  return shopnshipFrontendHosts.has(host) ? SHOPNSHIP_SOCKET_URL : window.location.origin
}

const getSocketUrl = () => {
  const rawSocketUrl = import.meta.env.VITE_APP_SOCKET_URL

  try {
    if (!rawSocketUrl) return getDefaultSocketUrl()

    const candidate = new URL(rawSocketUrl, window.location.origin)
    return candidate.origin
  } catch {
    return getDefaultSocketUrl()
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
