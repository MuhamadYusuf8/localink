'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Save, AlertCircle, TrendingDown, TrendingUp, Minus, CheckCircle, X, Image, Loader2, Plus, Calendar, Package } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import apiClient from '@/lib/api/client'
import type { ProductCategory } from '@/types'

// ─── Zod Schema ───────────────────────────────────────────
const productSchema = z.object({
  name: z.string().min(3, 'Nama produk minimal 3 karakter'),
  category_id: z.string().uuid('Kategori wajib dipilih').optional().or(z.literal('')),
  description: z.string().optional(),
  unit: z.string().min(1, 'Satuan wajib diisi (contoh: kg, ikat)'),
  retail_price: z.number().min(100, 'Harga minimal Rp 100'),
  wholesale_price: z.number().min(100).optional().nullable(),
  wholesale_min_qty: z.number().min(1).optional().nullable(),
  stock_qty: z.number().min(0, 'Stok tidak boleh negatif'),
  is_published: z.boolean(),
  harvest_date: z.string().optional().nullable(),
  weight_per_unit: z.number().min(0).optional().nullable(),
})

type ProductFormData = z.infer<typeof productSchema>

// ─── Form Component ───────────────────────────────────────
export function ProductForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<any[]>(initialData?.images || [])
  
  // Market Price Alignment Widget State
  const [alignment, setAlignment] = useState<{
    status: 'aligned' | 'below_market' | 'above_market' | 'slightly_high' | 'no_data'
    market_avg: number | null
    diff_percent: number | null
  } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData ?? {
      unit: 'kg',
      is_published: true,
      stock_qty: 0,
      wholesale_price: null,
      wholesale_min_qty: null,
      weight_per_unit: null,
    },
  })

  const watchPrice = watch('retail_price')
  const watchCategory = watch('category_id')

  // Fetch Categories
  useEffect(() => {
    apiClient.get('/catalog/categories')
      .then(res => setCategories(res.data.data))
      .catch(console.error)
  }, [])

  // Simulate Market Price Check Widget
  useEffect(() => {
    if (!watchPrice || !watchCategory) {
      setAlignment(null)
      return
    }

    const timer = setTimeout(() => {
      // Dalam implementasi nyata, ini memanggil /api/v1/farmer/products/{id}/price-check
      // Karena ini form baru (belum ada ID), kita simulasi atau panggil endpoint khusus checker
      
      // Simulasi logic widget alignment:
      // Kita anggap rata-rata pasar untuk kategori tsb adalah Rp 15.000
      const marketAvg = 15000
      const diffPct = ((watchPrice - marketAvg) / marketAvg) * 100
      
      let status: any = 'above_market'
      if (diffPct < -10) status = 'below_market'
      else if (diffPct <= 10) status = 'aligned'
      else if (diffPct <= 25) status = 'slightly_high'

      setAlignment({ status, market_avg: marketAvg, diff_percent: diffPct })
    }, 500)

    return () => clearTimeout(timer)
  }, [watchPrice, watchCategory])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'products')

    try {
      const res = await apiClient.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      const newImage = {
        url: res.data.data.url,
        alt: watch('name') || 'Gambar produk',
        is_primary: uploadedImages.length === 0
      }
      
      setUploadedImages([...uploadedImages, newImage])
    } catch (err) {
      alert('Gagal mengunggah gambar')
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...uploadedImages]
    const removed = newImages.splice(index, 1)[0]
    
    // Jika yang dihapus primary, jadikan yang pertama primary
    if (removed.is_primary && newImages.length > 0) {
      newImages[0].is_primary = true
    }
    
    setUploadedImages(newImages)
  }

  const setPrimaryImage = (index: number) => {
    const newImages = uploadedImages.map((img, i) => ({
      ...img,
      is_primary: i === index
    }))
    setUploadedImages(newImages)
  }

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true)
    const payload = {
      ...data,
      images: uploadedImages,
      category_id: data.category_id || null,
      harvest_date: data.harvest_date || null,
      wholesale_price: data.wholesale_price || null,
      wholesale_min_qty: data.wholesale_min_qty || null,
      weight_per_unit: data.weight_per_unit || null,
    }

    try {
      if (initialData) {
        await apiClient.put(`/farmer/products/${initialData.id}`, payload)
      } else {
        await apiClient.post('/farmer/products', payload)
      }
      router.push('/farmer/products')
      router.refresh()
    } catch (err: any) {
      const apiError = err.error || err.response?.data?.error
      const message = apiError?.message || 'Gagal menyimpan produk'
      const details = apiError?.details ? Object.values(apiError.details).flat().join('\n') : ''
      
      alert(details ? `${message}:\n${details}` : message)
    } finally {
      setIsLoading(false)
    }
  }

  // Flatten categories untuk select
  const flatCategories = categories.flatMap(c => 
    c.children ? c.children.map(child => ({ id: child.id, name: `${c.name} > ${child.name}` })) : [{ id: c.id, name: c.name }]
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in pb-20">
      
      {/* Basic Info */}
      <div className="p-6 rounded-card bg-dark-surface border border-dark-border space-y-6">
        <h2 className="text-lg font-semibold text-text-primary">Informasi Dasar</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Nama Produk" 
            placeholder="Tomat Cherry Organik" 
            required 
            error={errors.name?.message} 
            {...register('name')} 
          />
          
          <div className="flex flex-col gap-1.5">
            <label className="form-label">Kategori <span className="text-status-error">*</span></label>
            <select className="input-base h-10" {...register('category_id')}>
              <option value="">-- Pilih Kategori --</option>
              {flatCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-status-error">{errors.category_id.message}</p>}
          </div>
        </div>

        <Textarea 
          label="Deskripsi Produk" 
          placeholder="Jelaskan kualitas, cara tanam, keunggulan, dll..." 
          rows={4}
          error={errors.description?.message} 
          {...register('description')} 
        />
      </div>

      {/* Image Upload */}
      <div className="p-6 rounded-card bg-dark-surface border border-dark-border space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Gambar Produk</h2>
            <p className="text-xs text-text-muted mt-1">Unggah hingga 5 gambar. Gunakan gambar berkualitas tinggi.</p>
          </div>
          <label className="cursor-pointer">
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading || uploadedImages.length >= 5} />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium transition-colors ${
              isUploading || uploadedImages.length >= 5 
                ? 'bg-dark-muted text-text-muted cursor-not-allowed' 
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
            }`}>
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Tambah Gambar
            </div>
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {uploadedImages.map((img, idx) => (
            <div key={idx} className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${img.is_primary ? 'border-emerald-500 shadow-glow-emerald' : 'border-dark-border hover:border-emerald-500/50'}`}>
              <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                {!img.is_primary && (
                  <button type="button" onClick={() => setPrimaryImage(idx)} className="text-[10px] bg-emerald-500 text-white px-2 py-1 rounded hover:bg-emerald-600 w-full transition-colors">
                    Set Utama
                  </button>
                )}
                <button type="button" onClick={() => removeImage(idx)} className="text-[10px] bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 w-full transition-colors flex items-center justify-center gap-1">
                  <X size={10} /> Hapus
                </button>
              </div>

              {img.is_primary && (
                <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                  UTAMA
                </div>
              )}
            </div>
          ))}

          {uploadedImages.length === 0 && !isUploading && (
            <div className="col-span-full py-10 border-2 border-dashed border-dark-border rounded-lg flex flex-col items-center justify-center text-text-muted">
              <Image size={32} className="mb-2 opacity-20" />
              <p className="text-sm">Belum ada gambar</p>
            </div>
          )}

          {isUploading && (
            <div className="aspect-square rounded-lg border-2 border-dashed border-emerald-500/30 flex items-center justify-center animate-pulse">
              <Loader2 size={24} className="text-emerald-500 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Pricing & Market Widget */}
      <div className="p-6 rounded-card bg-dark-surface border border-dark-border space-y-6">
        <h2 className="text-lg font-semibold text-text-primary">Harga & Stok</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input 
            type="number"
            label="Harga Eceran (Rp)" 
            placeholder="15000" 
            required 
            error={errors.retail_price?.message} 
            {...register('retail_price', { valueAsNumber: true })} 
          />
          
          <Input 
            label="Satuan" 
            placeholder="kg, ikat, gram" 
            required 
            error={errors.unit?.message} 
            {...register('unit')} 
          />
          
          <Input 
            type="number"
            label="Stok Tersedia" 
            placeholder="100" 
            required 
            error={errors.stock_qty?.message} 
            {...register('stock_qty', { valueAsNumber: true })} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dark-border/50">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingDown size={18} />
              <h3 className="text-sm font-semibold uppercase tracking-wider">Harga Grosir (Opsional)</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                type="number"
                label="Harga Grosir (Rp)" 
                placeholder="13000" 
                hint="Harga lebih murah untuk pembelian banyak"
                error={errors.wholesale_price?.message} 
                {...register('wholesale_price', { valueAsNumber: true })} 
              />
              <Input 
                type="number"
                label="Min. Beli Grosir" 
                placeholder="50" 
                hint={`Minimal beli (dlm ${watch('unit') || 'unit'})`}
                error={errors.wholesale_min_qty?.message} 
                {...register('wholesale_min_qty', { valueAsNumber: true })} 
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Calendar size={18} />
              <h3 className="text-sm font-semibold uppercase tracking-wider">Detail Panen & Fisik</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                type="date"
                label="Estimasi Panen" 
                error={errors.harvest_date?.message} 
                {...register('harvest_date')} 
              />
              <Input 
                type="number"
                step="0.1"
                label={`Berat per ${watch('unit') || 'unit'} (kg)`} 
                placeholder="1.5" 
                error={errors.weight_per_unit?.message} 
                {...register('weight_per_unit', { valueAsNumber: true })} 
              />
            </div>
          </div>
        </div>

        {/* Market Alignment Widget */}
        {alignment && (
          <div className={`p-4 rounded-button border flex items-start gap-3 transition-colors ${
            alignment.status === 'aligned' ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400' :
            alignment.status === 'slightly_high' ? 'bg-yellow-900/20 border-yellow-500/50 text-yellow-400' :
            alignment.status === 'above_market' ? 'bg-red-900/20 border-red-500/50 text-red-400' :
            'bg-blue-900/20 border-blue-500/50 text-blue-400'
          }`}>
            <div className="mt-0.5">
              {alignment.status === 'aligned' ? <CheckCircle size={18} /> :
               alignment.status === 'above_market' ? <AlertCircle size={18} /> :
               alignment.status === 'below_market' ? <TrendingDown size={18} /> :
               <Minus size={18} />}
            </div>
            <div>
              <p className="font-medium text-sm">
                {alignment.status === 'aligned' ? 'Harga sangat kompetitif!' :
                 alignment.status === 'slightly_high' ? 'Harga sedikit di atas rata-rata pasar.' :
                 alignment.status === 'above_market' ? 'Harga terlalu mahal dari harga pasar.' :
                 'Harga sangat murah di bawah pasar.'}
              </p>
              {alignment.market_avg && (
                <p className="text-xs opacity-80 mt-1">
                  Rata-rata pasar: <PriceDisplay amount={alignment.market_avg} showCurrency size="xs" /> 
                  {' '}(Beda {alignment.diff_percent?.toFixed(1)}%)
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" id="is_pub" {...register('is_published')} className="w-4 h-4 rounded border-dark-border bg-dark-muted text-emerald-500 focus:ring-emerald-500 focus:ring-offset-dark-void" />
        <label htmlFor="is_pub" className="text-sm font-medium text-text-primary cursor-pointer">
          Publikasikan produk ini secara langsung
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-dark-border">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Batal</Button>
        <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<Save size={18} />}>
          {initialData ? 'Simpan Perubahan' : 'Tambah Produk'}
        </Button>
      </div>
    </form>
  )
}
