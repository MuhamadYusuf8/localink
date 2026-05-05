import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { id } from 'date-fns/locale'

/**
 * Format tanggal ke format Indonesia lengkap
 * Contoh: "01 Januari 2024"
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  const date = parseISO(dateString)
  if (!isValid(date)) return '-'
  return format(date, 'd MMMM yyyy', { locale: id })
}

/**
 * Format tanggal dengan waktu
 * Contoh: "01 Jan 2024, 14:30"
 */
export function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-'
  const date = parseISO(dateString)
  if (!isValid(date)) return '-'
  return format(date, 'd MMM yyyy, HH:mm', { locale: id })
}

/**
 * Relative time — "3 jam yang lalu", "kemarin"
 */
export function timeAgo(dateString: string | null): string {
  if (!dateString) return '-'
  const date = parseISO(dateString)
  if (!isValid(date)) return '-'
  return formatDistanceToNow(date, { addSuffix: true, locale: id })
}

/**
 * Format tanggal panen
 * Contoh: "Panen: 15 Juni 2024"
 */
export function formatHarvestDate(dateString: string | null): string {
  if (!dateString) return 'Belum ditentukan'
  const date = parseISO(dateString)
  if (!isValid(date)) return '-'
  return `Panen: ${format(date, 'd MMMM yyyy', { locale: id })}`
}

/**
 * Cek apakah produk siap panen dalam N hari ke depan
 */
export function isHarvestSoon(dateString: string | null, days = 3): boolean {
  if (!dateString) return false
  const date = parseISO(dateString)
  if (!isValid(date)) return false
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= days
}

/**
 * Format durasi langganan
 * Contoh: "Berakhir 31 Des 2024"
 */
export function formatSubscriptionExpiry(dateString: string | null): string {
  if (!dateString) return 'Tidak aktif'
  const date = parseISO(dateString)
  if (!isValid(date)) return '-'
  return `Berakhir ${format(date, 'd MMM yyyy', { locale: id })}`
}
