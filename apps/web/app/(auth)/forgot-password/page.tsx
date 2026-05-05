import type { Metadata } from 'next'
import { StaticPagePlaceholder } from '@/components/common/StaticPagePlaceholder'

export const metadata: Metadata = {
  title: 'Lupa Password',
  description: 'Pulihkan akses akun Localink Anda.',
}

export default function ForgotPasswordPage() {
  return (
    <StaticPagePlaceholder
      title="Lupa Password"
      description="Fitur reset password sedang kami aktifkan penuh. Untuk sementara, silakan hubungi admin untuk bantuan pemulihan akun."
    />
  )
}
