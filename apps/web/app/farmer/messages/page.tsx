'use client'

import React from 'react'
import { ChatInterface } from '@/components/ui/ChatInterface'
import { MessagesSquare } from 'lucide-react'

export default function FarmerMessagesPage() {
  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner shrink-0">
              <MessagesSquare size={24} strokeWidth={2.5} />
            </div>
            <h1 className="font-display font-extrabold text-3xl text-slate-900 tracking-tight">
              Pesan Pelanggan
            </h1>
          </div>
          <p className="text-sm text-slate-500 font-medium md:ml-[60px]">
            Balas pesan pembeli dengan cepat untuk meningkatkan konversi dan kepuasan pelanggan.
          </p>
        </div>
      </div>

      {/* Chat Interface Container */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden h-[calc(100vh-240px)] min-h-[600px] transition-shadow hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <ChatInterface />
      </div>
      
    </div>
  )
}