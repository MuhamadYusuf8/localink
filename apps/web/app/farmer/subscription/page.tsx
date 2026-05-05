'use client';

import { useState } from 'react';

type PlanKey = 'free' | 'basic' | 'pro';

interface Plan {
  key: PlanKey;
  name: string;
  price: number;
  priceLabel: string;
  commission: string;
  color: string;
  gradient: string;
  badge?: string;
  features: { label: string; included: boolean }[];
}

// ─── Design Tokens (Premium Light) ───────────────────────────
const C = {
  bgApp: '#F8FAFC',
  bgCard: '#FFFFFF',
  bgInput: '#F1F5F9',
  border: '#E2E8F0',
  textMain: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  primary: '#059669',
  primaryLight: '#ECFDF5',
  indigo: '#4F46E5',
  indigoLight: '#EEF2FF',
  shadowCard: '0 10px 30px rgba(0, 0, 0, 0.04)',
};

const PLANS: Plan[] = [
  {
    key: 'free',
    name: 'Gratis',
    price: 0,
    priceLabel: 'Rp 0',
    commission: '7%',
    color: '#64748B',
    gradient: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)',
    features: [
      { label: 'Maksimal 10 produk aktif', included: true },
      { label: 'Dashboard dasar', included: true },
      { label: 'Chat dengan pembeli', included: true },
      { label: 'Komisi transaksi 7%', included: true },
      { label: 'Analitik lanjutan', included: false },
      { label: 'Data harga pasar real-time', included: false },
      { label: 'Prioritas di hasil pencarian', included: false },
      { label: 'Listing produk tak terbatas', included: false },
      { label: 'Badge Petani Terverifikasi', included: false },
      { label: 'Dukungan prioritas', included: false },
    ],
  },
  {
    key: 'basic',
    name: 'Basic',
    price: 99000,
    priceLabel: 'Rp 99.000',
    commission: '5%',
    color: '#4F46E5',
    gradient: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
    badge: 'Populer',
    features: [
      { label: 'Maksimal 50 produk aktif', included: true },
      { label: 'Dashboard dasar', included: true },
      { label: 'Chat dengan pembeli', included: true },
      { label: 'Komisi transaksi 5%', included: true },
      { label: 'Analitik lanjutan', included: true },
      { label: 'Data harga pasar real-time', included: true },
      { label: 'Prioritas di hasil pencarian', included: false },
      { label: 'Listing produk tak terbatas', included: false },
      { label: 'Badge Petani Terverifikasi', included: false },
      { label: 'Dukungan prioritas', included: false },
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 299000,
    priceLabel: 'Rp 299.000',
    commission: '3%',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
    badge: 'Terbaik',
    features: [
      { label: 'Listing produk tak terbatas', included: true },
      { label: 'Dashboard dasar', included: true },
      { label: 'Chat dengan pembeli', included: true },
      { label: 'Komisi transaksi 3%', included: true },
      { label: 'Analitik lanjutan', included: true },
      { label: 'Data harga pasar real-time', included: true },
      { label: 'Prioritas di hasil pencarian', included: true },
      { label: '1x boost listing gratis/bulan', included: true },
      { label: 'Badge Petani Terverifikasi', included: true },
      { label: 'Dukungan prioritas', included: true },
    ],
  },
];

const BOOST_OPTIONS = [
  {
    type: 'featured_homepage',
    name: 'Featured Homepage',
    description: 'Tampil di bagian utama halaman marketplace',
    price: 50000,
    priceLabel: 'Rp 50.000/hari',
    icon: '🏠',
    color: '#D97706',
  },
  {
    type: 'top_search',
    name: 'Top Pencarian',
    description: 'Muncul paling atas di hasil pencarian relevan',
    price: 75000,
    priceLabel: 'Rp 75.000/hari',
    icon: '🔍',
    color: '#4F46E5',
  },
  {
    type: 'category_banner',
    name: 'Banner Kategori',
    description: 'Tampil sebagai banner di halaman kategori',
    price: 150000,
    priceLabel: 'Rp 150.000/hari',
    icon: '🚩',
    color: '#DB2777',
  },
];

const CURRENT_PLAN: PlanKey = 'free';

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" fill={color} opacity="0.1" />
      <path d="M8 12l3 3 5-5" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" fill="#E2E8F0" opacity="1" />
      <path d="M15 9l-6 6M9 9l6 6" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function FarmerSubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [confirmModal, setConfirmModal] = useState<PlanKey | null>(null);

  function handleUpgrade(planKey: PlanKey) {
    if (planKey === CURRENT_PLAN) return;
    setConfirmModal(planKey);
  }

  const yearlyDiscount = 0.2;

  return (
    <div style={{ minHeight: '100vh', background: C.bgApp, color: C.textMain, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '32px 40px 24px', borderBottom: `1px solid ${C.border}`, background: C.bgCard }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: C.textMain, margin: 0, letterSpacing: '-0.02em' }}>Langganan Paket</h1>
        <p style={{ color: C.textMuted, marginTop: '4px', fontSize: '0.95rem', fontWeight: 500 }}>
          Tingkatkan operasional toko Anda dengan komisi lebih rendah dan fitur analisis lanjutan
        </p>
      </div>

      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Current Plan Banner */}
        <div style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, #065F46 100%)`,
          borderRadius: '24px',
          padding: '28px 32px', marginBottom: '40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 10px 25px rgba(5, 150, 105, 0.2)',
          color: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
            }}>🎖️</div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#D1FAE5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Paket Anda Saat Ini
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px' }}>
                {PLANS.find(p => p.key === CURRENT_PLAN)?.name}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#D1FAE5', marginTop: '4px', fontWeight: 500 }}>
                Komisi transaksi: <span style={{ color: '#FCD34D', fontWeight: 700 }}>7%</span> • Limit 10 produk aktif
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', display: 'none' /* Hidden on small screens potentially */ }} className="md:block">
            <div style={{ fontSize: '0.85rem', color: '#D1FAE5', marginBottom: '6px', fontWeight: 500 }}>Potensi penghematan dengan Pro:</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FCD34D' }}>
              Hemat 4% Per Transaksi
            </div>
          </div>
        </div>

        {/* Billing Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#E2E8F0', borderRadius: '16px', padding: '6px',
          }}>
            <button onClick={() => setBillingCycle('monthly')} style={{
              padding: '10px 28px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: billingCycle === 'monthly' ? C.bgCard : 'transparent',
              color: billingCycle === 'monthly' ? C.textMain : C.textMuted,
              fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s',
              boxShadow: billingCycle === 'monthly' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
            }}>Tagihan Bulanan</button>
            <button onClick={() => setBillingCycle('yearly')} style={{
              padding: '10px 28px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: billingCycle === 'yearly' ? C.bgCard : 'transparent',
              color: billingCycle === 'yearly' ? C.textMain : C.textMuted,
              fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: billingCycle === 'yearly' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
            }}>
              Tagihan Tahunan
              <span style={{
                background: C.primary, color: '#FFFFFF', fontSize: '0.7rem',
                fontWeight: 800, padding: '3px 10px', borderRadius: '99px',
              }}>HEMAT 20%</span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '60px' }}>
          {PLANS.map((plan) => {
            const isCurrent = CURRENT_PLAN === plan.key;
            const finalPrice = billingCycle === 'yearly' ? plan.price * 12 * (1 - yearlyDiscount) : plan.price;
            const isSelected = selectedPlan === plan.key;

            return (
              <div key={plan.key} style={{
                background: isSelected ? plan.gradient : C.bgCard,
                border: `2px solid ${isCurrent ? C.primary : isSelected ? plan.color : C.border}`,
                borderRadius: '24px', padding: '32px',
                position: 'relative', overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSelected ? `0 20px 40px -10px ${plan.color}30` : C.shadowCard,
                cursor: 'pointer',
                transform: isSelected ? 'translateY(-8px)' : 'none',
              }} onClick={() => setSelectedPlan(plan.key)}>

                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: '20px', right: '-35px',
                    background: plan.color, color: '#fff',
                    fontSize: '0.7rem', fontWeight: 800, padding: '6px 40px',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    transform: 'rotate(45deg)', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                  }}>{plan.badge}</div>
                )}
                
                {isCurrent && (
                  <div style={{
                    position: 'absolute', top: '20px', right: '20px',
                    background: C.primaryLight, color: C.primary, border: `1px solid ${C.primary}30`,
                    fontSize: '0.75rem', fontWeight: 800, padding: '5px 14px', borderRadius: '99px',
                  }}>AKTIF</div>
                )}

                <div style={{ marginBottom: '28px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: C.textMain, marginBottom: '8px' }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900, color: plan.price === 0 ? C.textMuted : C.textMain, letterSpacing: '-0.04em' }}>
                      {plan.price === 0 ? 'Gratis' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(finalPrice)}
                    </span>
                    {plan.price > 0 && (
                      <span style={{ fontSize: '1rem', color: C.textMuted, fontWeight: 600 }}>
                        /{billingCycle === 'monthly' ? 'bln' : 'thn'}
                      </span>
                    )}
                  </div>
                  {plan.price > 0 && billingCycle === 'yearly' && (
                    <div style={{ fontSize: '0.85rem', color: C.primary, marginTop: '6px', fontWeight: 700 }}>
                      Hemat {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(plan.price * 12 * yearlyDiscount)}/tahun
                    </div>
                  )}
                </div>

                <div style={{
                  background: isSelected ? 'rgba(255,255,255,0.5)' : '#F1F5F9',
                  borderRadius: '16px', padding: '16px 20px', marginBottom: '32px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  border: `1px solid ${isSelected ? plan.color + '20' : 'transparent'}`
                }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: plan.color }}>{plan.commission}</span>
                  <span style={{ fontSize: '0.85rem', color: C.textSecondary, fontWeight: 600, lineHeight: 1.2 }}>Komisi per<br/>transaksi</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '40px' }}>
                  {plan.features.map((f) => (
                    <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {f.included ? <CheckIcon color={plan.color} /> : <XIcon />}
                      <span style={{ fontSize: '0.9rem', color: f.included ? C.textSecondary : '#94A3B8', fontWeight: f.included ? 500 : 400 }}>{f.label}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleUpgrade(plan.key); }}
                  disabled={isCurrent}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '16px', border: 'none',
                    background: isCurrent ? '#E2E8F0' : plan.key === 'pro' ? plan.color : 'transparent',
                    borderWidth: '2px', borderStyle: 'solid',
                    borderColor: isCurrent ? '#E2E8F0' : plan.color,
                    color: isCurrent ? '#94A3B8' : plan.key === 'pro' ? '#fff' : plan.color,
                    fontSize: '1rem', fontWeight: 800, cursor: isCurrent ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: !isCurrent && plan.key === 'pro' ? `0 8px 20px ${plan.color}30` : 'none'
                  }}>
                  {isCurrent ? 'Paket Aktif Saat Ini' : plan.key === 'free' ? 'Kembali ke Gratis' : `Pilih Paket ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Boost Options */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.textMain, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Ekstra Visibilitas Produk
            </h2>
            <p style={{ color: C.textMuted, fontSize: '1rem', margin: 0, fontWeight: 500 }}>
              Promosikan produk unggulan Anda agar tampil di urutan teratas hasil pencarian
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {BOOST_OPTIONS.map((boost) => (
              <div key={boost.type} style={{
                background: C.bgCard, border: `1px solid ${C.border}`,
                borderRadius: '24px', padding: '28px',
                transition: 'all 0.2s', boxShadow: C.shadowCard,
              }} onMouseOver={(e) => e.currentTarget.style.borderColor = boost.color} onMouseOut={(e) => e.currentTarget.style.borderColor = C.border}>
                <div style={{ 
                  fontSize: '2rem', marginBottom: '20px', width: '64px', height: '64px', 
                  background: `${boost.color}10`, borderRadius: '18px', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center' 
                }}>{boost.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: C.textMain, marginBottom: '8px' }}>{boost.name}</div>
                <div style={{ fontSize: '0.9rem', color: C.textMuted, marginBottom: '24px', lineHeight: 1.5, fontWeight: 500 }}>{boost.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', borderTop: `1px solid ${C.bgInput}` }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: boost.color }}>{boost.priceLabel}</span>
                  <button style={{
                    padding: '10px 24px', background: boost.color,
                    border: 'none', color: '#FFFFFF',
                    borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
                    boxShadow: `0 4px 12px ${boost.color}30`
                  }}>Aktifkan</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmModal && (() => {
        const plan = PLANS.find(p => p.key === confirmModal)!;
        const finalPrice = billingCycle === 'yearly' ? plan.price * 12 * 0.8 : plan.price;
        return (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{
              background: C.bgCard, borderRadius: '32px',
              padding: '40px', maxWidth: '480px', width: '90%',
              boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)',
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🚀</div>
              <h3 style={{ margin: '0 0 12px', fontSize: '1.5rem', fontWeight: 800, color: C.textMain }}>
                Konfirmasi Langganan
              </h3>
              <p style={{ color: C.textSecondary, fontSize: '1rem', margin: '0 0 32px', lineHeight: 1.6, fontWeight: 500 }}>
                Anda akan beralih ke paket <strong style={{ color: plan.color }}>{plan.name}</strong> dengan biaya{' '}
                <strong style={{ color: C.textMain }}>
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(finalPrice)}
                </strong>
                /{billingCycle === 'monthly' ? 'bulan' : 'tahun'}.
              </p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={() => setConfirmModal(null)} style={{
                  flex: 1, padding: '14px', background: '#F1F5F9',
                  border: 'none', color: C.textSecondary, borderRadius: '16px',
                  cursor: 'pointer', fontSize: '1rem', fontWeight: 700,
                }}>Batal</button>
                <button onClick={() => setConfirmModal(null)} style={{
                  flex: 1, padding: '14px', background: plan.color,
                  border: 'none', color: '#fff', borderRadius: '16px',
                  cursor: 'pointer', fontSize: '1rem', fontWeight: 800,
                  boxShadow: `0 4px 12px ${plan.color}30`
                }}>Bayar Sekarang</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}