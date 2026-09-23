import config from '@payload-config'
import { getPayload } from 'payload'

import type { Door, Factory, HomePage, Media, SiteSetting } from '@/payload-types'

import { DEFAULT_CUSTOM_SIZE, retailPrice, type ConfigDoor, type ConfigSettings } from './pricing'

export const getPayloadClient = async () => getPayload({ config })

export async function getSettings(): Promise<SiteSetting> {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings' })
}

export async function getHomePage(): Promise<HomePage> {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'home-page', depth: 1 })
}

export function toConfigSettings(s: SiteSetting): ConfigSettings {
  const c = s.customSize
  const d = DEFAULT_CUSTOM_SIZE
  return {
    installPrice: s.installPrice,
    // В старых записях группы может не быть: берём значения по умолчанию
    customSize: {
      enabled: c?.enabled ?? d.enabled,
      minWidth: c?.minWidth ?? d.minWidth,
      maxWidth: c?.maxWidth ?? d.maxWidth,
      minHeight: c?.minHeight ?? d.minHeight,
      maxHeight: c?.maxHeight ?? d.maxHeight,
      fee: c?.fee ?? d.fee,
      perCm: c?.perCm ?? d.perCm,
    },
    zones: (s.deliveryZones ?? []).map((z) => ({
      id: String(z.id),
      label: z.label,
      region: z.region,
      price: z.price,
    })),
  }
}

export const doorRetailPrice = (door: Door, s: SiteSetting): number =>
  retailPrice(door.factoryPrice, door.markupPercent ?? s.markupPercent)

export function toConfigDoor(door: Door, s: SiteSetting): ConfigDoor {
  const colors = (door.colors ?? []).filter((c): c is Exclude<typeof c, number> => typeof c === 'object')
  return {
    id: door.id,
    name: door.name,
    article: door.article,
    basePrice: doorRetailPrice(door, s),
    sizes: (door.sizes ?? []).map((sz) => ({
      id: String(sz.id),
      label: `${sz.width}×${sz.height}`,
      width: sz.width,
      height: sz.height,
    })),
    colors: colors.map((c) => ({ id: String(c.id), name: c.name, hex: c.hex, extra: c.extra ?? 0 })),
  }
}

/** 'original' отдаёт файл как загружен (для баннера, где нужна полная резкость), остальные варианты это уменьшенные копии */
export function mediaUrl(
  m: Media | number | null | undefined,
  size: 'card' | 'full' | 'original' = 'card',
): string | null {
  if (!m || typeof m !== 'object') return null
  const url = size === 'original' ? m.url : (m.sizes?.[size]?.url ?? m.url)
  if (!url) return null
  // Версия в адресе: при замене файла с тем же именем браузер и кэш картинок Next не отдадут старую копию
  return m.updatedAt ? `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(m.updatedAt)}` : url
}

export function doorPhotos(door: Door): Media[] {
  return (door.photos ?? []).filter((p): p is Media => typeof p === 'object')
}

/** Фабрика двери, если она загружена (при depth ≥ 1), иначе null */
export const doorFactory = (door: Door): Factory | null =>
  door.factory && typeof door.factory === 'object' ? door.factory : null

export type FactoryWithCount = Factory & { doorCount: number }

/** Фабрики в заданном в админке порядке, с числом показываемых дверей */
export async function getFactories(): Promise<FactoryWithCount[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'factories', sort: 'sortOrder', limit: 50, depth: 1 })
  return Promise.all(
    docs.map(async (f) => {
      const { totalDocs } = await payload.count({
        collection: 'doors',
        where: { factory: { equals: f.id }, published: { equals: true } },
      })
      return { ...f, doorCount: totalDocs }
    }),
  )
}

export async function getFactoryBySlug(slug: string): Promise<Factory | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'factories', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return docs[0] ?? null
}

export async function getDoors(series?: string, factoryId?: number): Promise<Door[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'doors',
    where: {
      published: { equals: true },
      ...(series ? { series: { equals: series } } : {}),
      ...(factoryId ? { factory: { equals: factoryId } } : {}),
    },
    sort: 'name',
    limit: 200,
    depth: 2,
  })
  return docs
}

export async function getBestsellers(): Promise<Door[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'doors',
    where: { published: { equals: true }, bestseller: { equals: true } },
    sort: 'name',
    limit: 12,
    depth: 2,
  })
  return docs
}

export async function getDoorBySlug(slug: string): Promise<Door | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'doors',
    where: { slug: { equals: slug }, published: { equals: true } },
    limit: 1,
    depth: 2,
  })
  return docs[0] ?? null
}

export async function getSeriesList(factoryId?: number): Promise<string[]> {
  const doors = await getDoors(undefined, factoryId)
  return [...new Set(doors.map((d) => d.series).filter((s): s is string => Boolean(s)))].sort()
}
