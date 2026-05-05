'use client'

import React, { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package, Star, Store, MapPin, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/lib/hooks/useAuth'
import apiClient from '@/lib/api/client'
import { formatIDR } from '@/lib/utils/currency'

interface DashboardData {
  stats: {
    revenue_this_month: number
    revenue_last_month: number
    revenue_growth_pct: number
    orders_this_month: number
    orders_last_month: number
    orders_growth_pct: number
    average_order_value: number
    repeat_buyer_rate: number
    total_products: number
    average_rating: number
    total_sales: number
  }
  chart: Array<{ date: string; revenue: number; orders: number }>
  top_products: Array<{
    product_id: string; name: string; slug: string;
    retail_price: number; unit: string; total_sold: number; total_revenue: number
  }>
}

// ─── Design Tokens (Premium Light Theme) ──────────────────
const C = {
  bgApp: '#F8FAFC',       // Slate 50
  bgCard: '#FFFFFF',      // Putih Bersih
  border: '#E2E8F0',      // Slate 200
  textMain: '#0F172A',    // Slate 900
  textSecondary: '#334155',// Slate 700
  textMuted: '#64748B',   // Slate 500
  primary: '#059669',     // Emerald 600
  primaryGlow: 'rgba(5, 150, 105, 0.08)',
  shadowCard: '0 4px 20px rgba(0, 0, 0, 0.03)',
  shadowButton: '0 4px 12px rgba(5, 150, 105, 0.2)',
};

function StatCard({
  title, value, growth, prefix = '', suffix = '', icon: Icon, isCurrency = false, colorClass, gradientClass, delay
}: {
  title: string; value: number | string; growth?: number; prefix?: string; suffix?: string; icon: React.ElementType; isCurrency?: boolean; colorClass: string; gradientClass: string; delay: number
}) {
  const isPositive = growth !== undefined && growth >= 0

  return (
    <div 
      className={clsx(
        "relative p-6 rounded-3xl overflow-hidden group animate-slide-up",
        "bg-white border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)]",
        "transition-all duration-500 hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background Glow (Light Theme) */}
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
        
        {growth !== undefined && (
          <div className={clsx(
            "flex items-center gap-1 px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider",
            isPositive 
              ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
              : "bg-red-50 border-red-200 text-red-600"
          )}>
            {isPositive ? <TrendingUp size={14} strokeWidth={3} /> : <TrendingDown size={14} strokeWidth={3} />}
            <span>{Math.abs(growth).toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <h3 className="font-display font-extrabold text-3xl text-slate-900 tracking-tight mb-2">
          {prefix}{isCurrency ? formatIDR(value as number, false) : value}{suffix}
        </h3>
        <p className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
      </div>
    </div>
  )
}

export default function FarmerDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    
    apiClient.get('/farmer/dashboard/stats?days=30')
      .then(res => {
        if (res.data?.data) {
          setData(res.data.data)
        } else {
          setError('Data tidak valid dari server.')
        }
      })
      .catch(err => {
        console.error('Dashboard error:', err)
        setError(err?.error?.message || err?.message || 'Gagal memuat data dashboard.')
      })
      .finally(() => setIsLoading(false))
  }, [retryCount])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden relative pb-20">
      {/* Subtle Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/50 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="space-y-8 relative z-10 animate-fade-in max-w-7xl mx-auto px-6 pt-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-slate-200 p-8 rounded-3xl animate-slide-up shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-[0_4px_12px_rgba(5,150,105,0.3)] text-white">
              <Store size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-3xl text-slate-900 tracking-tight mb-2">
                Selamat Datang, {user?.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-600">
                <span className="flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                  <Store size={16} className="text-emerald-600" />
                  {user?.farmerProfile?.store_name || 'Toko Petani'}
                </span>
                <span className="flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                  <MapPin size={16} className="text-emerald-600" />
                  {user?.farmerProfile?.city || 'Indonesia'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-48 bg-slate-200/50 rounded-3xl animate-pulse" />)}
            </div>
            <div className="h-96 bg-slate-200/50 rounded-3xl animate-pulse" />
          </div>
        ) : error || !data ? (
          <div className="flex flex-col items-center justify-center p-12 rounded-3xl bg-white border border-slate-200 text-center min-h-[400px] shadow-sm">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 text-red-500 border border-red-100">
              <Package size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-900">Oops! Ada Masalah</h2>
            <p className="text-slate-500 font-medium mb-8 max-w-md">{error || 'Gagal memuat data statistik Anda saat ini.'}</p>
            <button 
              onClick={() => setRetryCount(prev => prev + 1)}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-[0_4px_12px_rgba(5,150,105,0.2)]"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Pendapatan (30 Hari)"
                value={data.stats.revenue_this_month}
                growth={data.stats.revenue_growth_pct}
                prefix="Rp "
                isCurrency
                icon={DollarSign}
                colorClass="bg-emerald-50 text-emerald-600 border-emerald-100"
                gradientClass="bg-emerald-500"
                delay={0}
              />
              <StatCard
                title="Pesanan Baru"
                value={data.stats.orders_this_month}
                growth={data.stats.orders_growth_pct}
                icon={ShoppingBag}
                colorClass="bg-blue-50 text-blue-600 border-blue-100"
                gradientClass="bg-blue-500"
                delay={100}
              />
              <StatCard
                title="Total Produk Aktif"
                value={data.stats.total_products}
                icon={Package}
                colorClass="bg-amber-50 text-amber-600 border-amber-100"
                gradientClass="bg-amber-500"
                delay={200}
              />
              <StatCard
                title="Rating Toko"
                value={Number(data.stats.average_rating || 0).toFixed(1)}
                suffix=" / 5.0"
                icon={Star}
                colorClass="bg-yellow-50 text-yellow-600 border-yellow-200"
                gradientClass="bg-yellow-400"
                delay={300}
              />
            </div>

            {/* Chart & Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
              {/* Revenue Chart */}
              <div className="col-span-1 lg:col-span-2 p-8 rounded-3xl bg-white border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden">
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div>
                    <h3 className="text-xl font-display font-extrabold text-slate-900 tracking-tight">Tren Pendapatan</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">Perkembangan 30 hari terakhir</p>
                  </div>
                </div>

                <div className="h-80 w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.chart} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#94A3B8" 
                        fontSize={12}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => {
                          const d = new Date(val)
                          return `${d.getDate()}/${d.getMonth()+1}`
                        }}
                      />
                      <YAxis 
                        stroke="#94A3B8" 
                        fontSize={12}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `Rp${(val/1000)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFFFFF', 
                          borderColor: '#E2E8F0', 
                          borderRadius: '12px',
                          color: '#0F172A',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                          fontWeight: 600
                        }}
                        itemStyle={{ color: '#059669', fontWeight: 700 }}
                        formatter={(value: number) => [formatIDR(value), 'Pendapatan']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#059669" 
                        strokeWidth={4}
                        dot={false}
                        activeDot={{ r: 6, fill: '#FFFFFF', stroke: '#059669', strokeWidth: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Products */}
              <div className="col-span-1 p-8 rounded-3xl bg-white border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div>
                    <h3 className="text-xl font-display font-extrabold text-slate-900 tracking-tight">Produk Terlaris</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">Bulan ini</p>
                  </div>
                </div>
                
                {data.top_products.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <Package size={32} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 text-sm font-semibold">Belum ada penjualan<br/>bulan ini.</p>
                  </div>
                ) : (
                  <div className="space-y-4 relative z-10">
                    {data.top_products.map((p, idx) => (
                      <div key={p.product_id} className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-emerald-50 hover:border-emerald-100 transition-all cursor-pointer">
                        <div className={clsx(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-[15px]",
                          idx === 0 ? "bg-amber-100 text-amber-700 border border-amber-200" :
                          idx === 1 ? "bg-slate-200 text-slate-700 border border-slate-300" :
                          idx === 2 ? "bg-orange-100 text-orange-800 border border-orange-200" :
                          "bg-white text-slate-500 border border-slate-200"
                        )}>
                          #{idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">{p.name}</p>
                          <p className="text-[13px] font-semibold text-slate-500 mt-0.5">{p.total_sold} {p.unit} terjual</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[15px] font-display font-extrabold text-emerald-600">{formatIDR(p.total_revenue)}</p>
                        </div>
                      </div>
                    ))}
                    
                    <button className="w-full mt-6 py-3.5 rounded-xl border-2 border-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-50 hover:text-slate-900 hover:border-slate-200 transition-all flex items-center justify-center gap-2">
                      Lihat Semua Produk
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}