'use client'

import React from 'react'
import { ProductForm } from '@/components/forms/ProductForm'
import { ChevronLeft, PackagePlus } from 'lucide-react'
import Link from 'next/link'

export default function NewProductPage() {
  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
      {/* Breadcrumb & Navigation */}
      <div className="mb-10">
        <Link 
          href="/farmer/products" 
          className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-emerald-600 mb-6 transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-all">
            <ChevronLeft size={16} strokeWidth={3} />
          </div>
          Kembali ke Katalog Produk
        </Link>

        {/* Header Section */}
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner shrink-0">
            <PackagePlus size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-3xl text-slate-900 tracking-tight">
              Tambah Produk Baru
            </h1>
            <p className="text-[15px] text-slate-500 font-medium mt-1">
              Lengkapi rincian hasil panen terbaik Anda untuk menarik perhatian pembeli.
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-1"> {/* Padding tipis untuk estetika border internal form */}
          <ProductForm />
        </div>
      </div>
    </div>
  )
}