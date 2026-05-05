'use client'

import React from 'react'
import { clsx } from 'clsx'
import { Star } from 'lucide-react'

// ─── Props Interface ───────────────────────────────────────
export type RatingSize = 'sm' | 'md' | 'lg'

export interface RatingStarsProps {
  rating: number            // 0.0 – 5.0
  size?: RatingSize
  interactive?: boolean
  onChange?: (rating: number) => void
  showCount?: boolean
  count?: number
  className?: string
}

// ─── Size Map ─────────────────────────────────────────────
const sizeMap: Record<RatingSize, number> = {
  sm: 12,
  md: 16,
  lg: 20,
}

// ─── Component ────────────────────────────────────────────
export function RatingStars({
  rating,
  size = 'md',
  interactive = false,
  onChange,
  showCount = false,
  count,
  className,
}: RatingStarsProps) {
  const [hovered, setHovered] = React.useState<number | null>(null)
  const starSize = sizeMap[size]
  const displayRating = hovered ?? rating

  const stars = Array.from({ length: 5 }, (_, i) => {
    const starValue = i + 1
    const filled = displayRating >= starValue
    const halfFilled = !filled && displayRating >= starValue - 0.5

    return (
      <button
        key={i}
        type={interactive ? 'button' : undefined}
        className={clsx(
          'relative flex-shrink-0',
          interactive
            ? 'cursor-pointer transition-transform hover:scale-110'
            : 'cursor-default pointer-events-none'
        )}
        onClick={interactive && onChange ? () => onChange(starValue) : undefined}
        onMouseEnter={interactive ? () => setHovered(starValue) : undefined}
        onMouseLeave={interactive ? () => setHovered(null) : undefined}
        aria-label={interactive ? `Beri nilai ${starValue} bintang` : undefined}
      >
        {/* Bintang dasar (kosong) */}
        <Star
          size={starSize}
          className="text-slate-200"
          fill="currentColor"
        />

        {/* Overlay bintang penuh atau setengah */}
        {(filled || halfFilled) && (
          <span
            className="absolute inset-0 overflow-hidden text-amber-400"
            style={{ width: halfFilled && !filled ? '50%' : '100%' }}
          >
            <Star
              size={starSize}
              fill="currentColor"
              className="text-amber-400"
            />
          </span>
        )}
      </button>
    )
  })

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">{stars}</div>
      {showCount && (
        <span className="text-text-muted text-xs ml-1">
          {rating.toFixed(1)}
          {count !== undefined && ` (${count.toLocaleString('id-ID')})`}
        </span>
      )}
    </div>
  )
}
