// ============================================================
// app/api/forum/notifications/route.ts
// GET — ambil notifikasi user yang login
// PATCH — tandai sudah dibaca
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getSupabaseUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader || '' } } }
  )
}

// ─── GET /api/forum/notifications ─────────────────────────
export async function GET(req: NextRequest) {
  try {
    const supabaseUser = getSupabaseUser(req)
    
    // Gunakan race condition agar tidak menunggu Supabase terlalu lama (max 1.5 detik)
    const authPromise = supabaseUser.auth.getUser()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 1500)
    )

    let user = null
    try {
      const { data: { user: authUser } } = await Promise.race([authPromise, timeoutPromise]) as any
      user = authUser
    } catch (e) {
      console.warn('Supabase auth timeout or error, skipping notifications.')
    }

    if (!user) {
      return NextResponse.json({ notifications: [], unread_count: 0 })
    }

    const supabase = getSupabaseAdmin()

    const { data: notifications, error } = await supabase
      .from('forum_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json(
        { error: 'Gagal memuat notifikasi: ' + error.message },
        { status: 500 }
      )
    }

    const unreadCount = (notifications || []).filter((n) => !n.is_read).length

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: unreadCount,
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + (err instanceof Error ? err.message : 'Unknown') },
      { status: 500 }
    )
  }
}

// ─── PATCH /api/forum/notifications ───────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const supabaseUser = getSupabaseUser(req)
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Anda harus login' }, { status: 401 })
    }

    const body = await req.json()
    const { ids, all } = body

    const supabase = getSupabaseAdmin()
    let query = supabase
      .from('forum_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)

    if (all) {
      // Mark all as read — no extra filter needed
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      query = query.in('id', ids)
    } else {
      return NextResponse.json({ error: 'Sertakan ids atau all: true' }, { status: 400 })
    }

    const { error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Gagal update notifikasi: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Notifikasi berhasil ditandai sudah dibaca' })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + (err instanceof Error ? err.message : 'Unknown') },
      { status: 500 }
    )
  }
}
