import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── Core Palettes — Light Theme ────────────────────────────
        dark: {
          // Nama class tetap "dark.*" agar tidak perlu ubah JSX
          // tapi nilainya diganti ke light theme
          surface: '#FFFFFF',   // dark-surface → putih bersih (card bg)
          void:    '#F8FAF9',   // dark-void    → abu hijau sangat terang (page bg)
          muted:   '#F1F5F3',   // dark-muted   → abu hijau terang (input bg)
          border:  '#D1E8DF',   // dark-border  → hijau muda (border)
        },

        // ─── Brand Colors — Emerald DIBALIK untuk light mode ────────
        // Di dark mode, shade kecil = gelap, besar = terang
        // Di light mode, kita balik agar teks emerald tetap terbaca
        emerald: {
          50:  '#ECFDF5',   // paling terang (bg chips, dll)
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',   // brand utama — TIDAK BERUBAH
          600: '#059669',   // lebih gelap untuk teks di bg terang
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',   // paling gelap
        },

        harvest: {
          50:  '#FEF3C7',   // paling terang
          100: '#FDE68A',
          200: '#FCD34D',
          300: '#FBBF24',
          400: '#F59E0B',
          500: '#D97706',
          600: '#B45309',   // untuk teks amber di bg terang
          700: '#92400E',
          800: '#78350F',
          900: '#451A03',   // paling gelap
        },

        // ─── Typography — Light Theme ────────────────────────────────
        text: {
          primary:   '#0F1F1A',   // #FFFFFF → hijau sangat gelap
          secondary: '#4B7A67',   // #A1A1AA → hijau medium
          muted:     '#6B9E8A',   // #71717A → hijau muda
        },

        // ─── Status — tidak berubah ──────────────────────────────────
        status: {
          success: '#10B981',
          error:   '#EF4444',
          warning: '#F59E0B',
          info:    '#3B82F6',
        },

        // ─── Accent — tidak berubah ──────────────────────────────────
        accent: {
          DEFAULT: '#10B981',
          50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0', 300: '#6EE7B7',
          400: '#34D399', 500: '#10B981', 600: '#059669', 700: '#047857',
          800: '#065F46', 900: '#064E3B',
        },

        // ─── Light theme extras ──────────────────────────────────────
        // Warna tambahan khusus light theme yang sering dipakai inline
        light: {
          bg:       '#F8FAF9',
          card:     '#FFFFFF',
          input:    '#F1F5F3',
          accent:   '#EDF7F3',
          border:   '#D1E8DF',
          'border-hover': '#A8D5C2',
        },
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Bricolage Grotesque', 'Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },

      borderRadius: {
        'button': '12px',
        'card':   '24px',
        'pill':   '9999px',
      },

      boxShadow: {
        // Shadow disesuaikan untuk light theme
        'card':       '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(16,185,129,0.12), 0 2px 4px rgba(0,0,0,0.06)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.20)',
        'glow-error':   '0 0 20px -5px rgba(239, 68, 68, 0.15)',
        // Tambahan untuk light theme
        'nav':    '0 1px 3px rgba(0,0,0,0.06)',
        'modal':  '0 8px 32px rgba(0,0,0,0.10)',
        'input-focus': '0 0 0 3px rgba(16,185,129,0.15)',
      },

      backgroundImage: {
        'gradient-radial':        'radial-gradient(var(--tw-gradient-stops))',
        // Hero gradient light
        'gradient-hero':          'linear-gradient(135deg, #EDF7F3 0%, #F8FAF9 50%, #EDF7F3 100%)',
        'gradient-emerald-light': 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
        // Noise opacity lebih rendah untuk light theme
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.008'/%3E%3C/svg%3E\")",
      },

      animation: {
        'fade-in':    'fadeIn 0.5s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },

      // duration-250 & duration-400 tetap ada — tidak dihapus
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
      },
    },
  },
  plugins: [],
}

export default config