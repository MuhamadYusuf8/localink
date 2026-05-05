'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// ─── Design Tokens (Premium Light Theme) ──────────────────
const C = {
  bgApp: '#F8FAFC',       // Slate 50
  bgCard: '#FFFFFF',      // Putih Bersih
  border: '#E2E8F0',      // Slate 200
  textMain: '#0F172A',    // Slate 900
  textSecondary: '#334155',// Slate 700
  primary: '#059669',     // Emerald 600
  primaryGlow: 'rgba(5, 150, 105, 0.08)',
  primaryBorder: 'rgba(5, 150, 105, 0.25)',
  shadowCard: '0 10px 40px rgba(0, 0, 0, 0.05)',
  shadowButton: '0 4px 12px rgba(5, 150, 105, 0.2)',
};

export default function BuyerCheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order') ?? '';

  return (
    <div style={{ minHeight: '100vh', background: C.bgApp, color: C.textMain, display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
      
      {/* Subtle Premium Confetti Animation */}
      {Array.from({ length: 24 }).map((_, i) => (
        <span key={i} style={{ position: 'absolute', top: `${(i * 17) % 100}%`, left: `${(i * 31) % 100}%`, fontSize: '14px', opacity: 0.6, animation: `confetti 3s ease-in-out ${i * 0.15}s infinite` }}>✨</span>
      ))}
      
      <div style={{ width: 'min(92vw,600px)', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '48px 32px', textAlign: 'center', zIndex: 10, boxShadow: C.shadowCard, animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        
        {/* Success Icon */}
        <div style={{ width: '96px', height: '96px', margin: '0 auto 24px', borderRadius: '50%', background: C.primaryGlow, border: `4px solid ${C.primaryBorder}`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem', animation: 'pop 1.5s ease-in-out infinite', boxShadow: 'inset 0 2px 10px rgba(5,150,105,0.1)' }}>
          ✅
        </div>
        
        <h1 style={{ margin: '0 0 12px', fontSize: '2rem', fontWeight: 800, color: C.textMain, letterSpacing: '-0.02em' }}>
          Pesanan Berhasil! 
        </h1>
        
        <div style={{ color: C.textSecondary, marginBottom: '20px', fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.6 }}>
          Terima kasih, pembayaran Anda telah berhasil diverifikasi. Pesanan Anda saat ini sedang diproses oleh petani.
        </div>
        
        {/* Order ID Badge */}
        <div style={{ display: 'inline-block', background: C.bgApp, border: `1px dashed ${C.border}`, padding: '12px 24px', borderRadius: '12px', color: C.primary, fontWeight: 800, fontSize: '1.1rem', marginBottom: '40px', letterSpacing: '0.05em' }}>
          ID Order: {orderId || 'ORD-XXXX'}
        </div>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={`/buyer/orders/${orderId}`} style={{ textDecoration: 'none', padding: '14px 28px', borderRadius: '12px', border: 'none', background: C.primary, color: '#FFFFFF', fontWeight: 700, fontSize: '1rem', boxShadow: C.shadowButton, transition: 'transform 0.2s', display: 'inline-block' }}>
            Lihat Detail Pesanan
          </Link>
          <Link href="/products" style={{ textDecoration: 'none', padding: '14px 28px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.bgCard, color: C.textSecondary, fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s', display: 'inline-block', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            Lanjut Belanja
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes pop {
          0%, 100% { transform: scale(1) }
          50% { transform: scale(1.05) }
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg) }
          50% { transform: translateY(15px) rotate(10deg) }
          100% { transform: translateY(0) rotate(0deg) }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) }
          to { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </div>
  );
}