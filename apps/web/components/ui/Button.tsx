'use client'

import React from 'react'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

// ─── Props Interface ───────────────────────────────────────
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

// ─── Style Maps ───────────────────────────────────────────
const variantStyles: Record<ButtonVariant, string> = {
  primary: clsx(
    'bg-emerald-500 text-white border border-transparent shadow-sm',
    'hover:bg-emerald-600 hover:shadow-md',
    'active:bg-emerald-700',
    'disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed'
  ),
  secondary: clsx(
    'bg-white text-emerald-600 border border-emerald-500 shadow-sm',
    'hover:bg-emerald-50 hover:border-emerald-600 hover:text-emerald-700',
    'active:bg-emerald-100',
    'disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed'
  ),
  ghost: clsx(
    'bg-transparent text-slate-600 border border-transparent',
    'hover:bg-slate-100 hover:text-slate-900',
    'active:bg-slate-200',
    'disabled:opacity-40 disabled:cursor-not-allowed'
  ),
  danger: clsx(
    'bg-red-600 text-white border border-transparent shadow-sm',
    'hover:bg-red-700 hover:shadow-md',
    'active:bg-red-800',
    'disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed'
  ),
  success: clsx(
    'bg-emerald-600 text-white border border-transparent shadow-sm',
    'hover:bg-emerald-700',
    'active:bg-emerald-800',
    'disabled:opacity-40 disabled:cursor-not-allowed'
  ),
  outline: clsx(
    'bg-transparent text-slate-300 border border-white/10 shadow-sm',
    'hover:bg-white/5 hover:border-white/20 hover:text-white',
    'active:bg-white/10',
    'disabled:opacity-40 disabled:cursor-not-allowed'
  ),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm:  'px-3 py-1.5 text-sm gap-1.5 h-8',
  md:  'px-4 py-2.5 text-sm gap-2 h-10',
  lg:  'px-6 py-3 text-base gap-2.5 h-12',
}

// ─── Component ────────────────────────────────────────────
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        suppressHydrationWarning
        className={clsx(
          // Base
          'inline-flex items-center justify-center',
          'font-medium rounded-button',
          'transition-all duration-200',
          'select-none whitespace-nowrap',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
          'focus-visible:ring-offset-white',
          // Variant
          variantStyles[variant],
          // Size
          sizeStyles[size],
          // Full width
          fullWidth && 'w-full',
          // Custom
          className
        )}
        {...props}
      >
        {/* Left icon slot — always stable DOM, conditionally shown */}
        <span className="flex-shrink-0 flex items-center">
          {isLoading
            ? <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
            : leftIcon ?? null}
        </span>

        {/* Label */}
        <span>{children}</span>

        {/* Right icon slot */}
        {rightIcon && !isLoading && (
          <span className="flex-shrink-0 flex items-center">{rightIcon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
