'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, ArrowRight, Minus, Plus, Store, CheckCircle, AlertCircle, MapPin, MessagesSquare, TrendingUp, TrendingDown, Minus as MinusIcon } from 'lucide-react'
import apiClient from '@/lib/api/client'
import { useCartStore } from '@/lib/store/cartStore'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PriceDisplay, WholesalePriceDisplay } from '@/components/ui/PriceDisplay'
import { RatingStars } from '@/components/ui/RatingStars'
import type { Product } from '@/types'

export default function ProductDetailPage({
  params
}: {
  params: { farmerSlug: string, productSlug: string }
}) {
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [compare, setCompare] = useState<{ avg: number; trend: 'naik' | 'turun' | 'stabil' } | null>(null)

  const { isAuthenticated, user } = useAuth()
  const { addItem } = useCartStore()
  const router = useRouter()

  useEffect(() => {
    apiClient.get(`/catalog/products/${params.farmerSlug}/${params.productSlug}`)
      .then(res => setProduct(res.data.data))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [params])

  useEffect(() => {
    async function loadCompare() {
      if (!product?.name) return
      try {
        // Simple commodity match: pakai 1-2 kata pertama agar lebih sering match ke market_prices.
        const commodity = encodeURIComponent(product.name.split(' ').slice(0, 3).join(' '))
        const res = await fetch(`/api/market-price/${commodity}`)
        const json = await res.json()
        if (json?.success && json?.stats?.avg) {
          setCompare({ avg: Number(json.stats.avg), trend: json.stats.trend })
        } else {
          setCompare(null)
        }
      } catch {
        setCompare(null)
      }
    }
    void loadCompare()
  }, [product?.name])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 animate-pulse flex gap-12">
        <div className="w-1/2 h-96 bg-dark-surface rounded-card" />
        <div className="w-1/2 space-y-6">
          <div className="h-10 bg-dark-surface rounded w-3/4" />
          <div className="h-6 bg-dark-surface rounded w-1/4" />
          <div className="h-32 bg-dark-surface rounded w-full" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Produk Tidak Ditemukan</h1>
        <Link href="/products"><Button variant="secondary">Kembali ke Katalog</Button></Link>
      </div>
    )
  }

  // Cek apakah mode grosir aktif berdasarkan kuantitas
  const isWholesaleActive = product.wholesale_price && product.wholesale_min_qty && qty >= product.wholesale_min_qty
  const currentPrice = isWholesaleActive ? product.wholesale_price! : product.retail_price
  const pricingType = isWholesaleActive ? 'wholesale' : 'retail'

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/products/${params.farmerSlug}/${params.productSlug}`)
      return
    }

    if (user?.role !== 'buyer' && user?.role !== 'farmer') {
      alert('Hanya pembeli yang dapat menambahkan ke keranjang.')
      return
    }

    setIsAdding(true)
    try {
      await addItem(product.id, qty, pricingType)
      alert('Berhasil ditambahkan ke keranjang')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsAdding(false)
    }
  }

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/products/${params.farmerSlug}/${params.productSlug}`)
      return
    }
    if (user?.role !== 'buyer' && user?.role !== 'farmer') {
      alert('Hanya pembeli yang dapat memulai chat dengan petani.')
      return
    }
    if (!product?.farmer?.id) {
      alert('Data petani tidak lengkap untuk chat.')
      return
    }
    try {
      const res = await apiClient.post('/conversations', { farmer_id: product.farmer.id })
      const convId = res.data?.data?.id
      router.push(`/buyer/messages${convId ? `?c=${encodeURIComponent(convId)}` : ''}`)
    } catch (e: any) {
      alert(e?.response?.data?.error?.message || 'Gagal memulai chat.')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="text-sm text-text-muted mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-emerald-400">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-emerald-400">Katalog</Link>
        <span>/</span>
        <span className="text-text-primary truncate">{product.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Gallery */}
        <div className="w-full lg:w-1/2 flex-shrink-0">
          <div className="aspect-square rounded-card overflow-hidden bg-dark-surface border border-dark-border mb-4">
            {product.images && product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted">Tidak ada gambar</div>
            )}
          </div>
          {/* Thumbnail grid bisa ditambahkan di sini jika images > 1 */}
        </div>

        {/* Info */}
        <div className="w-full lg:w-1/2 space-y-8">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {product.is_featured && <Badge variant="premium">Unggulan</Badge>}
              <Badge variant="emerald">{product.category?.name}</Badge>
              {product.status === 'out_of_stock' && <Badge variant="error">Stok Habis</Badge>}
            </div>

            <h1 className="font-display font-bold text-3xl md:text-4xl text-text-primary leading-tight mb-4">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 text-sm">
              <RatingStars rating={Number(product.average_rating)} showCount count={product.rating_count} />
              <span className="text-dark-muted">|</span>
              <span className="text-text-secondary">{product.sold_count} Terjual</span>
            </div>
          </div>

          <div className="p-6 rounded-card bg-dark-surface border border-dark-border space-y-4">
            {/* Harga Retail */}
            <div>
              <p className="text-sm text-text-muted mb-1">Harga Eceran</p>
              <PriceDisplay amount={product.retail_price} unit={product.unit} size="xl" />
            </div>

            {/* Harga Grosir */}
            {product.wholesale_price && product.wholesale_min_qty && (
              <WholesalePriceDisplay
                price={product.wholesale_price}
                minQty={product.wholesale_min_qty}
                unit={product.unit}
                className={isWholesaleActive ? 'border-harvest-500' : ''}
              />
            )}
          </div>

          {/* Price Comparison */}
          <div className="p-4 rounded-card bg-dark-muted/10 border border-dark-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-text-muted">Perbandingan harga pasar</p>
                <p className="text-sm text-text-secondary mt-1">
                  {compare?.avg
                    ? `Rata-rata pasar ~ ${formatIDR(compare.avg)}/${product.unit}`
                    : 'Data harga pasar belum tersedia untuk komoditas ini.'}
                </p>
              </div>
              {compare?.avg ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-button border border-dark-border bg-dark-surface">
                  {compare.trend === 'naik' ? (
                    <TrendingUp size={16} className="text-status-success" />
                  ) : compare.trend === 'turun' ? (
                    <TrendingDown size={16} className="text-status-error" />
                  ) : (
                    <MinusIcon size={16} className="text-text-muted" />
                  )}
                  <span className="text-xs text-text-secondary capitalize">{compare.trend}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-text-primary border-b border-dark-border pb-2">Deskripsi Produk</h3>
            <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
              {product.description || 'Tidak ada deskripsi.'}
            </div>
          </div>

          {/* Add to Cart Actions */}
          <div className="pt-6 border-t border-dark-border flex items-center gap-6">
            <div className="flex items-center bg-dark-surface border border-dark-border rounded-button">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-12 h-12 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
                disabled={qty <= 1}
              >
                <Minus size={16} />
              </button>
              <span className="w-12 text-center font-medium text-text-primary">{qty}</span>
              <button
                onClick={() => setQty(Math.min(product.stock_qty, qty + 1))}
                className="w-12 h-12 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
                disabled={qty >= product.stock_qty}
              >
                <Plus size={16} />
              </button>
            </div>

            <Button
              size="lg"
              variant="primary"
              className="flex-1"
              leftIcon={<ShoppingCart size={18} />}
              onClick={handleAddToCart}
              isLoading={isAdding}
              disabled={product.status === 'out_of_stock' || product.stock_qty === 0}
            >
              {product.status === 'out_of_stock' ? 'Stok Habis' : `Tambah ke Keranjang • ${formatIDR(currentPrice * qty)}`}
            </Button>
          </div>

          {/* Farmer Card */}
          <div className="p-4 rounded-card bg-dark-muted/20 border border-dark-border flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-900/40 flex items-center justify-center">
              <Store size={20} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-muted mb-0.5">Dijual oleh</p>
              <Link href={`/farmers/${product.farmer?.slug}`} className="font-medium text-emerald-400 hover:text-emerald-300">
                {product.farmer?.store_name}
              </Link>
              <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                <MapPin size={12} /> {product.farmer?.city}, {product.farmer?.province}
              </p>
            </div>
            <Button variant="secondary" size="sm" leftIcon={<MessagesSquare size={16} />} onClick={handleStartChat}>
              Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}
