import Image from 'next/image'
import Link from 'next/link'

import { mediaUrl } from '@/lib/data'
import type { HomePage } from '@/payload-types'

import { CallbackButton } from './CallbackButton'
import { btnGhost, btnPrimary } from './ui'

const IVORY = '247 243 232'

/** Полноэкранный баннер главной: фото, светлая подложка под текстом, крупный тонкий заголовок */
export function Hero({ hero }: { hero: NonNullable<HomePage['hero']> }) {
  const photo = typeof hero.image === 'object' ? hero.image : null
  const src = mediaUrl(photo, 'original')
  const a = Math.min(100, Math.max(0, hero.overlay ?? 70)) / 100
  const [first, ...rest] = (hero.title ?? '').split('\n').filter(Boolean)

  return (
    <section className="relative isolate overflow-hidden bg-cream">
      {src && (
        <Image
          src={src}
          alt={photo?.alt || hero.eyebrow || 'Межкомнатные двери'}
          fill
          priority
          quality={85}
          sizes="100vw"
          className="-z-20 object-cover object-center"
        />
      )}

      {/* Подложка: на компьютере слева направо, на телефоне снизу вверх */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 hidden md:block"
        style={{
          background: `linear-gradient(90deg, rgb(${IVORY} / ${a}) 0%, rgb(${IVORY} / ${a * 0.8}) 38%, rgb(${IVORY} / 0) 72%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 md:hidden"
        style={{
          background: `linear-gradient(0deg, rgb(${IVORY} / ${Math.min(1, a + 0.2)}) 0%, rgb(${IVORY} / ${a * 0.85}) 45%, rgb(${IVORY} / 0) 100%)`,
        }}
      />

      <div className="mx-auto flex min-h-[560px] max-w-6xl flex-col justify-end px-4 pb-16 pt-24 md:min-h-[680px] md:justify-center md:pb-24">
        {hero.eyebrow && (
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-bronze">{hero.eyebrow}</p>
        )}
        <h1 className="mt-5 max-w-3xl font-serif font-light leading-[0.95] tracking-tight text-6xl sm:text-7xl md:text-8xl">
          {first}
          {rest.map((line) => (
            <span key={line} className="block italic text-bronze">
              {line}
            </span>
          ))}
        </h1>
        {hero.subtitle && <p className="mt-6 max-w-md text-lg text-ink/75">{hero.subtitle}</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={hero.buttonLink || '/catalog'} className={btnPrimary}>
            {hero.buttonLabel || 'Смотреть каталог'}
          </Link>
          <CallbackButton className={btnGhost}>Заказать звонок</CallbackButton>
        </div>
      </div>

      <a
        href="#catalog"
        aria-label="К каталогу"
        className="absolute bottom-8 right-6 flex size-14 items-center justify-center rounded-full bg-bronze text-white shadow-lg transition hover:bg-bronze-dark md:right-12"
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14m0 0-6-6m6 6 6-6" />
        </svg>
      </a>
    </section>
  )
}
