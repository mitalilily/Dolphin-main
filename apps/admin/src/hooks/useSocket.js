import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { getAdminSocketUrl } from 'services/runtimeConfig'
import { useAuthStore } from 'store/useAuthStore'
import { useNotificationsStore } from 'store/useNotificationsStore'

export const useSocket = () => {
  const { userId } = useAuthStore()
  const { addNotification } = useNotificationsStore()
  const socketUrl = getAdminSocketUrl()

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
