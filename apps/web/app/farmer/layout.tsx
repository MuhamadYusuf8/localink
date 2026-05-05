'use client'

import React, { useEffect, useState } from 'react'
import { withAuth } from '@/lib/hooks/withAuth'
import { FarmerDashboardLayout } from '@/components/layouts/FarmerDashboardLayout'
import apiClient from '@/lib/api/client'
import type { MarketPrice } from '@/types'

function FarmerLayout({ children }: { children: React.ReactNode }) {
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([])

  useEffect(() => {
    // Fetch market prices for the ticker
    apiClient.get('/farmer/market-prices')
      .then(res => setMarketPrices(res.data.data))
      .catch(() => {}) // Silently fail, it's just a ticker
  }, [])

  // The title and subtitle will be overridden by the pages themselves
  // but we can set a default empty state or use a context if we wanted to be fancy.
  // For simplicity, we can just pass children, and let pages render their own headers if needed,
  // or we can use a small context to update the layout header from the pages.
  // Given Next.js app router, rendering the header in the page might be easier,
  // but we already designed FarmerDashboardLayout to take title/actions.
  // Let's pass a generic title for now, or we can leave it empty and let pages render their own.
  
  return (
    <FarmerDashboardLayout marketPrices={marketPrices}>
      {children}
    </FarmerDashboardLayout>
  )
}

export default withAuth(FarmerLayout, { allowedRoles: ['farmer'] })
