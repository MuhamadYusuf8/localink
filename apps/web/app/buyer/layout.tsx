'use client'

import React from 'react'
import { withAuth } from '@/lib/hooks/withAuth'
import PublicLayout from '@/app/(public)/layout'

// Re-use PublicLayout but protect all child routes to ensure they are buyers.
// We can wrap the whole layout withAuth to protect /cart, /checkout, /buyer/orders etc.
function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicLayout>
      {children}
    </PublicLayout>
  )
}

// Protected layout for buyers - Also allow farmers as they can be buyers too
export default withAuth(BuyerLayout, { allowedRoles: ['buyer', 'farmer'] })
