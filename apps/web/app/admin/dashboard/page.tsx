'use client'

import React, { useEffect, useState } from 'react'
import { 
  Users, ShoppingBag, TrendingUp, AlertTriangle, 
  LogOut, DollarSign, Package, Activity, ArrowUpRight,
  ShieldCheck, Clock, BarChart3
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import apiClient from '@/lib/api/client'
import { formatIDR } from '@/lib/utils/currency'
import { clsx } from 'clsx'

// ─── Tipe Data ─────────────────────────────────────────────
interface AdminMetrics {
  total_farmers: number
  total_buyers: number
  total_products: number
  gross_merchandise_value: number
  platform_revenue: number
}

interface RecentOrder {
  id: string
  total_amount: number
  platform_commission: number
  status: string
  created_at: string
  buyer: { id: string; name: string }
  farmer: { id: string; store_name: string }
}

interface AdminDashboardData {
  metrics: AdminMetrics
  recent_orders: RecentOrder[]
}

// ─── Design Tokens (Premium Light) ──────────────────────────
const C = {
  bgApp: '#F8FAFC',       // Slate 50
  bgCard: '#FFFFFF',      // White
  border: '#E2E8F0',      // Slate 200
  textMain: '#0F172A',    // Slate 900
  textSecondary: '#475569',// Slate 600
  textMuted: '#94A3B8',   // Slate 400
  emerald: '#059669',     // Emerald 600
  indigo: '#4F46E5',      // Indigo 600
}

// ─── Komponen StatCard Premium ─────────────────────────────
function StatCard({ title, value, icon: Icon, colorClass, gradientClass, delay }: {
  title: string; value: string | number; icon: React.ElementType; colorClass: string; gradientClass: string; delay: number
}) {
  return (
    <div 
      className={clsx(
        "relative p-7 rounded-3xl overflow-hidden group animate-slide-up",
        "bg-white border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)]",
        "transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Subtle Pastel Glow */}
      <div className={clsx(
        "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-10 transition-opacity duration-500 group-hover:opacity-20",
        gradientClass
      )} />
      
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div className={clsx(
          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border",
          colorClass
        )}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
          <TrendingUp size={12} strokeWidth={3} />
          <span>Live</span>
        </div>
      </div>
      
      <div className="relative z-10">
        <h3 className="font-display font-extrabold text-3xl text-slate-900 tracking-tight mb-2">
          {value}
        </h3>
        <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">{title}</p>
      </div>
    </div>
  )
}

// ─── Status Badge Premium ──────────────────────────────────
function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string, text: string, border: string, dot: string }> = {
    pending_payment: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    processing: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    shipped: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  }
  
  const labels: Record<string, string> = {
    pending_payment: 'Menunggu',
    processing: 'Diproses',
    shipped: 'Dikirim',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  }

  const s = styles[status] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' }

  return (
    <span className={clsx(
      "px-3 py-1.5 rounded-lg text-[11px] font-bold border flex items-center w-fit gap-2 uppercase tracking-wider shadow-sm",
      s.bg, s.text, s.border
    )}>
      <span className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", s.dot)} />
      {labels[status] || status}
    </span>
  )
}

// ─── Halaman Utama ─────────────────────────────────────────
export default function AdminDashboardPage() {
  const { user, logout } = useAuth()
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/admin/dashboard/stats')
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-emerald-100 font-inter pb-20">
      
      {/* Premium Gradient Background Ornaments */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50 rounded-full blur-[120px] pointer-events-none opacity-60" />
      <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-blue-50 rounded-full blur-[100px] pointer-events-none opacity-40" />

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1500px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(5,150,105,0.25)] border border-emerald-400/20 transition-transform hover:scale-105">
              <ShieldCheck className="text-white" size={24} strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-display font-extrabold text-xl text-slate-900 tracking-tight leading-none block">
                Command Center
              </span>
              <span className="text-[10px] font-extrabold text-emerald-600 tracking-widest uppercase mt-1 block">System Administrator</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Cloud Engine Online</span>
            </div>
            
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            
            <div className="flex items-center gap-5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-extrabold text-slate-900 leading-tight">{user?.name}</p>
                <p className="text-[11px] font-medium text-slate-500">{user?.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logout()} 
                className="hover:bg-red-50 hover:text-red-600 text-slate-500 transition-all rounded-xl px-4 font-bold border border-transparent hover:border-red-100"
              >
                <LogOut size={18} className="mr-2" strokeWidth={2.5} />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1500px] mx-auto px-8 py-12 relative z-10">
        <div className="mb-12 animate-fade-in">
          <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight text-slate-900 mb-3">
            Dashboard <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Utama</span>
          </h1>
          <p className="text-[16px] text-slate-500 font-medium max-w-2xl leading-relaxed">
            Pantau arus kas, pertumbuhan pengguna, dan kesehatan ekosistem pertanian digital Localink secara real-time.
          </p>
        </div>

        {isLoading || !data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-48 rounded-3xl bg-white border border-slate-100 shadow-sm animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
            <StatCard 
              title="Gross Merchandise Value" 
              value={formatIDR(data.metrics.gross_merchandise_value)} 
              icon={DollarSign} 
              colorClass="bg-emerald-50 text-emerald-600 border-emerald-100"
              gradientClass="bg-emerald-500"
              delay={0}
            />
            <StatCard 
              title="Platform Revenue (Fee)" 
              value={formatIDR(data.metrics.platform_revenue)} 
              icon={BarChart3} 
              colorClass="bg-blue-50 text-blue-600 border-blue-100"
              gradientClass="bg-blue-500"
              delay={100}
            />
            <StatCard 
              title="Total Pengguna Aktif" 
              value={(data.metrics.total_buyers + data.metrics.total_farmers).toLocaleString('id-ID')} 
              icon={Users} 
              colorClass="bg-indigo-50 text-indigo-600 border-indigo-100"
              gradientClass="bg-indigo-500"
              delay={200}
            />
            <StatCard 
              title="Katalog Produk" 
              value={data.metrics.total_products.toLocaleString('id-ID')} 
              icon={Package} 
              colorClass="bg-amber-50 text-amber-600 border-amber-100"
              gradientClass="bg-amber-500"
              delay={300}
            />
          </div>
        )}

        {/* Recent Orders Section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-sm">
                <Activity size={20} strokeWidth={2.5} />
              </div>
              <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
                Log Transaksi Terbaru
              </h2>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-5 shadow-sm">
              Ekspor Data
              <ArrowUpRight size={16} className="ml-2" strokeWidth={2.5} />
            </Button>
          </div>

          <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.03)] transition-all">
            {isLoading || !data ? (
              <div className="p-20 flex flex-col justify-center items-center h-64 gap-4">
                <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-medium animate-pulse">Menghubungkan ke database...</p>
              </div>
            ) : data.recent_orders.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                  <Clock size={40} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Belum ada transaksi</h3>
                <p className="text-slate-500 mt-2 font-medium">Log transaksi otomatis akan muncul saat pembeli melakukan pemesanan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <th className="px-8 py-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">ID Transaksi</th>
                      <th className="px-8 py-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Pihak Terlibat</th>
                      <th className="px-8 py-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Nilai Gross</th>
                      <th className="px-8 py-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Fee Platform</th>
                      <th className="px-8 py-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recent_orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="font-mono text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 w-fit">
                            #{order.id.split('-')[0].toUpperCase()}
                          </div>
                          <div className="text-[11px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 uppercase tracking-tighter">
                            <Clock size={12} /> {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-bold text-[15px] text-slate-900">{order.farmer.store_name}</div>
                          <div className="text-[13px] text-slate-500 flex items-center gap-2 mt-1 font-medium">
                            <span className="w-4 h-px bg-slate-200" />
                            pembeli: {order.buyer.name}
                          </div>
                        </td>
                        <td className="px-8 py-6 font-mono text-[15px] font-bold text-slate-900 tracking-tight">
                          {formatIDR(order.total_amount)}
                        </td>
                        <td className="px-8 py-6">
                           <div className="font-mono text-[15px] font-extrabold text-emerald-600">
                            +{formatIDR(order.platform_commission)}
                          </div>
                          <p className="text-[10px] font-bold text-emerald-700/50 uppercase tracking-tighter mt-1">Net Revenue</p>
                        </td>
                        <td className="px-8 py-6">
                          <OrderStatusBadge status={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}