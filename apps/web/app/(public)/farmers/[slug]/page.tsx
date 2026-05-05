'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, MessageSquareText, ShieldCheck, Leaf, Store, Star, Truck, CreditCard } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RatingStars } from '@/components/ui/RatingStars';

type Profile = Record<string, any>;
type Review = Record<string, any>;
type Product = Record<string, any>;

const tabs = ['tentang', 'produk', 'ulasan', 'informasi'] as const;

function rupiah(n: number) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(n || 0)}`;
}

function osmEmbedUrl(lat: number, lng: number) {
  const delta = 0.06;
  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  const bbox = `${left},${bottom},${right},${top}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(
    `${lat},${lng}`,
  )}`;
}

export default function FarmerPublicProfilePage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]>('tentang');
  const [sort, setSort] = useState('terbaru');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [chatStarting, setChatStarting] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [pRes, prodRes, revRes] = await Promise.all([
        fetch(`/api/farmers/${params.slug}`),
        fetch(`/api/farmers/${params.slug}/products?sort=${sort}`),
        fetch(`/api/farmers/${params.slug}/reviews?page=${reviewPage}&rating=${ratingFilter}`),
      ]);
      if (!pRes.ok) throw new Error('Profil petani tidak ditemukan');
      const pJson = await pRes.json();
      const prodJson = await prodRes.json();
      const revJson = await revRes.json();
      setProfile(pJson.data);
      setProducts(prodJson.data ?? []);
      setReviews(revJson.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [params.slug, sort, reviewPage, ratingFilter]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const nowStatus = useMemo(() => {
    if (!profile?.open_days?.length) return 'Jadwal belum diatur';
    const weekday = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()];
    const time = new Date().toTimeString().slice(0, 5);
    const isOpenDay = profile.open_days.includes(weekday);
    const isOpenTime = time >= (profile.open_hour ?? '00:00') && time <= (profile.close_hour ?? '23:59');
    return isOpenDay && isOpenTime ? 'Buka Sekarang' : 'Tutup';
  }, [profile]);

  const ratingSummary = useMemo(() => {
    const counts = [1, 2, 3, 4, 5].reduce((acc, n) => ({ ...acc, [n]: 0 }), {} as Record<number, number>);
    for (const r of reviews) counts[r.rating] = (counts[r.rating] ?? 0) + 1;
    return counts;
  }, [reviews]);

  const canChat = isAuthenticated && (user?.role === 'buyer' || user?.role === 'farmer');

  async function startChat() {
    if (!profile?.id) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=/farmers/${encodeURIComponent(params.slug)}`);
      return;
    }
    if (user?.role !== 'buyer' && user?.role !== 'farmer') {
      alert('Hanya pembeli yang dapat memulai chat dengan petani.');
      return;
    }
    try {
      setChatStarting(true);
      const res = await apiClient.post('/conversations', { farmer_id: profile.id });
      const convId = res.data?.data?.id;
      router.push(`/buyer/messages${convId ? `?c=${encodeURIComponent(convId)}` : ''}`);
    } catch (e: any) {
      console.error('Chat error:', e);
      const msg = e?.error?.message || e?.response?.data?.error?.message || 'Gagal memulai chat.';
      alert(msg);
    } finally {
      setChatStarting(false);
    }
  }

  async function submitReview() {
    try {
      if (!isAuthenticated) {
        router.push(`/login?redirect=/farmers/${encodeURIComponent(params.slug)}&intent=review`);
        return;
      }
      if (user?.role !== 'buyer' && user?.role !== 'farmer') {
        alert('Hanya pembeli yang dapat memberi ulasan.');
        return;
      }

      setReviewSaving(true);
      const res = await fetch(`/api/farmers/${params.slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_id: user.id,
          buyer_name: user.name,
          buyer_avatar: user.avatar_url ? '🧑' : '🧑',
          rating: reviewStars,
          comment: reviewComment,
          is_verified: false,
        }),
      });
      if (!res.ok) throw new Error('Gagal mengirim ulasan');
      setReviewComment('');
      await loadProfile();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal mengirim ulasan');
    } finally {
      setReviewSaving(false);
    }
  }

  if (loading) return <div className="min-h-screen bg-dark-void" />;
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-dark-void">
        <div className="max-w-7xl mx-auto px-6 py-12 text-text-primary">
          <div className="rounded-card border border-dark-border bg-dark-surface p-6">
            <div className="text-sm text-status-error">⚠️ {error ?? 'Profil petani tidak ditemukan.'}</div>
            <div className="mt-4">
              <Link href="/products">
                <Button variant="secondary">Kembali ke Katalog</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-void text-text-primary">
      <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-card border border-dark-border bg-gradient-to-br from-dark-surface to-dark-void">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18),transparent_40%)]" />
          <div className="absolute inset-0 opacity-20 pointer-events-none [background-image:radial-gradient(#a0aec0_1px,transparent_1px)] [background-size:20px_20px]" />

          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-card bg-dark-muted/30 border border-emerald-500/20 flex items-center justify-center">
                  <Store className="text-emerald-400" size={22} />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display font-bold text-2xl md:text-3xl leading-tight">{profile.store_name}</h1>
                    {profile.is_premium && <Badge variant="premium" size="sm">Premium</Badge>}
                  </div>
                  <div className="text-sm text-text-secondary">{profile.store_tagline || profile.store_description || '-'}</div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {Number(profile.profile_completion_score ?? 0) >= 70 && (
                      <Badge variant="emerald" size="sm" icon={<ShieldCheck size={12} />}>Terverifikasi</Badge>
                    )}
                    {(profile.farming_methods ?? []).includes('Organik') && (
                      <Badge variant="info" size="sm" icon={<Leaf size={12} />}>Organik</Badge>
                    )}
                    <Badge variant={nowStatus === 'Buka Sekarang' ? 'emerald' : 'harvest'} size="sm">
                      {nowStatus}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted pt-1">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} /> {profile.city ?? '-'}, {profile.province ?? '-'}
                    </span>
                    <span className="text-dark-muted">•</span>
                    <span>🌱 {profile.total_products ?? 0} produk</span>
                    <span className="text-dark-muted">•</span>
                    <span>📦 {profile.total_sold ?? 0} terjual</span>
                  </div>

                  <RatingStars
                    rating={Number(profile.avg_rating ?? 0)}
                    showCount
                    count={Number(profile.total_reviews ?? 0)}
                    className="pt-1"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  leftIcon={<MessageSquareText size={16} />}
                  onClick={startChat}
                  isLoading={chatStarting}
                  disabled={!canChat && isAuthenticated}
                >
                  Chat Petani
                </Button>
                <Button variant="secondary" onClick={() => setTab('produk')}>
                  Lihat Produk
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Total Produk', value: profile.total_products ?? 0 },
            { label: 'Total Terjual', value: profile.total_sold ?? 0 },
            { label: 'Rating', value: Number(profile.avg_rating ?? 0).toFixed(1), icon: <Star size={14} className="text-harvest-400" /> },
            { label: 'Ulasan', value: profile.total_reviews ?? 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-card border border-dark-border bg-dark-surface p-4">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>{s.label}</span>
                {'icon' in s ? (s as any).icon : null}
              </div>
              <div className="mt-2 text-xl font-bold text-text-primary">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="sticky top-16 z-30 bg-dark-void/90 backdrop-blur-md border-b border-dark-border mt-7">
          <div className="flex gap-2 overflow-x-auto py-3">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  'px-4 py-2 rounded-button border text-sm font-medium capitalize transition-colors',
                  tab === t
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-dark-border bg-dark-surface text-text-secondary hover:bg-dark-muted/20 hover:text-text-primary',
                ].join(' ')}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {tab === 'tentang' && (
            <div className="rounded-card border border-dark-border bg-dark-surface p-6">
              <h3 className="font-display font-semibold text-lg text-text-primary">Tentang Toko</h3>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {profile.store_description || 'Belum ada deskripsi toko.'}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {(profile.farming_methods ?? []).map((m: string) => (
                  <Badge key={m} variant="outline" size="sm">{m}</Badge>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(profile.certifications ?? []).map((c: string) => (
                  <Badge key={c} variant="info" size="sm">🏅 {c}</Badge>
                ))}
              </div>
            </div>
          )}

          {tab === 'produk' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm text-text-muted">Urutkan</div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-10 px-3 rounded-button bg-dark-surface border border-dark-border text-text-primary outline-none focus:border-emerald-500"
                >
                  <option value="terbaru">Terbaru</option>
                  <option value="harga_asc">Harga Termurah</option>
                  <option value="harga_desc">Harga Tertinggi</option>
                  <option value="rating">Rating Tertinggi</option>
                </select>
              </div>

              {products.length === 0 ? (
                <div className="rounded-card border border-dark-border bg-dark-surface p-10 text-center text-sm text-text-muted">
                  Belum ada produk aktif.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <Link
                      key={p.id}
                      href={`/products/${encodeURIComponent(params.slug)}/${encodeURIComponent(p.slug ?? '')}`}
                      className="rounded-card border border-dark-border bg-dark-surface p-5 hover:bg-dark-muted/15 hover:border-emerald-500/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-3xl">{p.product_emoji || p.emoji || '🥬'}</div>
                        {p.is_featured && <Badge variant="premium" size="sm">Unggulan</Badge>}
                      </div>
                      <div className="mt-3 font-semibold text-text-primary">{p.name}</div>
                      <div className="mt-1 text-sm text-emerald-300 font-semibold">
                        {rupiah(p.price || 0)}/{p.unit || 'kg'}
                      </div>
                      <div className="mt-2 text-xs text-text-muted">
                        ⭐ {Number(p.rating ?? 0).toFixed(1)} · Stok {p.stock ?? 0}
                      </div>
                      <div className="mt-4">
                        <span className="inline-flex items-center justify-center w-full h-10 rounded-button bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-semibold">
                          Lihat Detail
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'ulasan' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4 rounded-card border border-dark-border bg-dark-surface p-5">
                <div className="text-3xl font-bold">{Number(profile.avg_rating ?? 0).toFixed(1)}</div>
                <div className="mt-2">
                  <RatingStars rating={Number(profile.avg_rating ?? 0)} />
                </div>
                <div className="mt-1 text-xs text-text-muted">{profile.total_reviews ?? 0} ulasan</div>

                <div className="mt-4 space-y-2">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <div key={n} className="grid grid-cols-[22px_1fr_28px] gap-2 items-center">
                      <span className="text-xs text-text-muted">{n}</span>
                      <div className="h-2 rounded-full bg-dark-muted/40 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${Math.min(100, ((ratingSummary[n] ?? 0) / Math.max(1, reviews.length)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted text-right">{ratingSummary[n] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[0, 5, 4, 3, 2, 1].map((f) => (
                    <button
                      key={f}
                      onClick={() => setRatingFilter(f)}
                      className={[
                        'px-3 py-1.5 rounded-full border text-xs transition-colors',
                        ratingFilter === f
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'border-dark-border bg-dark-surface text-text-muted hover:bg-dark-muted/20 hover:text-text-secondary',
                      ].join(' ')}
                    >
                      {f === 0 ? 'Semua' : `Bintang ${f}`}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="rounded-card border border-dark-border bg-dark-surface p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-text-primary truncate">
                            {r.buyer_avatar} {r.buyer_name}
                          </div>
                          <div className="mt-1">
                            <RatingStars rating={Number(r.rating ?? 0)} size="sm" />
                          </div>
                        </div>
                        <div className="text-xs text-text-muted">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : ''}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{r.comment}</div>
                      {r.is_verified && (
                        <div className="mt-3">
                          <Badge variant="emerald" size="sm">✓ Pembelian Terverifikasi</Badge>
                        </div>
                      )}
                      {r.reply && (
                        <div className="mt-4 border-l-2 border-emerald-500/20 pl-4 text-sm text-text-secondary">
                          <div className="font-semibold text-text-primary mb-1">Balasan Petani</div>
                          {r.reply}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setReviewPage((p) => Math.max(1, p - 1))}>
                      Prev
                    </Button>
                    <div className="text-xs text-text-muted">Halaman {reviewPage}</div>
                    <Button variant="secondary" size="sm" onClick={() => setReviewPage((p) => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>

                <div className="rounded-card border border-dark-border bg-dark-surface p-5">
                  <div className="font-semibold text-text-primary">Tambah Ulasan</div>
                  <div className="text-xs text-text-muted mt-1">
                    {isAuthenticated ? 'Ulasan hanya untuk akun pembeli.' : 'Silakan login sebagai pembeli untuk memberi ulasan.'}
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-button border border-dark-border bg-dark-void px-3 py-2">
                      <div className="text-[11px] text-text-muted mb-1">Rating</div>
                      <select
                        value={reviewStars}
                        onChange={(e) => setReviewStars(Number(e.target.value))}
                        className="w-full bg-transparent text-sm text-text-primary outline-none"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} bintang
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="primary"
                        fullWidth
                        isLoading={reviewSaving}
                        disabled={!reviewComment.trim()}
                        onClick={submitReview}
                      >
                        Kirim Ulasan
                      </Button>
                    </div>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value.slice(0, 500))}
                    className="mt-3 w-full min-h-[110px] rounded-card border border-dark-border bg-dark-void px-4 py-3 text-sm text-text-primary outline-none focus:border-emerald-500"
                    placeholder="Bagaimana pengalaman belanja Anda?"
                  />
                  <div className="mt-1 text-xs text-text-muted text-right">{reviewComment.length}/500</div>
                </div>
              </div>
            </div>
          )}

          {tab === 'informasi' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-card border border-dark-border bg-dark-surface p-6">
                <div className="flex items-center gap-2">
                  <Truck size={18} className="text-text-muted" />
                  <h4 className="font-semibold text-text-primary">Pengiriman</h4>
                </div>
                <div className="mt-4 space-y-2 text-sm text-text-secondary">
                  <div>Kurir: {(profile.supported_couriers ?? []).join(', ') || '-'}</div>
                  <div>Radius: {profile.delivery_radius_km ?? 0} km</div>
                  <div>Min. Order: {rupiah(profile.min_order_value ?? 0)}</div>
                  <div>Gratis Ongkir: {rupiah(profile.free_shipping_min ?? 0)}</div>
                </div>
              </div>
              <div className="rounded-card border border-dark-border bg-dark-surface p-6">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-text-muted" />
                  <h4 className="font-semibold text-text-primary">Pickup & Pembayaran</h4>
                </div>
                <div className="mt-4 space-y-2 text-sm text-text-secondary">
                  <div>Pickup: {profile.pickup_available ? 'Tersedia' : 'Tidak tersedia'}</div>
                  <div className="text-text-muted">{profile.pickup_notes || '-'}</div>
                  <div>Metode bayar: {(profile.payment_methods ?? []).join(', ') || '-'}</div>
                </div>
              </div>

              {profile.latitude != null && profile.longitude != null && (
                <div className="md:col-span-2 rounded-card border border-dark-border bg-dark-surface overflow-hidden">
                  <div className="p-6 border-b border-dark-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="font-semibold text-text-primary">Lokasi Toko</div>
                      <div className="text-xs text-text-muted mt-1">
                        {profile.location_label ? profile.location_label : `${profile.district ?? ''} ${profile.city ?? ''}`.trim()}
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        Koordinat: {Number(profile.latitude).toFixed(6)}, {Number(profile.longitude).toFixed(6)}
                      </div>
                    </div>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        `${profile.latitude},${profile.longitude}`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="primary" leftIcon={<MapPin size={16} />}>
                        Arahkan ke Google Maps
                      </Button>
                    </a>
                  </div>

                  <iframe
                    title="Peta lokasi toko"
                    src={osmEmbedUrl(Number(profile.latitude), Number(profile.longitude))}
                    className="w-full h-[420px]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
