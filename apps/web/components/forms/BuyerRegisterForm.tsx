'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { registerBuyer } from '@/lib/api/auth'
import { setAuthToken } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/authStore'
import type { BuyerType } from '@/types'

// ─── Zod Schema ───────────────────────────────────────────
const buyerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi'),
  buyer_type: z.enum(['retail', 'wholesale']),
  company_name: z.string().optional(),
  tax_id: z.string().optional(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Password tidak cocok',
  path: ['password_confirmation'],
})

type BuyerFormData = z.infer<typeof buyerSchema>

// ─── Komponen Form Daftar Pembeli ─────────────────────────
export function BuyerRegisterForm() {
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()
  const { loginSuccess } = useAuthStore()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BuyerFormData>({
    resolver: zodResolver(buyerSchema),
    defaultValues: { buyer_type: 'retail' },
  })

  const buyerType = watch('buyer_type') as BuyerType

  const onSubmit = async (data: BuyerFormData) => {
    setIsLoading(true)
    setServerError(null)
    try {
      const authData = await registerBuyer(data)
      setAuthToken(authData.token)
      loginSuccess(authData.user, authData.token)
      router.push('/products?welcome=true')
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } }
      setServerError(apiErr?.error?.message ?? 'Pendaftaran gagal. Coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h2 className="font-display font-bold text-display-sm text-text-primary">
          Daftar sebagai Pembeli
        </h2>
        <p className="text-text-secondary text-sm">
          Beli hasil bumi segar langsung dari petani lokal
        </p>
      </div>

      {serverError && (
        <div className="p-3 rounded-button bg-red-900/30 border border-red-900/60 text-red-400 text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input id="buyer-name" label="Nama Lengkap" placeholder="Siti Rahayu" required error={errors.name?.message} {...register('name')} />
        <Input id="buyer-email" type="email" label="Email" placeholder="siti@email.com" required error={errors.email?.message} {...register('email')} />

        <Input
          id="buyer-pass" type={showPass ? 'text' : 'password'}
          label="Password" placeholder="Minimal 8 karakter" required
          error={errors.password?.message}
          rightAddon={
            <button type="button" onClick={() => setShowPass(v => !v)} className="text-text-muted hover:text-text-secondary">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          {...register('password')}
        />

        <Input
          id="buyer-confirm" type={showConfirm ? 'text' : 'password'}
          label="Konfirmasi Password" placeholder="Ulangi password" required
          error={errors.password_confirmation?.message}
          rightAddon={
            <button type="button" onClick={() => setShowConfirm(v => !v)} className="text-text-muted hover:text-text-secondary">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          {...register('password_confirmation')}
        />

        {/* Tipe Pembeli */}
        <div className="space-y-2">
          <label className="form-label">Tipe Pembelian</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'retail', label: 'Retail', desc: 'Beli satuan/eceran' },
              { value: 'wholesale', label: 'Grosir', desc: 'Beli dalam jumlah besar' },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`
                  flex flex-col gap-1 p-3 rounded-button border cursor-pointer transition-all
                  ${buyerType === opt.value
                    ? 'border-emerald-500 bg-emerald-900/20 text-emerald-400'
                    : 'border-dark-border bg-dark-surface text-text-secondary hover:border-dark-muted'
                  }
                `}
              >
                <input type="radio" value={opt.value} className="sr-only" {...register('buyer_type')} />
                <span className="font-medium text-sm">{opt.label}</span>
                <span className="text-xs opacity-70">{opt.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Field khusus Grosir */}
        {buyerType === 'wholesale' && (
          <div className="space-y-4 p-4 bg-dark-muted/30 rounded-button border border-dark-border animate-fade-in">
            <p className="text-xs text-harvest-400 font-medium">Informasi Perusahaan/Usaha</p>
            <Input id="buyer-company" label="Nama Perusahaan / Usaha" placeholder="PT Segar Nusantara" error={errors.company_name?.message} {...register('company_name')} />
            <Input id="buyer-tax" label="NPWP (Opsional)" placeholder="00.000.000.0-000.000" hint="Wajib untuk faktur pajak" error={errors.tax_id?.message} {...register('tax_id')} />
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading} leftIcon={<ShoppingBag size={18} />}>
          Buat Akun Pembeli
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Sudah punya akun?{' '}
        <Link href="/login" className="text-emerald-500 hover:text-emerald-400 font-medium">
          Masuk di sini
        </Link>
      </p>
    </div>
  )
}
