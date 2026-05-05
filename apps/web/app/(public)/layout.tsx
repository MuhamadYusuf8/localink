'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, LogOut, Package, MessagesSquare, UserRound } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useCartStore } from '@/lib/store/cartStore'
import { Button } from '@/components/ui/Button'
import ForumNotificationBell from '@/components/forum/ForumNotificationBell'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth()
  const { summary, fetchCart } = useCartStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'buyer') {
      fetchCart()
    }
  }, [isAuthenticated, user, fetchCart])

  return (
    // bg-dark-void → bg-[#F8FAF9]
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col animate-fade-in">

      {/* Navbar Publik */}
      {/* bg-dark-surface/90 border-dark-border → bg-white/95 border-[#D1E8DF] + shadow lebih terang */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-[#D1E8DF] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between gap-4">

          {/* Logo Localink (Icon + Text) */}
          <Link href="/" className="flex items-center gap-3.5 shrink-0 group">
            <Image
              src="/images/localink-logo.png"
              alt="Localink Logo"
              width={48}
              height={48}
              className="w-12 h-12 object-contain transition-transform group-hover:scale-105"
              priority
            />
            <div className="hidden sm:block leading-tight">
              <span className="font-display font-bold text-xl text-[#0F1F1A] block tracking-tight">
                Localink
              </span>
              <span className="text-[11px] text-emerald-600 font-bold tracking-[0.1em] uppercase">Marketplace</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 px-4">
            {[
              { label: 'Produk', href: '/products' },
              { label: 'Harga Pasar', href: '/market-prices' },
              { label: 'Terdekat', href: '/farmers/nearby' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                // text-text-secondary → text-[#1A3329], hover tetap emerald
                className="text-[13px] font-semibold text-[#1A3329] hover:text-emerald-600 transition-colors relative group py-2"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 transition-all group-hover:w-full" />
              </Link>
            ))}
            {/* text-text-secondary → text-[#1A3329] */}
            <Link href="/forum" className="text-[13px] font-semibold text-[#1A3329] hover:text-emerald-600 transition-colors flex items-center gap-2 group py-2">
              Forum
              {/* badge Forum BARU — bg lebih solid agar kontras di background terang */}
              <span className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-full border border-emerald-200 font-bold group-hover:bg-emerald-100 transition-colors">
                BARU
              </span>
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                {/* text-text-muted → text-[#4B7A67] */}
                <svg className="w-4 h-4 text-[#4B7A67] group-focus-within:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {/* bg-dark-muted border-dark-border focus:bg-dark-surface → bg-[#F1F5F3] border-[#D1E8DF] focus:bg-white */}
              <input
                type="text"
                placeholder="Cari sayuran, beras, atau petani..."
                className="w-full h-10 pl-10 pr-4 rounded-button bg-[#F1F5F3] border border-[#D1E8DF] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white focus:outline-none transition-all text-xs font-medium text-[#0F1F1A] placeholder:text-[#6B9E8A]"
              />
            </div>
          </div>

          {/* Right Section: Auth & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {!isMounted ? (
              <div className="flex items-center gap-3">
                {/* skeleton: bg-dark-muted → bg-[#E8F0ED] */}
                <div className="h-9 w-24 rounded-button bg-[#E8F0ED] animate-pulse" />
              </div>
            ) : isAuthenticated ? (
              <>
                <div className="flex items-center gap-1 sm:gap-2 mr-2">
                  {user?.role === 'buyer' && (
                    // text-text-muted hover:text-emerald-400 hover:bg-emerald-500/10 → disesuaikan light
                    <Link href="/buyer/cart" className="relative text-[#4B7A67] hover:text-emerald-600 transition-all p-2 hover:bg-emerald-50 rounded-button">
                      <ShoppingCart size={19} />
                      {summary.total_items > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-sm">
                          {summary.total_items}
                        </span>
                      )}
                    </Link>
                  )}

                  {(user?.role === 'buyer' || user?.role === 'farmer') && (
                    <Link
                      href="/buyer/messages"
                      className="text-[#4B7A67] hover:text-emerald-600 transition-all p-2 hover:bg-emerald-50 rounded-button"
                      title="Pesan"
                    >
                      <MessagesSquare size={19} />
                    </Link>
                  )}

                  <ForumNotificationBell />
                </div>

                {/* border-dark-border → border-[#D1E8DF] */}
                <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-[#D1E8DF]">
                  <div className="text-right hidden lg:block leading-tight">
                    {/* text-text-primary → text-[#0F1F1A] */}
                    <p className="text-[13px] font-bold text-[#0F1F1A] max-w-[120px] truncate">{user?.name}</p>
                    {/* text-emerald-500 → text-emerald-600 (lebih gelap agar kontras di bg terang) */}
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-tight">{user?.role}</p>
                  </div>

                  {user?.role === 'farmer' ? (
                    <Link href="/farmer/dashboard" className="hidden sm:block">
                      <Button variant="primary" size="sm" className="h-9 shadow-md">Dashboard</Button>
                    </Link>
                  ) : user?.role === 'admin' ? (
                    <Link href="/admin/dashboard" className="hidden sm:block">
                      <Button variant="primary" size="sm" className="h-9 shadow-md">Admin</Button>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Link href="/buyer/account">
                        {/* text-text-muted → text-[#4B7A67] */}
                        <button className="p-2 text-[#4B7A67] hover:text-emerald-600 transition-colors" title="Akun Saya">
                          <UserRound size={19} />
                        </button>
                      </Link>
                      <Link href="/buyer/orders" className="hidden sm:block">
                        <button className="p-2 text-[#4B7A67] hover:text-emerald-600 transition-colors" title="Pesanan Saya">
                          <Package size={19} />
                        </button>
                      </Link>
                      {/* hover:text-red-600 tetap — sudah kontras di bg terang */}
                      <button
                        onClick={() => logout()}
                        className="p-2 text-[#4B7A67] hover:text-red-500 transition-colors"
                        title="Keluar"
                      >
                        <LogOut size={19} />
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-xs font-bold">Masuk</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm" className="h-9 text-xs font-bold px-5 shadow-md">Daftar</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Konten Halaman */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer Publik */}
      {/* bg-dark-surface border-dark-border → bg-white border-[#D1E8DF] */}
      <footer className="bg-white border-t border-[#D1E8DF] mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/images/localink-logo.png"
                  alt="Localink"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
                {/* text-text-primary → text-[#0F1F1A] */}
                <span className="font-display font-bold text-lg text-[#0F1F1A]">
                  Localink
                </span>
              </div>
              {/* text-text-secondary → text-[#1A3329] */}
              <p className="text-sm text-[#1A3329] leading-relaxed max-w-sm">
                Menghubungkan petani lokal Indonesia dengan pembeli secara langsung untuk rantai pasok pangan yang lebih adil dan transparan.
              </p>
            </div>

            <div>
              {/* text-text-primary → text-[#0F1F1A] */}
              <h4 className="font-medium text-[#0F1F1A] mb-4">Layanan</h4>
              {/* text-text-muted hover:text-emerald-500 → text-[#4B7A67] hover:text-emerald-600 */}
              <ul className="space-y-2 text-sm text-[#4B7A67]">
                <li><Link href="/register/farmer" className="hover:text-emerald-600">Buka Toko Petani</Link></li>
                <li><Link href="/register/buyer" className="hover:text-emerald-600">Beli Grosir</Link></li>
                <li><Link href="/market-prices" className="hover:text-emerald-600">Cek Harga Pasar</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-[#0F1F1A] mb-4">Bantuan</h4>
              <ul className="space-y-2 text-sm text-[#4B7A67]">
                <li><Link href="/faq" className="hover:text-emerald-600">FAQ</Link></li>
                <li><Link href="/terms" className="hover:text-emerald-600">Syarat & Ketentuan</Link></li>
                <li><Link href="/privacy" className="hover:text-emerald-600">Kebijakan Privasi</Link></li>
              </ul>
            </div>
          </div>

          {/* border-dark-border → border-[#D1E8DF] | text-text-muted → text-[#4B7A67] */}
          <div className="mt-12 pt-8 border-t border-[#D1E8DF] text-center text-xs text-[#4B7A67]">
            &copy; {new Date().getFullYear()} Localink. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}