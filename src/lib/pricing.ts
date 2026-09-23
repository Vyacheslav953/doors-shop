// Чистые функции расчёта: используются и в конфигураторе (браузер), и на сервере при сохранении заявки.

export type Region = 'moscow' | 'mo' | 'other'

export type ConfigDoor = {
  id: number | string
  name: string
  article?: string | null
  /** Розничная цена полотна (уже с наценкой) */
  basePrice: number
  /** Готовые размеры: они производятся на заводе, доплаты за них нет */
  sizes: { id: string; label: string; width: number; height: number }[]
  colors: { id: string; name: string; hex?: string | null; extra: number }[]
}

/** Правила выбора своего размера (настраиваются в админке) */
export type CustomSizeRules = {
  enabled: boolean
  minWidth: number
  maxWidth: number
  minHeight: number
  maxHeight: number
  /** Фиксированная доплата за любой нестандартный размер, ₽ */
  fee: number
  /** Доплата за каждый см сверх самого большого готового размера (отдельно по ширине и высоте), ₽ */
  perCm: number
}

export const CUSTOM_SIZE_STEP = 10 // мм
export const DEFAULT_CUSTOM_SIZE: CustomSizeRules = {
  enabled: true,
  minWidth: 550,
  maxWidth: 1000,
  minHeight: 1900,
  maxHeight: 2400,
  fee: 3000,
  perCm: 100,
}

export type ConfigSettings = {
  installPrice: number
  zones: { id: string; label: string; region: 'moscow' | 'mo'; price: number }[]
  customSize: CustomSizeRules
}

export type SizeDims = { width: number; height: number }

export type Selection = {
  /** Готовый размер. Игнорируется, если задан custom. */
  sizeId?: string
  /** Размер в мм с ползунков. Если совпал с готовым, доплаты нет. */
  custom?: SizeDims
  colorId?: string
  region: Region
  zoneId?: string
  install: boolean
}

export type QuoteLine = { label: string; value: number | null; note?: string }

export type Quote = {
  lines: QuoteLine[]
  total: number
  /** Стоимость доставки не входит в итог и будет названа менеджером */
  deliveryByManager: boolean
  /** Итоговый размер: свой (custom) или готовый, и доплата за него */
  size?: SizeDims & { custom: boolean; fee: number }
}

const rub = new Intl.NumberFormat('ru-RU')
export const formatRub = (n: number): string => `${rub.format(n)} ₽`

/** Розничная цена = закупочная × (1 + наценка), округление до 100 ₽ */
export const retailPrice = (factoryPrice: number, markupPercent: number): number =>
  Math.round((factoryPrice * (1 + markupPercent / 100)) / 100) * 100

/** Диапазон ползунков: правила из админки, расширенные так, чтобы в него попадали все готовые размеры */
export function customRange(door: ConfigDoor, rules: CustomSizeRules) {
  const ws = door.sizes.map((s) => s.width)
  const hs = door.sizes.map((s) => s.height)
  return {
    minWidth: Math.min(rules.minWidth, ...ws),
    maxWidth: Math.max(rules.maxWidth, ...ws),
    minHeight: Math.min(rules.minHeight, ...hs),
    maxHeight: Math.max(rules.maxHeight, ...hs),
  }
}

/** Приводит размер к шагу ползунка и границам диапазона */
export function clampSize(door: ConfigDoor, rules: CustomSizeRules, dims: SizeDims): SizeDims {
  const r = customRange(door, rules)
  const snap = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, Math.round(v / CUSTOM_SIZE_STEP) * CUSTOM_SIZE_STEP))
  return { width: snap(dims.width, r.minWidth, r.maxWidth), height: snap(dims.height, r.minHeight, r.maxHeight) }
}

export const findStandardSize = (door: ConfigDoor, dims: SizeDims) =>
  door.sizes.find((s) => s.width === dims.width && s.height === dims.height)

/** Доплата за размер: 0 для готовых, иначе фиксированная часть плюс надбавка за сантиметры сверх максимума готовых */
export function sizeSurcharge(door: ConfigDoor, rules: CustomSizeRules, dims: SizeDims): number {
  if (findStandardSize(door, dims)) return 0
  const maxW = Math.max(0, ...door.sizes.map((s) => s.width))
  const maxH = Math.max(0, ...door.sizes.map((s) => s.height))
  const overMm = Math.max(0, dims.width - maxW) + Math.max(0, dims.height - maxH)
  return rules.fee + Math.round(overMm / 10) * rules.perCm
}

export function computeQuote(door: ConfigDoor, settings: ConfigSettings, sel: Selection): Quote {
  const rules = settings.customSize
  const std = door.sizes.find((s) => s.id === sel.sizeId)
  const color = door.colors.find((c) => c.id === sel.colorId)
  const zone = settings.zones.find((z) => z.id === sel.zoneId && z.region === sel.region)

  const lines: QuoteLine[] = [{ label: 'Полотно', value: door.basePrice }]
  let total = door.basePrice

  // Размер: готовый без доплаты, свой (нестандартный) с доплатой
  let size: Quote['size']
  const dims = rules.enabled && sel.custom ? clampSize(door, rules, sel.custom) : std && { width: std.width, height: std.height }
  if (dims) {
    const fee = sizeSurcharge(door, rules, dims)
    size = { ...dims, custom: fee > 0, fee }
    if (fee > 0) {
      lines.push({ label: `Свой размер ${dims.width}×${dims.height}`, value: fee })
      total += fee
    }
  }

  if (color && color.extra) {
    lines.push({ label: `Цвет: ${color.name}`, value: color.extra })
    total += color.extra
  }

  const canInstall = sel.region !== 'other'
  if (sel.install && canInstall) {
    lines.push({ label: 'Монтаж', value: settings.installPrice })
    total += settings.installPrice
  }

  let deliveryByManager = false
  if (sel.region === 'other') {
    deliveryByManager = true
    lines.push({ label: 'Доставка ТК', value: null, note: 'рассчитает менеджер' })
  } else if (zone) {
    lines.push({ label: `Доставка: ${zone.label}`, value: zone.price })
    total += zone.price
  }

  return { lines, total, deliveryByManager, size }
}
