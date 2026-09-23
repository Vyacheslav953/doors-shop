import Link from 'next/link'

import { telHref } from '@/lib/phone'

import { CallbackButton } from './CallbackButton'

export function Header({ phone, workHours }: { phone: string; workHours?: string | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-serif text-3xl font-bold tracking-wide">
          Doors <span className="text-bronze">M</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          <Link href="/catalog" className="hover:text-bronze">
            Каталог
          </Link>
          <Link href="/#how" className="hover:text-bronze">
            Как заказать
          </Link>
          <Link href="/#delivery" className="hover:text-bronze">
            Доставка и монтаж
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <a href={telHref(phone)} className="hidden text-right leading-tight lg:block">
            <span className="block font-semibold">{phone}</span>
            {workHours && <span className="block text-xs text-muted">{workHours}</span>}
          </a>
          <div className="hidden sm:block">
            <CallbackButton />
          </div>
        </div>
      </div>
    </header>
  )
}
