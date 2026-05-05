'use client'

import React from 'react'
import { clsx } from 'clsx'
import { formatIDR } from '@/lib/utils/currency'

// ─── Props Interface ───────────────────────────────────────
export type PriceDisplaySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface PriceDisplayProps {
  amount: number           // Integer IDR
  unit?: string            // e.g. "kg", "ikat"
  size?: PriceDisplaySize
  showCurrency?: boolean
  strikethrough?: boolean  // Untuk harga coret
  className?: string
  prefix?: string          // e.g. "Mulai dari"
}

// ─── Size Styles ──────────────────────────────────────────
const sizeStyles: Record<PriceDisplaySize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-semibold',
  xl: 'text-2xl font-bold',
}

// ─── Component ────────────────────────────────────────────
export function PriceDisplay({
  amount,
  unit,
  size = 'md',
  showCurrency = true,
  strikethrough = false,
  className,
  prefix,
}: PriceDisplayProps) {
  const formatted = formatIDR(amount, showCurrency)

  return (
    <span
      className={clsx(
        'font-mono inline-flex items-baseline gap-1',
        sizeStyles[size],
        strikethrough
          ? 'line-through text-slate-400'
          : 'text-emerald-600',
        className
      )}
    >
      {prefix && (
        <span className="text-text-muted font-sans font-normal text-xs mr-0.5">
          {prefix}
        </span>
      )}
      {formatted}
      {unit && (
        <span className="text-text-muted font-sans font-normal text-xs">
          /{unit}
        </span>
      )}
    </span>
  )
}

// ─── Wholesale Price Display ──────────────────────────────
export interface WholesalePriceDisplayProps {
  price: number
  minQty: number
  unit: string
  className?: string
}

export function WholesalePriceDisplay({
  price,
  minQty,
  unit,
  className,
}: WholesalePriceDisplayProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-3 py-2 rounded-button',
        'bg-amber-50 border border-amber-200 shadow-sm',
        className
      )}
    >
      <span className="text-xs text-amber-700 font-bold">Grosir</span>
      <span className="text-amber-600 font-mono font-bold text-sm">
        {formatIDR(price)}/{unit}
      </span>
      <span className="text-slate-500 text-xs">
        min. {minQty} {unit}
      </span>
    </div>
  )
}

// ─── Market Price Range ────────────────────────────────────
export interface MarketPriceRangeProps {
  low: number
  high: number
  avg: number
  unit?: string
  className?: string
}

export function MarketPriceRange({
  low,
  high,
  avg,
  unit = 'kg',
  className,
}: MarketPriceRangeProps) {
  return (
    <div
      className={clsx(
        'text-xs text-slate-500 flex items-center gap-1 flex-wrap',
        className
      )}
    >
      <span>Harga pasar:</span>
      <span className="font-mono text-slate-700 font-medium">
        {formatIDR(low)} – {formatIDR(high)}/{unit}
      </span>
      <span className="text-slate-300">·</span>
      <span>Rata-rata:</span>
      <span className="font-mono text-amber-600 font-bold">{formatIDR(avg)}/{unit}</span>
    </div>
  )
}
