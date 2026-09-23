import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DoorCard } from '@/components/DoorCard'
import { getDoors, getFactoryBySlug, getSeriesList, getSettings } from '@/lib/data'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ series?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const factory = await getFactoryBySlug((await params).slug)
  return factory ? { title: `${factory.name}: каталог дверей` } : {}
}

export default async function FactoryPage({ params, searchParams }: Props) {
  const [{ slug }, { series }] = await Promise.all([params, searchParams])
  const factory = await getFactoryBySlug(slug)
  if (!factory) notFound()

  const [doors, seriesList, settings] = await Promise.all([
    getDoors(series, factory.id),
    getSeriesList(factory.id),
    getSettings(),
  ])

  const base = `/catalog/factory/${factory.slug}`
  const chip = (on: boolean) =>
    `rounded-full border px-4 py-2 text-sm transition ${
      on ? 'border-bronze bg-bronze text-white' : 'border-line bg-card hover:border-bronze'
    }`

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/catalog" className="hover:text-bronze">
          Каталог
        </Link>{' '}
        / {factory.name}
      </nav>
      <h1 className="font-serif text-5xl font-semibold">{factory.name}</h1>
      {factory.description && <p className="mt-3 max-w-2xl text-lg text-muted">{factory.description}</p>}

      {seriesList.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={base} className={chip(!series)}>
            Все
          </Link>
          {seriesList.map((s) => (
            <Link key={s} href={`${base}?series=${encodeURIComponent(s)}`} className={chip(series === s)}>
              {s}
            </Link>
          ))}
        </div>
      )}

      {doors.length === 0 ? (
        <p className="mt-10 text-muted">У этой фабрики пока нет моделей.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {doors.map((d) => (
            <DoorCard key={d.id} door={d} settings={settings} />
          ))}
        </div>
      )}
    </div>
  )
}
