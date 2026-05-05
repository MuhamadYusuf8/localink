'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { MapPin, Plus, Trash2, CheckCircle2, Building2, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

type BuyerAddress = {
  id: string
  label: string
  recipient_name: string
  phone: string
  province: string
  city: string
  district: string
  address: string
  postal_code: string | null
  is_primary: boolean
}

export default function BuyerAccountPage() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<BuyerAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    label: 'Rumah',
    recipient_name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    address: '',
    postal_code: '',
    is_primary: true,
  })

  const buyerTypeLabel = useMemo(() => {
    const t = user?.buyer_profile?.buyer_type ?? user?.buyerProfile?.buyer_type
    if (t === 'wholesale') return 'Wholesale'
    if (t === 'retail') return 'Retail'
    return 'Buyer'
  }, [user])

  async function loadAddresses() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/buyer/addresses', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || 'Gagal memuat alamat')
      setAddresses(json.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat alamat')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAddresses()
  }, [])

  async function addAddress(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/buyer/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          postal_code: form.postal_code || null,
          is_primary: Boolean(form.is_primary),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || 'Gagal menyimpan alamat')
      setForm((p) => ({ ...p, address: '', district: '', city: '', province: '', postal_code: '', is_primary: false }))
      await loadAddresses()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan alamat')
    } finally {
      setSaving(false)
    }
  }

  async function setPrimary(id: string) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/buyer/addresses/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_primary: true }),
      })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || 'Gagal mengubah alamat utama')
      await loadAddresses()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengubah alamat utama')
    } finally {
      setSaving(false)
    }
  }

  async function removeAddress(id: string) {
    if (!confirm('Hapus alamat ini?')) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/buyer/addresses/${encodeURIComponent(id)}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || 'Gagal menghapus alamat')
      await loadAddresses()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus alamat')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div className="space-y-2">
          <h1 className="font-display font-bold text-3xl text-slate-900 tracking-tight">Akun Saya</h1>
          <p className="text-sm text-slate-500 font-medium">Kelola profil dan daftar alamat pengiriman untuk pengalaman checkout yang lebih lancar.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium shadow-sm flex items-center gap-2">
          <span className="text-lg">⚠️</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Kolom Kiri: Profil & Form Tambah Alamat */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Kartu Profil */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl border border-emerald-100 bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                <UserIcon size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="font-bold text-lg text-slate-900">{user?.name ?? '-'}</div>
                  <Badge variant="emerald" size="sm" className="font-bold tracking-wide">{buyerTypeLabel}</Badge>
                </div>
                <div className="text-sm text-slate-500 font-medium">{user?.email ?? '-'}</div>
                {user?.buyer_profile?.company_name || user?.buyerProfile?.company_name ? (
                  <div className="text-xs text-slate-600 mt-3 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium w-fit">
                    <Building2 size={14} className="text-slate-400" />
                    <span>{user?.buyer_profile?.company_name ?? user?.buyerProfile?.company_name}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Form Tambah Alamat */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="mb-6 pb-4 border-b border-slate-100">
              <div className="font-bold text-lg text-slate-900 mb-1">Tambah Alamat Baru</div>
              <div className="text-sm text-slate-500 font-medium">Alamat utama akan diprioritaskan saat checkout pesanan.</div>
            </div>

            <form onSubmit={addAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Label Alamat" placeholder="Cth: Rumah, Kantor" value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} className="bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20" />
                <Input label="Nama Penerima" placeholder="Nama lengkap penerima" value={form.recipient_name} onChange={(e) => setForm((p) => ({ ...p, recipient_name: e.target.value }))} required className="bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20" />
              </div>
              <Input label="Nomor Handphone" placeholder="Cth: 0812xxxx" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required className="bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="Provinsi" placeholder="Provinsi" value={form.province} onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))} required className="bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20" />
                <Input label="Kota/Kab" placeholder="Kota/Kabupaten" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} required className="bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20" />
                <Input label="Kecamatan" placeholder="Kecamatan" value={form.district} onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))} required className="bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20" />
              </div>
              <Textarea label="Detail Alamat Lengkap" placeholder="Nama jalan, gedung, no. rumah..." rows={3} value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} required className="bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20 resize-none" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <Input label="Kode Pos (Opsional)" placeholder="Kode pos area" value={form.postal_code} onChange={(e) => setForm((p) => ({ ...p, postal_code: e.target.value }))} className="bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20" />
                <label className="flex items-center gap-3 text-sm text-slate-600 font-medium mt-6 cursor-pointer hover:text-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.is_primary}
                    onChange={(e) => setForm((p) => ({ ...p, is_primary: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500 focus:ring-2 accent-emerald-600"
                  />
                  Atur sebagai alamat utama
                </label>
              </div>

              <div className="pt-4">
                <Button type="submit" variant="primary" isLoading={saving} leftIcon={<Plus size={18} />} fullWidth className="h-12 text-[15px] font-bold shadow-[0_4px_12px_rgba(5,150,105,0.2)] bg-emerald-600 hover:bg-emerald-700">
                  Simpan Alamat Baru
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Kolom Kanan: Daftar Alamat */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
              <div className="font-bold text-lg text-slate-900 mb-1">Daftar Alamat Tersimpan</div>
              <div className="text-sm text-slate-500 font-medium">Pilih dan kelola alamat pengiriman Anda di bawah ini.</div>
            </div>

            {loading ? (
              <div className="p-6 space-y-4">
                <div className="h-28 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
                <div className="h-28 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <MapPin size={28} className="text-slate-300" />
                </div>
                <div className="text-slate-900 font-bold mb-1">Belum ada alamat</div>
                <div className="text-sm text-slate-500 font-medium">Silakan tambahkan alamat baru melalui form di samping.</div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {addresses.map((a) => (
                  <div key={a.id} className={`p-6 transition-all duration-200 ${a.is_primary ? 'bg-emerald-50/30' : 'hover:bg-slate-50'}`}>
                    <div className="flex items-start gap-4">
                      
                      {/* Ikon Pin */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${a.is_primary ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        <MapPin size={22} strokeWidth={2.5} />
                      </div>
                      
                      {/* Detail Alamat */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="font-bold text-[15px] text-slate-900 truncate">{a.label}</div>
                          {a.is_primary && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-md border border-emerald-200 bg-emerald-100 text-emerald-700 font-bold uppercase tracking-wider">
                              <CheckCircle2 size={12} strokeWidth={2.5} /> Utama
                            </span>
                          )}
                        </div>
                        <div className="text-[13.5px] text-slate-600 font-medium mb-2">
                          <span className="text-slate-900 font-bold">{a.recipient_name}</span> <span className="text-slate-400 mx-1">•</span> {a.phone}
                        </div>
                        <div className="text-[13px] text-slate-500 leading-relaxed font-medium bg-slate-50/50 p-3 rounded-lg border border-slate-100/50">
                          {a.address}, {a.district}, {a.city}, {a.province} {a.postal_code ?? ''}
                        </div>
                      </div>

                      {/* Tombol Aksi */}
                      <div className="flex flex-col sm:flex-row items-center gap-2 pl-2">
                        {!a.is_primary && (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            isLoading={saving} 
                            onClick={() => setPrimary(a.id)}
                            className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-600 font-medium shadow-sm transition-all text-xs px-3 h-8"
                          >
                            Jadikan Utama
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          isLoading={saving} 
                          onClick={() => removeAddress(a.id)} 
                          title="Hapus Alamat"
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 p-0 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}