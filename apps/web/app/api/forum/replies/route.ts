// ============================================================
// app/api/forum/replies/route.ts
// POST /api/forum/replies — buat reply baru
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

export async function POST(req: NextRequest) {
  try {
    const user = await getLaravelUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Anda harus login untuk membalas' }, { status: 401 })
    }

    const body = await req.json()
    const { thread_id, body: replyBody, parent_reply_id } = body

    if (!thread_id) {
      return NextResponse.json({ error: 'thread_id wajib diisi' }, { status: 400 })
    }
    if (!replyBody || replyBody.trim().length < 5) {
      return NextResponse.json({ error: 'Balasan minimal 5 karakter' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Pastikan thread ada dan tidak terkunci
    const { data: thread } = await supabase
      .from('forum_threads')
      .select('id, is_locked, author_id, author_name, author_avatar')
      .eq('id', thread_id)
      .single()

    if (!thread) {
      return NextResponse.json({ error: 'Thread tidak ditemukan' }, { status: 404 })
    }

    if (thread.is_locked && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Thread ini sudah terkunci. Anda tidak dapat menambahkan balasan.' },
        { status: 403 }
      )
    }

    const authorName = user.name || 'Pengguna'
    const authorRole = user.role || 'buyer'
    const initials = authorName
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase() || '')
      .join('')

    const isOfficial = authorRole === 'admin'

    const { data: reply, error } = await supabase
      .from('forum_replies')
      .insert({
        thread_id,
        parent_reply_id: parent_reply_id || null,
        body: replyBody.trim(),
        author_id: user.id,
        author_name: authorName,
        author_avatar: initials || 'U',
        author_role: authorRole,
        is_official: isOfficial,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Gagal membuat balasan: ' + error.message }, { status: 500 })
    }

    // Kirim notifikasi ke pemilik thread (jika bukan diri sendiri)
    if (thread.author_id !== user.id) {
      await supabase.from('forum_notifications').insert({
        user_id: thread.author_id,
        type: 'new_reply',
        thread_id,
        reply_id: reply.id,
        from_user_name: authorName,
        from_user_avatar: initials || 'U',
        message: `${authorName} membalas diskusi Anda`,
      })
    }

    return NextResponse.json({ ...reply, liked_by_user: false }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + (err instanceof Error ? err.message : 'Unknown') },
      { status: 500 }
    )
  }
}
