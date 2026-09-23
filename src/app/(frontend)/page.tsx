import Link from 'next/link'

import { Carousel } from '@/components/Carousel'
import { DoorCard } from '@/components/DoorCard'
import { Hero } from '@/components/Hero'
import { getBestsellers, getDoors, getHomePage, getSettings } from '@/lib/data'

export const dynamic = 'force-dynamic'

const steps = [
  { title: 'Выберите модель', text: 'Посмотрите каталог и откройте понравившуюся дверь.' },
  { title: 'Соберите комплектацию', text: 'Размер, цвет, монтаж и доставка. Ориентировочная цена считается сразу.' },
  { title: 'Мы перезвоним', text: 'Менеджер уточнит наличие, назовёт точную стоимость и сроки.' },
]

export default async function HomePage() {
  const [doors, settings, home, hits] = await Promise.all([getDoors(), getSettings(), getHomePage(), getBestsellers()])
  const featured = doors.slice(0, 8)

  return (
    <>
      <Hero hero={home.hero ?? {}} />

      {hits.length > 0 && (
        <section id="catalog" className="scroll-mt-16 bg-cream/60 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h2 className="font-serif text-4xl font-light uppercase tracking-[0.15em] md:text-5xl">Хит продаж</h2>
              <div className="mx-auto mt-5 h-px w-24 bg-bronze/60" />
            </div>
          </div>
          {/* Карусель вне контейнера: идёт на всю ширину экрана */}
          <div className="mt-10">
            <Carousel label="Хит продаж">
              {hits.map((d) => (
                <DoorCard key={d.id} door={d} settings={settings} swatches showFactory />
              ))}
            </Carousel>
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section id={hits.length > 0 ? 'all-doors' : 'catalog'} className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="font-serif text-4xl font-semibold">Каталог</h2>
            <Link href="/catalog" className="text-sm font-medium text-bronze hover:underline">
              В каталог →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((d) => (
              <DoorCard key={d.id} door={d} settings={settings} showFactory />
            ))}
          </div>
        </section>
      )}

      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16">
        <h2 className="font-serif text-4xl font-semibold">Как заказать</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-line bg-card p-6">
              <span className="font-serif text-5xl text-bronze/60">{i + 1}</span>
              <h3 className="mt-2 font-serif text-2xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="delivery" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-10">
        <div className="grid gap-6 rounded-3xl bg-cream/70 p-8 md:grid-cols-3 md:p-12">
          <div>
            <h2 className="font-serif text-4xl font-semibold">Доставка и монтаж</h2>
          </div>
          <div>
            <h3 className="font-semibold">Москва и Подмосковье</h3>
            <p className="mt-2 text-muted">Привозим своей службой доставки и по желанию устанавливаем двери.</p>
          </div>
          <div>
            <h3 className="font-semibold">Другие регионы</h3>
            <p className="mt-2 text-muted">{settings.regionNote}</p>
          </div>
        </div>
      </section>
    </>
  )
}
