'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, Plus, Pin, Lock, CheckCircle, MessageSquare, Eye, ChevronDown, X, AlertCircle } from 'lucide-react'
import { useForumThreads } from '@/lib/forum/hooks'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatRelativeTime, roleStyles, categoryStyles, parseTags, validateThreadForm } from '@/lib/forum/utils'
import type { ForumThread, ForumCategory, AuthorRole, ThreadSortOption } from '@/lib/forum/types'

// ─── Design Tokens (Premium Light Theme) ──────────────────
const C = {
  bg: '#F8FAFC',          // Slate 50 (Background Aplikasi)
  card: '#FFFFFF',        // Putih Bersih
  input: '#F1F5F9',       // Slate 100
  border: '#E2E8F0',      // Slate 200
  borderActive: '#059669',// Emerald 600 (Hijau Premium)
  accent: '#059669',      // Emerald 600
  accentGlow: 'rgba(5, 150, 105, 0.08)',
  accentBorder: 'rgba(5, 150, 105, 0.25)',
  textPrimary: '#0F172A', // Slate 900
  textSecondary: '#334155',// Slate 700
  textMuted: '#64748B',   // Slate 500
  textPlaceholder: '#94A3B8', // Slate 400
}

// ─── Skeleton ─────────────────────────────────────────────
function ThreadSkeleton() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }}>
      {[80, 60, 40].map((w, i) => (
        <div key={i} style={{ height: i === 0 ? '18px' : '12px', width: `${w}%`, background: '#F1F5F9', borderRadius: '6px', marginBottom: '10px', animation: 'pulse 1.5s ease infinite' }} />
      ))}
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────
function Avatar({ initials, role, size = 40 }: { initials: string; role: AuthorRole; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '12px', flexShrink: 0,
      background: roleStyles[role].gradient,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35 + 'px', fontWeight: 700, color: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>{initials}</div>
  )
}

// ─── RoleBadge ────────────────────────────────────────────
function RoleBadge({ role }: { role: AuthorRole }) {
  const s = roleStyles[role]
  return (
    <span style={{ background: s.badgeBg, color: s.badgeColor, border: `1px solid ${s.badgeBorder}`, borderRadius: '9999px', padding: '2px 10px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.02em' }}>
      {s.label}
    </span>
  )
}

// ─── CategoryBadge ────────────────────────────────────────
function CategoryBadge({ category }: { category: ForumCategory }) {
  const s = categoryStyles[category]
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: '9999px', padding: '2px 10px', fontSize: '0.65rem', fontWeight: 700 }}>
      {s.label}
    </span>
  )
}

// ─── Thread Card ──────────────────────────────────────────
function ThreadCard({ thread }: { thread: ForumThread }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={`/forum/${thread.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: C.card,
          border: `1px solid ${thread.is_pinned ? C.accentBorder : hovered ? C.borderActive : C.border}`,
          borderRadius: '16px', overflow: 'hidden', marginBottom: '16px',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hovered ? `0 12px 30px rgba(5,150,105,0.08), 0 0 0 1px ${C.accentBorder}` : '0 2px 10px rgba(0,0,0,0.02)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
        }}
      >
        {thread.is_pinned && (
          <div style={{ height: '3px', background: `linear-gradient(90deg, ${C.accent}, transparent)` }} />
        )}
        <div style={{ padding: '20px 24px' }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <Avatar initials={thread.author_avatar} role={thread.author_role} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <RoleBadge role={thread.author_role} />
                <CategoryBadge category={thread.category} />
                {thread.is_pinned && <span style={{ color: C.accent, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}><Pin size={12} /> Disematkan</span>}
                {thread.is_locked && <span style={{ color: '#EF4444', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}><Lock size={12} /> Terkunci</span>}
                {thread.is_resolved && <span style={{ color: C.accent, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}><CheckCircle size={12} /> Selesai</span>}
                {thread.has_official_reply && (
                  <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: '9999px', padding: '2px 10px', fontSize: '0.65rem', fontWeight: 700 }}>
                    ✓ Balasan Resmi
                  </span>
                )}
              </div>
              <h3 style={{ color: C.textPrimary, fontSize: '1.05rem', fontWeight: 700, margin: '0 0 6px', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                {thread.title}
              </h3>
              <p style={{ color: C.textSecondary, fontSize: '0.85rem', margin: 0, lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {thread.body}
              </p>
            </div>
          </div>

          {/* Tags */}
          {thread.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px', marginLeft: '56px' }}>
              {thread.tags.map((tag) => (
                <span key={tag} style={{ background: C.input, color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: '9999px', padding: '2px 10px', fontSize: '0.7rem', fontWeight: 500 }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', marginLeft: '56px' }}>
            <span style={{ color: C.textSecondary, fontSize: '0.75rem', fontWeight: 600 }}>{thread.author_name}</span>
            <span style={{ color: C.textPlaceholder, fontSize: '0.75rem' }}>{formatRelativeTime(thread.created_at)}</span>
            <span style={{ color: C.textMuted, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto', fontWeight: 500 }}>
              <Eye size={14} />{thread.view_count}
            </span>
            <span style={{ color: C.textMuted, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
              <MessageSquare size={14} />{thread.reply_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Create Thread Modal ──────────────────────────────────
function CreateThreadModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: { title: string; body: string; category: string; tags: string; related_order_id: string }) => Promise<void> }) {
  const [form, setForm] = useState({ title: '', body: '', category: '', tags: '', related_order_id: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateThreadForm(form)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    try {
      await onCreate(form)
      onClose()
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : 'Gagal membuat diskusi' })
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: C.input, border: `1px solid ${C.border}`, borderRadius: '10px',
    color: C.textPrimary, fontSize: '0.9rem', padding: '12px 16px', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border 0.2s'
  }

  const labelStyle: React.CSSProperties = { color: C.textSecondary, fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px', display: 'block' }

  const CATEGORIES = [
    { value: 'pertanyaan', label: 'Pertanyaan' },
    { value: 'negosiasi', label: 'Negosiasi' },
    { value: 'keluhan', label: 'Keluhan' },
    { value: 'pengumuman', label: 'Pengumuman' },
    { value: 'diskusi_umum', label: 'Diskusi Umum' },
  ]

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'rgba(15, 23, 42, 0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', width: '92%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}>
        <style>{`@keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } } @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }`}</style>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 16px', borderBottom: `1px solid ${C.border}` }}>
          <h2 style={{ color: C.textPrimary, fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Buat Diskusi Baru</h2>
          <button onClick={onClose} style={{ background: C.input, border: 'none', color: C.textMuted, cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Judul Diskusi *</label>
            <input style={{ ...inputStyle, borderColor: errors.title ? '#EF4444' : C.border }} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Minimal 10 karakter..." />
            {errors.title && <p style={{ color: '#EF4444', fontSize: '0.75rem', margin: '6px 0 0', fontWeight: 500 }}>{errors.title}</p>}
          </div>
          <div>
            <label style={labelStyle}>Kategori *</label>
            <select style={{ ...inputStyle, borderColor: errors.category ? '#EF4444' : C.border }} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Pilih kategori...</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {errors.category && <p style={{ color: '#EF4444', fontSize: '0.75rem', margin: '6px 0 0', fontWeight: 500 }}>{errors.category}</p>}
          </div>
          <div>
            <label style={labelStyle}>Isi Diskusi * ({form.body.length} karakter)</label>
            <textarea
              style={{ ...inputStyle, borderColor: errors.body ? '#EF4444' : C.border, minHeight: '140px', resize: 'vertical' }}
              value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Jelaskan topik diskusi Anda secara detail, minimal 30 karakter..."
            />
            {errors.body && <p style={{ color: '#EF4444', fontSize: '0.75rem', margin: '6px 0 0', fontWeight: 500 }}>{errors.body}</p>}
          </div>
          <div>
            <label style={labelStyle}>Tags (pisahkan dengan koma, maks 5)</label>
            <input style={inputStyle} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="contoh: tomat, harga, grosir" />
          </div>
          <div>
            <label style={labelStyle}>Nomor Order Terkait (opsional)</label>
            <input style={inputStyle} value={form.related_order_id} onChange={(e) => setForm({ ...form, related_order_id: e.target.value })} placeholder="contoh: ORD-2024-0891" />
          </div>
          {errors.submit && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontSize: '0.85rem', fontWeight: 500 }}>
              <AlertCircle size={18} />{errors.submit}
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '12px 24px', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.card, color: C.textSecondary, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>Batal</button>
            <button type="submit" disabled={loading} style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', background: loading ? C.border : C.accent, color: '#FFFFFF', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)' }}>
              {loading ? 'Mengirim...' : 'Buat Diskusi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Stats Bar ────────────────────────────────────────────
function StatsBar({ stats }: { stats: { total_threads: number; active_today: number; waiting_answer: number; resolved: number } }) {
  const items = [
    { label: 'Total Thread', value: stats.total_threads, color: C.accent },
    { label: 'Aktif Hari Ini', value: stats.active_today, color: '#2563EB' },
    { label: 'Menunggu Jawaban', value: stats.waiting_answer, color: '#D97706' },
    { label: 'Terselesaikan', value: stats.resolved, color: '#059669' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
      {items.map((item) => (
        <div key={item.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }}>
          <p style={{ color: item.color, fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px' }}>{item.value}</p>
          <p style={{ color: C.textSecondary, fontSize: '0.8rem', fontWeight: 500, margin: 0 }}>{item.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────
export default function ForumPage() {
  const { isAuthenticated, user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [category, setCategory] = useState<string>('all')
  const [sort, setSort] = useState<ThreadSortOption>('newest')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { threads, stats, isLoading, error, hasMore, createThread } = useForumThreads({
    category: category as ForumCategory | 'all',
    sort,
    search,
    page,
    limit: 12,
  })

  const handleCreate = useCallback(async (data: { title: string; body: string; category: string; tags: string; related_order_id: string }) => {
    await createThread({
      title: data.title,
      body: data.body,
      category: data.category as ForumCategory,
      tags: parseTags(data.tags),
      related_order_id: data.related_order_id || undefined,
    })
  }, [createThread])

  const CATEGORIES = [
    { value: 'all', label: 'Semua' },
    { value: 'pertanyaan', label: 'Pertanyaan' },
    { value: 'negosiasi', label: 'Negosiasi' },
    { value: 'keluhan', label: 'Keluhan' },
    { value: 'pengumuman', label: 'Pengumuman' },
    { value: 'diskusi_umum', label: 'Diskusi Umum' },
  ]

  const SORTS: { value: ThreadSortOption; label: string }[] = [
    { value: 'newest', label: 'Terbaru' },
    { value: 'oldest', label: 'Terlama' },
    { value: 'most_replies', label: 'Paling Banyak Balasan' },
    { value: 'most_views', label: 'Paling Banyak Dilihat' },
    { value: 'unanswered', label: 'Belum Terjawab' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-inter, Inter, sans-serif)', color: C.textPrimary }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px', color: C.textPrimary, letterSpacing: '-0.02em' }}>
              Forum Diskusi
            </h1>
            <p style={{ color: C.textMuted, fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>Diskusi, tanya jawab, dan berbagi pengalaman seputar pertanian</p>
          </div>
          {isAuthenticated && (
            <button
              id="btn-buat-diskusi"
              onClick={() => setShowModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', border: 'none', background: C.accent, color: '#FFFFFF', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)' }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Plus size={18} /> Buat Diskusi Baru
            </button>
          )}
        </div>

        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Search & Filter */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={18} color={C.textPlaceholder} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              id="forum-search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Cari diskusi yang ingin Anda temukan..."
              style={{ width: '100%', background: C.input, border: `1px solid ${C.border}`, borderRadius: '12px', color: C.textPrimary, fontSize: '0.95rem', padding: '12px 16px 12px 46px', outline: 'none', boxSizing: 'border-box', transition: 'border 0.2s' }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            {/* Category Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => { setCategory(cat.value); setPage(1) }}
                  style={{ padding: '8px 16px', borderRadius: '9999px', border: `1px solid ${category === cat.value ? C.accentBorder : C.border}`, background: category === cat.value ? C.accentGlow : C.card, color: category === cat.value ? C.accent : C.textSecondary, fontSize: '0.85rem', fontWeight: category === cat.value ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ChevronDown size={16} color={C.textMuted} />
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value as ThreadSortOption); setPage(1) }}
                style={{ background: C.input, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.textPrimary, fontSize: '0.85rem', fontWeight: 600, padding: '8px 16px', outline: 'none', cursor: 'pointer' }}
              >
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '16px 20px', color: '#EF4444', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 500 }}>
            <AlertCircle size={20} />{error}
          </div>
        )}

        {/* Thread List */}
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <ThreadSkeleton key={i} />)
        ) : threads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }}>
            <MessageSquare size={56} color={C.border} style={{ margin: '0 auto 20px', display: 'block' }} />
            <h3 style={{ color: C.textPrimary, margin: '0 0 10px', fontSize: '1.25rem', fontWeight: 700 }}>Belum ada diskusi</h3>
            <p style={{ color: C.textMuted, fontSize: '0.95rem', margin: '0 0 24px' }}>
              {search ? `Tidak ada hasil pencarian untuk "${search}"` : 'Jadilah yang pertama memulai langkah dan buat diskusi baru!'}
            </p>
            {isAuthenticated && (
              <button onClick={() => setShowModal(true)} style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', background: C.accent, color: '#FFFFFF', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)' }}>
                Buat Diskusi
              </button>
            )}
          </div>
        ) : (
          <>
            {threads.map((thread) => <ThreadCard key={thread.id} thread={thread} />)}
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '28px' }}>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  style={{ padding: '12px 36px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.card, color: C.textPrimary, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.accentBorder)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
                >
                  Muat lebih banyak diskusi
                </button>
              </div>
            )}
          </>
        )}

        {/* CTA Login */}
        {!isAuthenticated && (
          <div style={{ background: C.card, border: `1px solid ${C.accentBorder}`, borderRadius: '16px', padding: '32px 20px', textAlign: 'center', marginTop: '32px', boxShadow: '0 4px 20px rgba(5, 150, 105, 0.05)' }}>
            <h3 style={{ color: C.textPrimary, fontSize: '1.15rem', fontWeight: 700, margin: '0 0 8px' }}>Ingin Bergabung dalam Diskusi?</h3>
            <p style={{ color: C.textSecondary, margin: '0 0 20px', fontSize: '0.95rem' }}>Login sekarang untuk membagikan pendapat Anda dan berinteraksi dengan komunitas.</p>
            <Link href="/login" style={{ display: 'inline-block', padding: '12px 32px', borderRadius: '12px', background: C.accent, color: '#FFFFFF', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)' }}>
              Login ke Akun Anda
            </Link>
          </div>
        )}
      </div>

      {showModal && <CreateThreadModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
    </div>
  )
}