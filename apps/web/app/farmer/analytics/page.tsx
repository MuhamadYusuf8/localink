'use client';

import { useState } from 'react';

const CHART_DATA = {
  '7': [
    { label: '26 Apr', revenue: 850000, orders: 3 },
    { label: '27 Apr', revenue: 1200000, orders: 5 },
    { label: '28 Apr', revenue: 680000, orders: 2 },
    { label: '29 Apr', revenue: 2100000, orders: 8 },
    { label: '30 Apr', revenue: 1750000, orders: 6 },
    { label: '1 Mei', revenue: 3200000, orders: 11 },
    { label: '2 Mei', revenue: 2800000, orders: 9 },
  ],
  '30': [
    { label: '3 Apr', revenue: 750000, orders: 3 },
    { label: '6 Apr', revenue: 980000, orders: 4 },
    { label: '9 Apr', revenue: 1400000, orders: 6 },
    { label: '12 Apr', revenue: 2100000, orders: 8 },
    { label: '15 Apr', revenue: 1800000, orders: 7 },
    { label: '18 Apr', revenue: 2500000, orders: 10 },
    { label: '21 Apr', revenue: 3100000, orders: 12 },
    { label: '24 Apr', revenue: 2800000, orders: 11 },
    { label: '27 Apr', revenue: 3500000, orders: 14 },
    { label: '30 Apr', revenue: 4200000, orders: 16 },
    { label: '2 Mei', revenue: 3800000, orders: 15 },
  ],
  '90': [
    { label: 'Feb W1', revenue: 4500000, orders: 18 },
    { label: 'Feb W2', revenue: 5200000, orders: 21 },
    { label: 'Feb W3', revenue: 4800000, orders: 19 },
    { label: 'Feb W4', revenue: 6100000, orders: 24 },
    { label: 'Mar W1', revenue: 5500000, orders: 22 },
    { label: 'Mar W2', revenue: 7200000, orders: 28 },
    { label: 'Mar W3', revenue: 6800000, orders: 26 },
    { label: 'Mar W4', revenue: 8400000, orders: 32 },
    { label: 'Apr W1', revenue: 7900000, orders: 30 },
    { label: 'Apr W2', revenue: 9200000, orders: 36 },
    { label: 'Apr W3', revenue: 8700000, orders: 34 },
    { label: 'Apr W4', revenue: 10500000, orders: 41 },
    { label: 'Mei W1', revenue: 11200000, orders: 44 },
  ],
};

const TOP_PRODUCTS = [
  { name: 'Cabai Merah Keriting', sold: 450, unit: 'kg', revenue: 12600000, trend: +12.5, rating: 4.8 },
  { name: 'Tomat Segar Grade A', sold: 890, unit: 'kg', revenue: 10680000, trend: +8.2, rating: 4.9 },
  { name: 'Bawang Merah Brebes', sold: 280, unit: 'kg', revenue: 9800000, trend: -3.1, rating: 4.7 },
  { name: 'Kangkung Organik', sold: 1200, unit: 'ikat', revenue: 6000000, trend: +21.4, rating: 4.6 },
  { name: 'Wortel Premium', sold: 350, unit: 'kg', revenue: 3325000, trend: +5.8, rating: 4.5 },
];

const BUYER_TYPE_DATA = { retail: 38, wholesale: 62 };

function formatRupiah(n: number) {
  if (n >= 1000000) return `Rp ${(n / 1000000).toFixed(1)}jt`;
  if (n >= 1000) return `Rp ${(n / 1000).toFixed(0)}rb`;
  return `Rp ${n}`;
}

function formatRupiahFull(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
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
  danger: '#EF4444',      // Red 500
  dangerGlow: 'rgba(239, 68, 68, 0.1)',
  shadowCard: '0 4px 20px rgba(0, 0, 0, 0.03)',
};

function MiniBarChart({ data, metric }: { data: typeof CHART_DATA['7']; metric: 'revenue' | 'orders' }) {
  const max = Math.max(...data.map((d) => d[metric]));
  const chartH = 180;
  const barW = Math.floor((600 - data.length * 4) / data.length);

  // Sesuaikan warna grafik metrik
  const gradientColor1 = metric === 'revenue' ? '#059669' : '#4F46E5'; // Emerald or Indigo
  const gradientColor2 = metric === 'revenue' ? '#34D399' : '#818CF8';
  const textColor = metric === 'revenue' ? '#059669' : '#4F46E5';

  return (
    <div style={{ width: '100%', overflowX: 'auto', paddingTop: '10px' }}>
      <svg viewBox={`0 0 640 ${chartH + 40}`} style={{ width: '100%', display: 'block' }}>
        <defs>
          <linearGradient id={`barGrad-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientColor1} stopOpacity="0.9" />
            <stop offset="100%" stopColor={gradientColor2} stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const val = d[metric];
          const barH = Math.max(4, (val / max) * chartH);
          const x = 20 + i * (barW + 4);
          const y = chartH - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx={4} fill={`url(#barGrad-${metric})`} opacity="0.9" />
              <text x={x + barW / 2} y={chartH + 20} textAnchor="middle" fill={C.textMuted}
                style={{ fontSize: '10px', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{d.label}</text>
              <text x={x + barW / 2} y={y - 8} textAnchor="middle" fill={textColor}
                style={{ fontSize: '10px', fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
                {metric === 'revenue' ? formatRupiah(val) : val}
              </text>
            </g>
          );
        })}
        <line x1="16" y1={chartH} x2="624" y2={chartH} stroke={C.border} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function FarmerAnalyticsPage() {
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');
  const data = CHART_DATA[period];

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const kpis = [
    { label: 'Total Pendapatan', value: formatRupiahFull(totalRevenue), sub: `+18.4% vs periode lalu`, color: '#059669', bgIcon: '#ECFDF5', borderIcon: '#A7F3D0', icon: '💰' },
    { label: 'Total Pesanan', value: totalOrders.toString(), sub: `Rata-rata ${(totalOrders / parseInt(period)).toFixed(1)}/hari`, color: '#4F46E5', bgIcon: '#EEF2FF', borderIcon: '#C7D2FE', icon: '📦' },
    { label: 'Nilai Rata-rata Pesanan', value: formatRupiahFull(avgOrderValue), sub: '+6.2% vs periode lalu', color: '#D97706', bgIcon: '#FFFBEB', borderIcon: '#FDE68A', icon: '📊' },
    { label: 'Pembeli Unik', value: '47', sub: '12 pembeli baru', color: '#0891B2', bgIcon: '#ECFEFF', borderIcon: '#A5F3FC', icon: '👥' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bgApp, color: C.textMain, fontFamily: 'Inter, sans-serif', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ padding: '32px 40px', background: C.bgCard, borderBottom: `1px solid ${C.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: C.textMain, margin: 0, letterSpacing: '-0.02em' }}>Analitik Toko</h1>
            <p style={{ color: C.textMuted, marginTop: '4px', fontSize: '0.95rem', fontWeight: 500 }}>
              Pantau performa toko dan tren penjualan Anda secara mendalam
            </p>
          </div>
          
          {/* Period Selector */}
          <div style={{ display: 'flex', background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '4px' }}>
            {(['7', '30', '90'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: period === p ? C.bgCard : 'transparent',
                color: period === p ? C.primary : C.textMuted,
                fontWeight: period === p ? 700 : 600,
                fontSize: '0.85rem', transition: 'all 0.2s',
                boxShadow: period === p ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
              }}>
                {p === '7' ? '7 Hari' : p === '30' ? '30 Hari' : '90 Hari'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1600px', margin: '0 auto' }}>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} style={{
              background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px',
              padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: C.shadowCard
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                background: `linear-gradient(90deg, ${kpi.color}40, ${kpi.color})`,
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.75rem', width: '48px', height: '48px', background: kpi.bgIcon, border: `1px solid ${kpi.borderIcon}`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>{kpi.icon}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: kpi.color, background: `${kpi.color}15`, padding: '4px 10px', borderRadius: '20px' }}>{kpi.sub.split(' ')[0]}</div>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: C.textMain, marginTop: '20px', letterSpacing: '-0.02em' }}>{kpi.value}</div>
              <div style={{ fontSize: '0.85rem', color: C.textMuted, marginTop: '4px', fontWeight: 600 }}>{kpi.label}</div>
              <div style={{ fontSize: '0.75rem', color: C.textSubtle, marginTop: '16px', borderTop: `1px solid ${C.bgInput}`, paddingTop: '12px', fontWeight: 500 }}>
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Main Chart */}
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '32px', boxShadow: C.shadowCard }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: C.textMain }}>
                {chartMetric === 'revenue' ? 'Grafik Pendapatan' : 'Grafik Pesanan'}
              </h2>
              <p style={{ fontSize: '0.9rem', color: C.textMuted, marginTop: '4px', fontWeight: 500 }}>
                Menampilkan data {period === '7' ? '7 hari' : period === '30' ? '30 hari' : '90 hari'} terakhir
              </p>
            </div>
            
            {/* Chart Toggle */}
            <div style={{ display: 'flex', gap: '8px', background: C.bgInput, padding: '4px', borderRadius: '10px' }}>
              <button onClick={() => setChartMetric('revenue')} style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none',
                background: chartMetric === 'revenue' ? C.bgCard : 'transparent',
                color: chartMetric === 'revenue' ? C.primary : C.textMuted,
                fontWeight: chartMetric === 'revenue' ? 700 : 600,
                fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: chartMetric === 'revenue' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
              }}>Pendapatan</button>
              <button onClick={() => setChartMetric('orders')} style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none',
                background: chartMetric === 'orders' ? C.bgCard : 'transparent',
                color: chartMetric === 'orders' ? '#4F46E5' : C.textMuted,
                fontWeight: chartMetric === 'orders' ? 700 : 600,
                fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: chartMetric === 'orders' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
              }}>Pesanan</button>
            </div>
          </div>
          <MiniBarChart data={data} metric={chartMetric} />
        </div>

        {/* Bottom Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>

          {/* Top Products */}
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '32px', boxShadow: C.shadowCard }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 24px', color: C.textMain }}>Produk Terlaris</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* Table Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'minmax(120px, 2fr) 1fr 1fr 60px 60px',
                gap: '16px', padding: '12px 16px',
                fontSize: '0.75rem', color: C.textMuted, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                background: C.bgApp, borderRadius: '10px', marginBottom: '8px'
              }}>
                <span>Produk</span><span>Terjual</span><span>Pendapatan</span><span>Tren</span><span>Rating</span>
              </div>

              {TOP_PRODUCTS.map((p, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: 'minmax(120px, 2fr) 1fr 1fr 60px 60px',
                  gap: '16px', padding: '16px', borderRadius: '12px',
                  alignItems: 'center', transition: 'background 0.2s', borderBottom: i === TOP_PRODUCTS.length - 1 ? 'none' : `1px solid ${C.bgInput}`,
                }} onMouseOver={(e) => e.currentTarget.style.background = C.bgApp} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.8rem', color: C.textSubtle, fontWeight: 800, minWidth: '20px' }}>#{i + 1}</span>
                    <span style={{ fontSize: '0.9rem', color: C.textMain, fontWeight: 700 }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: C.textSecondary, fontWeight: 500 }}>{p.sold} <span style={{ color: C.textSubtle }}>{p.unit}</span></span>
                  <span style={{ fontSize: '0.85rem', color: C.primary, fontWeight: 700 }}>{formatRupiah(p.revenue)}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: p.trend > 0 ? C.primary : C.danger, background: p.trend > 0 ? C.primaryGlow : C.dangerGlow, padding: '4px 8px', borderRadius: '6px', textAlign: 'center' }}>
                    {p.trend > 0 ? '▲' : '▼'} {Math.abs(p.trend)}%
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#D97706', fontWeight: 600 }}>⭐ {p.rating}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Buyer Breakdown & Rating */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Buyer Breakdown */}
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '32px', boxShadow: C.shadowCard }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 32px', color: C.textMain }}>Demografi Tipe Pembeli</h2>
              
              {/* Donut-style breakdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
                  <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke={C.bgInput} strokeWidth="14" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke={C.primary} strokeWidth="14"
                      strokeDasharray={`${BUYER_TYPE_DATA.wholesale * 2.513} ${251.3}`} strokeLinecap="round" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#6366F1" strokeWidth="14"
                      strokeDasharray={`${BUYER_TYPE_DATA.retail * 2.513} ${251.3}`}
                      strokeDashoffset={`${-(BUYER_TYPE_DATA.wholesale * 2.513)}`} strokeLinecap="round" />
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: C.textMain, letterSpacing: '-0.02em' }}>47</div>
                    <div style={{ fontSize: '0.75rem', color: C.textMuted, fontWeight: 600 }}>Pembeli</div>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { label: 'Pesanan Grosir', pct: BUYER_TYPE_DATA.wholesale, color: C.primary, orders: 29 },
                    { label: 'Pesanan Retail', pct: BUYER_TYPE_DATA.retail, color: '#6366F1', orders: 18 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: item.color }} />
                          <span style={{ fontSize: '0.85rem', color: C.textSecondary, fontWeight: 600 }}>{item.label}</span>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: item.color }}>{item.pct}%</span>
                      </div>
                      <div style={{ height: '6px', background: C.bgInput, borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ height: '6px', width: `${item.pct}%`, background: item.color, borderRadius: '9999px' }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '6px', fontWeight: 500 }}>{item.orders} transaksi diselesaikan</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rating Overview */}
            <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '32px', boxShadow: C.shadowCard }}>
              <div style={{ fontSize: '0.8rem', color: C.textMuted, fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Skor Rating Toko
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ textAlign: 'center', background: '#FFFBEB', border: '1px solid #FEF3C7', padding: '16px', borderRadius: '16px' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#D97706', lineHeight: 1 }}>4.8</div>
                  <div style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600, marginTop: '8px' }}>dari 5.0</div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[5, 4, 3].map((star) => {
                    const pct = star === 5 ? 72 : star === 4 ? 20 : 8;
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 700, minWidth: '24px', display: 'flex', alignItems: 'center', gap: '2px' }}>{star}<span style={{ fontSize: '0.7rem' }}>★</span></span>
                        <div style={{ flex: 1, height: '8px', background: C.bgInput, borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '8px', background: '#F59E0B', borderRadius: '9999px' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: C.textSecondary, fontWeight: 600, minWidth: '32px', textAlign: 'right' }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}