'use client'

import Image from 'next/image'
import { useState } from 'react'

import { DoorPlaceholder } from './DoorPlaceholder'
import { PromoRibbon } from './PromoRibbon'

export type GalleryImage = { src: string; alt: string }

export function Gallery({ images, name, promo = false }: { images: GalleryImage[]; name: string; promo?: boolean }) {
  const [active, setActive] = useState(0)
  const current = images[active]

  return (
    <div>
      <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl border border-line bg-cream/50">
        {current ? (
          <Image
            src={current.src}
            alt={current.alt || name}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <DoorPlaceholder className="h-2/3 opacity-80" />
        )}
        {promo && <PromoRibbon size="lg" />}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Фото ${i + 1}`}
              aria-current={i === active}
              className={`relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-lg border bg-cream/50 ${
                i === active ? 'border-bronze' : 'border-line'
              }`}
            >
              <Image src={img.src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
