'use client';

import { useEffect, useMemo, useState } from 'react';

function formatRupiah(v: number) { return `Rp ${new Intl.NumberFormat('id-ID').format(v || 0)}`; }
function sparkline(values: number[]) {
  if (!values.length) return '';
  const max = Math.max(...values), min = Math.min(...values);
  const points = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * 100;
    const y = 100 - ((v - min) / Math.max(1, max - min)) * 100;
    return `${x},${y}`;
  });
  return points.join(' ');
}

export default function MarketPricePage() {
  const [rows, setRows] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('Semua');
  const [location, setLocation] = useState('Nasional');
  const [selected, setSelected] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [alertForm, setAlertForm] = useState({ commodity: '', alert_type: 'below', threshold: '' });

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t); }, [search]);

  async function load() {
    setLoading(true);
    const [priceRes, alertRes] = await Promise.all([
      fetch(`/api/market-price?q=${encodeURIComponent(debounced)}&category=${category}&location=${location}`),
      fetch('/api/market-price/alerts'),
    ]);
    const priceJson = await priceRes.json();
    const alertJson = await alertRes.json();
    setRows(priceJson.data ?? []);
    setAlerts(alertJson.data ?? []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, [debounced, category, location]);

  async function openDetail(commodity: string) {
    setSelected(commodity);
    const res = await fetch(`/api/market-price/${encodeURIComponent(commodity)}`);
    const json = await res.json();
    setHistory(json.data ?? []);
    setStats(json.stats ?? null);
  }

  async function addAlert() {
    const res = await fetch('/api/market-price/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...alertForm, threshold: Number(alertForm.threshold) }) });
    if (res.ok) {
      setAlertForm({ commodity: '', alert_type: 'below', threshold: '' });
      void load();
    }
  }

  async function deleteAlert(id: string) {
    await fetch(`/api/market-price/alerts?id=${id}`, { method: 'DELETE' });
    void load();
  }

  const detailPath = useMemo(() => {
    if (!history.length) return '';
    const values = history.map((h) => Number(h.price));
    const max = Math.max(...values), min = Math.min(...values);
    return history.map((h, i) => {
      const x = (i / Math.max(1, history.length - 1)) * 100;
      const y = 100 - ((Number(h.price) - min) / Math.max(1, max - min)) * 100;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [history]);

  // Premium Light Theme Palette
  const colors = {
    bgApp: '#F8FAFC', // Slate 50
    bgCard: '#FFFFFF',
    bgInput: '#F1F5F9', // Slate 100
    border: '#E2E8F0', // Slate 200
    textMain: '#0F172A', // Slate 900
    textMuted: '#64748B', // Slate 500
    textSubtle: '#94A3B8', // Slate 400
    primary: '#059669', // Emerald 600 (Richer green)
    danger: '#EF4444',
    shadowCard: '0 4px 20px rgba(0, 0, 0, 0.03)',
    shadowButton: '0 4px 12px rgba(5, 150, 105, 0.2)',
  };

  return (
    <div style={{ padding: '32px 24px', fontFamily: 'Inter, sans-serif', backgroundColor: colors.bgApp, minHeight: '100vh' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        
        {/* Header Card */}
        <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: colors.shadowCard }}>
          <h1 style={{ margin: 0, color: colors.textMain, fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Harga Pasar Komoditas</h1>
          <div style={{ color: colors.textMuted, marginTop: '6px', fontSize: '1.05rem' }}>Referensi harga terkini langsung dari pasar & petani Localink</div>
          <div style={{ color: colors.textSubtle, marginTop: '8px', fontSize: '0.85rem', fontWeight: 500 }}>Terakhir diperbarui: {new Date().toLocaleString('id-ID')}</div>
        </div>

        {/* Filter & Controls Card */}
        <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '16px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', boxShadow: colors.shadowCard }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari komoditas..." style={{ background: colors.bgInput, color: colors.textMain, border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '10px 14px', outline: 'none', transition: 'all 0.2s' }} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ background: colors.bgInput, color: colors.textMain, border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '10px 14px', outline: 'none' }}>
            {['Semua', 'Sayuran', 'Buah', 'Beras', 'Bumbu', 'Hasil Ternak'].map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={location} onChange={(e) => setLocation(e.target.value)} style={{ background: colors.bgInput, color: colors.textMain, border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '10px 14px', outline: 'none' }}>
            {['Nasional', 'DKI Jakarta', 'Jawa Tengah', 'Jawa Timur', 'Jawa Barat'].map((l) => <option key={l}>{l}</option>)}
          </select>
          <button onClick={() => setView((v) => (v === 'grid' ? 'table' : 'grid'))} style={{ background: '#FFFFFF', color: colors.textMain, border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '10px 16px', fontWeight: 500, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            {view === 'grid' ? 'Tampilan Tabel' : 'Tampilan Grid'}
          </button>
        </div>

        {loading ? <div style={{ color: colors.textMuted, textAlign: 'center', padding: '40px 0', fontWeight: 500 }}>Memuat data harga pasar...</div> : (
          view === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px' }}>
              {rows.map((r) => (
                <button key={`${r.commodity}-${r.location}`} onClick={() => openDetail(r.commodity)} style={{ textAlign: 'left', background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '20px', color: colors.textMain, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.06)'} onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '1.1rem', color: colors.textMain }}>{r.commodity}</strong>
                      <div style={{ color: colors.textMuted, fontSize: '0.85rem', marginTop: '2px' }}>{r.category}</div>
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: '0.8rem', background: colors.bgInput, padding: '4px 8px', borderRadius: '6px', fontWeight: 500 }}>{r.location}</div>
                  </div>
                  <div style={{ marginTop: '16px', fontSize: '1.5rem', fontWeight: 800, color: colors.primary, letterSpacing: '-0.02em' }}>{formatRupiah(r.price)}</div>
                  <div style={{ fontSize: '0.85rem', color: r.diff >= 0 ? colors.danger : colors.primary, fontWeight: 500, marginTop: '4px' }}>
                    {r.diff >= 0 ? '↑ Naik' : '↓ Turun'} {formatRupiah(r.diff)} ({(((r.diff || 0) / Math.max(1, r.previous_price)) * 100).toFixed(1)}%)
                  </div>
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '48px', marginTop: '16px' }}>
                    <polyline fill="none" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={sparkline((r.history ?? []).map((h: any) => Number(h.price)))} />
                  </svg>
                  <div style={{ color: colors.textSubtle, fontSize: '0.8rem', marginTop: '12px', paddingTop: '12px', borderTop: `1px dashed ${colors.border}` }}>
                    {r.unit} · Range bulan ini: <strong>{formatRupiah(r.lowest)} - {formatRupiah(r.highest)}</strong>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: colors.shadowCard }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: colors.textMain }}>
                <thead>
                  <tr style={{ background: colors.bgInput }}>
                    {['Komoditas', 'Kategori', 'Harga Hari Ini', 'Perubahan', 'Tren 7 Hari', 'Tertinggi', 'Terendah'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '14px 16px', fontSize: '0.85rem', color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.commodity}-${r.location}`} onClick={() => openDetail(r.commodity)} style={{ borderTop: `1px solid ${colors.border}`, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px', fontWeight: 500 }}>{r.commodity}</td>
                      <td style={{ padding: '16px', color: colors.textMuted }}>{r.category}</td>
                      <td style={{ padding: '16px', color: colors.primary, fontWeight: 700 }}>{formatRupiah(r.price)}</td>
                      <td style={{ padding: '16px', color: r.diff >= 0 ? colors.danger : colors.primary, fontWeight: 500 }}>{r.diff >= 0 ? '+' : ''}{formatRupiah(r.diff)}</td>
                      <td style={{ padding: '16px' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '100px', height: '28px' }}>
                          <polyline fill="none" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={sparkline((r.history ?? []).map((h: any) => Number(h.price)))} />
                        </svg>
                      </td>
                      <td style={{ padding: '16px', color: colors.textMuted }}>{formatRupiah(r.highest)}</td>
                      <td style={{ padding: '16px', color: colors.textMuted }}>{formatRupiah(r.lowest)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {selected && (
          <div style={{ marginTop: '20px', background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '24px', color: colors.textMain, boxShadow: colors.shadowCard }}>
            <h3 style={{ marginTop: 0, fontSize: '1.25rem', fontWeight: 700 }}>Grafik Tren Harga: {selected}</h3>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '280px', background: colors.bgInput, borderRadius: '12px', marginTop: '16px' }}>
              <defs>
                <linearGradient id="areaLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(5,150,105,0.15)" />
                  <stop offset="100%" stopColor="rgba(5,150,105,0)" />
                </linearGradient>
              </defs>
              <path d={`${detailPath} L 100 100 L 0 100 Z`} fill="url(#areaLight)" />
              <path d={detailPath} fill="none" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {stats && (
              <div style={{ marginTop: '16px', display: 'flex', gap: '24px', color: colors.textMuted, fontSize: '0.95rem' }}>
                <span>Rata-rata 30 hari: <strong style={{ color: colors.textMain }}>{formatRupiah(stats.avg)}</strong></span>
                <span>Volatilitas: <strong style={{ color: colors.textMain }}>{formatRupiah(stats.volatility)}</strong></span>
                <span>Tren: <strong style={{ color: colors.textMain }}>{stats.trend}</strong></span>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', color: colors.textMain }}>
          
          {/* Alert Card */}
          <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '24px', boxShadow: colors.shadowCard }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem' }}>🔔 Alert Harga Pintar</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px auto', gap: '10px' }}>
              <input value={alertForm.commodity} onChange={(e) => setAlertForm((p) => ({ ...p, commodity: e.target.value }))} placeholder="Komoditas" style={{ background: colors.bgInput, border: `1px solid ${colors.border}`, borderRadius: '10px', color: colors.textMain, padding: '10px 12px', outline: 'none' }} />
              <select value={alertForm.alert_type} onChange={(e) => setAlertForm((p) => ({ ...p, alert_type: e.target.value }))} style={{ background: colors.bgInput, border: `1px solid ${colors.border}`, borderRadius: '10px', color: colors.textMain, padding: '10px 12px', outline: 'none' }}>
                <option value="below">Di bawah</option><option value="above">Di atas</option>
              </select>
              <input value={alertForm.threshold} onChange={(e) => setAlertForm((p) => ({ ...p, threshold: e.target.value }))} placeholder="Threshold" type="number" style={{ background: colors.bgInput, border: `1px solid ${colors.border}`, borderRadius: '10px', color: colors.textMain, padding: '10px 12px', outline: 'none' }} />
              <button onClick={addAlert} style={{ background: `linear-gradient(135deg, #059669, #10B981)`, border: 'none', borderRadius: '10px', color: '#fff', padding: '10px 16px', fontWeight: 600, cursor: 'pointer', boxShadow: colors.shadowButton, transition: 'transform 0.1s' }} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>Simpan</button>
            </div>
            <div style={{ marginTop: '20px' }}>
              {alerts.map((a) => (
                <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', borderTop: `1px solid ${colors.border}`, padding: '12px 0' }}>
                  <div style={{ fontWeight: 500 }}>
                    {a.commodity} <span style={{ color: colors.textSubtle, fontWeight: 400, margin: '0 6px' }}>·</span> 
                    <span style={{ color: a.alert_type === 'below' ? colors.primary : colors.danger }}>{a.alert_type === 'below' ? 'Di bawah' : 'Di atas'}</span> {formatRupiah(a.threshold)}
                  </div>
                  <button onClick={() => deleteAlert(a.id)} style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: colors.danger, borderRadius: '8px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#FEE2E2'} onMouseOut={(e) => e.currentTarget.style.background = '#FEF2F2'}>Hapus</button>
                </div>
              ))}
              {alerts.length === 0 && <div style={{ textAlign: 'center', color: colors.textSubtle, padding: '20px 0', fontSize: '0.9rem' }}>Belum ada alert harga yang disetel.</div>}
            </div>
          </div>

          {/* Info Card */}
          <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '24px', boxShadow: colors.shadowCard }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem' }}>🌱 Integritas Harga Platform</h3>
            <div style={{ color: colors.textMuted, fontSize: '0.95rem', lineHeight: '1.6' }}>
              Perbandingan harga pasar yang ditampilkan di atas ditarik langsung dari rata-rata harga produk aktual yang diunggah oleh para petani di ekosistem <strong>Localink</strong>. <br/><br/>
              Fitur ini membantu para petani untuk tidak menjual di bawah harga wajar (*underselling*), sekaligus memberikan transparansi penuh bagi para pembeli.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}