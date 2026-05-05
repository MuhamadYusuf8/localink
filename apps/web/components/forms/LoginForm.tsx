'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { UserRole } from '@/types'

// ─── Zod Schema ───────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .min(8, 'Password minimal 8 karakter'),
})

type LoginFormData = z.infer<typeof loginSchema>

// ─── Inner form that reads searchParams (must be inside Suspense) ──
function LoginFormInner() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, error, clearError } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect')
  const sessionExpired = searchParams.get('session') === 'expired'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    clearError()
    try {
      const user = await login(data.email, data.password)

      const dashboardRoutes: Record<UserRole, string> = {
        farmer: '/farmer/dashboard',
        buyer:  '/buyer/orders',
        admin:  '/admin/dashboard',
      }

      // Redirect: Prioritaskan dashboard untuk Farmer agar tidak 'nyasar' ke halaman buyer
      let destination = redirectPath ?? dashboardRoutes[user.role]
      
      // Jika role adalah farmer, abaikan redirect path agar selalu masuk ke dashboard petani
      if (user.role === 'farmer') {
        destination = dashboardRoutes.farmer
      }

      router.push(destination)
    } catch {
      // Error sudah ditangani oleh AuthContext
    }
  }

  const isSubmittingForm = isLoading || isSubmitting

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center md:text-left">
        <h2 className="font-display font-extrabold text-3xl text-slate-900 tracking-tight">
          Selamat Datang Kembali
        </h2>
        <p className="text-slate-500 text-sm font-medium">
          Masuk ke akun Localink Anda untuk melanjutkan
        </p>
      </div>

      {/* Notifikasi sesi kadaluarsa */}
      {sessionExpired && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium flex items-start gap-3 shadow-sm animate-fade-in">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p>Sesi Anda telah berakhir demi keamanan. Silakan masuk kembali.</p>
        </div>
      )}

      {/* Error dari server */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-start gap-3 shadow-sm animate-fade-in">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          id="login-email"
          type="email"
          label="Email"
          placeholder="petani@email.com"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-1.5">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Minimal 8 karakter"
            autoComplete="current-password"
            required
            error={errors.password?.message}
            rightAddon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none p-1"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            {...register('password')}
          />
          <div className="flex justify-end pt-1">
            <Link
              href="/forgot-password"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
            >
              Lupa password?
            </Link>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmittingForm}
            leftIcon={<LogIn size={18} />}
            className="shadow-[0_4px_12px_rgba(5,150,105,0.2)] font-bold text-[15px] h-12 bg-emerald-600 hover:bg-emerald-700"
          >
            Masuk ke Akun
          </Button>
        </div>
      </form>

      {/* Divider */}
      <div className="relative flex items-center gap-4 py-2">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Atau</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Link daftar */}
      <p className="text-center text-sm text-slate-500 font-medium">
        Belum memiliki akun?{' '}
        <Link
          href="/register"
          className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors ml-1"
        >
          Daftar Sekarang
        </Link>
      </p>
    </div>
  )
}

// ─── Public export — wrapped in Suspense to satisfy useSearchParams ──
export function LoginForm() {
  return (
    <Suspense fallback={
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-3/4 bg-slate-200 rounded-lg" />
          <div className="h-4 w-1/2 bg-slate-100 rounded-lg" />
        </div>
        <div className="space-y-5">
          <div className="h-14 bg-slate-50 border border-slate-200 rounded-xl" />
          <div className="h-14 bg-slate-50 border border-slate-200 rounded-xl" />
          <div className="h-12 bg-slate-200 rounded-xl mt-4" />
        </div>
      </div>
    }>
      <LoginFormInner />
    </Suspense>
  )
}