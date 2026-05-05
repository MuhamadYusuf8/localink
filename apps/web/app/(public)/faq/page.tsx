import type { Metadata } from 'next'
import { StaticPagePlaceholder } from '@/components/common/StaticPagePlaceholder'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Pertanyaan umum seputar penggunaan Economic Survival.',
}

export default function FaqPage() {
  return (
    <StaticPagePlaceholder
      title="FAQ"
      description="Dokumentasi pertanyaan umum sedang kami susun agar lebih lengkap dan mudah dipahami. Untuk bantuan cepat, silakan hubungi tim support melalui kanal resmi Anda."
    />
  )
}
