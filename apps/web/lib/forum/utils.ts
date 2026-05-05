// ============================================================
// lib/forum/utils.ts — Helper Functions untuk Forum
// ============================================================

import type { AuthorRole, ForumCategory, RoleStyle, CategoryStyle } from './types'

// ─── Format Waktu Relatif ──────────────────────────────────
export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'baru saja'
  if (diffMins < 60) return `${diffMins} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  if (diffDays < 7) return `${diffDays} hari lalu`

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Format Angka ─────────────────────────────────────────
export function formatCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}rb`
  return String(count)
}

// ─── Role Style Tokens ─────────────────────────────────────
export const roleStyles: Record<AuthorRole, RoleStyle> = {
  buyer: {
    gradient: 'linear-gradient(135deg, #1E3A8A, #3B82F6)',
    badgeBg: 'rgba(59,130,246,0.08)',
    badgeColor: '#1D4ED8',
    badgeBorder: 'rgba(59,130,246,0.2)',
    label: 'PEMBELI',
  },
  farmer: {
    gradient: 'linear-gradient(135deg, #064E3B, #10B981)',
    badgeBg: 'rgba(16,185,129,0.08)',
    badgeColor: '#059669',
    badgeBorder: 'rgba(16,185,129,0.2)',
    label: 'PETANI',
  },
  admin: {
    gradient: 'linear-gradient(135deg, #78350F, #F59E0B)',
    badgeBg: 'rgba(245,158,11,0.08)',
    badgeColor: '#B45309',
    badgeBorder: 'rgba(245,158,11,0.2)',
    label: 'ADMIN',
  },
}

// ─── Category Style Tokens ────────────────────────────────
export const categoryStyles: Record<ForumCategory, CategoryStyle> = {
  pertanyaan: {
    color: '#0891B2',
    bg: 'rgba(8,145,178,0.08)',
    border: 'rgba(8,145,178,0.2)',
    label: 'Pertanyaan',
  },
  negosiasi: {
    color: '#B45309',
    bg: 'rgba(180,83,9,0.08)',
    border: 'rgba(180,83,9,0.2)',
    label: 'Negosiasi',
  },
  keluhan: {
    color: '#DC2626',
    bg: 'rgba(220,38,38,0.08)',
    border: 'rgba(220,38,38,0.2)',
    label: 'Keluhan',
  },
  pengumuman: {
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.2)',
    label: 'Pengumuman',
  },
  diskusi_umum: {
    color: '#4F46E5',
    bg: 'rgba(79,70,229,0.08)',
    border: 'rgba(79,70,229,0.2)',
    label: 'Diskusi Umum',
  },
}

// ─── Truncate Text ────────────────────────────────────────
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// ─── Generate Avatar Color dari Nama ──────────────────────
export function getAvatarGradient(role: AuthorRole): string {
  return roleStyles[role].gradient
}

// ─── Parse Tags dari String ───────────────────────────────
export function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0)
    .slice(0, 5)
}

// ─── Validasi Thread Form ─────────────────────────────────
export function validateThreadForm(data: {
  title: string
  body: string
  category: string
}): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!data.title || data.title.trim().length < 10) {
    errors.title = 'Judul minimal 10 karakter'
  }
  if (!data.body || data.body.trim().length < 30) {
    errors.body = 'Isi diskusi minimal 30 karakter'
  }
  if (!data.category) {
    errors.category = 'Pilih kategori diskusi'
  }
  return errors
}

// ─── Validasi Reply Form ──────────────────────────────────
export function validateReplyForm(body: string): string | null {
  if (!body || body.trim().length < 5) {
    return 'Balasan minimal 5 karakter'
  }
  return null
}

// ─── Build Query String ───────────────────────────────────
export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '' && value !== 'all') {
      searchParams.set(key, String(value))
    }
  }
  return searchParams.toString()
}

// ─── Mock Data untuk Development ──────────────────────────
export const MOCK_THREADS = [
  {
    id: '1a2b3c4d-0001-0000-0000-000000000001',
    title: 'Bagaimana cara negosiasi harga tomat langsung dengan petani?',
    body: 'Saya seorang pembeli dari Jakarta ingin membeli tomat dalam jumlah besar (500kg/minggu) langsung dari petani. Bagaimana cara terbaik untuk melakukan negosiasi harga? Apakah ada fitur khusus di platform ini untuk itu?',
    category: 'pertanyaan' as ForumCategory,
    author_id: 'user-001',
    author_name: 'Budi Santoso',
    author_avatar: 'BS',
    author_role: 'buyer' as AuthorRole,
    is_pinned: false,
    is_locked: false,
    is_resolved: true,
    view_count: 342,
    reply_count: 7,
    last_reply_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    related_order_id: null,
    related_product_id: null,
    tags: ['tomat', 'negosiasi', 'harga', 'grosir'],
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    has_official_reply: false,
  },
  {
    id: '1a2b3c4d-0002-0000-0000-000000000002',
    title: '📢 Pengumuman: Fitur Realtime Chat dengan Petani Sudah Aktif!',
    body: 'Kami dengan bangga mengumumkan bahwa fitur chat realtime antara pembeli dan petani kini sudah tersedia. Anda dapat mengakses fitur ini melalui menu "Pesan" di navbar atas. Fitur ini memungkinkan negosiasi langsung, diskusi kualitas produk, dan konfirmasi pengiriman secara real-time.',
    category: 'pengumuman' as ForumCategory,
    author_id: 'admin-001',
    author_name: 'Tim Economic Survival',
    author_avatar: 'ES',
    author_role: 'admin' as AuthorRole,
    is_pinned: true,
    is_locked: false,
    is_resolved: false,
    view_count: 1205,
    reply_count: 23,
    last_reply_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    related_order_id: null,
    related_product_id: null,
    tags: ['pengumuman', 'fitur-baru', 'chat'],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    has_official_reply: true,
  },
  {
    id: '1a2b3c4d-0003-0000-0000-000000000003',
    title: 'Keluhan: Pesanan #ORD-2024-0891 sudah 5 hari belum dikirim',
    body: 'Saya memesan 200kg cabai merah pada tanggal 28 April lalu dengan nomor pesanan #ORD-2024-0891. Status pesanan masih "Dikonfirmasi" dan belum ada update pengiriman. Petani tidak merespons pesan. Mohon bantuan admin!',
    category: 'keluhan' as ForumCategory,
    author_id: 'user-002',
    author_name: 'Rina Wijayanti',
    author_avatar: 'RW',
    author_role: 'buyer' as AuthorRole,
    is_pinned: false,
    is_locked: false,
    is_resolved: false,
    view_count: 89,
    reply_count: 4,
    last_reply_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    related_order_id: 'ORD-2024-0891',
    related_product_id: null,
    tags: ['keluhan', 'pengiriman', 'cabai'],
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    has_official_reply: true,
  },
  {
    id: '1a2b3c4d-0004-0000-0000-000000000004',
    title: 'Berbagi pengalaman: Panen jagung manis saya meningkat 40% pakai metode ini',
    body: 'Halo sesama petani! Setelah bergabung dengan platform ini selama 6 bulan, penjualan jagung manis saya meningkat 40%. Ingin berbagi tips: (1) Foto produk yang bagus sangat penting, (2) Respon cepat ke buyer, (3) Jaga konsistensi kualitas. Detail lebih lanjut ada di komentar.',
    category: 'diskusi_umum' as ForumCategory,
    author_id: 'farmer-001',
    author_name: 'Pak Sarwono',
    author_avatar: 'PS',
    author_role: 'farmer' as AuthorRole,
    is_pinned: false,
    is_locked: false,
    is_resolved: false,
    view_count: 567,
    reply_count: 18,
    last_reply_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    related_order_id: null,
    related_product_id: null,
    tags: ['pengalaman', 'jagung', 'tips', 'petani'],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    has_official_reply: false,
  },
  {
    id: '1a2b3c4d-0005-0000-0000-000000000005',
    title: 'Negosiasi bulk order bawang merah 1 ton per bulan',
    body: 'Kami dari PT. Restoran Nusantara (jaringan 50 restoran) mencari supplier bawang merah 1 ton/bulan dengan harga kompetitif. Budget kami Rp 25.000-30.000/kg. Apakah ada petani yang bisa memenuhi kebutuhan ini? Kontrak minimal 6 bulan.',
    category: 'negosiasi' as ForumCategory,
    author_id: 'user-003',
    author_name: 'David Kurniawan',
    author_avatar: 'DK',
    author_role: 'buyer' as AuthorRole,
    is_pinned: false,
    is_locked: false,
    is_resolved: false,
    view_count: 234,
    reply_count: 11,
    last_reply_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    related_order_id: null,
    related_product_id: null,
    tags: ['bawang-merah', 'bulk', 'kontrak', 'restoran'],
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    has_official_reply: false,
  },
  {
    id: '1a2b3c4d-0006-0000-0000-000000000006',
    title: 'Cara upload produk dan setting harga yang benar?',
    body: 'Saya baru bergabung sebagai petani di platform ini. Sudah berhasil daftar tapi bingung cara upload produk pertama kali. Ada yang bisa bantu jelaskan step by step? Saya ingin jual kangkung segar dari kebun saya di Bogor.',
    category: 'pertanyaan' as ForumCategory,
    author_id: 'farmer-002',
    author_name: 'Ibu Sumarni',
    author_avatar: 'IS',
    author_role: 'farmer' as AuthorRole,
    is_pinned: false,
    is_locked: false,
    is_resolved: false,
    view_count: 156,
    reply_count: 6,
    last_reply_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    related_order_id: null,
    related_product_id: null,
    tags: ['panduan', 'upload-produk', 'petani-baru'],
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    has_official_reply: false,
  },
  {
    id: '1a2b3c4d-0007-0000-0000-000000000007',
    title: '[TERKUNCI] Larangan spam dan promosi berlebihan di forum',
    body: 'Kami telah menutup beberapa thread yang melanggar aturan forum: (1) Dilarang spam iklan produk berulang, (2) Dilarang share link affiliasi, (3) Dilarang kampanye politik. Thread ini dikunci sebagai pengingat.',
    category: 'pengumuman' as ForumCategory,
    author_id: 'admin-001',
    author_name: 'Tim Economic Survival',
    author_avatar: 'ES',
    author_role: 'admin' as AuthorRole,
    is_pinned: true,
    is_locked: true,
    is_resolved: false,
    view_count: 892,
    reply_count: 0,
    last_reply_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    related_order_id: null,
    related_product_id: null,
    tags: ['aturan', 'forum', 'moderasi'],
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    has_official_reply: false,
  },
  {
    id: '1a2b3c4d-0008-0000-0000-000000000008',
    title: 'Standar kualitas sayuran untuk restoran bintang 5',
    body: 'Sebagai purchasing manager hotel berbintang, ingin berbagi standar kualitas yang kami butuhkan: diameter wortel minimal 2cm, tidak ada cacat visual, dikemas vacuum-sealed. Apakah ada petani yang bisa memenuhi standar ini dengan harga wajar?',
    category: 'diskusi_umum' as ForumCategory,
    author_id: 'user-004',
    author_name: 'Anita Herlambang',
    author_avatar: 'AH',
    author_role: 'buyer' as AuthorRole,
    is_pinned: false,
    is_locked: false,
    is_resolved: false,
    view_count: 445,
    reply_count: 14,
    last_reply_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    related_order_id: null,
    related_product_id: null,
    tags: ['kualitas', 'hotel', 'standar', 'wortel'],
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    has_official_reply: false,
  },
]

export const MOCK_REPLIES = [
  {
    id: 'reply-001',
    thread_id: '1a2b3c4d-0001-0000-0000-000000000001',
    parent_reply_id: null,
    body: 'Halo Pak Budi! Cara terbaik adalah menggunakan fitur "Buat Penawaran" yang ada di halaman profil petani. Anda bisa input jumlah, target harga, dan jadwal pengiriman. Petani akan menerima notifikasi dan bisa langsung merespons.',
    author_id: 'admin-001',
    author_name: 'Tim Economic Survival',
    author_avatar: 'ES',
    author_role: 'admin' as AuthorRole,
    is_solution: false,
    is_official: true,
    like_count: 12,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    liked_by_user: false,
  },
  {
    id: 'reply-002',
    thread_id: '1a2b3c4d-0001-0000-0000-000000000001',
    parent_reply_id: null,
    body: 'Saya petani tomat dari Malang, Pak. Untuk order 500kg/minggu, biasanya kami bisa kasih harga Rp 8.500/kg untuk kontrak 3 bulan. Bisa WA langsung ke saya di profil untuk diskusi lebih lanjut.',
    author_id: 'farmer-003',
    author_name: 'Pak Hendra',
    author_avatar: 'PH',
    author_role: 'farmer' as AuthorRole,
    is_solution: true,
    is_official: false,
    like_count: 8,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    liked_by_user: true,
  },
  {
    id: 'reply-003',
    thread_id: '1a2b3c4d-0001-0000-0000-000000000001',
    parent_reply_id: 'reply-002',
    body: 'Terima kasih Pak Hendra! Saya sudah hubungi via profil. Harga dan kualitasnya sangat sesuai dengan kebutuhan kami. Sangat merekomendasikan!',
    author_id: 'user-001',
    author_name: 'Budi Santoso',
    author_avatar: 'BS',
    author_role: 'buyer' as AuthorRole,
    is_solution: false,
    is_official: false,
    like_count: 3,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    liked_by_user: false,
  },
]
