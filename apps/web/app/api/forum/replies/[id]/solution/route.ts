// ============================================================
// app/api/forum/replies/[id]/solution/route.ts
// POST — tandai reply sebagai solusi (hanya author thread)
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUser = getSupabaseUser(req)
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Anda harus login' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const replyId = params.id

    // Fetch reply untuk cari thread_id
    const { data: reply } = await supabase
      .from('forum_replies')
      .select('id, thread_id, author_id, author_name, author_avatar')
      .eq('id', replyId)
      .single()

    if (!reply) {
      return NextResponse.json({ error: 'Balasan tidak ditemukan' }, { status: 404 })
    }

    // Fetch thread untuk verifikasi author
    const { data: thread } = await supabase
      .from('forum_threads')
      .select('id, author_id, is_locked, is_resolved')
      .eq('id', reply.thread_id)
      .single()

    if (!thread) {
      return NextResponse.json({ error: 'Thread tidak ditemukan' }, { status: 404 })
    }

    if (thread.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Hanya pemilik thread yang dapat menandai solusi' },
        { status: 403 }
      )
    }

    if (thread.is_locked) {
      return NextResponse.json(
        { error: 'Thread ini sudah terkunci' },
        { status: 403 }
      )
    }

    // Reset semua is_solution di thread ini terlebih dahulu
    await supabase
      .from('forum_replies')
      .update({ is_solution: false })
      .eq('thread_id', reply.thread_id)

    // Tandai reply ini sebagai solusi
    const { data: updated, error } = await supabase
      .from('forum_replies')
      .update({ is_solution: true })
      .eq('id', replyId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Gagal menandai solusi: ' + error.message }, { status: 500 })
    }

    // Update thread jadi resolved
    await supabase
      .from('forum_threads')
      .update({ is_resolved: true })
      .eq('id', reply.thread_id)

    // Kirim notifikasi ke penulis reply
    if (reply.author_id !== user.id) {
      const authorMeta = user.user_metadata || {}
      const fromName = authorMeta.full_name || authorMeta.name || user.email?.split('@')[0] || 'Pemilik Thread'
      const initials = fromName.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() || '').join('')

      await supabase.from('forum_notifications').insert({
        user_id: reply.author_id,
        type: 'solution_marked',
        thread_id: reply.thread_id,
        reply_id: replyId,
        from_user_name: fromName,
        from_user_avatar: initials || 'U',
        message: `Balasan Anda ditandai sebagai solusi oleh pemilik thread!`,
      })
    }

    return NextResponse.json(updated)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + (err instanceof Error ? err.message : 'Unknown') },
      { status: 500 }
    )
  }
}
