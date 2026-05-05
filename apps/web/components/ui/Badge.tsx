'use client'

import React from 'react'
import { clsx } from 'clsx'
import { Crown } from 'lucide-react'

// ─── Props Interface ───────────────────────────────────────
export type BadgeVariant =
  | 'emerald'
  | 'harvest'
  | 'error'
  | 'info'
  | 'muted'
  | 'premium'
  | 'wood'
  | 'outline'

export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  children: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

// ─── Style Maps ───────────────────────────────────────────
const variantStyles: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  harvest: 'bg-amber-50 text-amber-700 border border-amber-200',
  error:   'bg-red-50 text-red-700 border border-red-200',
  info:    'bg-blue-50 text-blue-700 border border-blue-200',
  muted:   'bg-slate-100 text-slate-600 border border-slate-200',
  premium: clsx(
    'bg-gradient-to-r from-amber-500 to-amber-600',
    'text-white shadow-sm',
    'font-semibold tracking-wide border-transparent'
  ),
  wood:    'bg-orange-50 text-orange-800 border border-orange-200',
  outline: 'bg-transparent text-slate-600 border border-slate-300',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
}

// ─── Component ────────────────────────────────────────────
export function Badge({
  variant = 'muted',
  size = 'md',
  children,
  icon,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'badge',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {variant === 'premium' && !icon && (
        <Crown size={10} className="flex-shrink-0" />
      )}
      {children}
    </span>
  )
}

// ─── Preset Badges ────────────────────────────────────────

export function PremiumBadge({ className }: { className?: string }) {
  return (
    <Badge variant="premium" size="sm" className={className}>
      PRO
    </Badge>
  )
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <Badge variant="emerald" size="sm" className={className}>
      ✓ Terverifikasi
    </Badge>
  )
}

export function WholesaleBadge({ className }: { className?: string }) {
  return (
    <Badge variant="emerald" size="sm" className={className}>
      Grosir
    </Badge>
  )
}

export function HarvestReadyBadge({ className }: { className?: string }) {
  return (
    <Badge variant="harvest" size="sm" className={className}>
      🌾 Siap Panen
    </Badge>
  )
}

export function FeaturedBadge({ className }: { className?: string }) {
  return (
    <Badge variant="premium" size="sm" className={className}>
      ⭐ Unggulan
    </Badge>
  )
}
