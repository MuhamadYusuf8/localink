'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, User, Store, MapPin, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { registerFarmer } from '@/lib/api/auth'
import { setAuthToken } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/authStore'

// ─── Skema Validasi per Step ──────────────────────────────
const step1Schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(255),
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  phone: z
    .string()
    .min(10, 'Nomor telepon minimal 10 digit')
    .max(15, 'Nomor telepon terlalu panjang')
    .regex(/^[0-9+\-\s]+$/, 'Format nomor telepon tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi'),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Password tidak cocok',
  path: ['password_confirmation'],
})

const step2Schema = z.object({
  store_name: z.string().min(3, 'Nama toko minimal 3 karakter').max(255),
  bio: z.string().max(500, 'Bio maksimal 500 karakter').optional(),
})

const step3Schema = z.object({
  province: z.string().min(1, 'Provinsi wajib dipilih'),
  city: z.string().min(1, 'Kota/Kabupaten wajib diisi'),
  district: z.string().min(1, 'Kecamatan wajib diisi'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>
type Step3Data = z.infer<typeof step3Schema>
type AllFormData = Step1Data & Step2Data & Step3Data

// ─── Data Provinsi Indonesia ──────────────────────────────
const PROVINCES = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau',
  'Jambi', 'Sumatera Selatan', 'Bangka Belitung', 'Bengkulu', 'Lampung',
  'DKI Jakarta', 'Jawa Barat', 'Banten', 'Jawa Tengah', 'DI Yogyakarta',
  'Jawa Timur', 'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan',
  'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara', 'Gorontalo',
  'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tenggara',
  'Maluku', 'Maluku Utara', 'Papua Barat', 'Papua',
]

// ─── Step Indicator ───────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Data Pribadi',  icon: User },
  { id: 2, label: 'Info Toko',     icon: Store },
  { id: 3, label: 'Lokasi',        icon: MapPin },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const Icon = step.icon
        const done = current > step.id
        const active = current === step.id

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${done   ? 'bg-emerald-500 border-emerald-500 text-white' : ''}
                  ${active ? 'bg-dark-surface border-emerald-500 text-emerald-400' : ''}
                  ${!done && !active ? 'bg-dark-surface border-dark-border text-text-muted' : ''}
                `}
              >
                {done
                  ? <CheckCircle size={16} />
                  : <Icon size={16} />
                }
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${active ? 'text-emerald-400' : done ? 'text-text-secondary' : 'text-text-muted'}`}>
                {step.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 mx-2 transition-colors duration-500 ${current > step.id ? 'bg-emerald-500' : 'bg-dark-border'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Step 1 — Data Pribadi ────────────────────────────────
function Step1({
  onNext,
  defaultValues,
}: {
  onNext: (data: Step1Data) => void
  defaultValues: Partial<Step1Data>
}) {
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <Input id="reg-name" label="Nama Lengkap" placeholder="Budi Santoso" required error={errors.name?.message} {...register('name')} />
      <Input id="reg-email" type="email" label="Email" placeholder="budi@email.com" required autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Input
        id="reg-phone" type="tel" label="Nomor HP / WhatsApp"
        placeholder="08123456789" required error={errors.phone?.message}
        hint="Akan digunakan untuk verifikasi dan notifikasi pesanan"
        {...register('phone')}
      />
      <Input
        id="reg-password" type={showPass ? 'text' : 'password'}
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
        id="reg-confirm" type={showConfirm ? 'text' : 'password'}
        label="Konfirmasi Password" placeholder="Ulangi password" required
        error={errors.password_confirmation?.message}
        rightAddon={
          <button type="button" onClick={() => setShowConfirm(v => !v)} className="text-text-muted hover:text-text-secondary">
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
        {...register('password_confirmation')}
      />
      <Button type="submit" variant="primary" size="lg" fullWidth rightIcon={<ArrowRight size={16} />}>
        Lanjutkan
      </Button>
    </form>
  )
}

// ─── Step 2 — Info Toko ───────────────────────────────────
function Step2({
  onNext,
  onBack,
  defaultValues,
}: {
  onNext: (data: Step2Data) => void
  onBack: () => void
  defaultValues: Partial<Step2Data>
}) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues,
  })

  const bioLength = watch('bio')?.length ?? 0

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <Input
        id="reg-store" label="Nama Toko / Kebun" placeholder="Kebun Segar Pak Budi"
        required error={errors.store_name?.message}
        hint="Nama ini akan ditampilkan di halaman toko Anda"
        {...register('store_name')}
      />
      <div>
        <Textarea
          id="reg-bio" label="Deskripsi Toko (Opsional)"
          placeholder="Ceritakan tentang kebun dan produk unggulan Anda..."
          rows={4} error={errors.bio?.message}
          {...register('bio')}
        />
        <p className="text-xs text-text-muted mt-1 text-right">{bioLength}/500</p>
      </div>

      <div className="p-4 rounded-button bg-dark-muted/50 border border-dark-border">
        <p className="text-xs text-text-muted leading-relaxed">
          💡 <strong className="text-text-secondary">Tips:</strong> Toko dengan deskripsi lengkap mendapat{' '}
          <span className="text-emerald-400">3× lebih banyak</span> kunjungan dari pembeli.
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="secondary" size="lg" onClick={onBack} leftIcon={<ArrowLeft size={16} />} className="flex-1">
          Kembali
        </Button>
        <Button type="submit" variant="primary" size="lg" rightIcon={<ArrowRight size={16} />} className="flex-1">
          Lanjutkan
        </Button>
      </div>
    </form>
  )
}

// ─── Step 3 — Lokasi ──────────────────────────────────────
function Step3({
  onSubmit,
  onBack,
  defaultValues,
  isLoading,
  serverError,
}: {
  onSubmit: (data: Step3Data) => void
  onBack: () => void
  defaultValues: Partial<Step3Data>
  isLoading: boolean
  serverError: string | null
}) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues,
  })

  // Deteksi lokasi otomatis dari browser
  const handleDetectLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitude', pos.coords.latitude)
        setValue('longitude', pos.coords.longitude)
      },
      () => {/* Abaikan jika ditolak */}
    )
  }

  const lat = watch('latitude')
  const lng = watch('longitude')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="p-3 rounded-button bg-red-900/30 border border-red-900/60 text-red-400 text-sm">
          {serverError}
        </div>
      )}

      {/* Provinsi */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-province" className="form-label">
          Provinsi <span className="text-status-error">*</span>
        </label>
        <select
          id="reg-province"
          className="input-base h-10"
          {...register('province')}
        >
          <option value="">-- Pilih Provinsi --</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        {errors.province && (
          <p className="text-xs text-status-error">{errors.province.message}</p>
        )}
      </div>

      <Input
        id="reg-city" label="Kota / Kabupaten" placeholder="Bandung"
        required error={errors.city?.message} {...register('city')}
      />
      <Input
        id="reg-district" label="Kecamatan" placeholder="Lembang"
        required error={errors.district?.message} {...register('district')}
      />

      {/* Deteksi lokasi GPS */}
      <div className="p-4 rounded-button bg-dark-surface border border-dark-border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Koordinat Lokasi (Opsional)</p>
            <p className="text-xs text-text-muted">Membantu pembeli di dekat Anda menemukan toko Anda</p>
          </div>
          <Button
            type="button" variant="ghost" size="sm"
            leftIcon={<MapPin size={14} />}
            onClick={handleDetectLocation}
          >
            Deteksi
          </Button>
        </div>
        {lat && lng && (
          <p className="text-xs font-mono text-emerald-400">
            ✓ Lokasi terdeteksi: {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" size="lg" onClick={onBack} leftIcon={<ArrowLeft size={16} />} className="flex-1">
          Kembali
        </Button>
        <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="flex-1">
          Daftar Sekarang
        </Button>
      </div>

      <p className="text-xs text-text-muted text-center leading-relaxed">
        Dengan mendaftar, Anda menyetujui{' '}
        <Link href="/terms" className="text-emerald-500 hover:underline">Syarat & Ketentuan</Link>
        {' '}dan{' '}
        <Link href="/privacy" className="text-emerald-500 hover:underline">Kebijakan Privasi</Link>{' '}kami.
      </p>
    </form>
  )
}

// ─── Komponen Utama Wizard ────────────────────────────────
export function FarmerRegisterForm() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<AllFormData>>({})
  const router = useRouter()
  const { loginSuccess } = useAuthStore()

  const handleStep1 = (data: Step1Data) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setStep(2)
  }

  const handleStep2 = (data: Step2Data) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setStep(3)
  }

  const handleStep3 = async (data: Step3Data) => {
    const allData = { ...formData, ...data } as AllFormData
    setIsLoading(true)
    setServerError(null)

    try {
      const authData = await registerFarmer(allData)
      setAuthToken(authData.token)
      loginSuccess(authData.user, authData.token)
      router.push('/farmer/dashboard?welcome=true')
    } catch (err: any) {
      const msg = err?.error?.message ?? err?.message ?? 'Pendaftaran gagal. Coba lagi.'
      
      // Handle Laravel's default validation errors if any
      const validationErrors = err?.error?.details ?? err?.errors
      if (validationErrors && Object.keys(validationErrors).length > 0) {
        const firstKey = Object.keys(validationErrors)[0]
        const firstMsg = validationErrors[firstKey][0]
        setServerError(`${msg} (${firstMsg})`)
      } else {
        setServerError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-display font-bold text-display-sm text-text-primary">
          Daftar sebagai Petani
        </h2>
        <p className="text-text-secondary text-sm">
          Lengkapi data berikut untuk membuka toko Anda
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator current={step} />

      {/* Step Content */}
      {step === 1 && (
        <Step1 onNext={handleStep1} defaultValues={formData} />
      )}
      {step === 2 && (
        <Step2 onNext={handleStep2} onBack={() => setStep(1)} defaultValues={formData} />
      )}
      {step === 3 && (
        <Step3
          onSubmit={handleStep3}
          onBack={() => setStep(2)}
          defaultValues={formData}
          isLoading={isLoading}
          serverError={serverError}
        />
      )}

      {/* Link ke login */}
      <p className="text-center text-sm text-text-secondary">
        Sudah punya akun?{' '}
        <Link href="/login" className="text-emerald-500 hover:text-emerald-400 font-medium">
          Masuk di sini
        </Link>
      </p>
    </div>
  )
}
