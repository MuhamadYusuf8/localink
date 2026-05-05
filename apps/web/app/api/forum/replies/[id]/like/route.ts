// ============================================================
// app/api/forum/replies/[id]/like/route.ts
// POST — toggle like pada reply (optimistic update safe)
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getLaravelUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Anda harus login untuk menyukai balasan' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const replyId = params.id

    // Cek apakah sudah pernah like
    const { data: existingLike } = await supabase
      .from('forum_reply_likes')
      .select('id')
      .eq('reply_id', replyId)
      .eq('user_id', user.id)
      .single()

    let liked: boolean

    if (existingLike) {
      // Unlike: hapus like & decrement
      await supabase
        .from('forum_reply_likes')
        .delete()
        .eq('reply_id', replyId)
        .eq('user_id', user.id)

      const { data: reply } = await supabase
        .from('forum_replies')
        .select('like_count')
        .eq('id', replyId)
        .single()

      await supabase
        .from('forum_replies')
        .update({ like_count: Math.max(0, (reply?.like_count ?? 1) - 1) })
        .eq('id', replyId)

      liked = false
    } else {
      // Like: tambah like & increment
      await supabase
        .from('forum_reply_likes')
        .insert({ reply_id: replyId, user_id: user.id })

      const { data: reply } = await supabase
        .from('forum_replies')
        .select('like_count')
        .eq('id', replyId)
        .single()

      await supabase
        .from('forum_replies')
        .update({ like_count: (reply?.like_count ?? 0) + 1 })
        .eq('id', replyId)

      liked = true
    }

    // Fetch updated like count
    const { data: updatedReply } = await supabase
      .from('forum_replies')
      .select('like_count')
      .eq('id', replyId)
      .single()

    return NextResponse.json({
      liked,
      like_count: updatedReply?.like_count || 0,
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + (err instanceof Error ? err.message : 'Unknown') },
      { status: 500 }
    )
  }
}
