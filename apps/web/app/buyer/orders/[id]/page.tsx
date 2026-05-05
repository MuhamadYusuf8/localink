'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  ChevronLeft, 
  Clock, 
  MapPin, 
  Truck, 
  CreditCard,
  MessageSquare,
  HelpCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import apiClient from '@/lib/api/client';

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
  shadowCard: '0 4px 20px rgba(0, 0, 0, 0.03)',
  shadowButton: '0 4px 12px rgba(5, 150, 105, 0.2)',
};

export default function BuyerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOrder() {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/buyer/orders/${id}`);
      const json = await res.json();
      if (json.success) {
        setOrder(json.data);
      } else {
        setError(json.error?.message || 'Gagal memuat detail pesanan');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function handleChatWithFarmer() {
    const farmerId = order?.farmer_id || order?.farmer?.id;
    
    if (!farmerId) {
      alert('Data petani tidak ditemukan pada pesanan ini.');
      return;
    }

    try {
      const res = await apiClient.post('/conversations', { farmer_id: farmerId });
      const conversationId = res.data.data.id;
      router.push(`/buyer/messages?c=${conversationId}`);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg = err.error?.message || err.message || 'Gagal memulai percakapan';
      alert(errorMsg);
    }
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bgApp, padding: '48px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'pulse 1.5s ease-in-out infinite' }}>
          <div style={{ height: '32px', width: '200px', background: C.border, borderRadius: '8px', marginBottom: '24px' }} />
          <div style={{ height: '240px', background: C.bgCard, borderRadius: '16px', border: `1px solid ${C.border}`, marginBottom: '24px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ height: '200px', background: C.bgCard, borderRadius: '16px', border: `1px solid ${C.border}` }} />
            <div style={{ height: '200px', background: C.bgCard, borderRadius: '16px', border: `1px solid ${C.border}` }} />
          </div>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: '100vh', background: C.bgApp, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: C.bgCard, padding: '48px', borderRadius: '24px', border: `1px solid ${C.border}`, boxShadow: C.shadowCard, textAlign: 'center', maxWidth: '480px', width: '100%' }}>
          <AlertCircle size={56} color={C.danger} style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.textMain, margin: '0 0 12px' }}>Oops!</h1>
          <p style={{ color: C.textSecondary, marginBottom: '32px', fontSize: '1rem' }}>{error || 'Pesanan tidak ditemukan'}</p>
          <Link href="/buyer/orders" style={{ display: 'inline-block', padding: '12px 24px', background: C.bgInput, color: C.textMain, border: `1px solid ${C.border}`, borderRadius: '10px', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}>
            Kembali ke Daftar Pesanan
          </Link>
        </div>
      </div>
    );
  }

  const timeline = [
    { label: 'Pesanan Dibuat', done: true, time: order.created_at },
    { label: 'Pembayaran Dikonfirmasi', done: !!order.paid_at || order.payment_status === 'paid', time: order.paid_at },
    { label: 'Sedang Diproses', done: ['diproses', 'dikirim', 'tiba', 'selesai'].includes(order.status) },
    { label: 'Dikirim', done: ['dikirim', 'tiba', 'selesai'].includes(order.status) },
    { label: 'Tiba di Tujuan', done: ['tiba', 'selesai'].includes(order.status) },
    { label: 'Selesai', done: order.status === 'selesai' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bgApp, color: C.textMain, fontFamily: 'Inter, sans-serif', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '40px 24px' }}>
        
        {/* Breadcrumbs & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <button 
              onClick={() => router.back()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: C.textMuted, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              <ChevronLeft size={18} />
              <span>Kembali</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={handleChatWithFarmer} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: `1px solid ${C.primaryBorder}`, background: C.primaryGlow, color: C.primary, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                <MessageSquare size={16} /> Chat Petani
              </button>
              <Link href={`/forum?order=${order.order_number}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgCard, color: C.textSecondary, fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}>
                <MessageSquare size={16} /> Tanya di Forum
              </Link>
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.bgCard, color: C.textSecondary, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                <HelpCircle size={16} /> Bantuan
              </button>
            </div>
          </div>
        </div>

        {/* Main Status Header */}
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '20px', overflow: 'hidden', marginBottom: '32px', boxShadow: C.shadowCard }}>
          <div style={{ padding: '24px 32px', borderBottom: `1px solid ${C.border}`, background: C.bgApp, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: C.textMain }}>{order.order_number || `Order #${order.id.slice(0, 8)}`}</h1>
                  <StatusBadge status={order.status} />
                </div>
                <p style={{ margin: 0, color: C.textMuted, fontSize: '0.85rem', fontWeight: 500 }}>
                  Dibuat pada {new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                {order.status === 'menunggu_pembayaran' && (
                  <Link href={`/buyer/checkout/payment?order=${order.id}`} style={{ textDecoration: 'none' }}>
                    <Button variant="primary">Bayar Sekarang</Button>
                  </Link>
                )}
                {order.status === 'dikirim' && (
                  <Button variant="primary">Konfirmasi Terima Barang</Button>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'nowrap', overflowX: 'auto', gap: '16px', paddingBottom: '8px' }}>
              {timeline.map((step, idx) => (
                <div key={step.label} style={{ flex: 1, minWidth: '110px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', background: step.done ? C.primary : C.bgInput, color: step.done ? '#FFFFFF' : C.textSubtle, border: `2px solid ${step.done ? C.primary : C.border}`, zIndex: 2 }}>
                    {step.done ? <CheckCircle size={18} /> : <Clock size={18} />}
                  </div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, margin: '0 0 4px', color: step.done ? C.textMain : C.textMuted }}>{step.label}</p>
                  {step.time && (
                    <p style={{ fontSize: '0.65rem', color: C.textMuted, margin: 0, fontWeight: 500 }}>{new Date(step.time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                  )}
                  {idx < timeline.length - 1 && (
                    <div style={{ position: 'absolute', top: '18px', left: '60%', width: '100%', height: '2px', background: timeline[idx+1].done ? C.primary : C.border, zIndex: 1 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '24px' }}>
          
          {/* Left Column: Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Shipping Info */}
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '28px', boxShadow: C.shadowCard }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: C.textMain, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={22} color={C.primary} />
                Informasi Pengiriman
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, margin: '0 0 8px' }}>Penerima</p>
                  <p style={{ fontWeight: 700, color: C.textMain, margin: '0 0 4px', fontSize: '0.95rem' }}>{order.shipping_name}</p>
                  <p style={{ color: C.textSecondary, margin: 0, fontSize: '0.85rem', fontWeight: 500 }}>{order.shipping_phone}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, margin: '0 0 8px' }}>Kurir & Layanan</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.textMain, fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                    <Truck size={16} color={C.primary} />
                    {order.courier} · {order.delivery_type}
                  </div>
                  <p style={{ color: C.textMuted, fontSize: '0.75rem', margin: 0, fontWeight: 500 }}>Estimasi tiba: {order.estimated_days}</p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ fontSize: '0.75rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, margin: '0 0 8px' }}>Alamat</p>
                  <p style={{ color: C.textSecondary, margin: 0, lineHeight: 1.6, fontSize: '0.9rem', fontWeight: 500 }}>
                    {order.shipping_address}<br />
                    {order.shipping_district}, {order.shipping_city}<br />
                    {order.shipping_province} {order.shipping_postal}
                  </p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '28px', boxShadow: C.shadowCard }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: C.textMain, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Package size={22} color={C.primary} />
                Produk yang Dipesan
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item: any) => (
                    <div key={item.id} style={{ display: 'flex', gap: '16px', padding: '16px', borderRadius: '12px', background: C.bgApp, border: `1px solid ${C.border}` }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '10px', background: C.bgCard, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                        {item.product_emoji || '📦'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: C.textMain, margin: '0 0 4px', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product_name}</p>
                        <p style={{ fontSize: '0.8rem', color: C.textSecondary, margin: '0 0 12px', fontWeight: 500 }}>
                          Petani: <span style={{ color: C.primary, fontWeight: 700 }}>{item.farmer_name}</span> · {item.farmer_city}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <p style={{ fontSize: '0.85rem', color: C.textMuted, margin: 0, fontWeight: 500 }}>
                            {item.qty} {item.unit} x <PriceDisplay amount={item.price_per_unit} showCurrency={false} size="xs" />
                          </p>
                          <PriceDisplay amount={item.subtotal} size="sm" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <Package size={48} color={C.border} style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: C.textMuted, fontStyle: 'italic', margin: 0, fontSize: '0.9rem' }}>Tidak ada rincian produk untuk pesanan ini.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Payment Summary */}
          <div style={{ position: 'sticky', top: '100px', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '28px', boxShadow: C.shadowCard }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: C.textMain, margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CreditCard size={22} color={C.primary} />
                Ringkasan Pembayaran
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: C.textSecondary, fontWeight: 500 }}>
                  <span>Subtotal Produk</span>
                  <span style={{ color: C.textMain, fontWeight: 600 }}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: C.textSecondary, fontWeight: 500 }}>
                  <span>Biaya Pengiriman</span>
                  <span style={{ color: C.textMain, fontWeight: 600 }}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.delivery_fee)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: C.textSecondary, fontWeight: 500 }}>
                    <span>Diskon Promo</span>
                    <span style={{ color: C.primary, fontWeight: 700 }}>-{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.discount_amount)}</span>
                  </div>
                )}
                <div style={{ paddingTop: '16px', marginTop: '4px', borderTop: `1px dashed ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: C.textMain, fontSize: '0.95rem' }}>Total Tagihan</span>
                  <PriceDisplay amount={order.total_amount} size="lg" />
                </div>
              </div>

              <div style={{ background: C.bgApp, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: C.textMuted, fontWeight: 500 }}>Metode Pembayaran</span>
                  <span style={{ color: C.textMain, fontWeight: 800, textTransform: 'uppercase' }}>{order.payment_method?.replace('_', ' ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: C.textMuted, fontWeight: 500 }}>Status Pembayaran</span>
                  <span style={{ fontWeight: 800, textTransform: 'uppercase', color: order.payment_status === 'paid' ? C.primary : '#D97706' }}>
                    {order.payment_status || 'PENDING'}
                  </span>
                </div>
              </div>

              {order.status === 'selesai' && (
                <button style={{ width: '100%', marginTop: '24px', padding: '12px', background: C.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: C.shadowButton }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  Beri Ulasan Sekarang
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
      <style>{`
        @media (max-width: 900px){ 
          div[style*="grid-template-columns: minmax(0, 1fr) 360px"] { grid-template-columns: 1fr !important; } 
        }
      `}</style>
    </div>
  );
}