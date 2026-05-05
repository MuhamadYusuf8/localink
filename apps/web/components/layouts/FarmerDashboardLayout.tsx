'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingBag, BarChart2, Star,
  Settings, ChevronLeft, ChevronRight,
  Bell, LogOut, Store, Menu, X, MessagesSquare, MessageCircle,
  ShoppingCart, TrendingUp, Search, ChevronDown
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/lib/hooks/useAuth'
import { MarketPriceTicker } from '@/components/ui/MarketPriceTicker'
import ForumNotificationBell from '@/components/forum/ForumNotificationBell'
import type { MarketPrice } from '@/types'

// ─── Design Tokens (Premium Light Theme) ──────────────────
const C = {
  bgApp: '#F8FAFC',       // Slate 50
  bgCard: '#FFFFFF',      // Putih Bersih
  bgInput: '#F1F5F9',     // Slate 100
  border: '#E2E8F0',      // Slate 200
  textMain: '#0F172A',    // Slate 900
  textSecondary: '#334155',// Slate 700
  textMuted: '#64748B',   // Slate 500
  textSubtle: '#94A3B8',  // Slate 400
  primary: '#059669',     // Emerald 600
  primaryGlow: 'rgba(5, 150, 105, 0.08)',
  primaryBorder: 'rgba(5, 150, 105, 0.25)',
};

// ─── Nav Items ────────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/farmer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/farmer/products', label: 'Produk', icon: Package },
  { href: '/farmer/orders', label: 'Pesanan', icon: ShoppingCart },
  { href: '/farmer/messages', label: 'Pesan Chat', icon: MessageCircle },
  { href: '/farmer/analytics', label: 'Analitik', icon: BarChart2 },
  { href: '/farmer/subscription', label: 'Langganan', icon: Star },
  { href: '/forum', label: 'Forum Diskusi', icon: MessagesSquare },
]

// ─── Sidebar Item ─────────────────────────────────────────
function SidebarItem({
  href, label, icon: Icon, collapsed, active,
}: {
  href: string; label: string; icon: React.ElementType
  collapsed: boolean; active: boolean
}) {
  return (
    <Link
      href={href}
      className={clsx(
        'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer font-medium',
        active 
          ? 'bg-[#ECFDF5] text-[#059669]' 
          : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]',
        collapsed && 'justify-center px-2'
      )}
      title={collapsed ? label : undefined}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 2} className="flex-shrink-0" />
      {!collapsed && <span className="text-[14px]">{label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#0F172A] text-white text-[12px] rounded-lg
                        opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-lg font-semibold">
          {label}
        </div>
      )}
    </Link>
  )
}

// ─── Sidebar ──────────────────────────────────────────────
function Sidebar({
  collapsed, onToggle, onClose, mobile,
}: {
  collapsed: boolean; onToggle: () => void; onClose?: () => void; mobile?: boolean
}) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside
      className={clsx(
        'flex flex-col bg-white border-r border-[#E2E8F0] h-full transition-all duration-300 shadow-[2px_0_10px_rgba(0,0,0,0.02)]',
        collapsed ? 'w-20' : 'w-64',
        mobile && 'w-72'
      )}
    >
      {/* Logo */}
      <div className={clsx(
        'flex items-center border-b border-[#E2E8F0] px-5 h-[72px] flex-shrink-0',
        collapsed ? 'justify-center px-0' : 'gap-3'
      )}>
        <div className="w-10 h-10 bg-gradient-to-br from-[#059669] to-[#10B981] rounded-xl flex-shrink-0 flex items-center justify-center shadow-[0_4px_12px_rgba(5,150,105,0.2)]">
          <span className="text-white font-extrabold text-[15px] font-display">ES</span>
        </div>
        {!collapsed && (
          <span className="font-display font-extrabold text-[16px] text-[#0F172A] truncate tracking-tight">
            Economic Survival
          </span>
        )}
        {mobile && (
          <button onClick={onClose} className="ml-auto text-[#64748B] hover:text-[#0F172A] p-2 bg-[#F1F5F9] rounded-lg">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Profil petani */}
      {!collapsed && (
        <div className="px-5 py-5 border-b border-[#E2E8F0] flex-shrink-0 bg-[#F8FAFC]/50">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Store size={20} className="text-[#059669]" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-[#0F172A] truncate">
                {user?.farmerProfile?.store_name ?? user?.name}
              </p>
              <p className="text-[12px] font-medium text-[#64748B] truncate mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            collapsed={collapsed && !mobile}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className={clsx('px-3 py-5 border-t border-[#E2E8F0] space-y-1.5 flex-shrink-0 bg-[#F8FAFC]/50')}>
        <Link
          href="/farmer/settings"
          className={clsx('group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]', collapsed && !mobile && 'justify-center px-2')}
        >
          <Settings size={20} />
          {(!collapsed || mobile) && <span className="text-[14px]">Pengaturan</span>}
        </Link>
        <button
          onClick={() => logout()}
          className={clsx('w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer font-medium text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#EF4444]', collapsed && !mobile && 'justify-center px-2')}
        >
          <LogOut size={20} />
          {(!collapsed || mobile) && <span className="text-[14px]">Keluar</span>}
        </button>

        {/* Toggle collapse (hanya desktop) */}
        {!mobile && (
          <button
            onClick={onToggle}
            className="w-full flex justify-center items-center p-2 mt-4 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors"
            title={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          >
            {collapsed ? <ChevronRight size={18} strokeWidth={2.5} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
          </button>
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #E2E8F0; border-radius: 10px; }
      `}</style>
    </aside>
  )
}

// ─── Top Bar ──────────────────────────────────────────────
function TopBar({
  title, subtitle, actions, onMenuClick,
  marketPrices,
}: {
  title?: string; subtitle?: string
  actions?: React.ReactNode; onMenuClick: () => void
  marketPrices?: MarketPrice[]
}) {
  const { user } = useAuth()

  return (
    <div className="flex-shrink-0 sticky top-0 z-30">
      {/* Top Bar */}
      <div className="backdrop-blur-xl bg-white/85 border-b border-[#E2E8F0] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between px-8 h-[72px] gap-6">
          <div className="flex items-center gap-6 flex-1">
            <button
              onClick={onMenuClick}
               className="lg:hidden p-2.5 text-[#64748B] hover:text-[#0F172A] transition-colors bg-[#F1F5F9] rounded-xl border border-[#E2E8F0]"
            >
              <Menu size={22} />
            </button>

            <div className="hidden sm:flex flex-col">
              <h2 className="text-[16px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
                {title || 'Dashboard'}
              </h2>
              {subtitle && <p className="text-[11px] text-[#64748B] font-bold mt-0.5">{subtitle}</p>}
            </div>

            {/* Aesthetic Search Bar */}
            <div className="hidden lg:flex items-center flex-1 max-w-md ml-8">
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#059669] transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Cari transaksi atau bantuan..."
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-full py-2.5 pl-12 pr-5 text-[13.5px] font-medium text-[#0F172A] focus:outline-none focus:border-[#059669]/50 focus:bg-white focus:ring-4 focus:ring-[#059669]/10 transition-all placeholder:text-[#94A3B8] shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] shadow-sm">
              <div className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
              <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">Live Sync</span>
            </div>

            <div className="h-8 w-[1px] bg-[#E2E8F0] mx-2 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="text-[#64748B] hover:text-[#059669] p-1 rounded-lg hover:bg-[#F1F5F9] transition-all">
                <ForumNotificationBell />
              </div>
              <button className="p-2 text-[#64748B] hover:text-[#059669] hover:bg-[#F1F5F9] rounded-lg transition-all">
                <Settings size={20} strokeWidth={2.2} />
              </button>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-[#E2E8F0] ml-1">
              <div className="text-right hidden sm:block">
                <p className="text-[13px] font-bold text-[#0F172A] leading-tight mb-0.5">{user?.name || 'Petani'}</p>
                <div className="flex items-center justify-end gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                  <p className="text-[9px] text-[#059669] font-extrabold uppercase tracking-widest">Pro Seller</p>
                </div>
              </div>
              <button className="flex items-center gap-1 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#059669] to-[#10B981] flex items-center justify-center text-white font-extrabold text-[15px] shadow-[0_4px_10px_rgba(5,150,105,0.2)] group-hover:scale-105 transition-transform duration-200">
                  {user?.name?.[0] || 'P'}
                </div>
                <ChevronDown size={16} strokeWidth={2.5} className="text-[#94A3B8] group-hover:text-[#0F172A] transition-colors ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Market Price Ticker Integrated */}
      {marketPrices && marketPrices.length > 0 && (
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] overflow-hidden py-1">
          <MarketPriceTicker prices={marketPrices} />
        </div>
      )}
    </div>
  )
}

// ─── Farmer Dashboard Layout ──────────────────────────────
export interface FarmerLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  marketPrices?: MarketPrice[]
}

export function FarmerDashboardLayout({
  children, title, subtitle, actions, marketPrices,
}: FarmerLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden text-[#0F172A] font-inter">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-shrink-0 z-40">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 flex shadow-2xl">
            <Sidebar collapsed={false} onToggle={() => { }} onClose={() => setMobileOpen(false)} mobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          title={title}
          subtitle={subtitle}
          actions={actions}
          onMenuClick={() => setMobileOpen(true)}
          marketPrices={marketPrices}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="p-8 max-w-[1600px] mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}