import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Configurator } from '@/components/Configurator'
import { Gallery } from '@/components/Gallery'
import { doorFactory, doorPhotos, getDoorBySlug, getSettings, mediaUrl, toConfigDoor, toConfigSettings } from '@/lib/data'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const door = await getDoorBySlug(slug)
  if (!door) return {}
  return { title: door.name, description: door.description ?? undefined }
}

export default async function DoorPage({ params }: Props) {
  const { slug } = await params
  const [door, settings] = await Promise.all([getDoorBySlug(slug), getSettings()])
  if (!door) notFound()
  const factory = doorFactory(door)

  const images = doorPhotos(door).flatMap((p) => {
    const src = mediaUrl(p, 'full')
    return src ? [{ src, alt: p.alt || door.name }] : []
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/catalog" className="hover:text-bronze">
          Каталог
        </Link>{' '}
        /{' '}
        {factory && (
          <>
            <Link href={`/catalog/factory/${factory.slug}`} className="hover:text-bronze">
              {factory.name}
            </Link>{' '}
            /{' '}
          </>
        )}
        {door.name}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Gallery images={images} name={door.name} promo={Boolean(door.promo)} />
        </div>

        <div>
          {(factory || door.series) && (
            <p className="text-sm uppercase tracking-[0.2em] text-bronze">
              {[factory?.name, door.series].filter(Boolean).join(' · ')}
            </p>
          )}
          <h1 className="mt-2 font-serif text-5xl font-semibold leading-tight">{door.name}</h1>
          {door.article && <p className="mt-2 text-sm text-muted">Артикул: {door.article}</p>}
          {door.description && <p className="mt-5 text-muted">{door.description}</p>}

          <div className="mt-10">
            <Configurator
              door={toConfigDoor(door, settings)}
              settings={toConfigSettings(settings)}
              phone={settings.phone}
              regionNote={settings.regionNote}
            />
          </div>

          {door.specs && door.specs.length > 0 && (
            <div className="mt-12">
              <h2 className="font-serif text-3xl font-semibold">Характеристики</h2>
              <dl className="mt-4 divide-y divide-line border-y border-line">
                {door.specs.map((s) => (
                  <div key={s.id} className="flex justify-between gap-6 py-3 text-sm">
                    <dt className="text-muted">{s.label}</dt>
                    <dd className="text-right font-medium">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
