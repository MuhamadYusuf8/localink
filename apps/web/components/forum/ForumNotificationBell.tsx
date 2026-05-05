'use client'

// ============================================================
// components/forum/ForumNotificationBell.tsx
// Bell icon dengan dropdown notifikasi realtime
// ============================================================

import React, { useState, useEffect, useRef } from 'react'
import { Bell, Check, ExternalLink, MessageSquare, Award, Lock, Star } from 'lucide-react'
import { useForumNotifications } from '@/lib/forum/hooks'
import { formatRelativeTime, roleStyles } from '@/lib/forum/utils'
import type { ForumNotification, ForumNotificationType } from '@/lib/forum/types'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

// ─── Notification Icon ────────────────────────────────────
function NotifIcon({ type }: { type: ForumNotificationType }) {
  const iconProps = { size: 14 }
  switch (type) {
    case 'new_reply': return <MessageSquare {...iconProps} color="#10B981" />
    case 'mention': return <MessageSquare {...iconProps} color="#06B6D4" />
    case 'solution_marked': return <Award {...iconProps} color="#F59E0B" />
    case 'thread_locked': return <Lock {...iconProps} color="#EF4444" />
    case 'official_reply': return <Star {...iconProps} color="#3B82F6" />
    default: return <Bell {...iconProps} color="#9BA3AF" />
  }
}

// ─── Single Notification Item ─────────────────────────────
function NotifItem({
  notif,
  onRead,
}: {
  notif: ForumNotification
  onRead: (id: string) => void
}) {
  const role = notif.from_user_avatar.length === 2 ? 'farmer' : 'buyer'

  return (
    <Link
      href={`/forum/${notif.thread_id}`}
      onClick={() => !notif.is_read && onRead(notif.id)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 16px',
        background: notif.is_read ? 'transparent' : 'rgba(16,185,129,0.05)',
        borderLeft: notif.is_read ? '3px solid transparent' : '3px solid #10B981',
        textDecoration: 'none',
        transition: 'background 0.15s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = notif.is_read
          ? 'transparent'
          : 'rgba(16,185,129,0.05)'
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '8px',
          background: roleStyles[role].gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.7rem',
          fontWeight: 700,
          color: '#fff',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {notif.from_user_avatar}
        <span
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#111316',
            border: '1px solid #1E2128',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <NotifIcon type={notif.type} />
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            color: notif.is_read ? '#9BA3AF' : '#E5E7EB',
            fontSize: '0.78rem',
            lineHeight: 1.4,
            margin: 0,
            fontWeight: notif.is_read ? 400 : 500,
          }}
        >
          {notif.message}
        </p>
        <p
          style={{
            color: '#6B7280',
            fontSize: '0.7rem',
            margin: '3px 0 0',
          }}
        >
          {formatRelativeTime(notif.created_at)}
        </p>
      </div>

      {/* Unread dot */}
      {!notif.is_read && (
        <div
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#10B981',
            flexShrink: 0,
            marginTop: '4px',
          }}
        />
      )}
    </Link>
  )
}

// ─── Main Component ───────────────────────────────────────
export function ForumNotificationBell() {
  const { user, isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [shaking, setShaking] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const prevUnreadRef = useRef(0)

  const { notifications, unreadCount, markAsRead } = useForumNotifications(
    isAuthenticated ? user?.id || null : null
  )

  // Shake animation saat ada notif baru
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setShaking(true)
      setTimeout(() => setShaking(false), 600)
    }
    prevUnreadRef.current = unreadCount
  }, [unreadCount])

  // Close dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isAuthenticated) return null

  const handleReadOne = async (id: string) => {
    await markAsRead([id])
  }

  const handleReadAll = async () => {
    await markAsRead()
  }

  return (
    <>
      <style>{`
        @keyframes bellShake {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(-12deg); }
          30% { transform: rotate(12deg); }
          45% { transform: rotate(-8deg); }
          60% { transform: rotate(8deg); }
          75% { transform: rotate(-4deg); }
          90% { transform: rotate(4deg); }
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateX(8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div ref={dropdownRef} style={{ position: 'relative' }}>
        {/* Bell Button */}
        <button
          id="forum-notification-bell"
          onClick={() => setOpen((v) => !v)}
          aria-label={`${unreadCount} notifikasi belum dibaca`}
          style={{
            position: 'relative',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            border: open ? '1px solid rgba(16,185,129,0.3)' : '1px solid #1E2128',
            background: open ? 'rgba(16,185,129,0.1)' : '#111316',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <Bell
            size={18}
            color={open ? '#10B981' : '#9BA3AF'}
            style={{
              animation: shaking ? 'bellShake 0.6s ease' : 'none',
              transformOrigin: 'top center',
            }}
          />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                minWidth: '18px',
                height: '18px',
                borderRadius: '9999px',
                background: '#EF4444',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid #0A0B0D',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '340px',
              background: '#111316',
              border: '1px solid #1E2128',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              animation: 'dropdownIn 0.2s ease',
              zIndex: 9999,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderBottom: '1px solid #1E2128',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={15} color="#10B981" />
                <span style={{ color: '#F0F2F5', fontWeight: 600, fontSize: '0.85rem' }}>
                  Notifikasi
                </span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: 'rgba(239,68,68,0.15)',
                      color: '#EF4444',
                      border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: '9999px',
                      padding: '1px 7px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                    }}
                  >
                    {unreadCount} baru
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleReadAll}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#10B981',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.1)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = 'none')
                  }
                >
                  <Check size={12} />
                  Tandai semua
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    color: '#6B7280',
                    fontSize: '0.8rem',
                  }}
                >
                  <Bell size={32} color="#2D3340" style={{ margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ margin: 0 }}>Belum ada notifikasi</p>
                </div>
              ) : (
                notifications.slice(0, 5).map((notif, i) => (
                  <div
                    key={notif.id}
                    style={{ animation: `notifSlideIn 0.2s ease ${i * 0.05}s both` }}
                  >
                    <NotifItem
                      notif={notif}
                      onRead={handleReadOne}
                    />
                    {i < Math.min(notifications.length, 5) - 1 && (
                      <div style={{ height: '1px', background: '#1E2128' }} />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #1E2128', padding: '10px 16px' }}>
              <Link
                href="/forum"
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: '#10B981',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.08)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = 'none')
                }
              >
                Lihat semua notifikasi
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default ForumNotificationBell
