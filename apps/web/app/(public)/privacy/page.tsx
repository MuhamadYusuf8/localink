import type { Metadata } from 'next'
import { StaticPagePlaceholder } from '@/components/common/StaticPagePlaceholder'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description: 'Kebijakan privasi dan perlindungan data pengguna Economic Survival.',
}

export default function PrivacyPage() {
  return (
    <StaticPagePlaceholder
      title="Kebijakan Privasi"
      description="Kebijakan privasi sedang kami perbarui agar mencakup proses perlindungan data terbaru sesuai kebutuhan operasional platform."
    />
  )
}
