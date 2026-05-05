'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { Loader2, Search, Package, MessageSquare, ChevronDown } from 'lucide-react'
import type { Order, OrderStatus } from '@/types'

// ─── UI Constants ──────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending_payment:   { label: 'Menunggu Pembayaran', color: '#B45309', bg: '#FEF3C7', dot: '#B45309' }, // Amber
  payment_confirmed: { label: 'Pembayaran Dikonfirmasi', color: '#1D4ED8', bg: '#DBEAFE', dot: '#1D4ED8' }, // Blue
  processing:        { label: 'Sedang Diproses', color: '#6D28D9', bg: '#EDE9FE', dot: '#6D28D9' }, // Violet
  ready_to_ship:     { label: 'Siap Dikirim', color: '#0F766E', bg: '#CCFBF1', dot: '#0F766E' }, // Teal
  shipped:           { label: 'Dalam Pengiriman', color: '#4338CA', bg: '#E0E7FF', dot: '#4338CA' }, // Indigo
  delivered:         { label: 'Terkirim', color: '#059669', bg: '#D1FAE5', dot: '#059669' }, // Emerald
  completed:         { label: 'Selesai', color: '#059669', bg: '#ECFDF5', dot: '#059669' }, // Emerald
  cancelled:         { label: 'Dibatalkan', color: '#DC2626', bg: '#FEE2E2', dot: '#DC2626' }, // Red
  refund_requested:  { label: 'Refund Diajukan', color: '#E11D48', bg: '#FFE4E6', dot: '#E11D48' }, // Rose
  refunded:          { label: 'Dana Dikembalikan', color: '#E11D48', bg: '#FFE4E6', dot: '#E11D48' }, // Rose
}

const NEXT_STATUS: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  payment_confirmed: { label: 'Mulai Proses', next: 'processing' },
  processing:        { label: 'Siap Kirim', next: 'ready_to_ship' },
  ready_to_ship:     { label: 'Tandai Dikirim', next: 'shipped' },
  shipped:           { label: 'Tandai Sampai', next: 'delivered' },
}

const FILTER_TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'pending_payment', label: 'Menunggu' },
  { key: 'processing', label: 'Diproses' },
  { key: 'ready_to_ship', label: 'Siap Kirim' },
  { key: 'shipped', label: 'Dikirim' },
  { key: 'completed', label: 'Selesai' },
]

// ─── Main Component ───────────────────────────────────────
export default function FarmerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const res = await apiClient.get('/farmer/orders')
      setOrders(res.data.data)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    setActionLoading(orderId)
    try {
      await apiClient.patch(`/farmer/orders/${orderId}/status`, { status })
      // Update local state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Gagal memperbarui status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleChatWithBuyer = async (buyerId?: string) => {
    if (!buyerId) {
      alert('Data pembeli tidak valid.')
      return
    }

    try {
      const res = await apiClient.post('/conversations', { buyer_id: buyerId })
      const conversationId = res.data.data.id
      router.push(`/farmer/messages?c=${conversationId}`)
    } catch (err: any) {
      console.error('Chat error:', err)
      const errorMsg = err.error?.message || err.message || 'Gagal memulai percakapan'
      alert(errorMsg)
    }
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const filtered = orders.filter((o) => {
    const matchStatus = activeFilter === 'all' || o.status === activeFilter
    const matchSearch =
      search === '' ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer?.name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  // Count helper
  const getCount = (status: OrderStatus | 'all') => {
    if (status === 'all') return orders.length
    return orders.filter(o => o.status === status).length
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-inter pb-12">
      {/* Page Header */}
      <div className="px-8 pt-10 pb-2 border-b border-slate-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative z-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manajemen Pesanan</h1>
              <p className="text-[14px] text-slate-500 font-medium mt-1.5">Pantau dan kelola semua pesanan masuk dari pembeli Anda.</p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Total Pesanan', value: orders.length, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                { label: 'Perlu Tindakan', value: orders.filter(o => ['payment_confirmed','processing','ready_to_ship'].includes(o.status)).length, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
                { label: 'Selesai', value: orders.filter(o => o.status === 'completed').length, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100' },
              ].map((stat) => (
                <div key={stat.label} className={`border rounded-2xl p-4 text-center min-w-[130px] shadow-sm ${stat.bg} ${stat.border}`}>
                  <div className={`text-2xl font-extrabold tracking-tight ${stat.color}`}>{stat.value}</div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-2">
            {FILTER_TABS.map((tab) => {
              const count = getCount(tab.key)
              const isActive = activeFilter === tab.key
              return (
                <button 
                  key={tab.key} 
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-5 py-3.5 text-[14px] font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
                    isActive 
                      ? 'text-emerald-700 border-emerald-600 bg-emerald-50 rounded-t-lg' 
                      : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                      isActive ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="p-8 max-w-[1400px] mx-auto">
        {/* Search */}
        <div className="mb-8 relative max-w-md">
          <Search size={18} strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor pesanan atau nama pembeli..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-xl text-[14px] font-medium text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400 shadow-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 size={48} strokeWidth={2.5} className="text-emerald-600 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Memuat data pesanan yang segar...</p>
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            {filtered.length === 0 ? (
              <div className="text-center py-24 bg-white border border-slate-200 border-dashed rounded-3xl shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-100">
                  <Package size={40} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Tidak ada pesanan ditemukan</h3>
                <p className="text-sm text-slate-500 font-medium">Coba ubah filter atau kata kunci pencarian Anda.</p>
              </div>
            ) : (
              filtered.map((order) => {
                const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment
                const nextAction = NEXT_STATUS[order.status]
                const isExpanded = expandedId === order.id
                const buyer = order.buyer
                const buyerType = buyer?.buyerProfile?.buyer_type || 'retail'

                return (
                  <div key={order.id} className={`bg-white transition-all duration-300 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${isExpanded ? 'border-2 border-emerald-500 shadow-[0_8px_30px_rgba(5,150,105,0.08)]' : 'border border-slate-200 hover:border-slate-300 hover:shadow-[0_4px_15px_rgba(0,0,0,0.04)]'}`}>
                    
                    {/* Header Item */}
                    <div 
                      className="p-6 flex items-center gap-6 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    >
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-extrabold text-[16px] shadow-[0_4px_12px_rgba(5,150,105,0.25)] shrink-0">
                        {buyer?.name.substring(0, 2).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <h4 className="font-bold text-[16px] text-slate-900 truncate">{buyer?.name}</h4>
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                            buyerType === 'wholesale' 
                              ? 'bg-amber-50 text-amber-600 border-amber-200' 
                              : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                          }`}>
                            {buyerType}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[13px] text-slate-500 font-medium">
                          <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{order.order_number}</span>
                          <span className="opacity-40">•</span>
                          <span>{order.shipping_address?.city || 'Lokasi tidak tersedia'}</span>
                          <span className="opacity-40">•</span>
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold border" style={{ backgroundColor: config.bg, color: config.color, borderColor: `${config.color}30` }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.dot }} />
                          {config.label}
                        </div>
                      </div>

                      {/* Total */}
                      <div className="text-right min-w-[150px] pl-4 border-l border-slate-100">
                        <PriceDisplay amount={order.total_amount} className="text-[18px] font-extrabold text-emerald-600 tracking-tight" />
                        <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                          {order.items?.reduce((acc, i) => acc + i.quantity, 0)} Items Ordered
                        </div>
                      </div>

                      <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-emerald-50' : ''}`}>
                        <ChevronDown size={20} className={isExpanded ? 'text-emerald-600' : 'text-slate-400'} strokeWidth={2.5} />
                      </div>
                    </div>

                    {/* Details Expanded Area */}
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-5 bg-slate-50 border-t border-slate-200">
                        <div className="mb-6">
                          <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-4">Rincian Produk</div>
                          <div className="space-y-3">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                                    {item.product_snapshot.primary_image ? (
                                      <img src={item.product_snapshot.primary_image} alt={item.product_snapshot.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Package size={20} strokeWidth={2.5} />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-[15px] font-bold text-slate-900 mb-1">{item.product_snapshot.name}</div>
                                    <div className="text-[13px] font-medium text-slate-500">
                                      {item.quantity} {item.product_snapshot.unit} × <PriceDisplay amount={item.unit_price} size="xs" className="inline text-slate-700" />
                                    </div>
                                  </div>
                                </div>
                                <PriceDisplay amount={item.total_price} className="text-[16px] font-extrabold text-slate-900" />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center pt-5 border-t border-slate-200">
                          <div className="text-[13px] text-slate-500 font-medium max-w-[50%]">
                            <span className="font-bold text-slate-700">Catatan Pembeli:</span> {order.notes || <span className="italic">Tidak ada catatan tambahan.</span>}
                          </div>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => handleChatWithBuyer(order.buyer?.id)}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-[14px] font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-sm transition-all"
                            >
                              <MessageSquare size={18} strokeWidth={2.5} />
                              Chat Pembeli
                            </button>
                            {nextAction && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUpdateStatus(order.id, nextAction.next)
                                }}
                                disabled={actionLoading === order.id}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-xl text-[14px] font-bold shadow-[0_4px_12px_rgba(5,150,105,0.2)] hover:-translate-y-0.5 transition-all"
                              >
                                {actionLoading === order.id ? (
                                  <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
                                ) : (
                                  nextAction.label
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}