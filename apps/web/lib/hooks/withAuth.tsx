'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/types'
import { useAuth } from '@/lib/hooks/useAuth'

// ─── Props Interface ──────────────────────────────────────
interface WithAuthOptions {
  allowedRoles?: UserRole[]
  redirectTo?: string
}

// ─── Loading Skeleton ────────────────────────────────────
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-dark-void flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-text-muted text-sm">Memverifikasi sesi...</p>
      </div>
    </div>
  )
}

// ─── Higher-Order Component ───────────────────────────────
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
): React.ComponentType<P> {
  const {
    allowedRoles = [],
    redirectTo = '/login',
  } = options

  function ProtectedComponent(props: P) {
    const { isAuthenticated, isLoading, user } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (isLoading) return

      // Tidak login — redirect ke halaman login
      if (!isAuthenticated || !user) {
        const currentPath = window.location.pathname
        router.replace(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`)
        return
      }

      // Role tidak sesuai — redirect ke dashboard yang benar
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        const dashboardRoutes: Record<UserRole, string> = {
          farmer: '/farmer/dashboard',
          buyer:  '/buyer/orders',
          admin:  '/admin/dashboard',
        }
        router.replace(dashboardRoutes[user.role])
      }
    }, [isAuthenticated, isLoading, user, router])

    // Tampilkan loading saat mengecek autentikasi
    if (isLoading) {
      return <AuthLoadingScreen />
    }

    // Jika tidak terautentikasi, tampilkan null (redirect sedang berlangsung)
    if (!isAuthenticated || !user) {
      return null
    }

    // Cek role
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return null
    }

    return <Component {...props} />
  }

  ProtectedComponent.displayName = `withAuth(${Component.displayName ?? Component.name ?? 'Component'})`
  return ProtectedComponent
}

// ─── Hook alternatif untuk penggunaan di dalam komponen ──
export function useRequireAuth(allowedRoles?: UserRole[]): {
  user: ReturnType<typeof useAuth>['user']
  isLoading: boolean
  isAuthorized: boolean
} {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated || !user) {
      router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, user, router, allowedRoles])

  const isAuthorized =
    isAuthenticated &&
    !!user &&
    (!allowedRoles || allowedRoles.length === 0 || allowedRoles.includes(user.role))

  return { user, isLoading, isAuthorized }
}
