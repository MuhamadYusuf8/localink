'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react'
import type { User, UserRole } from '@/types'
import { login as apiLogin, logout as apiLogout, getMe } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/store/authStore'
import { setAuthToken, clearAuthToken } from '@/lib/api/client'

// ─── State & Action Types ─────────────────────────────────
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'USER_UPDATED'; payload: User }

// ─── Context Shape ────────────────────────────────────────
interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  hasRole: (role: UserRole | UserRole[]) => boolean
  clearError: () => void
}

// ─── Reducer ─────────────────────────────────────────────
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null }

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }

    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      }

    case 'AUTH_LOGOUT':
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }

    case 'USER_UPDATED':
      return { ...state, user: action.payload }

    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Initial State dari Zustand Persist ──────────────────
function getInitialState(): AuthState {
  // Selalu return state loading saat initial render agar HTML server & client cocok
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  }
}

// ─── Provider ────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, undefined, getInitialState)
  const zustandStore = useAuthStore()

  // Hydrate auth state from localStorage setelah first render
  useEffect(() => {
    try {
      const stored = localStorage.getItem('economic-survival-auth')
      if (stored) {
        const parsed = JSON.parse(stored)
        const { state: persistedState } = parsed
        if (persistedState?.token && persistedState?.user) {
          setAuthToken(persistedState.token)
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: persistedState.user, token: persistedState.token }
          })
          return
        }
      }
    } catch {
      // Abaikan error
    }
    
    // Jika tidak ada data auth di localStorage
    dispatch({ type: 'AUTH_LOGOUT' })
  }, [])

  // Sinkronisasi state lokal ke Zustand untuk komponen non-context
  useEffect(() => {
    if (state.user && state.token) {
      zustandStore.loginSuccess(state.user, state.token)
    } else if (!state.isLoading) {
      zustandStore.logout()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user, state.token, state.isLoading])

  // Validasi token saat mount — pastikan masih valid
  useEffect(() => {
    if (state.token && state.isAuthenticated) {
      getMe()
        .then((user) => {
          dispatch({ type: 'USER_UPDATED', payload: user })
        })
        .catch(() => {
          // Token kadaluarsa atau tidak valid
          clearAuthToken()
          dispatch({ type: 'AUTH_LOGOUT' })
        })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Hanya saat mount

  // ─── Login ─────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string): Promise<User> => {
    dispatch({ type: 'AUTH_LOADING' })
    try {
      const authData = await apiLogin(email, password)
      setAuthToken(authData.token)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: authData.user, token: authData.token },
      })
      return authData.user
    } catch (err: unknown) {
      const message =
        (err as { error?: { message?: string } })?.error?.message ??
        'Login gagal. Periksa email dan password Anda.'
      dispatch({ type: 'AUTH_ERROR', payload: message })
      throw err
    }
  }, [])

  // ─── Logout ────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiLogout()
    } catch {
      // Tetap logout meski request gagal
    } finally {
      clearAuthToken()
      dispatch({ type: 'AUTH_LOGOUT' })
      zustandStore.logout()
    }
  }, [zustandStore])

  // ─── Refresh User ──────────────────────────────────────
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const user = await getMe()
      dispatch({ type: 'USER_UPDATED', payload: user })
      zustandStore.setUser(user)
    } catch {
      // Abaikan jika gagal
    }
  }, [zustandStore])

  // ─── Has Role ──────────────────────────────────────────
  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      if (!state.user) return false
      if (Array.isArray(role)) return role.includes(state.user.role)
      return state.user.role === role
    },
    [state.user]
  )

  // ─── Clear Error ───────────────────────────────────────
  const clearError = useCallback(() => {
    dispatch({ type: 'AUTH_ERROR', payload: '' })
  }, [])

  const value: AuthContextValue = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    refreshUser,
    hasRole,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider')
  }
  return context
}

export default AuthContext
