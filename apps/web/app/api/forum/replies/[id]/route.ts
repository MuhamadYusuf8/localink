// ============================================================
// app/api/forum/replies/[id]/route.ts
// PATCH — edit reply
// DELETE — hapus reply
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

// ─── PATCH /api/forum/replies/[id] ────────────────────────
export async function PATCH(
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
    const { id } = params

    const { data: reply } = await supabase
      .from('forum_replies')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!reply) {
      return NextResponse.json({ error: 'Balasan tidak ditemukan' }, { status: 404 })
    }

    if (reply.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Anda hanya dapat mengedit balasan milik Anda sendiri' },
        { status: 403 }
      )
    }

    const body = await req.json()
    if (!body.body || body.body.trim().length < 5) {
      return NextResponse.json({ error: 'Balasan minimal 5 karakter' }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('forum_replies')
      .update({ body: body.body.trim(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Gagal mengupdate balasan: ' + error.message }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + (err instanceof Error ? err.message : 'Unknown') },
      { status: 500 }
    )
  }
}

// ─── DELETE /api/forum/replies/[id] ───────────────────────
export async function DELETE(
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
    const { id } = params

    const { data: reply } = await supabase
      .from('forum_replies')
      .select('author_id')
      .eq('id', id)
      .single()

    if (!reply) {
      return NextResponse.json({ error: 'Balasan tidak ditemukan' }, { status: 404 })
    }

    const isAuthor = reply.author_id === user.id
    const isAdmin = user.user_metadata?.role === 'admin'

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk menghapus balasan ini' },
        { status: 403 }
      )
    }

    const { error } = await supabase.from('forum_replies').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Gagal menghapus balasan: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Balasan berhasil dihapus' })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + (err instanceof Error ? err.message : 'Unknown') },
      { status: 500 }
    )
  }
}
