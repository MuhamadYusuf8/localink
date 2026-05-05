'use client'

import React from 'react'
import { clsx } from 'clsx'
import type { OrderStatus } from '@/types'

// ─── Status Label & Warna ────────────────────────────────
const statusConfig: Record<
  OrderStatus,
  { label: string; colorClass: string; dotClass: string }
> = {
  pending_payment: {
    label: 'Menunggu Pembayaran',
    colorClass: 'bg-amber-50 text-amber-700 border-amber-100',
    dotClass: 'bg-amber-500',
  },
  payment_confirmed: {
    label: 'Pembayaran Dikonfirmasi',
    colorClass: 'bg-blue-50 text-blue-700 border-blue-100',
    dotClass: 'bg-blue-500',
  },
  processing: {
    label: 'Sedang Diproses',
    colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    dotClass: 'bg-indigo-500',
  },
  ready_to_ship: {
    label: 'Siap Dikirim',
    colorClass: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    dotClass: 'bg-cyan-500',
  },
  shipped: {
    label: 'Dalam Pengiriman',
    colorClass: 'bg-violet-50 text-violet-700 border-violet-100',
    dotClass: 'bg-violet-500',
  },
  delivered: {
    label: 'Telah Diterima',
    colorClass: 'bg-teal-50 text-teal-700 border-teal-100',
    dotClass: 'bg-teal-500',
  },
  completed: {
    label: 'Selesai',
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    dotClass: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Dibatalkan',
    colorClass: 'bg-red-50 text-red-700 border-red-100',
    dotClass: 'bg-red-500',
  },
  refund_requested: {
    label: 'Refund Diminta',
    colorClass: 'bg-orange-50 text-orange-700 border-orange-100',
    dotClass: 'bg-orange-500',
  },
  refunded: {
    label: 'Dana Dikembalikan',
    colorClass: 'bg-slate-50 text-slate-700 border-slate-100',
    dotClass: 'bg-slate-500',
  },
  // Alias untuk status dari database Supabase (Indonesian)
  'menunggu_pembayaran': {
    label: 'Menunggu Pembayaran',
    colorClass: 'bg-amber-50 text-amber-700 border-amber-100',
    dotClass: 'bg-amber-500',
  },
  'pembayaran_dikonfirmasi': {
    label: 'Dibayar',
    colorClass: 'bg-blue-50 text-blue-700 border-blue-100',
    dotClass: 'bg-blue-500',
  },
  'diproses': {
    label: 'Diproses',
    colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    dotClass: 'bg-indigo-500',
  },
  'dikirim': {
    label: 'Dikirim',
    colorClass: 'bg-violet-50 text-violet-700 border-violet-100',
    dotClass: 'bg-violet-500',
  },
  'tiba': {
    label: 'Tiba di Tujuan',
    colorClass: 'bg-teal-50 text-teal-700 border-teal-100',
    dotClass: 'bg-teal-500',
  },
  'selesai': {
    label: 'Selesai',
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    dotClass: 'bg-emerald-500',
  },
  'dibatalkan': {
    label: 'Dibatalkan',
    colorClass: 'bg-red-50 text-red-700 border-red-100',
    dotClass: 'bg-red-500',
  },
} as any

// ─── Props Interface ───────────────────────────────────────
export interface StatusBadgeProps {
  status: OrderStatus
  size?: 'sm' | 'md'
  showDot?: boolean
  className?: string
}

// ─── Component ────────────────────────────────────────────
export function StatusBadge({
  status,
  size = 'md',
  showDot = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status || 'Unknown',
    colorClass: 'bg-gray-900/40 text-gray-400 border-gray-700/60',
    dotClass: 'bg-gray-400',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium border rounded-pill',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs',
        config.colorClass,
        className
      )}
    >
      {showDot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dotClass)}
        />
      )}
      {config.label}
    </span>
  )
}

// ─── Export config untuk digunakan di komponen lain ───────
export { statusConfig }
