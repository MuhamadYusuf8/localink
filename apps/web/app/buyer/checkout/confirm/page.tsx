'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAddresses, useCheckout } from '@/lib/checkout/hooks';
import { estimateArrival, formatRupiah, groupItemsByFarmer, validatePhoneID } from '@/lib/checkout/utils';

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

export default function BuyerCheckoutConfirmPage() {
  const router = useRouter();
  const { addresses, reload } = useAddresses();
  const { items, totals, deliveryFee, setDeliveryFee, discount } = useCheckout();
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [courier, setCourier] = useState('JNE');
  const [deliveryType, setDeliveryType] = useState<'reguler' | 'express'>('reguler');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Rumah',
    recipient_name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    address: '',
    postal_code: '',
    is_primary: false,
  });

  const grouped = useMemo(() => groupItemsByFarmer(items), [items]);
  const eta = useMemo(() => estimateArrival(deliveryType), [deliveryType]);
  const dynamicTotals = useMemo(() => ({ ...totals, total: totals.subtotal + deliveryFee - discount }), [totals, deliveryFee, discount]);

  async function saveAddress() {
    setFormError(null);
    if (!addressForm.recipient_name || !addressForm.phone || !addressForm.province || !addressForm.city || !addressForm.district || !addressForm.address) {
      setFormError('Semua field wajib diisi kecuali kode pos');
      return;
    }
    if (!validatePhoneID(addressForm.phone)) {
      setFormError('Format nomor telepon Indonesia tidak valid');
      return;
    }
    const res = await fetch('/api/buyer/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addressForm),
    });
    const json = await res.json();
    if (!res.ok) {
      setFormError(json?.error?.message || 'Gagal menyimpan alamat');
      return;
    }
    setSelectedAddress(json.data.id);
    setShowAddressForm(false);
    await reload();
  }

  async function submitCheckout() {
    if (!selectedAddress) return alert('Pilih alamat pengiriman terlebih dahulu');
    if (!courier) return alert('Pilih kurir terlebih dahulu');
    if (items.length === 0) return alert('Keranjang kosong');

    try {
      setSubmitting(true);
      const res = await fetch('/api/buyer/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address_id: selectedAddress,
          courier,
          delivery_type: deliveryType,
          delivery_fee: deliveryFee,
          estimated_days: deliveryType === 'express' ? '1-2 hari kerja' : '3-5 hari kerja',
          payment_method: 'transfer_bank',
          discount_amount: discount,
          notes,
          items,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || 'Checkout gagal');
      sessionStorage.setItem('checkout_order_id', json.data.order_id);
      router.push(`/buyer/checkout/payment?order=${json.data.order_id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Checkout gagal');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bgApp, color: C.textMain, fontFamily: 'Inter, sans-serif', paddingBottom: '60px' }}>
      
      {/* Header Panel */}
      <div style={{ background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: '32px 24px', marginBottom: '32px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
           <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${C.primary}, #10B981)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: C.shadowButton
            }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', color: C.textMain }}>Konfirmasi Pesanan</h1>
              <p style={{ margin: '4px 0 0 0', color: C.textMuted, fontWeight: 500, fontSize: '0.95rem' }}>Langkah terakhir sebelum menyelesaikan pembayaran</p>
            </div>
        </div>
      </div>

      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 24px' }}>
        <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: '24px' }}>
          
          {/* LEFT COLUMN */}
          <div>
            {/* Alamat Pengiriman */}
            <section style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: C.shadowCard }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>📍 Alamat Pengiriman</h3>
                <button onClick={() => setShowAddressForm((v) => !v)} style={{ background: C.bgCard, color: C.textMain, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }} onMouseOver={(e) => e.currentTarget.style.background = C.bgInput} onMouseOut={(e) => e.currentTarget.style.background = C.bgCard}>
                  {showAddressForm ? 'Tutup Form' : '＋ Tambah Alamat Baru'}
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {addresses.map((addr: any) => (
                  <label key={addr.id} style={{ display: 'flex', alignItems: 'flex-start', padding: '16px', borderRadius: '12px', border: `2px solid ${selectedAddress === addr.id ? C.primary : C.border}`, cursor: 'pointer', background: selectedAddress === addr.id ? '#F0FDF4' : C.bgCard, transition: 'all 0.2s' }}>
                    <input type="radio" name="alamat" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} style={{ marginTop: '4px', accentColor: C.primary }} />
                    <div style={{ marginLeft: '12px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <strong style={{ color: C.textMain, fontSize: '0.95rem' }}>{addr.label}</strong>
                        {addr.is_primary && <span style={{ background: C.primaryGlow, color: C.primary, fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>Utama</span>}
                      </div>
                      <div style={{ color: C.textSecondary, fontWeight: 500, fontSize: '0.85rem', marginBottom: '4px' }}>{addr.recipient_name} · {addr.phone}</div>
                      <div style={{ color: C.textMuted, fontSize: '0.85rem', lineHeight: 1.5 }}>{addr.address}, {addr.district}, {addr.city}, {addr.province} {addr.postal_code}</div>
                    </div>
                  </label>
                ))}
              </div>

              {showAddressForm && (
                <div style={{ marginTop: '20px', borderTop: `1px solid ${C.border}`, paddingTop: '20px', animation: 'fadeIn 0.3s' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: C.textMain }}>Form Alamat Baru</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {Object.entries(addressForm).map(([k, v]) => (
                      k === 'is_primary' ? null : (
                        <div key={k}>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: C.textSecondary, marginBottom: '6px', textTransform: 'capitalize' }}>{k.replace('_', ' ')}</label>
                          <input value={String(v)} onChange={(e) => setAddressForm((prev) => ({ ...prev, [k]: e.target.value }))} placeholder={`Masukkan ${k.replace('_', ' ')}`} style={{ width: '100%', boxSizing: 'border-box', background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.textMain, padding: '12px', fontSize: '0.9rem', outline: 'none', transition: 'border 0.2s' }} />
                        </div>
                      )
                    ))}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '0.85rem', fontWeight: 500, color: C.textSecondary, cursor: 'pointer' }}>
                    <input type="checkbox" checked={addressForm.is_primary} onChange={(e) => setAddressForm((p) => ({ ...p, is_primary: e.target.checked }))} style={{ accentColor: C.primary, width: '16px', height: '16px' }} /> Jadikan alamat utama
                  </label>
                  {formError && <div style={{ color: C.danger, marginTop: '12px', fontSize: '0.85rem', fontWeight: 500, background: '#FEF2F2', padding: '10px', borderRadius: '8px' }}>⚠️ {formError}</div>}
                  <button onClick={saveAddress} style={{ marginTop: '16px', background: C.primary, border: 'none', borderRadius: '10px', color: '#fff', padding: '12px 24px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', boxShadow: C.shadowButton }}>Simpan & Gunakan Alamat</button>
                </div>
              )}
            </section>

            {/* Ringkasan Produk */}
            <section style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: C.shadowCard }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.15rem', fontWeight: 700 }}>📦 Ringkasan Produk</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {grouped.map((grp) => (
                  <div key={grp.farmerId}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '8px', borderBottom: `2px solid ${C.bgInput}` }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: C.primaryGlow, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>{grp.farmerName[0]}</div>
                      <div style={{ color: C.textMain, fontWeight: 700, fontSize: '0.95rem' }}>{grp.farmerName} <span style={{ color: C.textMuted, fontWeight: 500, fontSize: '0.85rem' }}>· {grp.farmerCity}</span></div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {grp.items.map((it: any, idx: number) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: '16px', alignItems: 'center' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: C.bgInput, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{it.product_emoji}</div>
                          <div>
                            <div style={{ color: C.textMain, fontWeight: 600, fontSize: '0.95rem' }}>{it.product_name}</div>
                            <div style={{ color: C.textMuted, fontSize: '0.85rem', marginTop: '2px' }}>{it.qty} {it.unit} × {formatRupiah(it.price_per_unit)}</div>
                          </div>
                          <div style={{ fontWeight: 700, color: C.textMain }}>{formatRupiah(it.subtotal)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Kurir & Pengiriman */}
            <section style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: C.shadowCard }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.15rem', fontWeight: 700 }}>🚚 Kurir & Pengiriman</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.textSecondary, marginBottom: '8px' }}>Pilih Kurir</label>
                  <select value={courier} onChange={(e) => setCourier(e.target.value)} style={{ width: '100%', background: C.bgInput, color: C.textMain, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px', fontSize: '0.9rem', fontWeight: 500, outline: 'none' }}>
                    {['JNE', 'J&T', 'SiCepat', 'AnterAja'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: C.textSecondary, marginBottom: '8px' }}>Tipe Pengiriman</label>
                  <select value={deliveryType} onChange={(e) => { const t = e.target.value as 'reguler' | 'express'; setDeliveryType(t); setDeliveryFee(t === 'express' ? 75000 : 35000); }} style={{ width: '100%', background: C.bgInput, color: C.textMain, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px', fontSize: '0.9rem', fontWeight: 500, outline: 'none' }}>
                    <option value="reguler">Reguler (3-5 hari) - Rp 35.000</option>
                    <option value="express">Express (1-2 hari) - Rp 75.000</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '16px', padding: '12px 16px', background: C.primaryGlow, borderRadius: '10px', border: `1px solid ${C.primaryBorder}`, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🗓️</span>
                <span style={{ color: C.primary, fontSize: '0.85rem', fontWeight: 600 }}>Estimasi paket tiba: {eta}</span>
              </div>
            </section>

            {/* Catatan Order */}
            <section style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', boxShadow: C.shadowCard }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.15rem', fontWeight: 700 }}>📝 Catatan Pesanan <span style={{ color: C.textSubtle, fontWeight: 400, fontSize: '0.9rem' }}>(Opsional)</span></h3>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 200))} placeholder="Contoh: Titipkan di pos satpam, atau tolong packing kayu ya pak." style={{ width: '100%', minHeight: '100px', borderRadius: '10px', boxSizing: 'border-box', padding: '14px', background: C.bgInput, border: `1px solid ${C.border}`, color: C.textMain, fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              <div style={{ color: C.textMuted, marginTop: '8px', fontSize: '0.8rem', textAlign: 'right' }}>{notes.length}/200 karakter</div>
            </section>
          </div>

          {/* RIGHT COLUMN (ASIDE) */}
          <aside style={{ height: 'fit-content', position: 'sticky', top: '24px' }}>
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', boxShadow: C.shadowCard }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.15rem', fontWeight: 800 }}>Ringkasan Pembayaran</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: C.textSecondary, fontSize: '0.9rem', fontWeight: 500 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Harga ({items.length} produk)</span>
                  <span style={{ color: C.textMain, fontWeight: 600 }}>{formatRupiah(dynamicTotals.subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Diskon Promo</span>
                    <span style={{ color: C.primary, fontWeight: 600 }}>-{formatRupiah(discount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ongkos Kirim ({deliveryType})</span>
                  <span style={{ color: C.textMain, fontWeight: 600 }}>{formatRupiah(deliveryFee)}</span>
                </div>
              </div>
              
              <div style={{ borderTop: `1px dashed ${C.border}`, margin: '20px 0', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: C.textMain }}>Total Tagihan</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: C.primary, letterSpacing: '-0.02em' }}>{formatRupiah(dynamicTotals.total)}</span>
              </div>
              
              <button disabled={!selectedAddress || submitting} onClick={submitCheckout} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: !selectedAddress || submitting ? C.bgInput : C.primary, color: !selectedAddress || submitting ? C.textSubtle : '#fff', fontWeight: 700, fontSize: '1rem', cursor: !selectedAddress || submitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: !selectedAddress || submitting ? 'none' : C.shadowButton }}>
                {submitting ? 'Memproses Pesanan...' : 'Selesaikan Pembayaran →'}
              </button>
              
              {!selectedAddress && (
                <div style={{ color: C.danger, fontSize: '0.8rem', marginTop: '12px', textAlign: 'center', fontWeight: 500 }}>
                  ⚠️ Silakan pilih alamat pengiriman terlebih dahulu.
                </div>
              )}
            </div>
            
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', marginTop: '16px', boxShadow: C.shadowCard }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '1.5rem' }}>🛡️</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: C.textMain }}>Pembayaran Aman</div>
                  <div style={{ fontSize: '0.8rem', color: C.textMuted, marginTop: '2px' }}>Transaksi dilindungi enkripsi SSL tingkat bank.</div>
                </div>
              </div>
            </div>
          </aside>
          
        </div>
      </div>
      <style>{`
        @media (max-width: 900px){ 
          .checkout-grid { grid-template-columns: 1fr !important; } 
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}