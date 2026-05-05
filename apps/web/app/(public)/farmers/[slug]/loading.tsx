export default function FarmerProfileLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0B0D', color: '#F0F2F5', fontFamily: 'Inter, sans-serif', padding: '24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ height: '220px', borderRadius: '12px', background: '#111316', border: '1px solid #1E2128', marginBottom: '24px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '12px', marginBottom: '16px' }}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} style={{ height: '88px', borderRadius: '12px', background: '#111316', border: '1px solid #1E2128' }} />
          ))}
        </div>
        <div style={{ height: '52px', borderRadius: '12px', background: '#111316', border: '1px solid #1E2128', marginBottom: '16px' }} />
        <div style={{ height: '420px', borderRadius: '12px', background: '#111316', border: '1px solid #1E2128' }} />
      </div>
    </div>
  );
}
