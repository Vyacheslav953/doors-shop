import type { Region } from './pricing'

/** Выбор посетителя в конфигураторе, уходит вместе с заявкой */
export type LeadConfig = {
  doorId: number | string
  sizeId?: string
  /** Размер в мм с ползунков (если совпал с готовым, доплаты нет) */
  customWidth?: number
  customHeight?: number
  colorId?: string
  region: Region
  zoneId?: string
  install: boolean
  city?: string
  /** Что посетитель видел на странице. Используется только в запасном Excel-файле, если база недоступна. */
  clientView?: { text: string; total: number }
}
