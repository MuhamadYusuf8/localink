/**
 * Utilitas format mata uang IDR
 * Semua nilai harga disimpan sebagai integer (paling kecil: Rupiah)
 */

/**
 * Format angka integer menjadi format Rupiah
 * Contoh: 12500 → "Rp 12.500"
 */
export function formatIDR(amount: number, showSymbol = true): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

  return showSymbol ? `Rp ${formatted}` : formatted
}

/**
 * Format harga dengan satuan
 * Contoh: formatPrice(12500, 'kg') → "Rp 12.500/kg"
 */
export function formatPrice(amount: number, unit?: string): string {
  const base = formatIDR(amount)
  return unit ? `${base}/${unit}` : base
}

/**
 * Format persen
 * Contoh: 0.05 → "5%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Hitung selisih harga vs harga pasar dalam persen
 */
export function priceDiffPercent(yourPrice: number, marketAvg: number): number {
  if (marketAvg === 0) return 0
  return ((yourPrice - marketAvg) / marketAvg) * 100
}

/**
 * Status keselarasan harga dengan pasar
 */
export type PriceAlignment = 'below_market' | 'aligned' | 'slightly_high' | 'above_market'

export function getPriceAlignment(yourPrice: number, marketAvg: number): PriceAlignment {
  const diff = priceDiffPercent(yourPrice, marketAvg)
  if (diff < -10)  return 'below_market'
  if (diff <= 10)  return 'aligned'
  if (diff <= 25)  return 'slightly_high'
  return 'above_market'
}

/**
 * Format jumlah besar menjadi ringkasan
 * Contoh: 1250000 → "1,25 jt"
 */
export function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} M`
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} jt`
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)} rb`
  }
  return amount.toString()
}
