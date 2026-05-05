// ============================================================
// app/api/forum/threads/route.ts
// GET /api/forum/threads — daftar thread dengan filter
// POST /api/forum/threads — buat thread baru
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getLaravelUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    console.log('[Forum Auth] No authorization header found')
    return null
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: { 
        'Authorization': authHeader,
        'Accept': 'application/json'
      },
    })
    if (!res.ok) {
      console.log('[Forum Auth] Laravel API rejected token. Status:', res.status)
      return null
    }
    const json = await res.json()
    return json.data // User object dari Laravel
  } catch (e) {
    console.error('[Forum Auth] Fetch exception:', e)
    return null
  }
}

// ─── GET /api/forum/threads ───────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const role = searchParams.get('role')
    const sort = searchParams.get('sort') || 'newest'
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '12'))
    const pinnedOnly = searchParams.get('pinned_only') === 'true'
    const unresolvedOnly = searchParams.get('unresolved_only') === 'true'

    const supabase = getSupabaseAdmin()
    let query = supabase.from('forum_threads').select('*', { count: 'exact' })

    // ─── Filter ──────────────────────────────────────────
    if (category && category !== 'all') query = query.eq('category', category)
    if (role && role !== 'all') query = query.eq('author_role', role)
    if (pinnedOnly) query = query.eq('is_pinned', true)
    if (unresolvedOnly) query = query.eq('is_resolved', false)
    if (search) {
      query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`)
    }

    // ─── Sort ─────────────────────────────────────────────
    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'most_replies':
        query = query.order('reply_count', { ascending: false })
        break
      case 'most_views':
        query = query.order('view_count', { ascending: false })
        break
      case 'unanswered':
        query = query.eq('reply_count', 0).order('created_at', { ascending: false })
        break
      default: // newest
        query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false })
    }

    // ─── Pagination ───────────────────────────────────────
    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)

    const { data: threads, error, count } = await query

    if (error) {
      return NextResponse.json({ error: 'Gagal memuat thread: ' + error.message }, { status: 500 })
    }

    // ─── Stats ────────────────────────────────────────────
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalRes, activeTodayRes, waitingRes, resolvedRes] = await Promise.all([
      supabase.from('forum_threads').select('id', { count: 'exact', head: true }),
      supabase.from('forum_threads').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('forum_threads').select('id', { count: 'exact', head: true }).eq('is_resolved', false).eq('reply_count', 0),
      supabase.from('forum_threads').select('id', { count: 'exact', head: true }).eq('is_resolved', true),
    ])

    const stats = {
      total_threads: totalRes.count || 0,
      active_today: activeTodayRes.count || 0,
      waiting_answer: waitingRes.count || 0,
      resolved: resolvedRes.count || 0,
    }

    const total = count || 0
    return NextResponse.json({
      data: threads || [],
      total,
      page,
      limit,
      has_more: from + limit < total,
      stats,
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server: ' + (err instanceof Error ? err.message : 'Unknown') },
      { status: 500 }
    )
  }
}

// ─── POST /api/forum/threads ──────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await getLaravelUser(req)

    if (!user) {
      return NextResponse.json({ error: 'Anda harus login untuk membuat diskusi' }, { status: 401 })
    }

    const body = await req.json()
    const { title, body: threadBody, category, tags = [], related_order_id, related_product_id } = body

    // ─── Validasi ────────────────────────────────────────
    if (!title || title.trim().length < 10) {
      return NextResponse.json({ error: 'Judul minimal 10 karakter' }, { status: 400 })
    }
    if (!threadBody || threadBody.trim().length < 30) {
      return NextResponse.json({ error: 'Isi diskusi minimal 30 karakter' }, { status: 400 })
    }
    const validCategories = ['pertanyaan', 'negosiasi', 'keluhan', 'pengumuman', 'diskusi_umum']
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json({ error: 'Kategori tidak valid' }, { status: 400 })
    }

    const authorName = user.name || 'Pengguna'
    const authorRole = user.role || 'buyer'
    const initials = authorName
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase() || '')
      .join('')

    const supabaseAdmin = getSupabaseAdmin()
    const { data: thread, error } = await supabaseAdmin
      .from('forum_threads')
      .insert({
        title: title.trim(),
        body: threadBody.trim(),
        category,
        author_id: user.id,
        author_name: authorName,
        author_avatar: initials || 'U',
        author_role: authorRole,
        tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
        related_order_id: related_order_id || null,
        related_product_id: related_product_id || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Gagal membuat diskusi: ' + error.message }, { status: 500 })
    }

    return NextResponse.json(thread, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server: ' + (err instanceof Error ? err.message : 'Unknown') },
      { status: 500 }
    )
  }
}
