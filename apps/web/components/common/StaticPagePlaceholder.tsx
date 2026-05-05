import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface StaticPagePlaceholderProps {
  title: string
  description: string
}

export function StaticPagePlaceholder({ title, description }: StaticPagePlaceholderProps) {
  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <div className="rounded-card border border-dark-border bg-dark-surface p-8 md:p-10">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">{title}</h1>
        <p className="text-text-secondary leading-relaxed">{description}</p>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft size={16} />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </section>
  )
}
