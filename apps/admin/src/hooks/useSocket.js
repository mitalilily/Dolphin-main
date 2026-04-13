import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from 'store/useAuthStore'
import { useNotificationsStore } from 'store/useNotificationsStore'

export const useSocket = () => {
  const { userId } = useAuthStore()
  const { addNotification } = useNotificationsStore()
  const isLocalhost =
    typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
  const socketUrl =
    process.env.REACT_APP_SOCKET_URL ||
    process.env.REACT_APP_API_BASE_URL?.replace(/\/api\/?$/, '') ||
    (isLocalhost ? 'http://127.0.0.1:5002' : 'https://delexpress-backend.onrender.com')

  useEffect(() => {
    if (!userId) return

    const socket = io(socketUrl)

    socket.emit('register', userId)

    socket.on('new_notification', (notification) => {
      addNotification(notification)
    })

    return () => {
      socket.disconnect()
    }
  }, [addNotification, socketUrl, userId])
}
