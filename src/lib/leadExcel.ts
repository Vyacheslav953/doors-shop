// Excel-копия заявок: каждая заявка дописывается в файл независимо от того, сохранилась ли она в базу.
import ExcelJS from 'exceljs'
import fs from 'node:fs/promises'
import path from 'node:path'

import { resolveExcelPath } from './excelPath'

export type ExcelLead = {
  name: string
  phone: string
  city?: string
  configText?: string
  estimate?: number
  /** Что выбрал посетитель, в сыром виде */
  config?: unknown
  /** ID заявки в админке, если она сохранилась в базу */
  dbId?: number | string
  /** Где и как сохранена заявка */
  status: string
}

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

/** Название листа: месяц и год по московскому времени, например «Сентябрь 2026» */
export function monthSheetName(date: Date): string {
  const parts = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', month: 'numeric', year: 'numeric' }).formatToParts(date)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const year = parts.find((p) => p.type === 'year')?.value
  return `${MONTHS[month - 1]} ${year}`
}
const HEADERS = ['Дата', 'ID в админке', 'Имя', 'Телефон', 'Город', 'Конфигурация', 'Ориентировочно, ₽', 'Данные выбора', 'Статус сохранения']
const WIDTHS = [20, 14, 20, 20, 18, 50, 18, 40, 40]

const filePath = resolveExcelPath

// Заявки могут прийти одновременно, а xlsx нельзя дописывать параллельно: выстраиваем в очередь
let chain: Promise<unknown> = Promise.resolve()
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn)
  chain = run.catch(() => undefined)
  return run
}

function addHeader(sheet: ExcelJS.Worksheet) {
  sheet.addRow(HEADERS)
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFE8D3' } }
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  WIDTHS.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w
  })
}

function toRow(lead: ExcelLead, now: Date): (string | number)[] {
  return [
    now.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
    lead.dbId ?? '',
    lead.name,
    lead.phone,
    lead.city ?? '',
    lead.configText ?? '',
    lead.estimate ?? '',
    lead.config ? JSON.stringify(lead.config) : '',
    lead.status.slice(0, 300),
  ]
}

const exists = (p: string) => fs.access(p).then(() => true, () => false)

/** Возвращает путь к файлу, в который записана заявка. Бросает ошибку, только если записать не удалось совсем. */
export function saveLeadToExcel(lead: ExcelLead, now: Date = new Date()): Promise<string> {
  return serial(async () => {
    const file = filePath()
    const sheetName = monthSheetName(now)
    await fs.mkdir(path.dirname(file), { recursive: true })

    try {
      const wb = new ExcelJS.Workbook()
      if (await exists(file)) await wb.xlsx.readFile(file)
      // Лист месяца создаётся при первой заявке этого месяца, остальные листы не трогаем
      let sheet = wb.getWorksheet(sheetName)
      if (!sheet) {
        sheet = wb.addWorksheet(sheetName)
        addHeader(sheet)
      }
      const row = sheet.addRow(toRow(lead, now))
      row.alignment = { vertical: 'top', wrapText: true }

      // Пишем во временный файл и переименовываем, чтобы не испортить основной при сбое
      const tmp = `${file}.tmp`
      await wb.xlsx.writeFile(tmp)
      await fs.rename(tmp, file)
      return file
    } catch (err) {
      // Основной файл мог быть открыт в Excel или повредиться: сохраняем заявку в отдельный файл
      console.error('[lead] main Excel file failed, writing standalone file', err)
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      const alt = file.replace(/\.xlsx$/i, '') + `-${stamp}.xlsx`
      const wb = new ExcelJS.Workbook()
      const sheet = wb.addWorksheet(sheetName)
      addHeader(sheet)
      sheet.addRow(toRow(lead, now))
      await wb.xlsx.writeFile(alt)
      return alt
    }
  })
}
