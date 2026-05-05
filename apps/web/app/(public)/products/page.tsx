'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCartStore } from '@/lib/store/cartStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api/client';
import type { Product as ApiProduct, PaginatedResponse, ProductCategory, ApiSuccessResponse } from '@/types';

type SortKey = 'popular' | 'price_asc' | 'price_desc' | 'newest' | 'rating';

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  farmer: string;
  farmer_avatar: string;
  farmer_city: string;
  farmer_rating: number;
  farmer_total_sold: number;
  price: number;
  unit: string;
  min_order: number;
  stock: number;
  is_organic: boolean;
  is_wholesale: boolean;
  wholesale_price: number;
  wholesale_min: number;
  image_emoji: string;
  image_url?: string;
  tags: string[];
  rating: number;
  review_count: number;
  description: string;
  harvest_date: string;
  badge?: string;
  slug: string;
  farmer_slug: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Sayuran': '🥬', 'Beras': '🌾', 'Bumbu': '🧅',
  'Buah': '🍎', 'Umbi': '🥔', 'Cabai': '🌶️',
  'Tomat': '🍅', 'Jagung': '🌽', 'Bawang': '🧄',
};

function getEmoji(product: ApiProduct): string {
  const name = product.name.toLowerCase();
  if (name.includes('cabai') || name.includes('cabe')) return '🌶️';
  if (name.includes('tomat')) return '🍅';
  if (name.includes('beras')) return '🌾';
  if (name.includes('bawang')) return name.includes('putih') ? '🧄' : '🧅';
  if (name.includes('bayam')) return '🥬';
  if (name.includes('kangkung')) return '🌿';
  if (name.includes('kentang')) return '🥔';
  if (name.includes('wortel')) return '🥕';
  if (name.includes('jagung')) return '🌽';
  if (name.includes('terong')) return '🍆';
  return CATEGORY_EMOJIS[product.category?.name || ''] || '📦';
}

function mapApiProduct(p: ApiProduct): Product {
  const isOrganic = p.tags?.some(t => t.toLowerCase().includes('organik')) || false;
  return {
    id: p.id, name: p.name,
    category: p.category?.name || 'Lainnya',
    subcategory: p.category?.name || 'Produk',
    farmer: p.farmer?.store_name || 'Petani Lokal',
    farmer_avatar: (p.farmer?.store_name || 'P')[0].toUpperCase(),
    farmer_city: p.farmer?.city || 'Indonesia',
    farmer_rating: Number(p.farmer?.average_rating) || 0,
    farmer_total_sold: p.farmer?.total_sales || 0,
    price: p.retail_price, unit: p.unit, min_order: 1,
    stock: p.stock_qty, is_organic: isOrganic,
    is_wholesale: !!p.wholesale_price,
    wholesale_price: p.wholesale_price || 0,
    wholesale_min: p.wholesale_min_qty || 0,
    image_emoji: getEmoji(p), image_url: p.images?.[0]?.url,
    tags: p.tags || [], rating: Number(p.average_rating) || 0,
    review_count: p.rating_count || 0, description: p.description || '',
    harvest_date: p.harvest_date || p.created_at,
    badge: p.is_featured ? 'Terpopuler' : isOrganic ? 'Organik' : undefined,
    slug: p.slug, farmer_slug: p.farmer?.slug || '',
  };
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'popular', label: '⭐ Terpopuler' },
  { key: 'newest', label: '🆕 Terbaru' },
  { key: 'price_asc', label: '💰 Harga Terendah' },
  { key: 'price_desc', label: '💰 Harga Tertinggi' },
  { key: 'rating', label: '⭐ Rating Terbaik' },
];

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '1px' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        // '#1A1D21' (star kosong di dark) → '#D1E8DF' (abu-abu kehijauan terang)
        <span key={s} style={{ fontSize: '0.7rem', color: s <= Math.round(rating) ? '#F59E0B' : '#D1E8DF' }}>★</span>
      ))}
    </span>
  );
}

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (p: Product, q: number) => void }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);
  const [qtyView, setQtyView] = useState(false);
  const [qty, setQty] = useState(product.min_order);

  function handleAdd() {
    setAddedAnim(true);
    onAddToCart(product, qty);
    setTimeout(() => setAddedAnim(false), 1500);
  }

  const daysAgo = Math.floor((Date.now() - new Date(product.harvest_date).getTime()) / 86400000);

  return (
    <div style={{
      // '#111316' → '#FFFFFF' | '#1E2128' → '#D1E8DF'
      background: '#FFFFFF', border: '1px solid #D1E8DF', borderRadius: '14px',
      overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(16,185,129,0.4)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        // tambah shadow saat hover di light theme
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(16,185,129,0.12)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#D1E8DF';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
      }}>

      {/* Product Image Area */}
      {/* '#1A1D21' → '#EDF7F3' */}
      <div style={{ position: 'relative', background: '#EDF7F3', height: '180px', overflow: 'hidden' }}>
        {product.image_url ? (
          <img
            src={product.image_url} alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
            {product.image_emoji}
          </div>
        )}

        {/* Badges — warna badge tetap, sudah kontras di atas gambar */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {product.badge && (
            <span style={{
              fontSize: '0.65rem', padding: '3px 8px', borderRadius: '9999px', fontWeight: 700,
              background: product.badge === 'Organik' ? 'rgba(16,185,129,0.85)' :
                product.badge === 'Terlaris' || product.badge === 'Terpopuler' ? 'rgba(245,158,11,0.85)' :
                  product.badge === 'Premium' ? 'rgba(99,102,241,0.85)' : 'rgba(6,182,212,0.85)',
              // Teks putih agar kontras di atas foto
              color: '#FFFFFF',
              border: 'none',
              backdropFilter: 'blur(4px)',
            }}>
              {product.badge === 'Organik' ? '🌿' : product.badge === 'Terlaris' || product.badge === 'Terpopuler' ? '🔥' : '✦'} {product.badge}
            </span>
          )}
          {product.is_wholesale && (
            <span style={{
              fontSize: '0.6rem', padding: '2px 7px', borderRadius: '9999px', fontWeight: 700,
              background: 'rgba(245,158,11,0.85)', color: '#FFFFFF', border: 'none',
            }}>GROSIR</span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={() => setIsWishlisted(!isWishlisted)}
          style={{
            position: 'absolute', top: '10px', right: '10px',
            // bg gelap semi-transparan agar terbaca di atas foto
            background: isWishlisted ? 'rgba(239,68,68,0.85)' : 'rgba(255,255,255,0.85)',
            border: `1px solid ${isWishlisted ? 'rgba(239,68,68,0.5)' : '#D1E8DF'}`,
            borderRadius: '8px', width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s',
            backdropFilter: 'blur(4px)',
          }}>
          {isWishlisted ? '❤️' : '🤍'}
        </button>

        {/* Freshness */}
        <div style={{
          position: 'absolute', bottom: '10px', left: '12px',
          fontSize: '0.65rem',
          color: daysAgo <= 0 ? '#fff' : '#fff',
          // bg solid agar terbaca di atas foto
          background: daysAgo <= 0 ? '#10B981' : 'rgba(0,0,0,0.45)',
          padding: '2px 8px', borderRadius: '9999px',
          border: 'none', backdropFilter: 'blur(4px)',
        }}>
          🌿 {daysAgo <= 0 ? 'Panen hari ini' : `${daysAgo} hari lalu`}
        </div>

        {/* Stock warning */}
        {product.stock < 30 && (
          <div style={{
            position: 'absolute', bottom: '10px', right: '12px',
            fontSize: '0.65rem', color: '#fff',
            background: 'rgba(245,158,11,0.85)', padding: '2px 8px', borderRadius: '9999px',
            border: 'none',
          }}>
            ⚠️ Stok terbatas
          </div>
        )}
      </div>

      {/* Product Info */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Name & Category */}
        <div style={{ marginBottom: '8px' }}>
          {/* '#A1A1AA' → '#6B9E8A' */}
          <div style={{ fontSize: '0.7rem', color: '#6B9E8A', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {product.subcategory}
          </div>
          <Link href={`/products/${product.farmer_slug}/${product.slug}`} style={{ textDecoration: 'none' }}>
            {/* '#FFFFFF' → '#0F1F1A' */}
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F1F1A', lineHeight: 1.3 }}>
              {product.name}
            </div>
          </Link>
        </div>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <StarRating rating={product.rating} />
          <span style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 600 }}>{product.rating.toFixed(1)}</span>
          {/* '#A1A1AA' → '#6B9E8A' */}
          <span style={{ fontSize: '0.7rem', color: '#6B9E8A' }}>({product.review_count} ulasan)</span>
        </div>

        {/* Farmer Info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
          // '#1A1D21' → '#F1F5F3' | '#1E2128' → '#D1E8DF'
          padding: '8px 10px', background: '#F1F5F3', borderRadius: '8px',
          border: '1px solid #D1E8DF',
        }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
            // gradient tetap
            background: 'linear-gradient(135deg, #064E3B, #10B981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6rem', fontWeight: 700, color: '#fff',
          }}>{product.farmer_avatar}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* '#1A3329' sudah merupakan warna gelap — cocok untuk light theme, tetap */}
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0F1F1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product.farmer}
            </div>
            {/* '#A1A1AA' → '#6B9E8A' */}
            <div style={{ fontSize: '0.68rem', color: '#6B9E8A' }}>📍 {product.farmer_city}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            <span style={{ fontSize: '0.65rem', color: '#F59E0B' }}>★</span>
            {/* '#1A3329' → '#0F1F1A' */}
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0F1F1A' }}>{product.farmer_rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Price */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            {/* '#10B981' tetap */}
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#10B981' }}>{formatRupiah(product.price)}</span>
            {/* '#A1A1AA' → '#6B9E8A' */}
            <span style={{ fontSize: '0.78rem', color: '#6B9E8A' }}>/ {product.unit}</span>
          </div>
          {product.is_wholesale && (
            <div style={{ fontSize: '0.72rem', color: '#B45309', marginTop: '3px' }}>
              Grosir ≥{product.wholesale_min} {product.unit}: {formatRupiah(product.wholesale_price)}/{product.unit}
            </div>
          )}
          {/* '#A1A1AA' → '#6B9E8A' */}
          <div style={{ fontSize: '0.72rem', color: '#6B9E8A', marginTop: '2px' }}>
            Min. {product.min_order} {product.unit} • Stok {product.stock} {product.unit}
          </div>
        </div>

        {/* Add to Cart */}
        <div style={{ marginTop: 'auto' }}>
          {qtyView ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <button
                  onClick={() => setQty(Math.max(product.min_order, qty - 1))}
                  style={{
                    width: '32px', height: '36px', borderRadius: '8px 0 0 8px',
                    // '#1A1D21' → '#F1F5F3' | '#2D3340' → '#D1E8DF' | '#FFFFFF' → '#0F1F1A'
                    background: '#F1F5F3', border: '1px solid #D1E8DF', borderRight: 'none',
                    color: '#0F1F1A', cursor: 'pointer', fontSize: '1rem', fontWeight: 700,
                  }}>−</button>
                <div style={{
                  flex: 1, height: '36px', background: '#F1F5F3', border: '1px solid #D1E8DF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 600, color: '#0F1F1A',
                }}>{qty}</div>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  style={{
                    width: '32px', height: '36px', borderRadius: '0 8px 8px 0',
                    background: '#F1F5F3', border: '1px solid #D1E8DF', borderLeft: 'none',
                    color: '#0F1F1A', cursor: 'pointer', fontSize: '1rem', fontWeight: 700,
                  }}>+</button>
              </div>
              {/* Tombol tambah keranjang — emerald tetap */}
              <button
                onClick={handleAdd}
                style={{
                  padding: '0 14px', height: '36px', borderRadius: '8px',
                  background: addedAnim ? '#059669' : '#10B981',
                  border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.8rem',
                  cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                }}>
                {addedAnim ? '✓ Ditambah' : '+ Keranjang'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setQtyView(true)}
              disabled={product.stock <= 0}
              style={{
                width: '100%', padding: '10px', borderRadius: '8px',
                // disabled: '#F1F5F3' bg | enabled: emerald transparan
                background: product.stock <= 0 ? '#F1F5F3' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${product.stock <= 0 ? '#D1E8DF' : 'rgba(16,185,129,0.3)'}`,
                // disabled: '#6B9E8A' | enabled: emerald
                color: product.stock <= 0 ? '#6B9E8A' : '#059669',
                fontWeight: 700, fontSize: '0.875rem',
                cursor: product.stock <= 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (product.stock > 0) {
                  (e.currentTarget as HTMLButtonElement).style.background = '#10B981';
                  (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (product.stock > 0) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.08)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#059669';
                }
              }}>
              {product.stock <= 0 ? 'Stok Habis' : '🛒 Tambah ke Keranjang'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortKey>('popular');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [wholesaleOnly, setWholesaleOnly] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastProduct, setToastProduct] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string, slug: string }[]>([{ name: 'Semua', slug: 'all' }]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const { addItem } = useCartStore();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params: any = {
          per_page: 20, q: search,
          sort: sort === 'popular' ? 'rating' : sort,
          min_price: priceMin || undefined,
          max_price: priceMax || undefined,
        };
        if (category !== 'all') params.category = category;
        if (wholesaleOnly) params.pricing_type = 'wholesale';
        const res = await apiClient.get<PaginatedResponse<ApiProduct>>('/catalog/products', { params });
        const apiData = res.data;
        let final = apiData.data.map(mapApiProduct);
        if (organicOnly) final = final.filter(p => p.is_organic);
        setProducts(final);
        setTotalCount(apiData.meta.pagination.total);
        if (categories.length === 1) {
          const catRes = await apiClient.get<ApiSuccessResponse<ProductCategory[]>>('/catalog/categories');
          setCategories([{ name: 'Semua', slug: 'all' }, ...catRes.data.data.map(c => ({ name: c.name, slug: c.slug }))]);
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setIsLoading(false);
      }
    }
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [search, category, sort, organicOnly, wholesaleOnly, priceMin, priceMax]);

  async function handleAddToCart(p: Product, quantity: number) {
    if (!isAuthenticated || user?.role !== 'buyer') {
      router.push('/login?redirect=/products');
      return;
    }
    try {
      const pricingType = (p.is_wholesale && quantity >= p.wholesale_min) ? 'wholesale' : 'retail';
      await addItem(p.id, quantity, pricingType);
      setToastProduct(p.name);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan ke keranjang');
    }
  }

  return (
    // '#0A0B0D' → '#F8FAF9' | '#FFFFFF' → '#0F1F1A'
    <div style={{ minHeight: '100vh', background: '#F8FAF9', color: '#0F1F1A', fontFamily: 'Inter, sans-serif' }}>

      {/* Toast notification */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          // '#111316' → '#FFFFFF' | shadow lebih terang
          background: '#FFFFFF', border: '1px solid rgba(16,185,129,0.35)',
          borderRadius: '12px', padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          animation: 'slideIn 0.3s ease',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
          }}>✅</div>
          <div>
            {/* '#FFFFFF' → '#0F1F1A' */}
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F1F1A' }}>Ditambahkan ke keranjang</div>
            {/* '#A1A1AA' → '#6B9E8A' */}
            <div style={{ fontSize: '0.75rem', color: '#6B9E8A' }}>{toastProduct}</div>
          </div>
          <Link href="/buyer/cart" style={{
            padding: '6px 12px', background: '#10B981', borderRadius: '6px',
            color: '#fff', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'none', marginLeft: '4px',
          }}>Lihat</Link>
        </div>
      )}

      {/* Page Header */}
      {/* '#1E2128' → '#D1E8DF' */}
      <div style={{ padding: '32px 32px 0', borderBottom: '1px solid #D1E8DF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            {/* '#FFFFFF' → '#0F1F1A' */}
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F1F1A', margin: 0 }}>Katalog Produk</h1>
            {/* '#A1A1AA' → '#6B9E8A' */}
            <p style={{ color: '#6B9E8A', marginTop: '4px', fontSize: '0.875rem' }}>
              {totalCount} produk segar langsung dari petani terpercaya
            </p>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { label: 'Tersedia', value: totalCount, color: '#10B981' },
              { label: 'Organik', value: products.filter(p => p.is_organic).length, color: '#6366F1' },
              { label: 'Grosir', value: products.filter(p => p.is_wholesale).length, color: '#B45309' },
            ].map((s) => (
              <div key={s.label} style={{
                // '#111316' → '#FFFFFF' | '#1E2128' → '#D1E8DF'
                background: '#FFFFFF', border: '1px solid #D1E8DF', borderRadius: '12px',
                padding: '12px 16px', textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                {/* '#A1A1AA' → '#6B9E8A' */}
                <div style={{ fontSize: '0.72rem', color: '#6B9E8A', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.slug)}
              style={{
                padding: '10px 18px', borderRadius: '10px 10px 0 0', cursor: 'pointer',
                // active: '#FFFFFF' bg, '#D1E8DF' border, bottom border match bg
                // inactive: transparent
                background: category === cat.slug ? '#FFFFFF' : 'transparent',
                border: `1px solid ${category === cat.slug ? '#D1E8DF' : 'transparent'}`,
                borderBottom: category === cat.slug ? '1px solid #FFFFFF' : '1px solid transparent',
                color: category === cat.slug ? '#059669' : '#6B9E8A',
                fontWeight: category === cat.slug ? 600 : 400, fontSize: '0.875rem',
                display: 'flex', alignItems: 'center', gap: '6px',
                marginBottom: '-1px', whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '380px' }}>
          {/* '#A1A1AA' → '#6B9E8A' */}
          <svg style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#6B9E8A' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk, petani, atau kategori..."
            style={{
              width: '100%', padding: '10px 14px 10px 40px',
              // '#1A1D21' → '#F1F5F3' | '#1E2128' → '#D1E8DF' | '#FFFFFF' → '#0F1F1A'
              background: '#F1F5F3', border: '1px solid #D1E8DF', borderRadius: '8px',
              color: '#0F1F1A', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#6B9E8A', cursor: 'pointer', fontSize: '1rem',
            }}>✕</button>
          )}
        </div>

        {/* Sort */}
        <select
          value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
          style={{
            padding: '10px 14px',
            // '#1A1D21' → '#F1F5F3' | '#1E2128' → '#D1E8DF' | '#FFFFFF' → '#0F1F1A'
            background: '#F1F5F3', border: '1px solid #D1E8DF',
            borderRadius: '8px', color: '#0F1F1A', fontSize: '0.875rem', cursor: 'pointer',
          }}>
          {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '10px 16px',
            background: showFilters ? 'rgba(16,185,129,0.08)' : '#F1F5F3',
            border: `1px solid ${showFilters ? 'rgba(16,185,129,0.35)' : '#D1E8DF'}`,
            borderRadius: '8px', color: showFilters ? '#059669' : '#4B7A67',
            fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
          ⚙️ Filter {(organicOnly || wholesaleOnly || priceMin || priceMax) && (
            <span style={{
              width: '18px', height: '18px', borderRadius: '50%', background: '#10B981',
              color: '#fff', fontSize: '0.65rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {[organicOnly, wholesaleOnly, !!priceMin, !!priceMax].filter(Boolean).length}
            </span>
          )}
        </button>

        {/* View Mode */}
        {/* '#1A1D21' → '#F1F5F3' | '#1E2128' → '#D1E8DF' */}
        <div style={{ display: 'flex', background: '#F1F5F3', border: '1px solid #D1E8DF', borderRadius: '8px', overflow: 'hidden' }}>
          {(['grid', 'list'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '10px 14px',
                // active: '#FFFFFF' | inactive: transparent
                background: viewMode === mode ? '#FFFFFF' : 'transparent',
                border: 'none', color: viewMode === mode ? '#059669' : '#6B9E8A',
                cursor: 'pointer', fontSize: '0.9rem',
              }}>
              {mode === 'grid' ? '⊞' : '☰'}
            </button>
          ))}
        </div>

        {/* Result count */}
        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#6B9E8A' }}>
          <span style={{ color: '#10B981', fontWeight: 600 }}>{products.length}</span> produk ditampilkan
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div style={{
          margin: '0 32px 20px', padding: '20px',
          // '#111316' → '#FFFFFF' | '#1E2128' → '#D1E8DF'
          background: '#FFFFFF', border: '1px solid #D1E8DF', borderRadius: '12px',
          display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Organic Checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <div
                onClick={() => setOrganicOnly(!organicOnly)}
                style={{
                  width: '18px', height: '18px', borderRadius: '4px',
                  // border inactive: '#D1E8DF'
                  border: `2px solid ${organicOnly ? '#10B981' : '#D1E8DF'}`,
                  background: organicOnly ? '#10B981' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {organicOnly && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>}
              </div>
              {/* '#1A3329' → '#0F1F1A' */}
              <span style={{ fontSize: '0.875rem', color: '#0F1F1A' }}>🌿 Organik Saja</span>
            </label>

            {/* Wholesale Checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <div
                onClick={() => setWholesaleOnly(!wholesaleOnly)}
                style={{
                  width: '18px', height: '18px', borderRadius: '4px',
                  border: `2px solid ${wholesaleOnly ? '#F59E0B' : '#D1E8DF'}`,
                  background: wholesaleOnly ? '#F59E0B' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {wholesaleOnly && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>}
              </div>
              {/* '#A1A1AA' → '#0F1F1A' */}
              <span style={{ fontSize: '0.875rem', color: '#0F1F1A' }}>📦 Tersedia Grosir</span>
            </label>
          </div>

          {/* Price Range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* '#71717A' → '#6B9E8A' */}
            <span style={{ fontSize: '0.8rem', color: '#6B9E8A' }}>Harga:</span>
            {[
              { value: priceMin, onChange: setPriceMin, placeholder: 'Min (Rp)' },
              { value: priceMax, onChange: setPriceMax, placeholder: 'Max (Rp)' },
            ].map((inp, i) => (
              <input
                key={i}
                type="number" value={inp.value}
                onChange={(e) => inp.onChange(e.target.value)}
                placeholder={inp.placeholder}
                style={{
                  width: '100px', padding: '8px 10px',
                  // '#1A1D21' → '#F1F5F3' | '#2D3340' → '#D1E8DF' | '#FFFFFF' → '#0F1F1A'
                  background: '#F1F5F3', border: '1px solid #D1E8DF', borderRadius: '6px',
                  color: '#0F1F1A', fontSize: '0.8rem', outline: 'none',
                }}
              />
            ))}
          </div>

          {/* Reset */}
          {(organicOnly || wholesaleOnly || priceMin || priceMax) && (
            <button
              onClick={() => { setOrganicOnly(false); setWholesaleOnly(false); setPriceMin(''); setPriceMax(''); }}
              style={{
                padding: '7px 14px', background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.18)', borderRadius: '8px',
                // '#EF4444' → '#DC2626' (lebih gelap agar kontras di bg terang)
                color: '#DC2626', fontSize: '0.8rem', cursor: 'pointer',
              }}>
              ✕ Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Products Grid / List */}
      <div style={{ padding: '0 32px 40px' }}>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} style={{
                height: '380px', borderRadius: '14px',
                // shimmer terang
                background: 'linear-gradient(90deg, #E8F0ED 25%, #F1F5F3 50%, #E8F0ED 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite, pulse 1.5s infinite ease-in-out',
                border: '1px solid #D1E8DF',
              }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          // Empty state
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            // '#111316' → '#FFFFFF' | '#1E2128' → '#D1E8DF'
            background: '#FFFFFF', border: '1px solid #D1E8DF', borderRadius: '12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🔍</div>
            {/* '#FFFFFF' → '#0F1F1A' */}
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F1F1A' }}>Produk tidak ditemukan</div>
            {/* '#A1A1AA' → '#6B9E8A' */}
            <div style={{ fontSize: '0.875rem', color: '#6B9E8A', marginTop: '8px', marginBottom: '20px' }}>
              Coba ubah kata kunci atau filter pencarian
            </div>
            <button
              onClick={() => { setSearch(''); setCategory('all'); setOrganicOnly(false); setWholesaleOnly(false); setPriceMin(''); setPriceMax(''); }}
              style={{ padding: '10px 24px', background: '#10B981', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}>
              Reset Semua Filter
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
            ))}
          </div>
        ) : (
          // List View
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {products.map((p) => (
              <div key={p.id} style={{
                // '#111316' → '#FFFFFF' | '#1E2128' → '#D1E8DF'
                background: '#FFFFFF', border: '1px solid #D1E8DF', borderRadius: '12px',
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(16,185,129,0.4)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(16,185,129,0.10)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#D1E8DF';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                }}>
                {/* '#1A1D21' → '#EDF7F3' */}
                <div style={{
                  width: '56px', height: '56px', background: '#EDF7F3', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', flexShrink: 0, overflow: 'hidden',
                }}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : p.image_emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* '#FFFFFF' → '#0F1F1A' */}
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#0F1F1A' }}>{p.name}</span>
                    {p.badge && (
                      <span style={{
                        fontSize: '0.65rem', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700,
                        background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)',
                      }}>{p.badge}</span>
                    )}
                  </div>
                  {/* '#A1A1AA' → '#6B9E8A' */}
                  <div style={{ fontSize: '0.75rem', color: '#6B9E8A', marginTop: '2px' }}>
                    🌱 {p.farmer} · 📍 {p.farmer_city} · ⭐ {p.rating.toFixed(1)} ({p.review_count})
                  </div>
                  {/* '#71717A' → '#6B9E8A' */}
                  <div style={{ fontSize: '0.75rem', color: '#6B9E8A', marginTop: '2px' }}>
                    Min. {p.min_order} {p.unit} · Stok {p.stock} {p.unit}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#10B981' }}>
                    {formatRupiah(p.price)}
                    {/* '#A1A1AA' → '#6B9E8A' */}
                    <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#6B9E8A' }}>/{p.unit}</span>
                  </div>
                  {p.is_wholesale && (
                    // '#F59E0B' → '#B45309' (lebih gelap agar kontras di bg terang)
                    <div style={{ fontSize: '0.7rem', color: '#B45309', marginTop: '2px' }}>
                      Grosir: {formatRupiah(p.wholesale_price)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleAddToCart(p, p.min_order)}
                  disabled={p.stock <= 0}
                  style={{
                    padding: '9px 16px',
                    background: p.stock <= 0 ? '#F1F5F3' : 'rgba(16,185,129,0.08)',
                    border: `1px solid ${p.stock <= 0 ? '#D1E8DF' : 'rgba(16,185,129,0.3)'}`,
                    borderRadius: '8px',
                    color: p.stock <= 0 ? '#6B9E8A' : '#059669',
                    fontWeight: 600, fontSize: '0.8rem',
                    cursor: p.stock <= 0 ? 'not-allowed' : 'pointer',
                    flexShrink: 0, transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (p.stock > 0) {
                      (e.currentTarget as HTMLButtonElement).style.background = '#10B981';
                      (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (p.stock > 0) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.08)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#059669';
                    }
                  }}>
                  {p.stock <= 0 ? 'Habis' : '🛒 Tambah'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 0.8; }
          50% { opacity: 0.5; }
          100% { opacity: 0.8; }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}