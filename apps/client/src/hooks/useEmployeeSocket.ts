import { useEffect } from 'react'
import { getEmployeeByUserId } from '../api/employee.service'
import { useAuth } from '../context/auth/AuthContext'
import { disconnectSocket, registerUserSocket } from './User/useUserOnline'

export const useEmployeeSocket = () => {
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    const socketUserId = user?.userId || user?.id
    if (!isAuthenticated || !socketUserId) return

    let cancelled = false

    const initSocket = async () => {
      try {
        const employee = await getEmployeeByUserId(socketUserId)
        if (!cancelled && employee?.employee?.isActive) {
          registerUserSocket({ id: socketUserId, role: 'employee' })
        }
      } catch (error: unknown) {
        const apiError = error as { response?: { status?: number } }
        if (apiError?.response?.status !== 404) {
          console.error('Employee socket registration failed:', error)
        }
      }
    }

    initSocket()
    return () => {
      cancelled = true
      disconnectSocket()
    }
  }, [isAuthenticated, user?.id, user?.userId])
}
