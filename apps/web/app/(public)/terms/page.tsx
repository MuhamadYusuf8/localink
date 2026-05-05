import type { Metadata } from 'next'
import { StaticPagePlaceholder } from '@/components/common/StaticPagePlaceholder'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan',
  description: 'Syarat dan ketentuan layanan Localink.',
}

export default function TermsPage() {
  return (
    <StaticPagePlaceholder
      title="Syarat & Ketentuan"
      description="Dokumen syarat dan ketentuan sedang kami finalisasi agar selaras dengan alur transaksi terbaru di platform."
    />
  )
}
