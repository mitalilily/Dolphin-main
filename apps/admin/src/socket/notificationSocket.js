// notificationSocket.js
import { io } from 'socket.io-client'
import { getAdminSocketUrl } from 'services/runtimeConfig'

const URL = getAdminSocketUrl()
export const socket = io(URL) // Your backend URL

export function registerUser(userId) {
  socket.emit('register', userId)
}
