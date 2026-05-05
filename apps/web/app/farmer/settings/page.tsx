'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────
interface StoreSettings {
  // Profil Toko
  store_name: string;
  store_description: string;
  store_avatar: string; // inisial
  store_tagline: string;
  established_year: string;
  // Kontak
  phone: string;
  whatsapp: string;
  email: string;
  // Lokasi & Pickup
  province: string;
  city: string;
  district: string;
  full_address: string;
  pickup_available: boolean;
  pickup_notes: string;
  // Pengiriman
  delivery_radius_km: number;
  min_order_value: number;
  free_shipping_min: number;
  supported_couriers: string[];
  // Operasional
  open_days: string[];
  open_hour: string;
  close_hour: string;
  auto_reply_message: string;
  // Spesialisasi
  product_categories: string[];
  farming_methods: string[];
  certifications: string[];
  // Pembayaran
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  payment_methods: string[];
  // Notifikasi
  notif_new_order: boolean;
  notif_new_message: boolean;
  notif_review: boolean;
  notif_promotion: boolean;
  notif_email: boolean;
  notif_whatsapp: boolean;
}

const INITIAL: StoreSettings = {
  store_name: 'Toko Pak Haji Syamsul',
  store_description: 'Kami menyediakan hasil pertanian segar berkualitas tinggi langsung dari kebun kami di Boyolali. Sudah melayani ratusan restoran dan rumah makan di Jawa Tengah.',
  store_avatar: 'HS',
  store_tagline: 'Segar dari Kebun, Langsung ke Meja Anda',
  established_year: '2019',
  phone: '0812-3456-7890',
  whatsapp: '0812-3456-7890',
  email: 'syamsul@petani.test',
  province: 'Jawa Tengah',
  city: 'Boyolali',
  district: 'Ngemplak',
  full_address: 'Jl. Merapi No. 12, Desa Sawahan, Ngemplak, Boyolali 57375',
  pickup_available: true,
  pickup_notes: 'Pickup tersedia setiap hari Senin–Sabtu, pukul 06.00–09.00 WIB. Hubungi terlebih dahulu sebelum datang.',
  delivery_radius_km: 50,
  min_order_value: 150000,
  free_shipping_min: 500000,
  supported_couriers: ['JNE', 'J&T', 'SiCepat'],
  open_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  open_hour: '06:00',
  close_hour: '17:00',
  auto_reply_message: 'Terima kasih telah menghubungi Toko Pak Haji Syamsul! Kami akan membalas pesan Anda secepatnya pada jam operasional.',
  product_categories: ['Cabai', 'Tomat', 'Sayuran Hijau'],
  farming_methods: ['Konvensional'],
  certifications: [],
  bank_name: 'BRI',
  bank_account: '1234-5678-9012-3456',
  bank_holder: 'Haji Syamsul',
  payment_methods: ['Transfer Bank', 'QRIS'],
  notif_new_order: true,
  notif_new_message: true,
  notif_review: true,
  notif_promotion: false,
  notif_email: true,
  notif_whatsapp: true,
};

const ALL_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const ALL_COURIERS = ['JNE', 'J&T', 'SiCepat', 'AnterAja', 'Gosend', 'Grab Express', 'Ninja Xpress', 'POS Indonesia'];
const ALL_METHODS = ['Konvensional', 'Organik', 'Hidroponik', 'Aeroponik', 'Vertikultur', 'Permakultur'];
const ALL_CATEGORIES = ['Cabai', 'Tomat', 'Sayuran Hijau', 'Umbi', 'Buah', 'Beras', 'Bumbu', 'Rempah', 'Jagung', 'Kacang-kacangan'];
const ALL_CERTS = ['Organik SNI', 'BPOM', 'Halal MUI', 'SRP (Sustainable Rice Platform)', 'GAP (Good Agricultural Practice)', 'GlobalGAP'];
const ALL_PAYMENTS = ['Transfer Bank', 'QRIS', 'COD', 'Dompet Digital (OVO/GoPay/Dana)', 'Kredit (NET 30)'];
const ALL_BANKS = ['BRI', 'BCA', 'Mandiri', 'BNI', 'BSI', 'CIMB Niaga', 'Danamon'];

const TABS = [
  { key: 'profil', label: 'Profil Toko', icon: '🏪' },
  { key: 'lokasi', label: 'Lokasi & Pickup', icon: '📍' },
  { key: 'pengiriman', label: 'Pengiriman', icon: '🚚' },
  { key: 'operasional', label: 'Jam Operasional', icon: '🕐' },
  { key: 'spesialisasi', label: 'Spesialisasi', icon: '🌱' },
  { key: 'pembayaran', label: 'Pembayaran', icon: '💳' },
  { key: 'notifikasi', label: 'Notifikasi', icon: '🔔' },
];

function formatRupiah(val: number) {
  return new Intl.NumberFormat('id-ID').format(val);
}

function validateSettings(s: StoreSettings): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  if (!s.store_name || s.store_name.trim().length < 3) {
    errors.store_name = ['Nama toko minimal 3 karakter'];
  }

  if (s.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) {
    errors.email = ['Format email tidak valid'];
  }

  if (s.phone && !/^0\d{8,13}$/.test(s.phone.replace(/[-\s]/g, ''))) {
    errors.phone = ['Format nomor HP tidak valid (contoh: 08123456789)'];
  }

  if (s.open_hour && s.close_hour && s.open_hour >= s.close_hour) {
    errors.open_hour = ['Jam buka harus lebih awal dari jam tutup'];
  }

  if (s.bank_account && s.bank_name && !s.bank_holder) {
    errors.bank_holder = ['Nama pemilik rekening wajib diisi'];
  }

  if (s.established_year) {
    const year = Number.parseInt(s.established_year, 10);
    if (Number.isNaN(year) || year < 1945 || year > new Date().getFullYear()) {
      errors.established_year = ['Tahun berdiri tidak valid'];
    }
  }

  return errors;
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
  textSubtle: '#94A3B8',
  primary: '#059669',
  primaryGlow: 'rgba(5, 150, 105, 0.08)',
};

// ─── Sub-components ───────────────────────────────────────────

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '20px', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' }}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, background: '#FAFBFC' }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: C.textMain }}>{title}</div>
        {subtitle && <div style={{ fontSize: '0.85rem', color: C.textMuted, marginTop: '4px', fontWeight: 500 }}>{subtitle}</div>}
      </div>
      <div style={{ padding: '28px' }}>{children}</div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text', hint, fieldKey, error }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string; fieldKey?: string; error?: string;
}) {
  return (
    <div id={fieldKey ? `field-${fieldKey}` : undefined} style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: C.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '12px 16px', background: C.bgInput,
          border: `1px solid ${C.border}`, borderRadius: '12px', color: C.textMain,
          fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
          transition: 'all 0.2s',
        }}
      />
      {hint && <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '6px', fontWeight: 500 }}>{hint}</div>}
      {error && <div style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '6px', fontWeight: 600 }}>{error}</div>}
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 3, hint, maxLength }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; hint?: string; maxLength?: number;
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
        {maxLength && <span style={{ fontSize: '0.75rem', color: value.length > maxLength * 0.9 ? '#F59E0B' : C.textMuted }}>{value.length}/{maxLength}</span>}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        style={{
          width: '100%', padding: '12px 16px', background: C.bgInput,
          border: `1px solid ${C.border}`, borderRadius: '12px', color: C.textMain,
          fontSize: '0.95rem', outline: 'none', resize: 'vertical',
          boxSizing: 'border-box', lineHeight: 1.6, transition: 'all 0.2s',
        }}
      />
      {hint && <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '6px', fontWeight: 500 }}>{hint}</div>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: C.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '12px 16px', background: C.bgInput,
          border: `1px solid ${C.border}`, borderRadius: '12px', color: C.textMain,
          fontSize: '0.95rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
        }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, subtitle, checked, onChange }: {
  label: string; subtitle?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${C.border}` }}>
      <div>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: C.textMain }}>{label}</div>
        {subtitle && <div style={{ fontSize: '0.8rem', color: C.textMuted, marginTop: '4px' }}>{subtitle}</div>}
      </div>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: '48px', height: '26px', borderRadius: '9999px', cursor: 'pointer',
          background: checked ? C.primary : '#CBD5E1',
          position: 'relative', flexShrink: 0, transition: 'background 0.3s',
        }}>
        <div style={{
          width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
          position: 'absolute', top: '3px',
          left: checked ? '25px' : '3px',
          transition: 'left 0.3s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }} />
      </div>
    </div>
  );
}

function MultiChip({ label, hint, allOptions, selected, onChange }: {
  label: string; hint?: string; allOptions: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  }
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: C.textSecondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {allOptions.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              style={{
                padding: '8px 16px', borderRadius: '12px', cursor: 'pointer',
                background: active ? '#ECFDF5' : C.bgCard,
                border: `1px solid ${active ? C.primary : C.border}`,
                color: active ? C.primary : C.textSecondary,
                fontSize: '0.85rem', fontWeight: active ? 700 : 600,
                transition: 'all 0.2s',
              }}>
              {active ? '✓ ' : ''}{opt}
            </button>
          );
        })}
      </div>
      {hint && <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '8px', fontWeight: 500 }}>{hint}</div>}
    </div>
  );
}

function RangeField({ label, value, onChange, min, max, step = 1, unit, hint }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; unit: string; hint?: string;
}) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: C.primary }}>
          {unit === 'km' ? `${value} km` : `Rp ${formatRupiah(value)}`}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: C.primary, cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: C.textMuted, marginTop: '8px', fontWeight: 500 }}>
        <span>{unit === 'km' ? `${min} km` : `Rp ${formatRupiah(min)}`}</span>
        <span>{unit === 'km' ? `${max} km` : `Rp ${formatRupiah(max)}`}</span>
      </div>
      {hint && <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '6px', fontWeight: 500 }}>{hint}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function FarmerSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<StoreSettings>(INITIAL);
  const [activeTab, setActiveTab] = useState('profil');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [bankAccountEditing, setBankAccountEditing] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [avatarColor] = useState('linear-gradient(135deg, #059669, #10B981)');

  function set<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/farmer/settings', { credentials: 'include' });

        if (res.status === 401) {
          router.push('/login');
          return;
        }

        if (!res.ok) {
          throw new Error('Gagal memuat pengaturan');
        }

        const json = (await res.json()) as { data: StoreSettings & { logo_url?: string } };
        setSettings(json.data);
        setLogoUrl(json.data.logo_url ?? null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data');
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, [router]);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setFieldErrors({});

    const errors = validateSettings(settings);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaving(false);
      const firstErrorKey = Object.keys(errors)[0];
      document.getElementById(`field-${firstErrorKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      const res = await fetch('/api/farmer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...settings, logo_url: logoUrl }),
      });
      const json = (await res.json()) as {
        data?: StoreSettings & { logo_url?: string };
        error?: { message?: string; fields?: Record<string, string[]> };
      };

      if (!res.ok) {
        if (json.error?.fields) {
          setFieldErrors(json.error.fields);
        }
        throw new Error(json.error?.message || 'Gagal menyimpan');
      }

      if (json.data) {
        setSettings(json.data);
        if (json.data.logo_url !== undefined) {
          setLogoUrl(json.data.logo_url);
        }
      }
      setSaved(true);
      setBankAccountEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!window.confirm('Reset semua perubahan yang belum disimpan?')) return;

    try {
      setLoading(true);
      const res = await fetch('/api/farmer/settings', { credentials: 'include' });
      const json = (await res.json()) as { data?: StoreSettings & { logo_url?: string } };
      if (res.ok && json.data) {
        setSettings(json.data);
        setLogoUrl(json.data.logo_url ?? null);
      } else {
        setSettings(INITIAL);
        setLogoUrl(null);
      }
      setSaved(false);
      setFieldErrors({});
      setSaveError(null);
    } catch {
      setSettings(INITIAL);
      setLogoUrl(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoUpload(file: File) {
    try {
      setLogoUploading(true);
      setSaveError(null);
      const formData = new FormData();
      formData.append('logo', file);
      const res = await fetch('/api/farmer/settings/logo', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const json = (await res.json()) as { success?: boolean; error?: string; data?: { logoUrl?: string } };
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Upload logo gagal');
      }
      setLogoUrl(json.data?.logoUrl ?? null);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Gagal upload logo');
    } finally {
      setLogoUploading(false);
    }
  }

  // Completion score
  const fields = [
    settings.store_name, settings.store_description, settings.store_tagline,
    settings.phone, settings.whatsapp, settings.email,
    settings.province, settings.city, settings.full_address,
    settings.bank_name, settings.bank_account,
  ];
  const filled = fields.filter((f) => f && f.trim().length > 0).length;
  const score = Math.round((filled / fields.length) * 100);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bgApp, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: C.textMuted }}>
        <div style={{ width: '40px', height: '40px', border: `3px solid ${C.border}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ fontSize: '0.95rem', color: C.textSecondary, fontWeight: 600 }}>Memuat pengaturan toko...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: C.bgApp, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '48px', background: C.bgCard, borderRadius: '24px', border: `1px solid ${C.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', maxWidth: '440px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
        <div style={{ color: C.textMain, fontWeight: 800, fontSize: '1.25rem', marginBottom: '12px' }}>Gagal Memuat Data</div>
        <div style={{ color: C.textMuted, fontSize: '0.95rem', marginBottom: '32px', fontWeight: 500 }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ padding: '12px 32px', background: C.primary, border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.2)' }}>
          Coba Lagi
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bgApp, color: C.textMain, fontFamily: 'Inter, sans-serif' }}>

      {/* Page Header */}
      <div style={{ padding: '32px 32px 0', borderBottom: `1px solid ${C.border}`, maxWidth: '1200px', margin: '0 auto', background: C.bgCard, borderRadius: '0 0 24px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '18px',
                background: avatarColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: '1.5rem', color: '#fff',
                boxShadow: '0 8px 16px rgba(5,150,105,0.2)',
              }}>{settings.store_avatar}</div>
              <div style={{
                position: 'absolute', bottom: '-4px', right: '-4px',
                width: '24px', height: '24px', borderRadius: '50%',
                background: C.primary, border: `3px solid ${C.bgCard}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', color: '#fff'
              }}>✓</div>
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: C.textMain, margin: 0, letterSpacing: '-0.02em' }}>{settings.store_name}</h1>
              <p style={{ color: C.textMuted, marginTop: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                {settings.city}, {settings.province} · Mitra sejak {settings.established_year}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                <div style={{ width: '140px', height: '6px', background: C.bgInput, borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '99px',
                    width: `${score}%`,
                    background: C.primary,
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: C.primary, fontWeight: 700 }}>
                  Profil {score}% Lengkap
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', marginLeft: 'auto' }}>
            {saveError && (
              <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px', color: '#EF4444', fontSize: '0.85rem', fontWeight: 600 }}>
                {saveError}
              </div>
            )}
            {saved && (
              <span style={{
                fontSize: '0.85rem', color: C.primary, background: '#ECFDF5',
                border: '1px solid #D1FAE5', borderRadius: '12px',
                padding: '10px 18px', fontWeight: 700,
              }}>✓ Perubahan disimpan</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '12px 32px', borderRadius: '14px',
                background: saving ? C.textSubtle : C.primary,
                border: 'none', color: '#fff',
                fontWeight: 800, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 6px 20px rgba(5,150,105,0.25)',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px',
              }}>
              {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px' }} className="no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 20px', borderRadius: '12px', cursor: 'pointer',
                background: activeTab === tab.key ? C.bgInput : 'transparent',
                border: 'none',
                color: activeTab === tab.key ? C.primary : C.textMuted,
                fontWeight: activeTab === tab.key ? 700 : 600,
                fontSize: '0.85rem', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s',
              }}>
              <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '40px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        {Object.keys(fieldErrors).length > 0 && (
          <div style={{ padding: '16px 20px', background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '16px', color: '#D97706', fontSize: '0.9rem', marginBottom: '24px', fontWeight: 600 }}>
            ⚠️ Mohon periksa kembali input yang ditandai merah sebelum menyimpan.
          </div>
        )}

        {/* ── TAB: PROFIL ── */}
        {activeTab === 'profil' && (
          <>
            <SectionCard title="Logo Toko" subtitle="Foto profil publik toko Anda">
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{
                  width: '96px', height: '96px', borderRadius: '20px',
                  background: avatarColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '2rem', color: '#fff',
                  flexShrink: 0, overflow: 'hidden', border: `4px solid ${C.bgInput}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo toko" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : settings.store_avatar}
                </div>

                <div>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleLogoUpload(file);
                    }}
                  />
                  <button
                    disabled={logoUploading}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    style={{
                      padding: '10px 24px', background: '#FFFFFF', border: `2px solid ${C.border}`,
                      borderRadius: '12px', color: C.textSecondary, fontSize: '0.9rem', cursor: 'pointer',
                      fontWeight: 700, transition: 'all 0.2s',
                    }}
                  >
                    {logoUploading ? 'Proses...' : '📷 Unggah Foto Baru'}
                  </button>
                  <div style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '8px', fontWeight: 500 }}>
                    Format: JPG, PNG, WEBP (Maks. 2MB)
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Informasi Dasar" subtitle="Detail utama toko Anda">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <InputField
                    label="Nama Toko Resmi"
                    value={settings.store_name}
                    onChange={(v) => set('store_name', v)}
                    placeholder="Masukkan nama toko..."
                    fieldKey="store_name"
                    error={fieldErrors.store_name?.[0]}
                  />
                </div>
                <InputField label="Slogan Toko" value={settings.store_tagline} onChange={(v) => set('store_tagline', v)} placeholder="Slogan singkat..." hint="Tampil di bawah nama toko (Maks. 60 karakter)." />
                <InputField
                  label="Tahun Mulai Beroperasi"
                  value={settings.established_year}
                  onChange={(v) => set('established_year', v)}
                  placeholder="2019"
                  type="number"
                  fieldKey="established_year"
                  error={fieldErrors.established_year?.[0]}
                />
              </div>
              <TextareaField label="Deskripsi Bisnis" value={settings.store_description} onChange={(v) => set('store_description', v)}
                placeholder="Ceritakan tentang sejarah, kualitas produk, dan keunggulan toko Anda..."
                rows={5} maxLength={500} hint="Teks deskriptif meningkatkan kepercayaan calon pembeli." />
            </SectionCard>

            <SectionCard title="Data Kontak" subtitle="Kontak operasional untuk pembeli">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <InputField
                  label="Nomor Telepon Kantor"
                  value={settings.phone}
                  onChange={(v) => set('phone', v)}
                  placeholder="0812-xxxx-xxxx"
                  fieldKey="phone"
                  error={fieldErrors.phone?.[0]}
                />
                <InputField label="Link WhatsApp Bisnis" value={settings.whatsapp} onChange={(v) => set('whatsapp', v)} placeholder="0812-xxxx-xxxx" hint="Akan digunakan sebagai tombol chat utama." />
                <div style={{ gridColumn: '1 / -1' }}>
                  <InputField
                    label="Email Resmi"
                    value={settings.email}
                    onChange={(v) => set('email', v)}
                    placeholder="kontak@toko.com"
                    type="email"
                    fieldKey="email"
                    error={fieldErrors.email?.[0]}
                  />
                </div>
              </div>
            </SectionCard>

            <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '20px', padding: '24px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#EF4444', marginBottom: '4px' }}>Zona Berbahaya</div>
              <div style={{ fontSize: '0.85rem', color: '#991B1B', marginBottom: '20px', fontWeight: 500 }}>Tindakan ini permanen dan tidak dapat dibatalkan.</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{
                  padding: '10px 20px', background: '#fff',
                  border: '1px solid #FCA5A5', borderRadius: '12px',
                  color: '#EF4444', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                }}>Tutup Toko Sementara</button>
                <button style={{
                  padding: '10px 20px', background: '#EF4444',
                  border: 'none', borderRadius: '12px',
                  color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                }}>Hapus Akun Permanen</button>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: LOKASI ── */}
        {activeTab === 'lokasi' && (
          <>
            <SectionCard title="Domisili Toko" subtitle="Titik lokasi operasional Anda">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <InputField label="Wilayah Provinsi" value={settings.province} onChange={(v) => set('province', v)} placeholder="Jawa Tengah" />
                <InputField label="Kabupaten / Kota" value={settings.city} onChange={(v) => set('city', v)} placeholder="Boyolali" />
                <InputField label="Wilayah Kecamatan" value={settings.district} onChange={(v) => set('district', v)} placeholder="Ngemplak" />
              </div>
              <TextareaField label="Alamat Korespondensi & Pickup" value={settings.full_address} onChange={(v) => set('full_address', v)}
                placeholder="Nama Jalan, Blok, No. Rumah, RT/RW, Kode Pos..."
                rows={4} hint="Gunakan alamat yang mudah ditemukan kurir." />
            </SectionCard>

            <SectionCard title="Pengambilan Di Tempat" subtitle="Opsi pickup mandiri oleh pembeli">
              <Toggle label="Izinkan Pengambilan Mandiri" subtitle="Pembeli dapat mengambil barang langsung ke lokasi" checked={settings.pickup_available} onChange={(v) => set('pickup_available', v)} />
              {settings.pickup_available && (
                <div style={{ marginTop: '20px' }}>
                  <TextareaField label="Instruksi Pickup" value={settings.pickup_notes} onChange={(v) => set('pickup_notes', v)}
                    placeholder="Contoh: Tersedia Senin-Sabtu jam 08:00-11:00. Mohon info 1 jam sebelum sampai..."
                    rows={3} hint="Teks ini tampil saat pembeli memilih metode pickup." />
                </div>
              )}
            </SectionCard>
          </>
        )}

        {/* ── TAB: PENGIRIMAN ── */}
        {activeTab === 'pengiriman' && (
          <>
            <SectionCard title="Ketentuan Logistik" subtitle="Atur radius dan batas minimum order">
              <RangeField label="Jangkauan Radius Kirim" value={settings.delivery_radius_km} onChange={(v) => set('delivery_radius_km', v)}
                min={5} max={200} step={5} unit="km"
                hint="Jarak maksimal pengiriman instan/pribadi." />
              <RangeField label="Batas Minimum Belanja" value={settings.min_order_value} onChange={(v) => set('min_order_value', v)}
                min={50000} max={2000000} step={50000} unit="Rp"
                hint="Pesanan di bawah nilai ini tidak akan diproses." />
              <RangeField label="Syarat Gratis Ongkos Kirim" value={settings.free_shipping_min} onChange={(v) => set('free_shipping_min', v)}
                min={0} max={5000000} step={100000} unit="Rp"
                hint="Gunakan 0 jika Anda tidak menyediakan promo ini." />
            </SectionCard>

            <SectionCard title="Layanan Ekspedisi" subtitle="Pilih mitra kurir yang Anda dukung">
              <MultiChip label="Mitra Kurir Tersedia" allOptions={ALL_COURIERS} selected={settings.supported_couriers} onChange={(v) => set('supported_couriers', v)} />
            </SectionCard>
          </>
        )}

        {/* ── TAB: OPERASIONAL ── */}
        {activeTab === 'operasional' && (
          <>
            <SectionCard title="Jadwal Toko" subtitle="Tentukan kapan toko Anda aktif melayani">
              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: C.textSecondary, marginBottom: '12px', textTransform: 'uppercase' }}>Hari Aktif</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {ALL_DAYS.map((day) => {
                    const active = settings.open_days.includes(day);
                    return (
                      <button key={day} onClick={() => {
                        const updated = active ? settings.open_days.filter((d) => d !== day) : [...settings.open_days, day];
                        set('open_days', updated);
                      }} style={{
                        padding: '10px 20px', borderRadius: '12px', cursor: 'pointer',
                        background: active ? '#ECFDF5' : '#fff',
                        border: `1px solid ${active ? C.primary : C.border}`,
                        color: active ? C.primary : C.textSecondary,
                        fontSize: '0.85rem', fontWeight: active ? 700 : 600, transition: 'all 0.2s',
                      }}>{day}</button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <div id="field-open_hour">
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: C.textSecondary, marginBottom: '8px', textTransform: 'uppercase' }}>Jam Buka</label>
                  <input type="time" value={settings.open_hour} onChange={(e) => set('open_hour', e.target.value)}
                    style={{
                      width: '100%', padding: '12px 16px', background: C.bgInput,
                      border: `1px solid ${C.border}`, borderRadius: '12px', color: C.textMain,
                      fontSize: '0.95rem', outline: 'none',
                    }} />
                  {fieldErrors.open_hour?.[0] && (
                    <div style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '6px', fontWeight: 600 }}>{fieldErrors.open_hour[0]}</div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: C.textSecondary, marginBottom: '8px', textTransform: 'uppercase' }}>Jam Tutup</label>
                  <input type="time" value={settings.close_hour} onChange={(e) => set('close_hour', e.target.value)}
                    style={{
                      width: '100%', padding: '12px 16px', background: C.bgInput,
                      border: `1px solid ${C.border}`, borderRadius: '12px', color: C.textMain,
                      fontSize: '0.95rem', outline: 'none',
                    }} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Respons Otomatis" subtitle="Pesan otomatis untuk pembeli di luar jam kerja">
              <TextareaField label="Draft Auto-Reply" value={settings.auto_reply_message} onChange={(v) => set('auto_reply_message', v)}
                placeholder="Pesan otomatis..."
                rows={4} maxLength={300} />
            </SectionCard>
          </>
        )}

        {/* ── TAB: SPESIALISASI ── */}
        {activeTab === 'spesialisasi' && (
          <>
            <SectionCard title="Katalog Kategori" subtitle="Fokus kategori produk toko Anda">
              <MultiChip label="Kategori Bisnis" allOptions={ALL_CATEGORIES}
                selected={settings.product_categories} onChange={(v) => set('product_categories', v)} />
            </SectionCard>

            <SectionCard title="Budidaya & Sertifikasi" subtitle="Metode produksi dan pengakuan resmi">
              <MultiChip label="Metode Tani" allOptions={ALL_METHODS}
                selected={settings.farming_methods} onChange={(v) => set('farming_methods', v)} />
              <div style={{ marginTop: '24px' }}>
                <MultiChip label="Sertifikasi Resmi" allOptions={ALL_CERTS}
                  selected={settings.certifications} onChange={(v) => set('certifications', v)} />
              </div>
            </SectionCard>
          </>
        )}

        {/* ── TAB: PEMBAYARAN ── */}
        {activeTab === 'pembayaran' && (
          <>
            <SectionCard title="Data Finansial" subtitle="Rekening tujuan untuk penarikan dana">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <SelectField label="Mitra Perbankan" value={settings.bank_name} onChange={(v) => set('bank_name', v)} options={ALL_BANKS} />
                <InputField
                  label="Nama Pemilik Rekening"
                  value={settings.bank_holder}
                  onChange={(v) => set('bank_holder', v)}
                  placeholder="Nama sesuai buku tabungan"
                  fieldKey="bank_holder"
                  error={fieldErrors.bank_holder?.[0]}
                />
                <div style={{ gridColumn: '1 / -1' }}>
                  <InputField
                    label="Nomor Rekening Tujuan"
                    value={settings.bank_account}
                    onChange={(v) => set('bank_account', v)}
                    placeholder="xxxx-xxxx-xxxx"
                    type="text"
                  />
                  {settings.bank_account.includes('*') && !bankAccountEditing && (
                    <button
                      onClick={() => { setBankAccountEditing(true); set('bank_account', ''); }}
                      style={{
                        marginTop: '4px', padding: '8px 16px', background: 'transparent',
                        border: `1px solid ${C.border}`, borderRadius: '10px',
                        color: C.textSecondary, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700
                      }}
                    >
                      Perbarui Rekening
                    </button>
                  )}
                </div>
              </div>

              {/* Bank Preview Card (Premium Style) */}
              <div style={{
                padding: '28px', background: `linear-gradient(135deg, #065F46 0%, ${C.primary} 100%)`,
                borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '20px',
                boxShadow: '0 12px 24px rgba(5,150,105,0.2)', color: '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7, letterSpacing: '0.15em', fontWeight: 800 }}>VIRTUAL WALLET</div>
                    <div style={{ fontWeight: 900, fontSize: '1.25rem', marginTop: '6px' }}>{settings.bank_name}</div>
                  </div>
                  <div style={{ fontSize: '1.5rem' }}>💳</div>
                </div>
                <div style={{ marginTop: '32px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.1em' }}>{settings.bank_account || '•••• •••• ••••'}</div>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7, letterSpacing: '0.1em', fontWeight: 700 }}>CARD HOLDER</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '2px' }}>{settings.bank_holder || '—'}</div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Opsi Transaksi" subtitle="Metode bayar yang Anda terima">
              <MultiChip label="Metode Pembayaran" allOptions={ALL_PAYMENTS}
                selected={settings.payment_methods} onChange={(v) => set('payment_methods', v)} />
            </SectionCard>
          </>
        )}

        {/* ── TAB: NOTIFIKASI ── */}
        {activeTab === 'notifikasi' && (
          <>
            <SectionCard title="Pemberitahuan Sistem" subtitle="Kontrol notifikasi untuk setiap aktivitas">
              <Toggle label="Notifikasi Transaksi" subtitle="Info saat ada pesanan masuk" checked={settings.notif_new_order} onChange={(v) => set('notif_new_order', v)} />
              <Toggle label="Notifikasi Obrolan" subtitle="Info saat ada pesan baru dari pembeli" checked={settings.notif_new_message} onChange={(v) => set('notif_new_message', v)} />
              <Toggle label="Notifikasi Ulasan" subtitle="Info saat pembeli memberi bintang" checked={settings.notif_review} onChange={(v) => set('notif_review', v)} />
            </SectionCard>

            <SectionCard title="Saluran Pengiriman" subtitle="Media pengiriman notifikasi">
              <Toggle label="Email Notifikasi" subtitle={settings.email} checked={settings.notif_email} onChange={(v) => set('notif_email', v)} />
              <Toggle label="WhatsApp Notifikasi" subtitle={settings.whatsapp} checked={settings.notif_whatsapp} onChange={(v) => set('notif_whatsapp', v)} />
            </SectionCard>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px', gap: '16px' }}>
          <button onClick={() => void handleReset()} style={{
            padding: '12px 28px', background: '#fff', border: `2px solid ${C.border}`,
            borderRadius: '14px', color: C.textSecondary, fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
          }}>Batalkan Perubahan</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '12px 40px', borderRadius: '14px',
            background: saving ? C.textSubtle : C.primary,
            border: 'none', color: '#fff',
            fontWeight: 800, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: saving ? 'none' : '0 8px 24px rgba(5,150,105,0.3)',
          }}>
            {saving ? 'Proses...' : 'Simpan Semua Pengaturan'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}