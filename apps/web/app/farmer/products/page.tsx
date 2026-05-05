'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit2, Eye, EyeOff, Sparkles, Package } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import apiClient from '@/lib/api/client'
import type { Product, PaginatedResponse } from '@/types'

export default function FarmerProductsPage() {
  const [data, setData] = useState<Product[]>([])
  const [meta, setMeta] = useState<PaginatedResponse<Product>['meta'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [promotingId, setPromotingId] = useState<string | null>(null)

  const fetchProducts = () => {
    setIsLoading(true)
    setError(null)
    apiClient.get(`/farmer/products?page=${page}&q=${search}`)
      .then(res => {
        // Handle both standard and wrapped response
        const products = res.data.data || res.data
        setData(Array.isArray(products) ? products : [])
        setMeta(res.data.meta || null)
      })
      .catch(err => {
        console.error('Fetch products error:', err)
        setError('Gagal memuat daftar produk. Silakan coba lagi.')
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchProducts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]) // Only refetch on page change, search needs manual trigger or debounce

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchProducts()
  }

  const togglePublish = async (id: string) => {
    try {
      await apiClient.post(`/farmer/products/${id}/publish`)
      fetchProducts()
    } catch (err) {
      console.error(err)
    }
  }

  const promoteProduct = async (id: string) => {
    setPromotingId(id)
    try {
      await apiClient.post(`/farmer/products/${id}/promote`, { boost_type: 'top_search', days: 7 })
      fetchProducts()
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Gagal mengaktifkan promosi.')
    } finally {
      setPromotingId(null)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in bg-slate-50 min-h-screen pb-12 font-inter">
      
      {/* Header Premium */}
      <div className="px-8 pt-10 pb-6 border-b border-slate-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative z-10">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="font-display font-extrabold text-3xl text-slate-900 tracking-tight">Katalog Produk</h1>
            <p className="text-sm text-slate-500 font-medium mt-1.5">Kelola stok, harga eceran, grosir, dan publikasi hasil tani Anda.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              onClick={fetchProducts} 
              disabled={isLoading}
              className="bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-bold px-5"
            >
              Refresh Data
            </Button>
            <Link href="/farmer/products/new">
              <Button 
                variant="primary" 
                leftIcon={<Plus size={18} strokeWidth={2.5} />} 
                className="shadow-[0_4px_12px_rgba(5,150,105,0.2)] bg-emerald-600 hover:bg-emerald-700 font-bold px-6"
              >
                Tambah Produk
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-8 max-w-[1400px] mx-auto space-y-6">
        
        {/* Filter / Search Bar */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 max-w-lg relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
              <input 
                placeholder="Cari nama produk, SKU, atau kategori..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400 shadow-inner"
              />
            </div>
            <Button type="submit" variant="secondary" className="bg-slate-800 text-white hover:bg-slate-900 border-none font-bold px-6 rounded-xl">
              Cari Produk
            </Button>
          </form>
        </div>

        {/* Product Table */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold text-[12px] uppercase tracking-wider">Produk</th>
                  <th className="px-6 py-4 font-bold text-[12px] uppercase tracking-wider">Harga Eceran</th>
                  <th className="px-6 py-4 font-bold text-[12px] uppercase tracking-wider">Stok Tersedia</th>
                  <th className="px-6 py-4 font-bold text-[12px] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-bold text-[12px] uppercase tracking-wider">Promosi</th>
                  <th className="px-6 py-4 font-bold text-[12px] uppercase tracking-wider text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
                        <span className="text-slate-500 font-medium">Memuat katalog produk...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <p className="text-red-500 font-bold mb-4">{error}</p>
                      <Button variant="secondary" size="sm" onClick={fetchProducts} className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100">Coba Lagi</Button>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <Package size={28} className="text-slate-300" />
                      </div>
                      <p className="text-slate-900 font-bold text-[15px] mb-1">Katalog Masih Kosong</p>
                      <p className="text-slate-500 text-[13px] font-medium mb-6">Anda belum menambahkan produk apa pun ke toko Anda.</p>
                      <Link href="/farmer/products/new">
                        <Button variant="primary" size="sm" className="bg-emerald-600 font-bold shadow-md">Tambah Produk Pertama</Button>
                      </Link>
                    </td>
                  </tr>
                ) : (
                  data?.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                            {product.images && product.images.length > 0 ? (
                              <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Package size={20} strokeWidth={1.5} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[15px] text-slate-900 group-hover:text-emerald-700 transition-colors">{product.name}</p>
                            <p className="text-[12px] font-semibold text-slate-500 mt-0.5">dijual per {product.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <PriceDisplay amount={product.retail_price} size="sm" className="font-extrabold text-emerald-600" />
                      </td>
                      <td className="px-6 py-5">
                        <span className={`font-mono font-bold px-2.5 py-1 rounded-md text-[13px] ${product.stock_qty <= 10 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                          {product.stock_qty}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {product.status === 'active' ? (
                          <Badge variant="emerald" size="sm" className="font-bold">Aktif</Badge>
                        ) : product.status === 'out_of_stock' ? (
                          <Badge variant="error" size="sm" className="font-bold">Habis</Badge>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[11px] font-bold border border-slate-200">Draft</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {product.is_featured && product.featured_until ? (
                          <div className="space-y-1.5">
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] font-bold">
                              <Sparkles size={12} className="text-amber-500" /> Dipromosikan
                            </span>
                            <div className="text-[11px] font-medium text-slate-500">
                              s/d {new Date(product.featured_until).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Sparkles size={14} className="text-amber-500" />}
                            isLoading={promotingId === product.id}
                            onClick={() => promoteProduct(product.id)}
                            className="bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition-colors text-[12px] font-bold py-1.5 h-auto"
                          >
                            Boost 7 Hari
                          </Button>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => togglePublish(product.id)}
                            title={product.is_published ? "Sembunyikan dari toko" : "Tampilkan di toko"}
                            className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg p-2 transition-colors"
                          >
                            {product.is_published ? <EyeOff size={18} /> : <Eye size={18} />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Edit Produk"
                            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg p-2 transition-colors"
                          >
                            <Edit2 size={18} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {meta && meta.pagination.last_page > 1 && (
            <div className="px-6 py-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[13px] font-medium text-slate-500">
                Menampilkan <span className="font-bold text-slate-900">{meta.pagination.from}</span> - <span className="font-bold text-slate-900">{meta.pagination.to}</span> dari <span className="font-bold text-slate-900">{meta.pagination.total}</span> produk
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="bg-white border-slate-200 text-slate-700 font-bold shadow-sm"
                >
                  Sebelumnya
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  disabled={page === meta.pagination.last_page}
                  onClick={() => setPage(p => p + 1)}
                  className="bg-white border-slate-200 text-slate-700 font-bold shadow-sm"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}