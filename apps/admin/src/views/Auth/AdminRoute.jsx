import { jwtDecode } from 'jwt-decode'
import { useEffect } from 'react'
import { Redirect } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token)
    return decoded.exp < Date.now() / 1000
  } catch {
    return true
  }
}

export const AdminRoute = ({ children }) => {
  const { token, refreshToken, logout } = useAuthStore()
  const shouldRedirect = !token || !refreshToken || isTokenExpired(refreshToken)

  useEffect(() => {
    if (shouldRedirect) {
      logout()
    }
  }, [shouldRedirect, logout])

  if (shouldRedirect) return <Redirect to="/auth/signin" />

  return children
}
