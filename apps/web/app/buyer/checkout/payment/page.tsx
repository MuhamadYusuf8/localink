'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatRupiah } from '@/lib/checkout/utils';

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
  warning: '#D97706',
  warningBg: '#FFFBEB',
  warningBorder: '#FCD34D',
  shadowCard: '0 4px 20px rgba(0, 0, 0, 0.03)',
  shadowButton: '0 4px 12px rgba(5, 150, 105, 0.2)',
};

function useCountdown(deadline?: string) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!deadline) return;
    const timer = setInterval(() => {
      const diff = Math.max(0, new Date(deadline).getTime() - Date.now());
      setLeft(diff);
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  return useMemo(() => {
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [left]);
}

export default function BuyerCheckoutPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order') ?? '';
  const [order, setOrder] = useState<any>(null);
  const [method, setMethod] = useState<'transfer_bank' | 'qris' | 'cod' | 'ewallet'>('transfer_bank');
  const [bank, setBank] = useState('BCA');
  const [wallet, setWallet] = useState('GoPay');
  const [proof, setProof] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('Menunggu pembayaran');
  const countdown = useCountdown(order?.payment_deadline);

  useEffect(() => {
    async function load() {
      if (!orderId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/buyer/orders/${orderId}`);
        const json = await res.json();
        if (res.ok) {
          setOrder(json.data);
        } else {
          console.error('Order fetch failed:', json?.error?.message);
          setOrder({ error: json?.error?.message || 'Order tidak ditemukan' });
        }
      } catch (e) {
        console.error('Fetch error:', e);
        setOrder({ error: 'Gagal menghubungi server' });
      }
      setLoading(false);
    }
    void load();
  }, [orderId]);

  async function uploadProof() {
    if (!proof) return '';
    const form = new FormData();
    form.append('file', proof);
    const res = await fetch('/api/buyer/payment/upload-proof', { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || 'Upload bukti gagal');
    return json.data.url as string;
  }

  async function confirmPayment() {
    try {
      setSubmitting(true);
      setStatusText('Memproses pembayaran...');
      let uploadedProof = proofUrl;
      if (method === 'transfer_bank' && proof) uploadedProof = await uploadProof();
      const res = await fetch('/api/buyer/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, method, payment_bank: bank, proof_url: uploadedProof, notes: method === 'ewallet' ? wallet : null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || 'Konfirmasi gagal');
      setStatusText('Pembayaran berhasil dikonfirmasi');
      router.push(`/buyer/checkout/success?order=${orderId}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal memproses pembayaran');
      setStatusText('Menunggu pembayaran');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bgApp, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: C.primary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
         <div className="animate-spin" style={{ width: '20px', height: '20px', border: '3px solid transparent', borderTopColor: C.primary, borderRadius: '50%' }} />
         Memuat data tagihan...
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  );

  if (order?.error || !order) {
    return (
      <div style={{ minHeight: '100vh', background: C.bgApp, color: C.textMain, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ background: C.bgCard, maxWidth: '500px', margin: '0 auto', padding: '40px', borderRadius: '16px', boxShadow: C.shadowCard, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❌</div>
          <h2 style={{ margin: '0 0 8px 0', color: C.textMain }}>{order?.error || 'Order tidak ditemukan'}</h2>
          <p style={{ color: C.textMuted, marginBottom: '24px' }}>Order ID: <span style={{ fontWeight: 600 }}>{orderId}</span></p>
          <button onClick={() => router.push('/buyer/orders')} style={{ padding: '12px 24px', background: C.primary, color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, boxShadow: C.shadowButton }}>Lihat Daftar Pesanan Saya</button>
        </div>
      </div>
    );
  }

  const isExpired = order.payment_deadline && new Date(order.payment_deadline).getTime() < Date.now();

  return (
    <div style={{ minHeight: '100vh', background: C.bgApp, color: C.textMain, fontFamily: 'Inter, sans-serif', paddingBottom: '60px' }}>
      {/* Header Panel */}
      <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: '24px', marginBottom: '32px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
           <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: `linear-gradient(135deg, ${C.primary}, #10B981)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: C.shadowButton
            }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: C.textMain }}>Pembayaran</h1>
              <p style={{ margin: '2px 0 0 0', color: C.textMuted, fontWeight: 500, fontSize: '0.85rem' }}>Selesaikan pembayaran untuk memproses pesanan Anda</p>
            </div>
        </div>
      </div>

      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Top Highlight Card */}
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px 32px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: C.shadowCard }}>
          <div>
            <div style={{ color: C.textSecondary, fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>Nomor Pesanan</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: C.textMain, letterSpacing: '0.02em', marginBottom: '8px' }}>{order.order_number}</div>
            <div style={{ color: C.primary, fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.02em' }}>{formatRupiah(order.total_amount)}</div>
          </div>
          <div style={{ textAlign: 'right', background: isExpired ? C.dangerBg : C.primaryGlow, padding: '16px 24px', borderRadius: '12px', border: `1px solid ${isExpired ? C.danger : C.primaryBorder}` }}>
            <div style={{ color: isExpired ? C.danger : C.primary, fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>{isExpired ? 'Status Waktu' : 'Selesaikan pembayaran dalam'}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: isExpired ? C.danger : C.primary, letterSpacing: '0.05em' }}>{countdown}</div>
            {isExpired && <div style={{ background: C.danger, color: '#fff', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600, marginTop: '8px', display: 'inline-block' }}>Waktu pembayaran habis</div>}
          </div>
        </div>

        <div className="payment-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: '24px' }}>
          
          {/* Main Payment Section */}
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '32px', boxShadow: C.shadowCard }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.15rem', fontWeight: 700, color: C.textMain }}>Pilih Metode Pembayaran</h3>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {[
                ['transfer_bank', '🏦 Transfer Bank'],
                ['qris', '📱 QRIS'],
                ['ewallet', '👛 E-Wallet'],
                ['cod', '📦 COD'],
              ].map(([id, label]) => (
                <button 
                  key={id} 
                  onClick={() => setMethod(id as any)} 
                  style={{ 
                    padding: '10px 18px', borderRadius: '10px', 
                    border: `1px solid ${method === id ? C.primary : C.border}`, 
                    background: method === id ? C.primaryGlow : C.bgCard, 
                    color: method === id ? C.primary : C.textSecondary,
                    fontWeight: method === id ? 700 : 500,
                    fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: method === id ? '0 2px 8px rgba(5, 150, 105, 0.1)' : 'none'
                  }}
                  onMouseOver={(e) => { if(method !== id) e.currentTarget.style.background = C.bgInput }}
                  onMouseOut={(e) => { if(method !== id) e.currentTarget.style.background = C.bgCard }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Transfer Bank Content */}
            {method === 'transfer_bank' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.textSecondary, marginBottom: '8px' }}>Pilih Bank Tujuan</label>
                <select value={bank} onChange={(e) => setBank(e.target.value)} style={{ width: '100%', background: C.bgInput, color: C.textMain, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px', fontSize: '0.95rem', fontWeight: 600, outline: 'none', marginBottom: '20px' }}>
                  {['BRI', 'BCA', 'Mandiri', 'BNI', 'BSI'].map((b) => <option key={b}>{b}</option>)}
                </select>
                
                <div style={{ background: C.bgApp, border: `1px solid ${C.primaryBorder}`, borderRadius: '12px', padding: '20px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: C.primary }} />
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', color: C.textMuted, marginBottom: '4px' }}>Nomor Rekening {bank}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <strong style={{ fontSize: '1.4rem', color: C.textMain, letterSpacing: '0.05em' }}>1234567890</strong> 
                      <button onClick={() => navigator.clipboard.writeText('1234567890')} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, color: C.textSecondary, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>Salin</button>
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', color: C.textMuted, marginBottom: '4px' }}>Atas Nama</div>
                    <strong style={{ fontSize: '1rem', color: C.textMain }}>PT Localink Indonesia</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: C.textMuted, marginBottom: '4px' }}>Nominal Transfer (Tepat hingga 3 digit terakhir)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <strong style={{ color: C.warning, fontSize: '1.4rem' }}>{formatRupiah(order.total_amount)}</strong> 
                      <button onClick={() => navigator.clipboard.writeText(String(order.total_amount))} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, color: C.textSecondary, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>Salin Nominal</button>
                    </div>
                  </div>
                </div>

                <div style={{ border: `2px dashed ${C.border}`, background: C.bgApp, borderRadius: '12px', padding: '24px', textAlign: 'center', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🧾</div>
                  <div style={{ fontWeight: 600, color: C.textMain, marginBottom: '4px' }}>Unggah Bukti Transfer</div>
                  <div style={{ fontSize: '0.85rem', color: C.textMuted, marginBottom: '16px' }}>Format JPG, PNG (Maks. 5MB)</div>
                  <input type="file" id="proof-upload" accept="image/*" onChange={(e) => setProof(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
                  <label htmlFor="proof-upload" style={{ display: 'inline-block', background: C.bgCard, border: `1px solid ${C.border}`, color: C.textMain, fontWeight: 600, fontSize: '0.85rem', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    Pilih File Gambar
                  </label>
                  {proof && <div style={{ marginTop: '16px', color: C.primary, fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>✓ {proof.name} siap diunggah</div>}
                </div>
              </div>
            )}

            {/* QRIS Content */}
            {method === 'qris' && (
              <div style={{ textAlign: 'center', padding: '32px 24px', border: `1px solid ${C.border}`, borderRadius: '16px', background: C.bgApp, animation: 'fadeIn 0.3s' }}>
                <div style={{ fontWeight: 700, fontSize: '1.2rem', color: C.textMain, marginBottom: '24px' }}>Scan QRIS untuk Membayar</div>
                <div style={{ width: '240px', height: '240px', margin: '0 auto', background: '#FFFFFF', border: `2px solid ${C.border}`, borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: C.shadowCard }}>
                  <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, #0F172A, #0F172A 10px, #FFFFFF 10px, #FFFFFF 20px)', opacity: 0.8, borderRadius: '8px' }} />
                </div>
                <div style={{ marginTop: '24px', fontSize: '0.9rem', color: C.textSecondary, fontWeight: 500, lineHeight: 1.6 }}>
                  Buka aplikasi GoPay, OVO, Dana, ShopeePay, atau Mobile Banking Anda,<br/>lalu arahkan kamera ke kode QR di atas.
                </div>
              </div>
            )}

            {/* COD Content */}
            {method === 'cod' && (
              <div style={{ padding: '24px', borderRadius: '12px', background: C.warningBg, border: `1px solid ${C.warningBorder}`, display: 'flex', alignItems: 'flex-start', gap: '16px', animation: 'fadeIn 0.3s' }}>
                <div style={{ fontSize: '2rem' }}>📦</div>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: C.warning, fontSize: '1.05rem', fontWeight: 800 }}>Bayar di Tempat (COD)</h4>
                  <p style={{ margin: 0, color: C.warning, fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 500 }}>
                    Anda memilih untuk membayar langsung ke kurir saat paket tiba. Pastikan Anda menyiapkan uang pas sebesar <strong>{formatRupiah(order.total_amount)}</strong>. COD hanya berlaku untuk wilayah tertentu dalam radius petani.
                  </p>
                </div>
              </div>
            )}

            {/* E-Wallet Content */}
            {method === 'ewallet' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.textSecondary, marginBottom: '8px' }}>Pilih Penyedia E-Wallet</label>
                <select value={wallet} onChange={(e) => setWallet(e.target.value)} style={{ width: '100%', background: C.bgInput, color: C.textMain, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px', fontSize: '0.95rem', fontWeight: 600, outline: 'none', marginBottom: '20px' }}>
                  {['GoPay', 'OVO', 'Dana', 'ShopeePay', 'LinkAja'].map((w) => <option key={w}>{w}</option>)}
                </select>
                
                <div style={{ background: C.bgApp, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: C.bgCard, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📱</div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: C.textMuted, marginBottom: '4px' }}>Nomor Tujuan Pembayaran</div>
                    <strong style={{ fontSize: '1.2rem', color: C.textMain }}>0812-0000-0000</strong>
                    <div style={{ fontSize: '0.85rem', color: C.primary, fontWeight: 600, marginTop: '4px' }}>PT Localink ({wallet})</div>
                  </div>
                </div>
              </div>
            )}

            <button 
              disabled={submitting || isExpired} 
              onClick={confirmPayment} 
              style={{ 
                width: '100%', marginTop: '32px', padding: '16px', borderRadius: '12px', border: 'none', 
                background: submitting || isExpired ? C.bgInput : C.primary, 
                color: submitting || isExpired ? C.textSubtle : '#fff', 
                fontWeight: 700, fontSize: '1rem', cursor: submitting || isExpired ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', boxShadow: submitting || isExpired ? 'none' : C.shadowButton
              }}
              onMouseOver={(e) => { if (!submitting && !isExpired) e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseOut={(e) => { if (!submitting && !isExpired) e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {submitting ? 'Memproses Konfirmasi...' : method === 'qris' ? 'Saya Sudah Bayar via QRIS' : method === 'cod' ? 'Konfirmasi Pesanan COD' : 'Konfirmasi Pembayaran'}
            </button>
          </div>

          {/* Sidebar Area */}
          <aside style={{ display: 'grid', gap: '16px', height: 'fit-content' }}>
            
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', boxShadow: C.shadowCard }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: C.textMain }}>Ringkasan Order</h3>
              <div style={{ color: C.textSecondary, fontSize: '0.9rem', marginBottom: '8px', fontWeight: 500 }}>ID Pesanan: <span style={{ color: C.textMain, fontWeight: 700 }}>{order.order_number}</span></div>
              <div style={{ color: C.textSecondary, fontSize: '0.9rem', marginBottom: '16px', fontWeight: 500 }}>Status: <span style={{ color: C.warning, fontWeight: 700 }}>{statusText}</span></div>
              
              <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: '16px' }}>
                <div style={{ fontSize: '0.85rem', color: C.textMuted, marginBottom: '4px' }}>Total Tagihan</div>
                <div style={{ color: C.primary, fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.02em' }}>{formatRupiah(order.total_amount)}</div>
              </div>
            </div>
            
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', boxShadow: C.shadowCard }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '1.5rem' }}>📞</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: C.textMain }}>Butuh Bantuan?</div>
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: C.textSecondary, lineHeight: 1.5, fontWeight: 500 }}>Tim Customer Service kami siap membantu kendala pembayaran Anda 24/7.</p>
              <button style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${C.border}`, background: C.bgApp, color: C.textMain, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = C.bgInput} onMouseOut={(e) => e.currentTarget.style.background = C.bgApp}>Hubungi CS</button>
            </div>
            
          </aside>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px){ 
          .payment-grid { grid-template-columns: 1fr !important; } 
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}