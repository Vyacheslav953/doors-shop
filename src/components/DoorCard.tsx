import Image from 'next/image'
import Link from 'next/link'

import type { Door, SiteSetting } from '@/payload-types'
import { doorFactory, doorPhotos, doorRetailPrice, mediaUrl } from '@/lib/data'
import { formatRub } from '@/lib/pricing'

import { DoorPlaceholder } from './DoorPlaceholder'
import { PromoRibbon } from './PromoRibbon'

export function DoorCard({
  door,
  settings,
  swatches = false,
  showFactory = false,
}: {
  door: Door
  settings: SiteSetting
  /** Показать точки доступных цветов в углу фото */
  swatches?: boolean
  /** Добавить название фабрики к подписи (там, где карточки показываются вне страницы фабрики) */
  showFactory?: boolean
}) {
  const factory = doorFactory(door)
  const photo = doorPhotos(door)[0]
  const src = mediaUrl(photo, 'card')
  const colors = (door.colors ?? []).filter((c): c is Exclude<typeof c, number> => typeof c === 'object')

  return (
    <Link
      href={`/catalog/${door.slug}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-card transition hover:border-bronze hover:shadow-md"
    >
      <div className="relative flex aspect-[3/4] items-center justify-center bg-cream/50">
        {src ? (
          <Image
            src={src}
            alt={photo?.alt || door.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <DoorPlaceholder className="h-2/3 opacity-80" />
        )}
        {door.promo && <PromoRibbon />}
        {swatches && colors.length > 0 && (
          <ul className="absolute left-3 top-3 flex flex-col gap-1.5" aria-label="Доступные цвета">
            {colors.slice(0, 4).map((c) => (
              <li
                key={c.id}
                title={c.name}
                className="size-3 rounded-full border border-black/15"
                style={{ background: c.hex || '#ddd' }}
              />
            ))}
          </ul>
        )}
      </div>
      <div className="p-4">
        {(door.series || (showFactory && factory)) && (
          <p className="text-xs uppercase tracking-wider text-muted">
            {[showFactory ? factory?.name : null, door.series].filter(Boolean).join(' · ')}
          </p>
        )}
        <h3 className="mt-1 font-serif text-xl font-semibold leading-snug">{door.name}</h3>
        <p className="mt-2 text-sm">
          от <span className="font-semibold">{formatRub(doorRetailPrice(door, settings))}</span>
        </p>
      </div>
    </Link>
  )
}
