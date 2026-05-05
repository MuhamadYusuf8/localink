import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from '@/components/forms/LoginForm'

export const metadata: Metadata = {
  title: 'Masuk',
  description: 'Masuk ke akun Localink Anda untuk mengakses marketplace pertanian.',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-dark-surface rounded-card" />}>
      <LoginForm />
    </Suspense>
  )
}
