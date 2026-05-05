/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aktifkan App Router (default di Next.js 14)
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },

  // Konfigurasi domain gambar eksternal
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 's3.ap-southeast-1.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
        pathname: '/**',
      },
      // Placeholder gambar untuk development
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Environment variables yang di-expose ke client
  env: {
    API_URL: process.env.API_URL,
    APP_URL: process.env.APP_URL,
  },

  // Header keamanan
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ]
  },

  // Redirect legacy routes
  async redirects() {
    return [
      {
        source: '/farmer',
        destination: '/farmer/dashboard',
        permanent: false,
      },
      {
        source: '/buyer',
        destination: '/buyer/orders',
        permanent: false,
      },
    ]
  },

  // Webpack konfigurasi tambahan
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })
    return config
  },

  // Output standalone untuk Docker deployment
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,

  // Poweredby header dihapus untuk keamanan
  poweredByHeader: false,
}

module.exports = nextConfig
