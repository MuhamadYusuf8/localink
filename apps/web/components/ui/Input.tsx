'use client'

import React from 'react'
import { clsx } from 'clsx'
import { AlertCircle, CheckCircle } from 'lucide-react'

// ─── Props Interface ───────────────────────────────────────
export type InputVariant = 'default' | 'error' | 'success'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  hint?: string
  error?: string
  variant?: InputVariant
  leftAddon?: React.ReactNode
  rightAddon?: React.ReactNode
  required?: boolean
  inputSize?: 'sm' | 'md' | 'lg'
}

// ─── Component ────────────────────────────────────────────
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      variant: variantProp,
      leftAddon,
      rightAddon,
      required,
      inputSize = 'md',
      className,
      id,
      ...props
    },
    ref
  ) => {
    // Tentukan variant dari error jika ada
    const variant: InputVariant = error ? 'error' : variantProp ?? 'default'

    const inputId = id ?? props.name ?? Math.random().toString(36).slice(2)

    const sizeStyles = {
      sm:  'px-3 py-1.5 text-sm h-8',
      md:  'px-4 py-2.5 text-sm h-10',
      lg:  'px-4 py-3 text-base h-12',
    }

    const borderStyles: Record<InputVariant, string> = {
      default: 'border-dark-border focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10',
      error:   'border-status-error focus:border-status-error focus:ring-4 focus:ring-red-500/10',
      success: 'border-status-success focus:border-status-success focus:ring-4 focus:ring-emerald-500/10',
    }

    return (
      <div className="flex flex-col w-full">
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
            {required && (
              <span className="text-status-error ml-0.5" aria-hidden="true">*</span>
            )}
          </label>
        )}

        {/* Input Wrapper */}
        <div className="relative flex items-center">
          {/* Addon Kiri */}
          {leftAddon && (
            <div className="absolute left-3 flex items-center text-text-muted pointer-events-none">
              {leftAddon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            aria-invalid={variant === 'error'}
            className={clsx(
              'input-base w-full',
              sizeStyles[inputSize],
              borderStyles[variant],
              leftAddon  && 'pl-10',
              rightAddon && 'pr-10',
              className
            )}
            {...props}
          />

          {/* Addon Kanan — ikon status atau custom */}
          {rightAddon ? (
            <div className="absolute right-3 flex items-center text-text-muted">
              {rightAddon}
            </div>
          ) : variant === 'error' ? (
            <div className="absolute right-3 flex items-center text-status-error pointer-events-none">
              <AlertCircle size={16} />
            </div>
          ) : variant === 'success' ? (
            <div className="absolute right-3 flex items-center text-status-success pointer-events-none">
              <CheckCircle size={16} />
            </div>
          ) : null}
        </div>

        {/* Error Message */}
        {error && (
          <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-xs text-status-error flex items-center gap-1">
            <AlertCircle size={12} />
            {error}
          </p>
        )}

        {/* Hint */}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-text-muted">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// ─── Textarea ────────────────────────────────────────────
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  required?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, required, className, id, ...props }, ref) => {
    const textareaId = id ?? props.name ?? Math.random().toString(36).slice(2)

    return (
      <div className="flex flex-col w-full">
        {label && (
          <label htmlFor={textareaId} className="form-label">
            {label}
            {required && <span className="text-status-error ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={!!error}
          className={clsx(
            'input-base resize-none',
            'min-h-[100px] py-3',
            error
              ? 'border-status-error focus:border-status-error'
              : 'border-dark-border focus:border-emerald-500 focus:shadow-glow-emerald',
            className
          )}
          {...props}
        />
        {error && (
          <p role="alert" className="mt-1.5 text-xs text-status-error">
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="mt-1.5 text-xs text-text-muted">{hint}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
