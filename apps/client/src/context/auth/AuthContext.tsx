import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { logoutApi } from '../../api/auth'
import { clearAuthTokens, getAuthTokens, setAuthTokens } from '../../api/tokenVault'
import { useUserProfile } from '../../hooks/User/useUserProfile'
import type { IUserProfileDB } from '../../types/user.types'
import { emptyUserProfile } from '../../utils/utility'

/* ---------- context shape ---------- */
interface AuthCtx {
  setUserId: Dispatch<SetStateAction<string>>
  userId: string
  user: IUserProfileDB
  loading: boolean
  isAuthenticated: boolean
  setTokens: (access: string, refresh: string) => void
  clearTokens: () => void
  logout: () => Promise<void>
  refetchUser: () => void
  walletBalance: number | null
  setWalletBalance: Dispatch<SetStateAction<number | null>>
}

export const AuthContext = createContext<AuthCtx | undefined>(undefined)

const USER_ID_STORAGE_KEY = 'cc_user_id'

/* ---------- provider ---------- */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient()

  const { accessToken, refreshToken } = getAuthTokens()
  const hasTokens = !!accessToken && !!refreshToken

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(hasTokens)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [userId, setUserIdState] = useState(() => localStorage.getItem(USER_ID_STORAGE_KEY) || '')

  const {
    data: user,
    isFetching: userFetching,
    isError: userProfileError,
    refetch: refetchUser,
  } = useUserProfile(isAuthenticated)

  const setUserId: Dispatch<SetStateAction<string>> = (value) => {
    setUserIdState((currentUserId) => {
      const nextUserId =
        typeof value === 'function' ? (value as (previous: string) => string)(currentUserId) : value

      if (nextUserId) {
        localStorage.setItem(USER_ID_STORAGE_KEY, nextUserId)
      } else {
        localStorage.removeItem(USER_ID_STORAGE_KEY)
      }

      return nextUserId
    })
  }

  useEffect(() => {
    // If we successfully fetched a user, ensure auth is marked as true.
    if (user?.id) {
      setIsAuthenticated(true)
      setUserId(user.userId || user.id)
    }
    // Do NOT automatically mark user as unauthenticated on generic errors here.
    // Auth state should primarily follow presence of valid tokens; 401 handling
    // is done in axios interceptors which clear tokens and redirect as needed.
  }, [user])

  const setTokens = (access: string, refresh: string) => {
    setAuthTokens(access, refresh)
    queryClient.resetQueries({ queryKey: ['userProfile'] })
    queryClient.resetQueries({ queryKey: ['userInfo'] })
    setIsAuthenticated(true)
    refetchUser()
  }

  const clearTokens = () => {
    clearAuthTokens()
    localStorage.removeItem(USER_ID_STORAGE_KEY)
    setUserIdState('')
    setIsAuthenticated(false)
    queryClient.removeQueries({ queryKey: ['userInfo'] })
    queryClient.removeQueries({ queryKey: ['userProfile'] })
    queryClient.removeQueries({ queryKey: ['walletBalance'] })
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch (e) {
      console.error('Logout error ignored:', e)
    }
    clearTokens()
    window.location.href = '/login'
  }

  const value: AuthCtx = {
    user: user ?? { ...emptyUserProfile },
    loading: isAuthenticated && (userFetching || (!user?.id && !userProfileError)),
    isAuthenticated,
    setUserId,
    setTokens,
    clearTokens,
    userId,
    logout,
    refetchUser,
    walletBalance,
    setWalletBalance,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* ---------- hook ---------- */
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
