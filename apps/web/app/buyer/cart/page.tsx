'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCartStore, CartItem as ApiCartItem } from '@/lib/store/cartStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  farmer: string;
  farmer_avatar: string;
  farmer_city: string;
  unit: string;
  price_per_unit: number;
  min_order: number;
  stock: number;
  qty: number;
  category: string;
  is_organic: boolean;
  image_emoji: string;
  notes: string;
  selected: boolean;
  is_real?: boolean;
  farmer_id?: string;
}

interface FarmerGroup {
  farmer: string;
  farmer_avatar: string;
  farmer_city: string;
  items: CartItem[];
}

const MOCK_CART: CartItem[] = [
  {
    id: 'c1', product_id: 'p1',
    name: 'Cabai Merah Keriting', farmer: 'Pak Suharto', farmer_avatar: 'SH',
    farmer_city: 'Boyolali', unit: 'kg', price_per_unit: 28000,
    min_order: 5, stock: 120, qty: 10, category: 'Cabai',
    is_organic: false, image_emoji: '🌶️', notes: '', selected: true,
    farmer_id: '019de4c6-4c2d-70f0-b22b-2033e6883dd9'
  },
  {
    id: 'c2', product_id: 'p2',
    name: 'Tomat Cherry Segar', farmer: 'Pak Suharto', farmer_avatar: 'SH',
    farmer_city: 'Boyolali', unit: 'kg', price_per_unit: 15000,
    min_order: 2, stock: 80, qty: 5, category: 'Tomat',
    is_organic: true, image_emoji: '🍅', notes: '', selected: true,
    farmer_id: '019de4c6-4c2d-70f0-b22b-2033e6883dd9'
  },
  {
    id: 'c3', product_id: 'p3',
    name: 'Beras Pandan Wangi Premium', farmer: 'Bu Sari', farmer_avatar: 'BS',
    farmer_city: 'Karawang', unit: 'kg', price_per_unit: 14500,
    min_order: 10, stock: 500, qty: 50, category: 'Beras',
    is_organic: false, image_emoji: '🌾', notes: 'Tolong pisahkan per 10kg', selected: true,
    farmer_id: '019de4c6-4c2d-70f0-b22b-2033e6883dd9'
  },
  {
    id: 'c5', product_id: 'p5',
    name: 'Bawang Merah Brebes', farmer: 'Pak Tono', farmer_avatar: 'PT',
    farmer_city: 'Brebes', unit: 'kg', price_per_unit: 35000,
    min_order: 3, stock: 200, qty: 15, category: 'Bumbu',
    is_organic: false, image_emoji: '🧅', notes: '', selected: true,
    farmer_id: '019de4c6-4c2d-70f0-b22b-2033e6883dd9'
  },
];

function getEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('cabai') || n.includes('cabe')) return '🌶️';
  if (n.includes('tomat')) return '🍅';
  if (n.includes('beras')) return '🌾';
  if (n.includes('bawang')) return n.includes('putih') ? '🧄' : '🧅';
  if (n.includes('bayam')) return '🥬';
  if (n.includes('kangkung')) return '🌿';
  if (n.includes('kentang')) return '🥔';
  if (n.includes('wortel')) return '🥕';
  if (n.includes('jagung')) return '🌽';
  if (n.includes('terong')) return '🍆';
  return '📦';
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function groupByFarmer(items: CartItem[]): FarmerGroup[] {
  const map = new Map<string, FarmerGroup>();
  items.forEach((item) => {
    if (!map.has(item.farmer)) {
      map.set(item.farmer, {
        farmer: item.farmer,
        farmer_avatar: item.farmer_avatar,
        farmer_city: item.farmer_city,
        items: [],
      });
    }
    map.get(item.farmer)!.items.push(item);
  });
  return Array.from(map.values());
}

// ─── Design Tokens (Premium Light Theme) ──────────────────
const C = {
  bgApp: '#F8FAFC',       // Slate 50
  bgCard: '#FFFFFF',      // Putih Bersih
  bgInput: '#F1F5F9',     // Slate 100
  border: '#E2E8F0',      // Slate 200
  textMain: '#0F172A',    // Slate 900
  textSecondary: '#334155',// Slate 700
  textMuted: '#64748B',   // Slate 500
  textSubtle: '#94A3B8',  // Slate 400
  primary: '#059669',     // Emerald 600
  primaryGlow: 'rgba(5, 150, 105, 0.08)',
  primaryBorder: 'rgba(5, 150, 105, 0.25)',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  shadowCard: '0 4px 20px rgba(0, 0, 0, 0.03)',
  shadowButton: '0 4px 12px rgba(5, 150, 105, 0.2)',
};

export default function CartPage() {
  const [mockItems, setMockItems] = useState<CartItem[]>(MOCK_CART);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set([...MOCK_CART.map(i => i.id)]));
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'confirm'>('cart');
  const [deliveryType, setDeliveryType] = useState<'reguler' | 'express'>('reguler');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [noteEditId, setNoteEditId] = useState<string | null>(null);

  const { items: storeItems, fetchCart, updateItem: storeUpdateItem, removeItem: storeRemoveItem, isLoading } = useCartStore();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'buyer' || user?.role === 'farmer')) {
      fetchCart();
    }
  }, [isAuthenticated, user]);

  const realItems = useMemo(() => {
    return storeItems.map(item => ({
      id: item.id,
      product_id: item.product_id,
      name: item.product?.name || 'Produk',
      farmer: item.product?.farmer?.store_name || 'Petani Lokal',
      farmer_avatar: (item.product?.farmer?.store_name || 'P')[0].toUpperCase(),
      farmer_city: 'Petani Terverifikasi',
      unit: item.product?.unit || 'kg',
      price_per_unit: item.current_price,
      min_order: 1,
      stock: 999,
      qty: item.quantity,
      category: 'Produk Segar',
      is_organic: item.product?.name.toLowerCase().includes('organik') || false,
      image_emoji: getEmoji(item.product?.name || ''),
      notes: '',
      selected: selectedIds.has(item.id),
      is_real: true,
      farmer_id: item.product?.farmer?.id
    }));
  }, [storeItems, selectedIds]);

  const cartItems = useMemo(() => {
    const combined = [...mockItems, ...realItems];
    return combined.map(item => ({
      ...item,
      selected: selectedIds.has(item.id)
    }));
  }, [mockItems, realItems, selectedIds]);

  const grouped = groupByFarmer(cartItems);
  const selectedItems = cartItems.filter((i) => i.selected);
  const subtotal = selectedItems.reduce((s, i) => s + i.price_per_unit * i.qty, 0);
  const discount = promoApplied ? Math.round(subtotal * 0.05) : 0;
  const deliveryFee = deliveryType === 'express' ? 75000 : 35000;
  const total = subtotal - discount + deliveryFee;
  const totalWeight = selectedItems.reduce((s, i) => s + (i.unit === 'kg' ? i.qty : 0), 0);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === cartItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cartItems.map(i => i.id)));
    }
  }

  async function updateQty(item: CartItem, delta: number) {
    const newQty = Math.max(item.min_order, Math.min(item.stock, item.qty + delta));

    if (item.is_real) {
      try {
        await storeUpdateItem(item.id, newQty);
      } catch (err) {
        alert('Gagal memperbarui kuantitas');
      }
    } else {
      setMockItems(prev => prev.map(i => i.id === item.id ? { ...i, qty: newQty } : i));
    }
  }

  async function removeItem(id: string, isReal?: boolean) {
    setDeletingId(id);
    setTimeout(async () => {
      if (isReal) {
        try {
          await storeRemoveItem(id);
        } catch (err) {
          alert('Gagal menghapus item');
        }
      } else {
        setMockItems(prev => prev.filter(i => i.id !== id));
      }
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDeletingId(null);
    }, 300);
  }

  function applyPromo() {
    if (promoCode.toUpperCase() === 'TANI5') {
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoError('Kode promo tidak valid atau sudah kadaluarsa');
      setPromoApplied(false);
    }
  }

  function updateNote(id: string, note: string, isReal?: boolean) {
    if (isReal) {
      // API Local note storage
    } else {
      setMockItems(prev => prev.map(i => i.id === id ? { ...i, notes: note } : i));
    }
  }

  const allSelected = cartItems.length > 0 && selectedIds.size === cartItems.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div style={{ minHeight: '100vh', background: C.bgApp, color: C.textMain, fontFamily: 'Inter, sans-serif' }}>

      {/* Page Header */}
      <div style={{ padding: '32px 40px 24px', background: C.bgCard, borderBottom: `1px solid ${C.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${C.primary}, #10B981)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: C.shadowButton
            }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: C.textMain, margin: 0, letterSpacing: '-0.02em' }}>Keranjang Belanja</h1>
              <p style={{ color: C.textMuted, marginTop: '4px', fontSize: '0.95rem', fontWeight: 500 }}>
                {cartItems.length} produk dari {grouped.length} petani siap untuk dipesan
              </p>
            </div>
            {isLoading && (
              <div style={{ marginLeft: '16px', color: C.primary, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', background: C.primaryGlow, padding: '6px 12px', borderRadius: '20px' }}>
                <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid transparent', borderTopColor: C.primary, borderRadius: '50%' }} />
                Menyinkronkan data...
              </div>
            )}
          </div>

          {/* Progress Steps */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '28px' }}>
            {['Keranjang', 'Konfirmasi', 'Pembayaran'].map((step, idx) => {
              const stepKey = ['cart', 'confirm', 'payment'][idx];
              const isActive = checkoutStep === stepKey;
              const isPast = (checkoutStep === 'confirm' && idx === 0);
              return (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: isActive ? C.primary : isPast ? '#D1FAE5' : C.bgInput,
                      border: `2px solid ${isActive ? C.primary : isPast ? C.primary : C.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', fontWeight: 700,
                      color: isActive ? '#fff' : isPast ? C.primary : C.textSubtle,
                    }}>
                      {isPast ? '✓' : idx + 1}
                    </div>
                    <span style={{
                      fontSize: '0.9rem', fontWeight: isActive ? 700 : 500,
                      color: isActive ? C.textMain : C.textMuted,
                    }}>{step}</span>
                  </div>
                  {idx < 2 && <div style={{ width: '40px', height: '2px', background: isPast ? C.primary : C.border }} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 0', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

        {/* LEFT: Cart Items */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Select All Bar */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px',
            padding: '16px 24px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: C.shadowCard
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <div
                onClick={toggleSelectAll}
                style={{
                  width: '20px', height: '20px', borderRadius: '6px',
                  border: `2px solid ${allSelected ? C.primary : C.textSubtle}`,
                  background: allSelected ? C.primary : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                }}>
                {allSelected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: C.textMain }}>
                Pilih Semua ({cartItems.length} produk)
              </span>
            </label>
            {someSelected && (
              <button
                onClick={() => {
                  selectedItems.forEach(i => removeItem(i.id, i.is_real));
                }}
                style={{
                  background: C.dangerBg, border: `1px solid ${C.dangerBorder}`,
                  borderRadius: '8px', color: C.danger, fontSize: '0.85rem', fontWeight: 600,
                  padding: '8px 16px', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#FEE2E2'}
                onMouseOut={(e) => e.currentTarget.style.background = C.dangerBg}
              >
                Hapus Terpilih ({selectedItems.length})
              </button>
            )}
          </div>

          {/* Farmer Groups */}
          {grouped.map((group) => (
            <div key={group.farmer} style={{
              background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px',
              marginBottom: '20px', overflow: 'hidden', boxShadow: C.shadowCard
            }}>
              {/* Farmer Header */}
              <div style={{
                padding: '16px 24px', borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: '14px',
                background: C.bgApp,
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: `linear-gradient(135deg, ${C.primary}, #34D399)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem', color: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>{group.farmer_avatar}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: C.textMain }}>🌱 {group.farmer}</div>
                  <div style={{ fontSize: '0.8rem', color: C.textMuted, marginTop: '2px', fontWeight: 500 }}>📍 {group.farmer_city}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span style={{
                    fontSize: '0.75rem', padding: '4px 12px', borderRadius: '9999px',
                    background: C.primaryGlow, color: C.primary,
                    border: `1px solid ${C.primaryBorder}`, fontWeight: 700,
                  }}>✓ Terverifikasi</span>
                </div>
              </div>

              {/* Items */}
              {group.items.map((item, idx) => (
                <div key={item.id} style={{
                  padding: '20px 24px',
                  borderBottom: idx === group.items.length - 1 ? 'none' : `1px solid ${C.bgInput}`,
                  opacity: deletingId === item.id ? 0 : 1,
                  transition: 'opacity 0.3s, background 0.15s',
                  background: item.selected ? '#F0FDF4' : 'transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>

                    {/* Checkbox */}
                    <div
                      onClick={() => toggleSelect(item.id)}
                      style={{
                        width: '20px', height: '20px', borderRadius: '6px', marginTop: '18px',
                        border: `2px solid ${item.selected ? C.primary : C.textSubtle}`,
                        background: item.selected ? C.primary : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                      }}>
                      {item.selected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>

                    {/* Product Emoji */}
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '12px',
                      background: C.bgInput, border: `1px solid ${C.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '2rem', flexShrink: 0, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                    }}>{item.image_emoji}</div>

                    {/* Product Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: C.textMain }}>{item.name}</span>
                            {item.is_organic && (
                              <span style={{
                                fontSize: '0.65rem', padding: '2px 8px', borderRadius: '9999px',
                                background: '#ECFDF5', color: C.primary,
                                border: '1px solid #A7F3D0', fontWeight: 700,
                              }}>🌿 ORGANIK</span>
                            )}
                            {item.is_real && (
                              <span style={{
                                fontSize: '0.65rem', padding: '2px 8px', borderRadius: '6px',
                                background: '#EFF6FF', color: '#2563EB',
                                border: '1px solid #BFDBFE', fontWeight: 700,
                              }}>REAL</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.8rem', color: C.textMuted, fontWeight: 500 }}>Kategori: {item.category}</span>
                            <span style={{ fontSize: '0.8rem', color: C.textSubtle }}>•</span>
                            <span style={{ fontSize: '0.8rem', color: C.textMuted, fontWeight: 500 }}>Min. {item.min_order} {item.unit}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: item.stock < 20 ? '#D97706' : C.textMuted }}>
                              Stok: {item.stock} {item.unit} {item.stock < 20 ? '⚠️' : ''}
                            </span>
                          </div>

                          {/* Notes */}
                          <div style={{ marginTop: '12px' }}>
                            {noteEditId === item.id ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                  autoFocus
                                  value={item.notes}
                                  onChange={(e) => updateNote(item.id, e.target.value, item.is_real)}
                                  onBlur={() => setNoteEditId(null)}
                                  placeholder="Tambahkan catatan untuk petani (opsional)..."
                                  style={{
                                    flex: 1, padding: '8px 12px', background: C.bgCard,
                                    border: `1px solid ${C.primary}`, borderRadius: '8px',
                                    color: C.textMain, fontSize: '0.85rem', outline: 'none',
                                    boxShadow: '0 0 0 3px rgba(5,150,105,0.1)'
                                  }}
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => setNoteEditId(item.id)}
                                style={{
                                  background: 'none', border: 'none', padding: 0,
                                  color: item.notes ? C.primary : C.textMuted,
                                  fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500,
                                  display: 'flex', alignItems: 'center', gap: '6px',
                                }}>
                                ✏️ {item.notes ? <span style={{ fontStyle: 'italic' }}>&quot;{item.notes.slice(0, 40)}{item.notes.length > 40 ? '...' : ''}&quot;</span> : 'Tambah catatan'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '1.15rem', color: C.primary, letterSpacing: '-0.02em' }}>
                            {formatRupiah(item.price_per_unit * item.qty)}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: C.textMuted, marginTop: '4px', fontWeight: 500 }}>
                            {formatRupiah(item.price_per_unit)} / {item.unit}
                          </div>
                        </div>
                      </div>

                      {/* Qty Control + Delete */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                          <button
                            onClick={() => updateQty(item, -1)}
                            disabled={item.qty <= item.min_order}
                            style={{
                              width: '36px', height: '36px', borderRadius: '8px 0 0 8px',
                              background: item.qty <= item.min_order ? C.bgInput : C.bgCard, border: `1px solid ${C.border}`, borderRight: 'none',
                              color: item.qty <= item.min_order ? C.textSubtle : C.textMain,
                              cursor: item.qty <= item.min_order ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '1.2rem', fontWeight: 500, transition: 'background 0.15s',
                            }}>−</button>
                          <div style={{
                            width: '56px', height: '36px', background: C.bgCard,
                            border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, color: C.textMain,
                          }}>
                            {item.qty}
                          </div>
                          <button
                            onClick={() => updateQty(item, 1)}
                            disabled={item.qty >= item.stock}
                            style={{
                              width: '36px', height: '36px', borderRadius: '0 8px 8px 0',
                              background: item.qty >= item.stock ? C.bgInput : C.bgCard, border: `1px solid ${C.border}`, borderLeft: 'none',
                              color: item.qty >= item.stock ? C.textSubtle : C.textMain,
                              cursor: item.qty >= item.stock ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '1.2rem', fontWeight: 500, transition: 'background 0.15s',
                            }}>+</button>
                          <span style={{ fontSize: '0.85rem', color: C.textMuted, marginLeft: '12px', fontWeight: 500 }}>{item.unit}</span>
                        </div>

                        <button
                          onClick={() => removeItem(item.id, item.is_real)}
                          style={{
                            background: C.dangerBg, border: `1px solid ${C.dangerBorder}`,
                            borderRadius: '8px', color: C.danger, fontSize: '0.85rem', fontWeight: 600,
                            padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#FEE2E2'}
                          onMouseOut={(e) => e.currentTarget.style.background = C.dangerBg}
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {cartItems.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '100px 20px',
              background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px',
              boxShadow: C.shadowCard
            }}>
              <div style={{ fontSize: '5rem', marginBottom: '20px', opacity: 0.8 }}>🛒</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: C.textMain }}>Keranjang Anda masih kosong</div>
              <div style={{ fontSize: '0.95rem', color: C.textMuted, marginTop: '8px', marginBottom: '32px' }}>
                Temukan berbagai macam produk segar langsung dari petani terbaik.
              </div>
              <Link href="/products" style={{
                display: 'inline-block', padding: '12px 32px',
                background: C.primary, borderRadius: '10px', color: '#fff',
                fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none',
                boxShadow: C.shadowButton, transition: 'transform 0.2s'
              }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                Mulai Belanja Sekarang
              </Link>
            </div>
          )}
        </div>

        {/* RIGHT: Summary */}
        <div style={{ width: '380px', flexShrink: 0, position: 'sticky', top: '24px' }}>

          {/* Order Summary Card */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px',
            overflow: 'hidden', marginBottom: '20px', boxShadow: C.shadowCard
          }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, background: C.bgApp }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: C.textMain }}>Ringkasan Pesanan</h3>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Selected items summary */}
              <div style={{ marginBottom: '20px' }}>
                {selectedItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: C.textMuted, fontSize: '0.9rem', fontWeight: 500 }}>
                    Belum ada produk yang dipilih
                  </div>
                ) : (
                  selectedItems.map((item) => (
                    <div key={item.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      marginBottom: '12px',
                    }}>
                      <span style={{ fontSize: '0.85rem', color: C.textSecondary, flex: 1, marginRight: '12px', lineHeight: 1.4, fontWeight: 500 }}>
                        {item.image_emoji} {item.name.length > 20 ? item.name.slice(0, 20) + '...' : item.name}
                        <span style={{ color: C.textMuted }}> ×{item.qty}</span>
                      </span>
                      <span style={{ fontSize: '0.85rem', color: C.textMain, fontWeight: 700, flexShrink: 0 }}>
                        {formatRupiah(item.price_per_unit * item.qty)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div style={{ height: '1px', background: C.border, marginBottom: '20px' }} />

              {/* Promo Code */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.85rem', color: C.textMain, marginBottom: '10px', fontWeight: 700 }}>
                  🎟️ Gunakan Promo
                </div>
                {promoApplied ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: C.primaryGlow,
                    border: `1px solid ${C.primaryBorder}`, borderRadius: '10px',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: C.primary }}>TANI5</span>
                      <span style={{ fontSize: '0.8rem', color: C.textSecondary, marginLeft: '8px', fontWeight: 500 }}>Diskon 5% Diterapkan</span>
                    </div>
                    <button
                      onClick={() => { setPromoApplied(false); setPromoCode(''); }}
                      style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, padding: '4px' }}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        value={promoCode}
                        onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                        placeholder="Masukkan kode promo..."
                        style={{
                          flex: 1, padding: '10px 14px', background: C.bgInput,
                          border: `1px solid ${promoError ? C.danger : C.border}`, borderRadius: '10px',
                          color: C.textMain, fontSize: '0.85rem', outline: 'none', transition: 'border 0.2s'
                        }}
                      />
                      <button
                        onClick={applyPromo}
                        style={{
                          padding: '10px 16px', background: C.bgCard,
                          border: `1px solid ${C.border}`, borderRadius: '10px',
                          color: C.primary, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = C.bgInput}
                        onMouseOut={(e) => e.currentTarget.style.background = C.bgCard}
                      >Terapkan</button>
                    </div>
                    {promoError && <div style={{ fontSize: '0.8rem', color: C.danger, marginTop: '8px', fontWeight: 500 }}>{promoError}</div>}
                    <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '8px', fontWeight: 500 }}>Coba gunakan kode: <strong style={{ color: C.primary }}>TANI5</strong></div>
                  </div>
                )}
              </div>

              {/* Delivery Type */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.85rem', color: C.textMain, marginBottom: '10px', fontWeight: 700 }}>
                  🚚 Opsi Pengiriman
                </div>
                {[
                  { key: 'reguler', label: 'Reguler', sub: '3-5 hari kerja', price: 35000 },
                  { key: 'express', label: 'Express', sub: '1-2 hari kerja', price: 75000 },
                ].map((opt) => (
                  <div
                    key={opt.key}
                    onClick={() => setDeliveryType(opt.key as 'reguler' | 'express')}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                      border: `1px solid ${deliveryType === opt.key ? C.primary : C.border}`,
                      background: deliveryType === opt.key ? '#F0FDF4' : C.bgCard,
                      marginBottom: '8px', transition: 'all 0.15s',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        border: `2px solid ${deliveryType === opt.key ? C.primary : C.textSubtle}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {deliveryType === opt.key && (
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: C.primary }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: C.textMain }}>{opt.label}</div>
                        <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '2px', fontWeight: 500 }}>{opt.sub}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: C.primary }}>
                      {formatRupiah(opt.price)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', background: C.bgApp, padding: '16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: C.textSecondary, fontWeight: 500 }}>Subtotal produk ({selectedItems.length})</span>
                  <span style={{ fontSize: '0.85rem', color: C.textMain, fontWeight: 600 }}>{formatRupiah(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', color: C.textSecondary, fontWeight: 500 }}>Diskon Promo (5%)</span>
                    <span style={{ fontSize: '0.85rem', color: C.primary, fontWeight: 700 }}>− {formatRupiah(discount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: C.textSecondary, fontWeight: 500 }}>Ongkos Kirim ({deliveryType})</span>
                  <span style={{ fontSize: '0.85rem', color: C.textMain, fontWeight: 600 }}>{formatRupiah(deliveryFee)}</span>
                </div>
                {totalWeight > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px dashed ${C.border}`, paddingTop: '10px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: C.textMuted }}>Estimasi Total Berat</span>
                    <span style={{ fontSize: '0.8rem', color: C.textSecondary, fontWeight: 600 }}>{totalWeight} kg</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: C.textMain }}>Total Pembayaran</span>
                <span style={{ fontWeight: 800, fontSize: '1.4rem', color: C.primary, letterSpacing: '-0.02em' }}>{formatRupiah(total)}</span>
              </div>

              <button
                disabled={selectedItems.length === 0}
                onClick={() => {
                  const checkoutItems = selectedItems.map(item => ({
                    product_id: item.product_id,
                    farmer_id: item.farmer_id || '019de4c6-4c2d-70f0-b22b-2033e6883dd9', // Fallback to a real farmer ID for testing
                    farmer_name: item.farmer,
                    farmer_avatar: item.farmer_avatar,
                    farmer_city: item.farmer_city,
                    product_name: item.name,
                    product_emoji: item.image_emoji,
                    unit: item.unit,
                    qty: item.qty,
                    price_per_unit: item.price_per_unit,
                    subtotal: item.price_per_unit * item.qty,
                    notes: item.notes
                  }));
                  localStorage.setItem('buyer_cart_items', JSON.stringify(checkoutItems));
                  router.push('/buyer/checkout/confirm');
                }}
                style={{
                  width: '100%', padding: '16px', borderRadius: '12px',
                  background: selectedItems.length === 0 ? C.bgInput : C.primary,
                  border: 'none',
                  color: selectedItems.length === 0 ? C.textSubtle : '#fff',
                  fontWeight: 700, fontSize: '1rem', cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: selectedItems.length > 0 ? C.shadowButton : 'none',
                }}
                onMouseOver={(e) => { if (selectedItems.length > 0) e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseOut={(e) => { if (selectedItems.length > 0) e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {selectedItems.length === 0 ? 'Pilih Produk Terlebih Dahulu' : `Lanjutkan ke Checkout`}
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px 24px',
            boxShadow: C.shadowCard
          }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 700, color: C.textMain }}>Belanja Lebih Tenang</h4>
            <div style={{ fontSize: '0.85rem', color: C.textSecondary, lineHeight: 1.6, fontWeight: 500 }}>
              {[
                { icon: '🔒', text: 'Pembayaran 100% aman & terenkripsi' },
                { icon: '📦', text: 'Produk segar langsung dari petani' },
                { icon: '🔄', text: 'Garansi produk sesuai deskripsi' },
                { icon: '💬', text: 'Bisa chat langsung dengan petani' },
              ].map((info) => (
                <div key={info.text} style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1rem' }}>{info.icon}</span>
                  <span>{info.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}