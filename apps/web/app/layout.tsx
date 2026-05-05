import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { AuthProvider } from '@/lib/hooks/useAuth'

// ─── Font Configuration ──────────────────────────────────
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// ─── Metadata Default ────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Economic Survival — Marketplace Pertanian Indonesia',
    template: '%s | Economic Survival',
  },
  description:
    'Platform marketplace pertanian terpercaya yang menghubungkan petani lokal langsung dengan pembeli. Beli hasil bumi segar langsung dari sumbernya.',
  keywords: [
    'marketplace pertanian',
    'beli sayuran online',
    'beli buah langsung petani',
    'petani lokal Indonesia',
    'grosir pertanian',
    'harga tani',
  ],
  authors: [{ name: 'Economic Survival Team' }],
  creator: 'Economic Survival',
  publisher: 'Economic Survival',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: process.env.APP_URL ?? 'http://localhost:3000',
    siteName: 'Economic Survival',
    title: 'Economic Survival — Marketplace Pertanian Indonesia',
    description:
      'Beli hasil bumi segar langsung dari petani lokal Indonesia. Harga transparan, kualitas terjamin.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Economic Survival Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Economic Survival — Marketplace Pertanian Indonesia',
    description: 'Beli hasil bumi segar langsung dari petani lokal.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// Mengubah meta viewport ke tema terang yang bersih
export const viewport: Viewport = {
  themeColor: '#FFFFFF', 
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
}

// ─── Root Layout ─────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Menghapus class "dark" dari tag html
    <html lang="id" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      {/* Menerapkan latar belakang off-white premium (Slate 50) dan teks Slate 900 secara global */}
      <body className="bg-[#F8FAFC] text-[#0F172A] antialiased min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}