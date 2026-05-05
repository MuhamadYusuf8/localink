'use client'

import React from 'react'
import PublicLayout from '@/app/(public)/layout'

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicLayout>
      {children}
    </PublicLayout>
  )
}
