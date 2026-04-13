// notificationSocket.js
import { io } from 'socket.io-client'
const isLocalhost =
  typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
const URL =
  process.env.REACT_APP_SOCKET_URL ||
  process.env.REACT_APP_API_BASE_URL?.replace(/\/api\/?$/, '') ||
  (isLocalhost ? 'http://127.0.0.1:5002' : 'https://delexpress-backend.onrender.com')
export const socket = io(URL) // Your backend URL

export function registerUser(userId) {
  socket.emit('register', userId)
}
