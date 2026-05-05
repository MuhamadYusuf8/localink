import type { Metadata } from 'next'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: {
    template: '%s | Localink',
    default: 'Autentikasi',
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Panel Kiri — Branding (Premium Light) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-slate-200">
        {/* Latar gradien terang */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-slate-50 to-emerald-100/40" />

        {/* Grid pattern dekoratif (subtle) */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
                linear-gradient(rgba(15,23,42,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(15,23,42,0.03) 1px, transparent 1px)
              `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Konten branding */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            <Image
              src="/images/localink-logo.png"
              alt="Localink"
              width={48}
              height={48}
              className="w-12 h-12 object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
                Localink
              </span>
              <span className="text-xs text-emerald-600 font-bold tracking-widest uppercase">Marketplace</span>
            </div>
          </Link>

          {/* Tagline utama */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-extrabold font-display leading-tight text-slate-900 tracking-tight">
                Marketplace Pertanian<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#059669] to-[#10B981]">Langsung dari Petani</span>
              </h1>
              <p className="text-slate-600 text-lg font-medium leading-relaxed max-w-md">
                Platform terpercaya yang menghubungkan petani lokal Indonesia
                dengan pembeli secara langsung. Harga transparan, kualitas terjamin.
              </p>
            </div>

            {/* Statistik platform */}
            <div className="grid grid-cols-3 gap-6 pt-4">
              {[
                { value: '12.000+', label: 'Petani Aktif' },
                { value: 'Rp 2,4M+', label: 'Transaksi Bulanan' },
                { value: '34 Provinsi', label: 'Jangkauan' },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <div className="font-display font-extrabold text-2xl text-[#059669] tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-slate-500 font-medium text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-slate-400 font-medium text-xs">
            © 2026 Localink. Membangun ketahanan pangan Indonesia.
          </p>
        </div>

        {/* Glow dekoratif (Lembut) */}
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Panel Kanan — Form Auth */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto bg-white lg:bg-[#F8FAFC] shadow-[-20px_0_40px_rgba(0,0,0,0.02)] z-20 relative">
        <div className="w-full max-w-md animate-fade-in">
          <Link href="/" className="flex items-center gap-3 mb-10 lg:hidden justify-center group">
            <Image
              src="/images/localink-logo.png"
              alt="Localink"
              width={40}
              height={40}
              className="w-10 h-10 object-contain transition-transform group-hover:scale-105"
            />
            <span className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
              Localink
            </span>
          </Link>

          {children}
        </div>
      </div>
    </div>
  )
}