// ============================================================
// lib/forum/types.ts — TypeScript Interfaces untuk Forum
// ============================================================

export type ForumCategory =
  | 'pertanyaan'
  | 'negosiasi'
  | 'keluhan'
  | 'pengumuman'
  | 'diskusi_umum'

export type AuthorRole = 'buyer' | 'farmer' | 'admin'

export type ForumNotificationType =
  | 'new_reply'
  | 'mention'
  | 'solution_marked'
  | 'thread_locked'
  | 'official_reply'

// ─── Forum Thread ──────────────────────────────────────────
export interface ForumThread {
  id: string
  title: string
  body: string
  category: ForumCategory
  author_id: string
  author_name: string
  author_avatar: string
  author_role: AuthorRole
  is_pinned: boolean
  is_locked: boolean
  is_resolved: boolean
  view_count: number
  reply_count: number
  last_reply_at: string
  related_order_id?: string | null
  related_product_id?: string | null
  tags: string[]
  created_at: string
  updated_at: string
  // Computed dari join
  has_official_reply?: boolean
  solution_reply?: ForumReply | null
}

// ─── Forum Reply ───────────────────────────────────────────
export interface ForumReply {
  id: string
  thread_id: string
  parent_reply_id?: string | null
  body: string
  author_id: string
  author_name: string
  author_avatar: string
  author_role: AuthorRole
  is_solution: boolean
  is_official: boolean
  like_count: number
  created_at: string
  updated_at: string
  // Computed
  liked_by_user?: boolean
  children?: ForumReply[]
}

// ─── Forum Reply Like ─────────────────────────────────────
export interface ForumReplyLike {
  id: string
  reply_id: string
  user_id: string
  created_at: string
}

// ─── Forum Notification ───────────────────────────────────
export interface ForumNotification {
  id: string
  user_id: string
  type: ForumNotificationType
  thread_id: string
  reply_id?: string | null
  from_user_name: string
  from_user_avatar: string
  message: string
  is_read: boolean
  created_at: string
}

// ─── API Request Payloads ─────────────────────────────────
export interface CreateThreadPayload {
  title: string
  body: string
  category: ForumCategory
  tags?: string[]
  related_order_id?: string
  related_product_id?: string
}

export interface UpdateThreadPayload {
  title?: string
  body?: string
  category?: ForumCategory
  tags?: string[]
  is_pinned?: boolean
  is_locked?: boolean
  is_resolved?: boolean
}

export interface CreateReplyPayload {
  thread_id: string
  body: string
  parent_reply_id?: string
}

export interface UpdateReplyPayload {
  body: string
}

// ─── API Response Types ───────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface ForumThreadsResponse extends PaginatedResponse<ForumThread> {
  stats: ForumStats
}

export interface ForumStats {
  total_threads: number
  active_today: number
  waiting_answer: number
  resolved: number
}

// ─── Filter & Sort Options ────────────────────────────────
export interface ThreadFilterOptions {
  category?: ForumCategory | 'all'
  role?: AuthorRole | 'all'
  sort?: ThreadSortOption
  search?: string
  page?: number
  limit?: number
  pinned_only?: boolean
  unresolved_only?: boolean
}

export type ThreadSortOption =
  | 'newest'
  | 'oldest'
  | 'most_replies'
  | 'most_views'
  | 'unanswered'

// ─── Design Token Types ───────────────────────────────────
export interface RoleStyle {
  gradient: string
  badgeBg: string
  badgeColor: string
  badgeBorder: string
  label: string
}

export interface CategoryStyle {
  color: string
  bg: string
  border: string
  label: string
}
