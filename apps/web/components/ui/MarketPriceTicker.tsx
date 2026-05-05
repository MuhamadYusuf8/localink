'use client'

import React from 'react'
import { clsx } from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { MarketPrice } from '@/types'
import { formatIDR } from '@/lib/utils/currency'

// ─── Props Interface ───────────────────────────────────────
export interface MarketPriceTickerProps {
  prices: MarketPrice[]
  className?: string
}

// ─── Komponen Item Ticker ─────────────────────────────────
function TickerItem({ price }: { price: MarketPrice }) {
  const TrendIcon =
    price.trend === 'up'
      ? TrendingUp
      : price.trend === 'down'
      ? TrendingDown
      : Minus

  const trendColor =
    price.trend === 'up'
      ? 'text-red-600'
      : price.trend === 'down'
      ? 'text-emerald-600'
      : 'text-amber-600'

  return (
    <span className="inline-flex items-center gap-2 px-6 text-sm whitespace-nowrap">
      <span className="text-text-muted text-xs">🌾</span>
      <span className="text-text-secondary font-medium">{price.product_name}</span>
      <span className="text-text-muted text-xs">·</span>
      <span className="font-mono text-text-primary">
        {formatIDR(price.price_avg)}/kg
      </span>
      <span className={clsx('flex items-center gap-0.5 text-xs font-medium', trendColor)}>
        <TrendIcon size={12} />
        {price.trend_percent !== undefined && Math.abs(price.trend_percent) > 0
          ? `${price.trend === 'up' ? '+' : ''}${price.trend_percent.toFixed(1)}%`
          : '—'
        }
      </span>
    </span>
  )
}

// ─── Separator ────────────────────────────────────────────
function TickerSeparator() {
  return (
    <span className="inline-flex items-center px-3 text-dark-muted">
      <span className="w-1 h-1 rounded-full bg-dark-muted" />
    </span>
  )
}

// ─── Komponen Utama ───────────────────────────────────────
export function MarketPriceTicker({ prices, className }: MarketPriceTickerProps) {
  if (!prices || prices.length === 0) return null

  // Duplikasi untuk animasi seamless marquee
  const doubled = [...prices, ...prices]

  return (
    <div
      className={clsx(
        'w-full overflow-hidden',
        'bg-white border-y border-dark-border',
        'py-2',
        className
      )}
      aria-label="Harga komoditas hari ini"
    >
      {/* Label kiri */}
      <div className="relative flex items-center">
        <div className="flex-shrink-0 px-4 py-0.5 z-10 bg-emerald-50 border-r border-emerald-100 mr-2">
          <span className="text-emerald-600 text-[10px] font-bold tracking-widest uppercase">
            Harga Pasar
          </span>
        </div>

        {/* Track scrolling */}
        <div className="overflow-hidden flex-1">
          <div className="marquee-track">
            {doubled.map((price, i) => (
              <React.Fragment key={`${price.id}-${i}`}>
                <TickerItem price={price} />
                {i < doubled.length - 1 && <TickerSeparator />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Fade kanan */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>
    </div>
  )
}
