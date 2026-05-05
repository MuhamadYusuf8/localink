'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ShoppingBag, MapPin, Store, Package } from 'lucide-react'
import apiClient from '@/lib/api/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { RatingStars } from '@/components/ui/RatingStars'
import type { Product, PaginatedResponse } from '@/types'

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/catalog/products?per_page=8')
      .then(res => setProducts((res.data as PaginatedResponse<Product>).data))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  return (
    // bg-dark-void → bg-[#F8FAF9]
    <div className="animate-fade-in bg-[#F8FAF9]">

      {/* ── Hero Section ─────────────────────────────────────────── */}
      {/* from-dark-void via-dark-surface to-dark-void border-dark-border
          → gradient hijau sangat muda agar tetap "segar" & nyambung brand */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#EDF7F3] via-[#F8FAF9] to-[#EDF7F3] border-b border-[#D1E8DF]">

        {/* Decorative radial — opacity diturunkan agar tidak terlalu terang */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-300/30 via-transparent to-transparent" />
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent" />

        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32 relative z-10 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            {/* Badge — tetap pakai variant emerald bawaan */}
            <Badge variant="emerald" className="mx-auto lg:mx-0 shadow-sm">✨ 100% Langsung dari Petani</Badge>

            {/* text-text-primary → text-[#0F1F1A] | text-emerald-500 tetap */}
            <h1 className="font-display font-bold text-4xl lg:text-6xl text-[#0F1F1A] leading-[1.1]">
              Pangan Segar,<br />
              <span className="text-emerald-500">Harga Transparan.</span>
            </h1>

            {/* text-text-secondary → text-[#1A3329] */}
            <p className="text-lg text-[#1A3329] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Dukung petani lokal dengan membeli hasil panen segar langsung dari kebun mereka. Nikmati harga yang lebih adil tanpa perantara.
            </p>

            {/* Buttons — tidak berubah, primary & secondary sudah kontras */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
              <Link href="/products">
                <Button size="lg" variant="primary" className="shadow-lg" rightIcon={<ArrowRight size={18} />}>
                  Mulai Belanja
                </Button>
              </Link>
              <Link href="/register/farmer">
                <Button size="lg" variant="secondary">
                  Saya Petani
                </Button>
              </Link>
            </div>
          </div>

          {/* ── Mockup Card (Hero kanan) ────────────────────────── */}
          <div className="flex-1 relative w-full max-w-lg lg:max-w-none hidden sm:block">
            {/* Lingkaran dekoratif — sesuaikan agar tidak tenggelam di bg terang */}
            <div className="aspect-square rounded-full bg-emerald-500/8 border border-emerald-500/15 absolute inset-0 animate-pulse-slow" />
            <div className="aspect-square rounded-full bg-amber-500/8 border border-amber-500/10 absolute inset-4 animate-pulse-slow delay-150" />

            {/* Card mockup:
                bg-dark-surface border-dark-border → bg-white border-[#D1E8DF] + shadow nyata */}
            <div className="relative z-10 bg-white border border-[#D1E8DF] rounded-card p-6 shadow-xl rotate-2 hover:rotate-0 transition-transform duration-500 ml-auto max-w-md"
              style={{ boxShadow: '0 8px 32px rgba(16,185,129,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}>

              <div className="flex items-center gap-3 mb-4">
                {/* bg-emerald-500/10 → bg-emerald-50, text-emerald-400 → text-emerald-600 */}
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                  <Store size={20} className="text-emerald-600" />
                </div>
                <div>
                  {/* text-text-primary → text-[#0F1F1A] */}
                  <h3 className="font-medium text-[#0F1F1A]">Kebun Segar Pak Budi</h3>
                  {/* text-text-muted → text-[#4B7A67] */}
                  <p className="text-xs text-[#4B7A67] flex items-center gap-1">
                    <MapPin size={12} /> Lembang, Jawa Barat
                  </p>
                </div>
              </div>

              {/* bg-dark-muted → bg-[#EDF7F3] (hijau muda terang) */}
              <div className="h-48 rounded-button bg-[#EDF7F3] overflow-hidden mb-4 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/15 to-transparent" />
              </div>

              <div className="flex justify-between items-end">
                <div>
                  {/* text-text-primary → text-[#0F1F1A] */}
                  <p className="font-medium text-[#0F1F1A] mb-1">Tomat Cherry Organik</p>
                  <PriceDisplay amount={22000} unit="kg" size="lg" />
                </div>
                <Button variant="primary" size="sm" leftIcon={<ShoppingBag size={14} />}>Beli</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Catalog ─────────────────────────────────────── */}
      {/* section tidak punya bg → otomatis inherit bg-[#F8FAF9] dari parent */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              {/* text-text-primary → text-[#0F1F1A] */}
              <h2 className="font-display font-bold text-3xl text-[#0F1F1A] mb-2">Pilihan Segar Hari Ini</h2>
              {/* text-text-secondary → text-[#1A3329] */}
              <p className="text-[#1A3329]">Hasil panen terbaik yang baru diunggah oleh petani lokal.</p>
            </div>
            {/* text-emerald-400 hover:text-emerald-300 → text-emerald-600 hover:text-emerald-700
                (lebih gelap agar terbaca di bg terang) */}
            <Link href="/products" className="hidden sm:flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
              Lihat Semua <ArrowRight size={16} />
            </Link>
          </div>

          {/* ── Loading Skeleton ──────────────────────────────────── */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                // bg-dark-surface border-dark-border → bg-white border-[#D1E8DF]
                // + shimmer lebih terang
                <div key={i} className="animate-pulse bg-white rounded-card h-80 border border-[#D1E8DF]"
                  style={{ background: 'linear-gradient(90deg, #E8F0ED 25%, #F1F5F3 50%, #E8F0ED 75%)', backgroundSize: '200% 100%' }} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <Link key={product.id} href={`/products/${product.farmer?.slug}/${product.slug}`} className="group block h-full">
                  {/* bg-dark-surface border-dark-border → bg-white border-[#D1E8DF]
                      hover:border-emerald-500/50 tetap | tambah shadow untuk depth */}
                  <div className="bg-white border border-[#D1E8DF] rounded-card overflow-hidden h-full flex flex-col transition-all duration-300 hover:border-emerald-400/60 hover:shadow-md hover:-translate-y-1"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}>

                    {/* Image Area */}
                    {/* bg-dark-muted → bg-[#EDF7F3] */}
                    <div className="aspect-[4/3] bg-[#EDF7F3] relative overflow-hidden">
                      {product.images && product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        // text-text-muted → text-[#4B7A67]
                        <div className="absolute inset-0 flex items-center justify-center text-[#4B7A67]">No Image</div>
                      )}

                      {/* Badges — tetap pakai variant bawaan */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        {product.is_featured && <Badge variant="premium" size="sm">Unggulan</Badge>}
                        {product.wholesale_price && <Badge variant="harvest" size="sm">Grosir Tersedia</Badge>}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-4 flex flex-col flex-1">
                      {/* text-text-primary → text-[#0F1F1A]
                          group-hover:text-emerald-400 → group-hover:text-emerald-600 */}
                      <h3 className="font-medium text-[#0F1F1A] mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-1.5 mb-3">
                        <RatingStars rating={Number(product.average_rating)} size="sm" />
                        {/* text-text-muted → text-[#4B7A67] */}
                        <span className="text-xs text-[#4B7A67]">({product.sold_count} terjual)</span>
                      </div>

                      {/* border-dark-border → border-[#D1E8DF] */}
                      <div className="mt-auto pt-3 border-t border-[#D1E8DF] flex justify-between items-end">
                        <div>
                          <PriceDisplay amount={product.retail_price} unit={product.unit} size="lg" />
                        </div>
                      </div>

                      {/* Farmer Info — text-text-muted → text-[#4B7A67] */}
                      <div className="mt-3 flex items-center gap-2 text-xs text-[#4B7A67]">
                        {/* text-emerald-500 tetap */}
                        <Store size={14} className="text-emerald-500" />
                        <span className="truncate">{product.farmer?.store_name}</span>
                        <span className="mx-1">•</span>
                        <span className="truncate">{product.farmer?.city}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            // Empty state:
            // bg-dark-surface border-dark-border → bg-white border-[#D1E8DF]
            <div className="text-center py-20 bg-white rounded-card border border-[#D1E8DF] shadow-sm">
              {/* text-emerald-100 → text-emerald-300 (agar icon terlihat di bg terang) */}
              <Package size={48} className="mx-auto text-emerald-300 mb-4" />
              {/* text-text-primary → text-[#0F1F1A] */}
              <h3 className="text-lg font-medium text-[#0F1F1A] mb-2">Belum ada produk</h3>
              {/* text-text-muted → text-[#4B7A67] */}
              <p className="text-[#4B7A67]">Katalog produk sedang kosong saat ini.</p>
            </div>
          )}

          {/* CTA mobile — tidak berubah, Button secondary sudah handle warnanya */}
          <div className="mt-8 text-center sm:hidden">
            <Link href="/products">
              <Button variant="secondary" fullWidth rightIcon={<ArrowRight size={16} />}>
                Lihat Semua Produk
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}