// ============================================================
// lib/forum/realtime.ts — Supabase Realtime Setup
// ============================================================

import { createClient, type RealtimeChannel } from '@supabase/supabase-js'
import type { ForumReply, ForumNotification, ForumThread } from './types'

// ─── Supabase Client Singleton ────────────────────────────
let supabaseInstance: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    supabaseInstance = createClient(url, key)
  }
  return supabaseInstance
}

// ─── Callbacks ────────────────────────────────────────────
export interface ReplyRealtimeCallbacks {
  onNewReply: (reply: ForumReply) => void
  onUpdatedReply: (reply: ForumReply) => void
  onDeletedReply: (replyId: string) => void
}

export interface ThreadRealtimeCallbacks {
  onUpdatedThread: (thread: Partial<ForumThread>) => void
}

export interface NotificationRealtimeCallbacks {
  onNewNotification: (notification: ForumNotification) => void
}

// ─── Subscribe ke Replies Thread ─────────────────────────
export function subscribeToThreadReplies(
  threadId: string,
  callbacks: ReplyRealtimeCallbacks
): RealtimeChannel {
  const supabase = getSupabase()
  const channel = supabase
    .channel(`thread-replies:${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'forum_replies',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => callbacks.onNewReply(payload.new as ForumReply)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'forum_replies',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => callbacks.onUpdatedReply(payload.new as ForumReply)
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'forum_replies',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => callbacks.onDeletedReply((payload.old as { id: string }).id)
    )
    .subscribe()

  return channel
}

// ─── Subscribe ke Thread Updates ─────────────────────────
export function subscribeToThread(
  threadId: string,
  callbacks: ThreadRealtimeCallbacks
): RealtimeChannel {
  const supabase = getSupabase()
  const channel = supabase
    .channel(`thread:${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'forum_threads',
        filter: `id=eq.${threadId}`,
      },
      (payload) => callbacks.onUpdatedThread(payload.new as Partial<ForumThread>)
    )
    .subscribe()

  return channel
}

// ─── Subscribe ke Notifikasi User ─────────────────────────
export function subscribeToUserNotifications(
  userId: string,
  callbacks: NotificationRealtimeCallbacks
): RealtimeChannel {
  const supabase = getSupabase()
  const channel = supabase
    .channel(`user-notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'forum_notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callbacks.onNewNotification(payload.new as ForumNotification)
    )
    .subscribe()

  return channel
}

// ─── Unsubscribe Helper ───────────────────────────────────
export async function unsubscribeChannel(channel: RealtimeChannel): Promise<void> {
  const supabase = getSupabase()
  await supabase.removeChannel(channel)
}

// ─── Broadcast "sedang mengetik" ──────────────────────────
export function broadcastTyping(threadId: string, userName: string): RealtimeChannel {
  const supabase = getSupabase()
  const channel = supabase.channel(`typing:${threadId}`)
  channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { user: userName },
  })
  return channel
}

export function subscribeToTyping(
  threadId: string,
  onTyping: (user: string) => void
): RealtimeChannel {
  const supabase = getSupabase()
  const channel = supabase
    .channel(`typing:${threadId}`)
    .on('broadcast', { event: 'typing' }, (payload) => {
      onTyping(payload.payload?.user || 'Seseorang')
    })
    .subscribe()

  return channel
}
