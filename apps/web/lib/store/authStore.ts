import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, UserRole } from '@/types'
import { setAuthToken, clearAuthToken } from '@/lib/api/client'

// ─── State Interface ──────────────────────────────────────
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setUser: (user: User) => void
  setToken: (token: string) => void
  setLoading: (loading: boolean) => void
  loginSuccess: (user: User, token: string) => void
  logout: () => void
  updateUser: (data: Partial<User>) => void
  hasRole: (role: UserRole | UserRole[]) => boolean
}

// ─── Zustand Store dengan Persist ─────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user }),

      setToken: (token) => {
        setAuthToken(token)
        set({ token })
      },

      setLoading: (isLoading) => set({ isLoading }),

      loginSuccess: (user, token) => {
        setAuthToken(token)
        set({ user, token, isAuthenticated: true, isLoading: false })
      },

      logout: () => {
        clearAuthToken()
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (data) => {
        const current = get().user
        if (!current) return
        set({ user: { ...current, ...data } })
      },

      hasRole: (role) => {
        const user = get().user
        if (!user) return false
        if (Array.isArray(role)) return role.includes(user.role)
        return user.role === role
      },
    }),
    {
      name: 'economic-survival-auth',
      storage: createJSONStorage(() => localStorage),
      // Hanya persist data yang perlu — jangan simpan isLoading
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
