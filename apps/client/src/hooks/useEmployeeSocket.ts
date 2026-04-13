import { useEffect } from 'react'
import { getEmployeeByUserId } from '../api/employee.service'
import { useAuth } from '../context/auth/AuthContext'
import { disconnectSocket, registerUserSocket } from './User/useUserOnline'

export const useEmployeeSocket = () => {
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return

    const initSocket = async () => {
      const employee = await getEmployeeByUserId(user.userId)
      if (employee?.employee?.isActive) {
        registerUserSocket({ id: user.userId, role: 'employee' })
      }
    }

    initSocket()
    return () => disconnectSocket()
  }, [isAuthenticated, user?.userId])
}
