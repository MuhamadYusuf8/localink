'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { MapPin, Navigation, Star } from 'lucide-react'
import apiClient from '@/lib/api/client'
import { Button } from '@/components/ui/Button'
import type { FarmerProfile, PaginatedResponse } from '@/types'

function toFixed(n: unknown, digits = 1) {
  const num = typeof n === 'number' ? n : Number(n)
  if (Number.isNaN(num)) return null
  return Number(num.toFixed(digits))
}

function osmEmbedUrl(lat: number, lng: number) {
  const delta = 0.03;
  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  const bbox = `${left},${bottom},${right},${top}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(
    `${lat},${lng}`,
  )}`;
}

export default function NearbyFarmersPage() {
  const [permission, setPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [radiusKm, setRadiusKm] = useState(25)
  const [farmers, setFarmers] = useState<FarmerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setPermission('denied')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPermission('granted')
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => setPermission('denied'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])

  useEffect(() => {
    async function fetchNearby() {
      setLoading(true)
      setError(null)
      try {
        const params: Record<string, any> = { radius_km: radiusKm }
        if (coords) {
          params.lat = coords.lat
          params.lng = coords.lng
        }
        const res = await apiClient.get<PaginatedResponse<FarmerProfile>>('/catalog/farmers/nearby', { params })
        const list = res.data.data ?? []

        // Jika hasil kosong saat pakai koordinat (karena data demo mungkin jauh), fallback ke rekomendasi umum
        if (coords && list.length === 0) {
          const res2 = await apiClient.get<PaginatedResponse<FarmerProfile>>('/catalog/farmers/nearby', { params: { radius_km: radiusKm } })
          setFarmers(res2.data.data ?? [])
        } else {
          setFarmers(list)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Gagal memuat petani terdekat')
      } finally {
        setLoading(false)
      }
    }
    void fetchNearby()
  }, [coords, radiusKm])

  const heroSubtitle = useMemo(() => {
    if (permission === 'granted') return 'Menampilkan petani terdekat dari lokasimu.'
    if (permission === 'denied') return 'Lokasi tidak diizinkan. Menampilkan rekomendasi petani premium & terlaris.'
    return 'Meminta izin lokasi untuk menampilkan petani terdekat.'
  }, [permission])

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-6 lg:items-end lg:justify-between mb-8">
        <div className="space-y-2">
          <h1 className="font-display font-bold text-3xl text-text-primary">Petani Terdekat</h1>
          <p className="text-sm text-text-secondary">{heroSubtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-button border border-dark-border bg-dark-surface px-3 py-2">
            <span className="text-xs text-text-muted">Radius</span>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="bg-transparent text-sm text-text-primary outline-none"
            >
              {[5, 10, 25, 50, 100].map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
            </select>
          </div>
          {coords && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex"
            >
              <Button variant="secondary" size="sm" leftIcon={<Navigation size={16} />}>
                Buka Lokasi Saya
              </Button>
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-card border border-red-900/50 bg-red-900/20 text-red-300 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          {loading ? (
            <div className="h-[520px] rounded-card border border-dark-border bg-dark-surface animate-pulse" />
          ) : coords ? (
            <div className="relative overflow-hidden rounded-card border border-dark-border bg-dark-surface h-[520px]">
              <iframe
                title="Peta lokasi petani"
                src={osmEmbedUrl(coords.lat, coords.lng)}
                className="w-full h-full border-none grayscale-[0.3] invert-[0.9] hue-rotate-[180deg]"
                loading="lazy"
              />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-dark-void/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-button border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-xs">
                  <MapPin size={14} /> Lokasi kamu aktif
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[520px] rounded-card border border-dark-border bg-dark-surface flex items-center justify-center text-text-muted">
              Lokasi belum tersedia.
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-card border border-dark-border bg-dark-surface">
            <div className="p-4 border-b border-dark-border flex items-center justify-between">
              <div>
                <div className="font-semibold text-text-primary">Daftar Petani</div>
                <div className="text-xs text-text-muted">{farmers.length} rekomendasi</div>
              </div>
              <div className="text-[11px] text-text-muted">Klik untuk lihat toko</div>
            </div>

            <div className="max-h-[520px] overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  <div className="h-20 rounded-card bg-dark-muted/30 animate-pulse" />
                  <div className="h-20 rounded-card bg-dark-muted/30 animate-pulse" />
                  <div className="h-20 rounded-card bg-dark-muted/30 animate-pulse" />
                </div>
              ) : farmers.length === 0 ? (
                <div className="p-8 text-center text-sm text-text-muted">Belum ada petani di radius ini.</div>
              ) : (
                farmers.map((f) => {
                  const dist = toFixed(f.distance_km, 1)
                  return (
                    <Link
                      key={f.id}
                      href={`/farmers/${f.slug}`}
                      className="block p-4 border-b border-dark-border hover:bg-dark-muted/20 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-button bg-emerald-900/30 border border-emerald-500/20 flex items-center justify-center text-emerald-200 font-bold">
                          {(f.store_name?.[0] ?? 'P').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-text-primary truncate">{f.store_name}</div>
                            {f.is_premium && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full border border-harvest-500/30 bg-harvest-500/10 text-harvest-300">
                                Premium
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-text-muted mt-1 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={12} /> {f.city ?? '-'}, {f.province ?? '-'}
                            </span>
                            <span className="text-dark-muted">•</span>
                            <span className="inline-flex items-center gap-1 text-harvest-300">
                              <Star size={12} /> {Number(f.average_rating ?? 0).toFixed(1)} ({f.rating_count ?? 0})
                            </span>
                            {dist !== null && (
                              <>
                                <span className="text-dark-muted">•</span>
                                <span className="text-emerald-300">{dist} km</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

