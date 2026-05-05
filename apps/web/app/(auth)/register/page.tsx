import type { Metadata } from 'next'
import Link from 'next/link'
import { Sprout, ShoppingBag, ArrowRight, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Daftar',
  description: 'Bergabung dengan Economic Survival sebagai petani atau pembeli.',
}

// ─── Kartu Pilihan Peran ──────────────────────────────────
function RoleCard({
  href,
  icon: Icon,
  title,
  subtitle,
  features,
  accent,
}: {
  href: string
  icon: React.ElementType
  title: string
  subtitle: string
  features: string[]
  accent: 'emerald' | 'harvest'
}) {
  const accentClasses = {
    emerald: {
      iconBg: 'bg-emerald-900/40 text-emerald-400',
      border: 'hover:border-emerald-500/40',
      glow: 'hover:shadow-glow-emerald',
      arrow: 'text-emerald-500',
      feature: 'text-emerald-400',
    },
    harvest: {
      iconBg: 'bg-harvest-900/40 text-harvest-400',
      border: 'hover:border-harvest-500/40',
      glow: 'hover:shadow-glow-harvest',
      arrow: 'text-harvest-500',
      feature: 'text-harvest-400',
    },
  }[accent]

  return (
    <Link
      href={href}
      className={`
        group block p-6 rounded-card bg-dark-surface border border-dark-border
        transition-all duration-300 cursor-pointer
        ${accentClasses.border} ${accentClasses.glow}
        hover:bg-dark-muted/50 hover:-translate-y-0.5
      `}
    >
      {/* Ikon & judul */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-button flex items-center justify-center ${accentClasses.iconBg}`}>
          <Icon size={24} />
        </div>
        <ArrowRight
          size={20}
          className={`${accentClasses.arrow} opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1`}
        />
      </div>

      {/* Teks */}
      <h3 className="font-display font-semibold text-lg text-text-primary mb-1">
        {title}
      </h3>
      <p className="text-text-muted text-sm mb-4 leading-relaxed">
        {subtitle}
      </p>

      {/* Fitur */}
      <ul className="space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
            <CheckCircle size={14} className={accentClasses.feature} />
            {f}
          </li>
        ))}
      </ul>
    </Link>
  )
}

// ─── Halaman Pilihan Registrasi ───────────────────────────
export default function RegisterPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="font-display font-bold text-display-sm text-text-primary">
          Bergabung Bersama Kami
        </h2>
        <p className="text-text-secondary text-sm">
          Pilih peran Anda di platform Economic Survival
        </p>
      </div>

      {/* Kartu Pilihan */}
      <div className="grid gap-4">
        <RoleCard
          href="/register/farmer"
          icon={Sprout}
          title="Saya Petani"
          subtitle="Jual hasil pertanian langsung ke pembeli tanpa perantara dengan harga yang lebih menguntungkan."
          accent="emerald"
          features={[
            'Buka toko online gratis',
            'Akses harga pasar real-time',
            'Dashboard analitik penjualan',
            'Negosiasi langsung via chat',
          ]}
        />

        <RoleCard
          href="/register/buyer"
          icon={ShoppingBag}
          title="Saya Pembeli"
          subtitle="Beli hasil bumi segar langsung dari petani lokal dengan harga terbaik dan kualitas terjamin."
          accent="harvest"
          features={[
            'Harga langsung dari petani',
            'Pilihan retail & grosir',
            'Chat langsung dengan petani',
            'Lacak pesanan real-time',
          ]}
        />
      </div>

      {/* Link ke login */}
      <p className="text-center text-sm text-text-secondary">
        Sudah punya akun?{' '}
        <Link
          href="/login"
          className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
        >
          Masuk sekarang
        </Link>
      </p>
    </div>
  )
}
