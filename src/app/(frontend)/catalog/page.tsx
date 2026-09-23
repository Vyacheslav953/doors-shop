import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { DoorCard } from '@/components/DoorCard'
import { FactoryCard } from '@/components/FactoryCard'
import { getDoors, getFactories, getSettings } from '@/lib/data'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Каталог межкомнатных дверей' }

/** Каталог начинается с выбора фабрики; двери показываются внутри фабрики */
export default async function CatalogPage() {
  const factories = await getFactories()

  // Одна фабрика: выбирать не из чего, сразу показываем её двери
  if (factories.length === 1) redirect(`/catalog/factory/${factories[0].slug}`)

  // Фабрики ещё не заведены: показываем все двери, чтобы каталог не был пустым
  if (factories.length === 0) {
    const [doors, settings] = await Promise.all([getDoors(), getSettings()])
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-serif text-5xl font-semibold">Каталог</h1>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {doors.map((d) => (
            <DoorCard key={d.id} door={d} settings={settings} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-serif text-5xl font-semibold">Каталог</h1>
      <p className="mt-3 text-lg text-muted">Выберите фабрику</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {factories.map((f) => (
          <FactoryCard key={f.id} factory={f} />
        ))}
      </div>
    </div>
  )
}
