import Link from 'next/link'

import { telHref } from '@/lib/phone'

export function Footer({ phone, workHours }: { phone: string; workHours?: string | null }) {
  return (
    <footer id="contacts" className="mt-24 border-t border-line bg-cream/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-serif text-3xl font-bold">
            Doors <span className="text-bronze">M</span>
          </p>
          <p className="mt-2 text-sm text-muted">Межкомнатные двери с доставкой и монтажом</p>
        </div>
        <div className="text-sm">
          <a href={telHref(phone)} className="text-lg font-semibold">
            {phone}
          </a>
          {workHours && <p className="text-muted">{workHours}</p>}
        </div>
        <Link href="/privacy" className="text-sm text-muted underline">
          Политика конфиденциальности
        </Link>
      </div>
    </footer>
  )
}
