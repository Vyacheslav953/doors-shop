import { NextResponse } from 'next/server'

import { getPayloadClient, getSettings, toConfigDoor, toConfigSettings } from '@/lib/data'
import { saveLeadToExcel, type ExcelLead } from '@/lib/leadExcel'
import { notifyTelegram } from '@/lib/notify'
import { formatPhone, normalizePhone } from '@/lib/phone'
import { computeQuote, formatRub, type Region } from '@/lib/pricing'

// Простое ограничение частоты в памяти процесса: 5 заявок с одного IP за 10 минут
const hits = new Map<string, number[]>()
const WINDOW = 10 * 60_000
const LIMIT = 5

function limited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 1000) for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW)) hits.delete(k)
  return recent.length > LIMIT
}

const str = (v: unknown): string | undefined => (typeof v === 'string' || typeof v === 'number' ? String(v) : undefined)
const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e))
const regionNames: Record<Region, string> = { moscow: 'Москва', mo: 'Подмосковье', other: 'Другой регион' }

type Prepared = {
  doorId?: number
  summary?: string
  estimate?: number
  city?: string
  config?: Record<string, unknown>
}

/** Пересчитывает конфигурацию на сервере, чтобы менеджер видел честную цену. Читает базу, поэтому может бросить ошибку. */
async function prepareLead(cfg: any): Promise<Prepared> {
  const doorId = Number(cfg?.doorId)
  if (!cfg || !Number.isFinite(doorId)) return {}

  const payload = await getPayloadClient()
  const door = await payload.findByID({ collection: 'doors', id: doorId, depth: 2 }).catch((err) => {
    // «Не найдена» это нормально (дверь скрыли), а любая другая ошибка означает проблемы с базой
    if (err?.status === 404 || err?.name === 'NotFound') return null
    throw err
  })
  if (!door?.published) return {}

  const settings = await getSettings()
  const cd = toConfigDoor(door, settings)
  const cs = toConfigSettings(settings)
  const region: Region = cfg.region === 'mo' || cfg.region === 'other' ? cfg.region : 'moscow'
  // Размер: приходит в мм с ползунков (приводится к диапазону и шагу), иначе берём готовый по id
  const w = Number(cfg.customWidth)
  const h = Number(cfg.customHeight)
  const sel = {
    sizeId: str(cfg.sizeId),
    custom: cs.customSize.enabled && Number.isFinite(w) && Number.isFinite(h) ? { width: w, height: h } : undefined,
    colorId: str(cfg.colorId),
    region,
    zoneId: str(cfg.zoneId),
    install: cfg.install === true,
  }
  const quote = computeQuote(cd, cs, sel)
  const color = cd.colors.find((c) => c.id === sel.colorId)
  const city = region === 'other' ? str(cfg.city)?.trim().slice(0, 80) : undefined

  return {
    doorId: door.id,
    estimate: quote.total,
    city,
    config: sel,
    summary: [
      `Дверь: ${door.name}${door.article ? ` (${door.article})` : ''}`,
      quote.size
        ? `Размер: ${quote.size.width}×${quote.size.height} мм${quote.size.custom ? ` (СВОЙ, доплата ${formatRub(quote.size.fee)})` : ' (готовый)'}`
        : null,
      color ? `Цвет: ${color.name}` : null,
      `Куда: ${regionNames[region]}${city ? `, ${city}` : ''}`,
      `Монтаж: ${sel.install && region !== 'other' ? 'да' : 'нет'}`,
      ...quote.lines.map((l) => `• ${l.label}: ${l.value === null ? l.note : formatRub(l.value)}`),
      quote.deliveryByManager ? '(доставку ТК считает менеджер)' : null,
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

/** Никогда не бросает ошибку: результат или причина сбоя возвращаются в объекте */
async function saveToDatabase(name: string, phone: string, cfg: any): Promise<{ id?: number; prepared?: Prepared; error?: unknown }> {
  let prepared: Prepared | undefined
  try {
    prepared = await prepareLead(cfg)
    const payload = await getPayloadClient()
    const doc = await payload.create({
      collection: 'leads',
      data: {
        name,
        phone,
        city: prepared.city,
        door: prepared.doorId,
        summary: prepared.summary,
        estimate: prepared.estimate,
        config: prepared.config,
      },
    })
    return { id: doc.id, prepared }
  } catch (error) {
    return { prepared, error }
  }
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (limited(ip)) {
    return NextResponse.json({ error: 'Слишком много заявок. Попробуйте позже или позвоните нам.' }, { status: 429 })
  }

  let body: Record<string, any>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }

  // Ловушка для ботов: делаем вид, что всё хорошо, но ничего не сохраняем
  if (body.website) return NextResponse.json({ ok: true })

  const name = String(body.name ?? '').trim().slice(0, 80)
  if (name.length < 2) return NextResponse.json({ error: 'Укажите имя' }, { status: 400 })

  const digits = normalizePhone(String(body.phone ?? ''))
  if (!digits) return NextResponse.json({ error: 'Проверьте номер телефона' }, { status: 400 })

  if (body.consent !== true) {
    return NextResponse.json({ error: 'Нужно согласие на обработку данных' }, { status: 400 })
  }

  const phone = formatPhone(digits)
  const cfg = body.config

  // 1. База (админка)
  const db = await saveToDatabase(name, phone, cfg)
  if (db.error) console.error('[lead] database save failed', db.error)

  // 2. Excel: пишется всегда. Если база не смогла пересчитать конфигурацию, берём то, что видел посетитель.
  const p = db.prepared
  const view = cfg?.clientView
  const clientText = typeof view?.text === 'string' ? view.text.slice(0, 1500) : undefined
  const region = cfg?.region === 'mo' || cfg?.region === 'other' ? (cfg.region as Region) : cfg ? 'moscow' : undefined
  const city = p?.city ?? (region === 'other' ? str(cfg?.city)?.trim().slice(0, 80) : undefined)
  const configText = p?.summary ?? (clientText ? `(со страницы, не проверено сервером)\n${clientText}` : undefined)

  const excelLead: ExcelLead = {
    name,
    phone,
    city,
    configText,
    estimate: p?.estimate ?? (Number.isFinite(view?.total) ? Number(view.total) : undefined),
    config:
      p?.config ??
      (cfg && {
        doorId: str(cfg.doorId),
        sizeId: str(cfg.sizeId),
        customWidth: str(cfg.customWidth),
        customHeight: str(cfg.customHeight),
        colorId: str(cfg.colorId),
        region,
        zoneId: str(cfg.zoneId),
        install: cfg.install === true,
      }),
    dbId: db.id,
    status: db.error ? `ТОЛЬКО В EXCEL, база недоступна: ${errMsg(db.error)}` : 'админка + Excel',
  }

  let excelFile: string | undefined
  let excelError: unknown
  try {
    excelFile = await saveLeadToExcel(excelLead)
  } catch (err) {
    excelError = err
    console.error('[lead] Excel save failed', err)
  }

  // 3. Уведомление менеджеру: одно на заявку, со статусом сохранения
  const status = db.error
    ? excelError
      ? '🚨 НЕ СОХРАНЕНА НИГДЕ (ни база, ни Excel), перезвоните клиенту!'
      : `⚠️ База недоступна, заявка только в Excel: ${excelFile}`
    : excelError
      ? '⚠️ Заявка в админке, но в Excel записать не удалось'
      : '✅ Заявка сохранена в админке и в Excel'
  void notifyTelegram(
    [
      '🚪 Новая заявка Doors M',
      `Имя: ${name}`,
      `Телефон: ${phone}`,
      city ? `Город: ${city}` : null,
      configText ? `\n${configText}` : null,
      excelLead.estimate ? `\nОриентировочно: ${formatRub(excelLead.estimate)}` : null,
      `\n${status}`,
    ]
      .filter(Boolean)
      .join('\n'),
  )

  if (db.error && excelError) {
    // Последний рубеж: данные остаются в логах сервера и в Telegram
    console.error('[lead] LEAD NOT SAVED ANYWHERE:', JSON.stringify(excelLead))
    return NextResponse.json({ error: 'Не удалось сохранить заявку. Пожалуйста, позвоните нам.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
