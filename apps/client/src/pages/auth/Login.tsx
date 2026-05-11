import { Navigate } from 'react-router-dom'
import LoginForm from '../../components/auth/LoginForm'
import FullScreenLoader from '../../components/UI/loader/FullScreenLoader'
import { useAuth } from '../../context/auth/AuthContext'

export default function Login() {
  const { loading, isAuthenticated, user } = useAuth()

  if (loading) return <FullScreenLoader />
  if (isAuthenticated) {
    return <Navigate to={user?.onboardingComplete ? '/dashboard' : '/onboarding-questions'} replace />
  }

  return <LoginForm />
}
