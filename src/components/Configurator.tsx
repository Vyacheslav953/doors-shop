'use client'

import { useMemo, useState } from 'react'

import type { LeadConfig } from '@/lib/lead'
import { telHref } from '@/lib/phone'
import {
  CUSTOM_SIZE_STEP,
  computeQuote,
  customRange,
  findStandardSize,
  formatRub,
  sizeSurcharge,
  type ConfigDoor,
  type ConfigSettings,
  type Region,
  type SizeDims,
} from '@/lib/pricing'

import { CallbackButton } from './CallbackButton'
import { btnGhost } from './ui'

const regions: { id: Region; label: string }[] = [
  { id: 'moscow', label: 'Москва' },
  { id: 'mo', label: 'Подмосковье' },
  { id: 'other', label: 'Другой регион' },
]

const chip = (on: boolean) =>
  `rounded-full border px-4 py-2 text-sm transition ${
    on ? 'border-bronze bg-bronze text-white' : 'border-line bg-card hover:border-bronze'
  }`

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-3 font-serif text-xl font-semibold">
        <span className="flex size-7 items-center justify-center rounded-full border border-bronze text-sm text-bronze">
          {n}
        </span>
        {title}
      </h3>
      {children}
    </section>
  )
}

/** Шкала размера в мм: риски показывают готовые размеры, для которых доплаты нет */
function SizeSlider({
  label,
  value,
  min,
  max,
  marks,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  marks: number[]
  onChange: (v: number) => void
}) {
  const at = (v: number) => (max > min ? (v - min) / (max - min) : 0)
  // Ползунок шириной 20 px ходит от 10 до (ширина - 10) px, поэтому риски и заливка считаются с тем же отступом
  const pos = (v: number) => `calc(10px + (100% - 20px) * ${at(v)})`

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-semibold tabular-nums">{value} мм</span>
      </div>
      <div className="relative mt-1">
        <input
          type="range"
          min={min}
          max={max}
          step={CUSTOM_SIZE_STEP}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={`${label}, мм`}
          className="range-bronze"
          style={{ '--p': pos(value) } as React.CSSProperties}
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[14px]">
          {marks.map((m) => (
            <span key={m} className="absolute h-2 w-px bg-bronze/70" style={{ left: pos(m) }} />
          ))}
        </div>
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted tabular-nums">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

export function Configurator({
  door,
  settings,
  phone,
  regionNote,
}: {
  door: ConfigDoor
  settings: ConfigSettings
  phone: string
  regionNote?: string | null
}) {
  // Размер в мм: готовые размеры и шкалы меняют одно и то же значение, готовым он считается, если совпал с одним из них
  const [dims, setDims] = useState<SizeDims>({ width: door.sizes[0]?.width ?? 800, height: door.sizes[0]?.height ?? 2000 })
  const [colorId, setColorId] = useState(door.colors[0]?.id)
  const [region, setRegion] = useState<Region>('moscow')
  const [zoneByRegion, setZoneByRegion] = useState<Record<string, string>>({})
  const [install, setInstall] = useState(false)
  const [city, setCity] = useState('')

  const zones = settings.zones.filter((z) => z.region === region)
  const zoneId = zones.find((z) => z.id === zoneByRegion[region])?.id ?? zones[0]?.id
  const canInstall = region !== 'other'
  const withInstall = install && canInstall

  const rules = settings.customSize
  const range = customRange(door, rules)
  const standard = findStandardSize(door, dims)
  const surcharge = sizeSurcharge(door, rules, dims)
  const sizeId = standard?.id

  const quote = useMemo(
    () =>
      computeQuote(door, settings, {
        sizeId,
        custom: rules.enabled ? dims : undefined,
        colorId,
        region,
        zoneId,
        install: withInstall,
      }),
    [door, settings, rules.enabled, sizeId, dims, colorId, region, zoneId, withInstall],
  )

  const config: LeadConfig = {
    doorId: door.id,
    sizeId,
    customWidth: dims.width,
    customHeight: dims.height,
    colorId,
    region,
    zoneId,
    install: withInstall,
    city: region === 'other' ? city.trim() || undefined : undefined,
    clientView: {
      total: quote.total,
      text: [
        `Дверь: ${door.name}${door.article ? ` (${door.article})` : ''}`,
        `Размер: ${dims.width}×${dims.height} мм${surcharge > 0 ? ' (свой)' : ''}`,
        `Куда: ${regions.find((r) => r.id === region)?.label}`,
        ...quote.lines.map((l) => `${l.label}: ${l.value === null ? l.note : formatRub(l.value)}`),
      ].join('\n'),
    },
  }

  const selectedColor = door.colors.find((c) => c.id === colorId)

  return (
    <div className="space-y-8">
      {door.sizes.length > 0 && (
        <Step n={1} title="Размер полотна, мм">
          <p className="mb-2 text-sm text-muted">Готовые размеры, без доплаты:</p>
          <div className="flex flex-wrap gap-2">
            {door.sizes.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={s.id === sizeId}
                onClick={() => setDims({ width: s.width, height: s.height })}
                className={chip(s.id === sizeId)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {rules.enabled && (
            <div className="mt-5 rounded-xl border border-line bg-card p-4">
              <p className="text-sm font-medium">Или задайте свой размер</p>
              <div className="mt-4 space-y-5">
                <SizeSlider
                  label="Ширина"
                  value={dims.width}
                  min={range.minWidth}
                  max={range.maxWidth}
                  marks={[...new Set(door.sizes.map((s) => s.width))]}
                  onChange={(width) => setDims((d) => ({ ...d, width }))}
                />
                <SizeSlider
                  label="Высота"
                  value={dims.height}
                  min={range.minHeight}
                  max={range.maxHeight}
                  marks={[...new Set(door.sizes.map((s) => s.height))]}
                  onChange={(height) => setDims((d) => ({ ...d, height }))}
                />
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-muted">
                <span aria-hidden className="inline-block h-2 w-px bg-bronze/70" />
                риски на шкале: готовые размеры
              </p>
              <p className={`mt-3 text-sm ${surcharge > 0 ? 'font-medium text-ink' : 'text-muted'}`} aria-live="polite">
                {surcharge > 0
                  ? `Свой размер ${dims.width}×${dims.height} мм: доплата +${formatRub(surcharge)}`
                  : 'Готовый размер, доплаты нет'}
              </p>
              {surcharge > 0 && (
                <p className="mt-1 text-xs text-muted">Нестандартный размер изготавливается под заказ, срок назовёт менеджер.</p>
              )}
            </div>
          )}
        </Step>
      )}

      {door.colors.length > 0 && (
        <Step n={2} title="Цвет">
          <div className="flex flex-wrap gap-3">
            {door.colors.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-label={c.name}
                aria-pressed={c.id === colorId}
                title={c.name}
                onClick={() => setColorId(c.id)}
                className={`size-11 rounded-full border-2 p-0.5 transition ${
                  c.id === colorId ? 'border-bronze' : 'border-transparent hover:border-line'
                }`}
              >
                <span className="block size-full rounded-full border border-black/10" style={{ background: c.hex || '#ddd' }} />
              </button>
            ))}
          </div>
          {selectedColor && (
            <p className="mt-2 text-sm text-muted">
              {selectedColor.name}
              {selectedColor.extra > 0 && ` (+${formatRub(selectedColor.extra)})`}
            </p>
          )}
        </Step>
      )}

      <Step n={3} title="Куда доставить">
        <div className="flex flex-wrap gap-2">
          {regions.map((r) => (
            <button key={r.id} type="button" aria-pressed={r.id === region} onClick={() => setRegion(r.id)} className={chip(r.id === region)}>
              {r.label}
            </button>
          ))}
        </div>
        {region !== 'other' && zones.length > 0 && (
          <div className="mt-3 space-y-2">
            {zones.map((z) => (
              <label
                key={z.id}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                  z.id === zoneId ? 'border-bronze bg-card' : 'border-line'
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="zone"
                    checked={z.id === zoneId}
                    onChange={() => setZoneByRegion((prev) => ({ ...prev, [region]: z.id }))}
                    className="accent-bronze"
                  />
                  {z.label}
                </span>
                <span className="font-semibold">{formatRub(z.price)}</span>
              </label>
            ))}
          </div>
        )}
        {region === 'other' && (
          <div className="mt-3 space-y-2">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ваш город"
              maxLength={80}
              aria-label="Ваш город"
              className="w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-base outline-none focus:border-bronze focus:ring-2 focus:ring-bronze/30"
            />
            {regionNote && <p className="text-sm text-muted">{regionNote}</p>}
          </div>
        )}
      </Step>

      <Step n={4} title="Монтаж">
        {canInstall ? (
          <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${install ? 'border-bronze bg-card' : 'border-line'}`}>
            <span className="flex items-center gap-3">
              <input type="checkbox" checked={install} onChange={(e) => setInstall(e.target.checked)} className="size-4 accent-bronze" />
              Нужен монтаж двери
            </span>
            <span className="font-semibold">{formatRub(settings.installPrice)}</span>
          </label>
        ) : (
          <p className="text-sm text-muted">Монтаж выполняем в Москве и Подмосковье.</p>
        )}
      </Step>

      <div className="rounded-2xl border border-line bg-cream/60 p-5">
        <ul className="space-y-1.5 text-sm">
          {quote.lines.map((l) => (
            <li key={l.label} className="flex justify-between gap-4">
              <span className="text-muted">{l.label}</span>
              <span>{l.value === null ? l.note : formatRub(l.value)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-4">
          <span className="text-sm text-muted">Ориентировочно{quote.deliveryByManager && ' (без доставки)'}</span>
          <span className="font-serif text-4xl font-bold">{formatRub(quote.total)}</span>
        </div>
        <p className="mt-2 text-xs text-muted">Точную стоимость, наличие и сроки назовёт менеджер.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <CallbackButton config={config} className="inline-flex flex-1 items-center justify-center rounded-full bg-bronze px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-bronze-dark">
          Заказать звонок
        </CallbackButton>
        <a href={telHref(phone)} className={`${btnGhost} flex-1 py-3.5`}>
          Позвонить {phone}
        </a>
      </div>
    </div>
  )
}
