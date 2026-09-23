'use client'

import { Children, useCallback, useEffect, useRef, useState } from 'react'

/** Горизонтальная карусель со стрелками и тонкой полосой прогресса. Карточки приходят как children. */
export function Carousel({ children, label }: { children: React.ReactNode; label: string }) {
  const track = useRef<HTMLUListElement>(null)
  const [thumb, setThumb] = useState({ width: 100, left: 0 })
  const [edge, setEdge] = useState({ start: true, end: true })

  const update = useCallback(() => {
    const el = track.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const width = Math.min(100, (el.clientWidth / el.scrollWidth) * 100)
    const progress = max > 0 ? el.scrollLeft / max : 0

    // Конец ленты: последняя карточка целиком на экране (запас справа у ленты пустой, листать там нечего)
    const last = el.lastElementChild
    const lastVisible = !last || last.getBoundingClientRect().right <= el.getBoundingClientRect().right + 1
    const start = el.scrollLeft <= 2
    const nothingToScroll = start && lastVisible

    setThumb(nothingToScroll ? { width: 100, left: 0 } : { width, left: progress * (100 - width) })
    setEdge({ start, end: lastVisible || max - el.scrollLeft <= 2 })
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  const scrollBy = (dir: 1 | -1) => {
    const el = track.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  const arrow =
    'flex size-11 items-center justify-center rounded-full border border-bronze text-bronze transition hover:bg-bronze hover:text-white disabled:pointer-events-none disabled:opacity-30'

  return (
    // Лента идёт на всю ширину экрана: первая карточка стоит по левому краю контента, а вправо карточки уходят к краю экрана
    <div role="region" aria-roledescription="карусель" aria-label={label} className="bleed-root">
      <ul
        ref={track}
        onScroll={update}
        className="bleed-track flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Children.map(children, (child) => (
          <li className="w-[72%] shrink-0 snap-start sm:w-[45%] md:w-[36%] lg:w-[27%]">{child}</li>
        ))}
      </ul>

      <div className="mx-auto mt-6 flex max-w-6xl items-center gap-6 px-4">
        <div className="relative h-px flex-1 bg-line" aria-hidden>
          <div
            className="absolute -top-px h-0.5 rounded-full bg-bronze transition-[left] duration-150"
            style={{ width: `${thumb.width}%`, left: `${thumb.left}%` }}
          />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => scrollBy(-1)} disabled={edge.start} aria-label="Назад" className={arrow}>
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
            </svg>
          </button>
          <button type="button" onClick={() => scrollBy(1)} disabled={edge.end} aria-label="Вперёд" className={arrow}>
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14m0 0-6-6m6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
