import type { Metadata } from 'next'
import { BuyerRegisterForm } from '@/components/forms/BuyerRegisterForm'

export const metadata: Metadata = {
  title: 'Daftar sebagai Pembeli',
  description: 'Beli hasil bumi segar langsung dari petani lokal Indonesia.',
}

export default function BuyerRegisterPage() {
  return <BuyerRegisterForm />
}
