import Image from 'next/image'
import Link from 'next/link'

import { mediaUrl, type FactoryWithCount } from '@/lib/data'

import { DoorPlaceholder } from './DoorPlaceholder'

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few
  return many
}

/** Крупная карточка фабрики на экране выбора в каталоге */
export function FactoryCard({ factory }: { factory: FactoryWithCount }) {
  const photo = typeof factory.image === 'object' ? factory.image : null
  const src = mediaUrl(photo, 'full')

  return (
    <Link
      href={`/catalog/factory/${factory.slug}`}
      className="group block overflow-hidden rounded-3xl border border-line bg-card transition hover:border-bronze hover:shadow-lg"
    >
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-cream/60">
        {src ? (
          <Image
            src={src}
            alt={photo?.alt || factory.name}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <DoorPlaceholder className="h-2/3 opacity-80" />
        )}
      </div>
      <div className="flex items-end justify-between gap-6 p-6 md:p-8">
        <div>
          <h2 className="font-serif text-4xl font-semibold leading-tight">{factory.name}</h2>
          {factory.description && <p className="mt-2 max-w-sm text-muted">{factory.description}</p>}
          <p className="mt-4 text-sm text-muted">
            {factory.doorCount} {plural(factory.doorCount, 'модель', 'модели', 'моделей')}
          </p>
        </div>
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-bronze text-white transition group-hover:bg-bronze-dark"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14m0 0-6-6m6 6-6 6" />
          </svg>
        </span>
      </div>
    </Link>
  )
}
