import type { Metadata } from 'next'
import { FarmerRegisterForm } from '@/components/forms/FarmerRegisterForm'

export const metadata: Metadata = {
  title: 'Daftar sebagai Petani',
  description: 'Buka toko online Anda dan jual hasil pertanian langsung ke pembeli.',
}

export default function FarmerRegisterPage() {
  return <FarmerRegisterForm />
}
