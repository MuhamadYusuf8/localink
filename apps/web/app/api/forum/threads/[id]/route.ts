// ============================================================
// app/api/forum/threads/[id]/route.ts
// GET — detail thread + replies
// PATCH — update thread
// DELETE — hapus thread
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Helper untuk mengambil data user dari backend Laravel
async function getLaravelUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: { Authorization: authHeader },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data
  } catch (e) {
    return null
  }
}

// ─── GET /api/forum/threads/[id] ──────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin()
    const { id } = params

    // Increment view count
    await supabase.rpc('increment_view_count', { thread_uuid: id })

    // Fetch thread
    const { data: thread, error: threadError } = await supabase
      .from('forum_threads')
      .select('*')
      .eq('id', id)
      .single()

    if (threadError || !thread) {
      return NextResponse.json({ error: 'Thread tidak ditemukan' }, { status: 404 })
    }

    // Fetch replies (flat list, sorted by created_at)
    const { data: replies, error: repliesError } = await supabase
      .from('forum_replies')
      .select('*')
      .eq('thread_id', id)
      .order('created_at', { ascending: true })

    if (repliesError) {
      return NextResponse.json(
        { error: 'Gagal memuat balasan: ' + repliesError.message },
        { status: 500 }
      )
    }

    // Cek apakah ada official reply
    const hasOfficialReply = (replies || []).some((r) => r.is_official)
    const solutionReply = (replies || []).find((r) => r.is_solution) || null

    return NextResponse.json({
      thread: { ...thread, has_official_reply: hasOfficialReply },
      replies: replies || [],
      solution_reply: solutionReply,
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + (err instanceof Error ? err.message : 'Unknown') },
      { status: 500 }
    )
  }
}

// ─── PATCH /api/forum/threads/[id] ────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getLaravelUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Anda harus login' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const { id } = params

    const { data: thread } = await supabase
      .from('forum_threads')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!thread) {
      return NextResponse.json({ error: 'Thread tidak ditemukan' }, { status: 404 })
    }

    const isAuthor = thread.author_id === user.id
    const isAdmin = user.role === 'admin'

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk mengedit thread ini' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const allowed = ['title', 'body', 'category', 'tags', 'is_pinned', 'is_locked', 'is_resolved']
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    for (const key of allowed) {
      if (body[key] !== undefined) {
        // Non-admin tidak bisa pin/lock
        if ((key === 'is_pinned' || key === 'is_locked') && !isAdmin) continue
        updates[key] = body[key]
      }
    }

    const { data: updated, error } = await supabase
      .from('forum_threads')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Gagal mengupdate thread: ' + error.message }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + (err instanceof Error ? err.message : 'Unknown') },
      { status: 500 }
    )
  }
}

// ─── DELETE /api/forum/threads/[id] ───────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getLaravelUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Anda harus login' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const { id } = params

    const { data: thread } = await supabase
      .from('forum_threads')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!thread) {
      return NextResponse.json({ error: 'Thread tidak ditemukan' }, { status: 404 })
    }

    const isAuthor = thread.author_id === user.id
    const isAdmin = user.role === 'admin'

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk menghapus thread ini' },
        { status: 403 }
      )
    }

    const { error } = await supabase.from('forum_threads').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Gagal menghapus thread: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Thread berhasil dihapus' })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + (err instanceof Error ? err.message : 'Unknown') },
      { status: 500 }
    )
  }
}
