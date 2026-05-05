'use client'

// ============================================================
// lib/forum/hooks.ts — Custom Hooks untuk Forum
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { buildQueryString } from './utils'
import { createClient } from '@supabase/supabase-js'
import { useAuthStore } from '@/lib/store/authStore'
import type {
  ForumThread,
  ForumReply,
  ForumNotification,
  ThreadFilterOptions,
  CreateThreadPayload,
  CreateReplyPayload,
} from './types'

interface ForumStats {
  total_threads: number
  active_today: number
  waiting_answer: number
  resolved: number
}

// ─── Supabase Client ───────────────────────────────────────
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return createClient(url, key)
}

// ─── useForumThreads ─────────────────────────────────────
export function useForumThreads(options: ThreadFilterOptions = {}) {
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [stats, setStats] = useState<ForumStats>({
    total_threads: 0,
    active_today: 0,
    waiting_answer: 0,
    resolved: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchThreads = useCallback(async (opts: ThreadFilterOptions) => {
    setIsLoading(true)
    setError(null)
    try {
      const qs = buildQueryString({
        category: opts.category,
        role: opts.role,
        sort: opts.sort,
        search: opts.search,
        page: opts.page ?? 1,
        limit: opts.limit ?? 12,
        pinned_only: opts.pinned_only ? 'true' : undefined,
        unresolved_only: opts.unresolved_only ? 'true' : undefined,
      })
      const res = await fetch(`/api/forum/threads?${qs}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal memuat thread')
      }
      const data = await res.json()
      setThreads(data.data)
      setTotal(data.total)
      setHasMore(data.has_more)
      setStats(data.stats)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchThreads(options)
    }, options.search !== undefined ? 300 : 0)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    options.category,
    options.role,
    options.sort,
    options.search,
    options.page,
    options.pinned_only,
    options.unresolved_only,
  ])

  const createThread = useCallback(async (payload: CreateThreadPayload): Promise<ForumThread> => {
    const res = await fetch('/api/forum/threads', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${useAuthStore.getState().token || ''}`
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Gagal membuat thread')
    setThreads((prev) => [data, ...prev])
    return data
  }, [])

  const refresh = useCallback(() => fetchThreads(options), [fetchThreads, options])

  return { threads, stats, isLoading, error, total, hasMore, createThread, refresh }
}

// ─── useForumThread (single) ──────────────────────────────
export function useForumThread(threadId: string) {
  const [thread, setThread] = useState<ForumThread | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchThread = useCallback(async () => {
    if (!threadId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/forum/threads/${threadId}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Thread tidak ditemukan')
      }
      const data = await res.json()
      setThread(data.thread)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }, [threadId])

  useEffect(() => {
    fetchThread()
  }, [fetchThread])

  const updateThread = useCallback((updates: Partial<ForumThread>) => {
    setThread((prev) => (prev ? { ...prev, ...updates } : prev))
  }, [])

  return { thread, isLoading, error, refresh: fetchThread, updateThread }
}

// ─── useForumReplies ──────────────────────────────────────
export function useForumReplies(threadId: string) {
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newRepliesCount, setNewRepliesCount] = useState(0)
  const supabaseRef = useRef(getSupabaseClient())

  const fetchReplies = useCallback(async () => {
    if (!threadId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/forum/threads/${threadId}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal memuat balasan')
      }
      const data = await res.json()
      setReplies(data.replies || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }, [threadId])

  useEffect(() => {
    fetchReplies()
  }, [fetchReplies])

  // ─── Supabase Realtime Subscription ─────────────────────
  useEffect(() => {
    if (!threadId) return
    const supabase = supabaseRef.current
    const channel = supabase
      .channel(`forum_replies:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_replies',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const newReply = payload.new as ForumReply
          setReplies((prev) => {
            // Hindari duplikasi
            if (prev.find((r) => r.id === newReply.id)) return prev
            return [...prev, { ...newReply, liked_by_user: false }]
          })
          setNewRepliesCount((c) => c + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'forum_replies',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const updated = payload.new as ForumReply
          setReplies((prev) =>
            prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [threadId])

  const createReply = useCallback(async (payload: CreateReplyPayload): Promise<ForumReply> => {
    const res = await fetch('/api/forum/replies', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${useAuthStore.getState().token || ''}`
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Gagal mengirim balasan')
    // Optimistic update — realtime akan handle dedup
    setReplies((prev) => {
      if (prev.find((r) => r.id === data.id)) return prev
      return [...prev, data]
    })
    return data
  }, [])

  const updateReplyLike = useCallback((replyId: string, liked: boolean, newCount: number) => {
    setReplies((prev) =>
      prev.map((r) =>
        r.id === replyId ? { ...r, like_count: newCount, liked_by_user: liked } : r
      )
    )
  }, [])

  const markSolution = useCallback((replyId: string) => {
    setReplies((prev) =>
      prev.map((r) => ({
        ...r,
        is_solution: r.id === replyId,
      }))
    )
  }, [])

  const clearNewReplies = useCallback(() => setNewRepliesCount(0), [])

  return {
    replies,
    isLoading,
    error,
    newRepliesCount,
    createReply,
    updateReplyLike,
    markSolution,
    clearNewReplies,
    refresh: fetchReplies,
  }
}

// ─── useForumNotifications ────────────────────────────────
export function useForumNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<ForumNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const supabaseRef = useRef(getSupabaseClient())

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/forum/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // ─── Realtime Subscription ───────────────────────────────
  useEffect(() => {
    if (!userId) return
    const supabase = supabaseRef.current
    const channel = supabase
      .channel(`forum_notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notif = payload.new as ForumNotification
          setNotifications((prev) => [notif, ...prev].slice(0, 20))
          setUnreadCount((c) => c + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markAsRead = useCallback(async (ids?: string[]) => {
    try {
      const body = ids ? { ids } : { all: true }
      await fetch('/api/forum/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().token || ''}`
        },
        body: JSON.stringify(body),
      })
      if (ids) {
        setNotifications((prev) =>
          prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
        )
        setUnreadCount((c) => Math.max(0, c - ids.length))
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch {
      // silent
    }
  }, [])

  return { notifications, unreadCount, isLoading, markAsRead, refresh: fetchNotifications }
}

// ─── useReplyLike ─────────────────────────────────────────
export function useReplyLike(
  replyId: string,
  initialLiked: boolean,
  initialCount: number,
  onUpdate?: (liked: boolean, count: number) => void
) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)

  const toggleLike = useCallback(async () => {
    if (isLoading) return
    // Optimistic update
    const newLiked = !liked
    const newCount = newLiked ? count + 1 : count - 1
    setLiked(newLiked)
    setCount(newCount)
    onUpdate?.(newLiked, newCount)

    setIsLoading(true)
    try {
      const res = await fetch(`/api/forum/replies/${replyId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token || ''}`
        }
      })
      if (!res.ok) {
        // Rollback
        setLiked(liked)
        setCount(count)
        onUpdate?.(liked, count)
      } else {
        const data = await res.json()
        setLiked(data.liked)
        setCount(data.like_count)
        onUpdate?.(data.liked, data.like_count)
      }
    } catch {
      // Rollback
      setLiked(liked)
      setCount(count)
      onUpdate?.(liked, count)
    } finally {
      setIsLoading(false)
    }
  }, [replyId, liked, count, isLoading, onUpdate])

  return { liked, count, isLoading, toggleLike }
}
