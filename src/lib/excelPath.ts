// Путь к Excel-файлу заявок. Задаётся в админке (Настройки сайта), но читается из локального файла-зеркала,
// а не из базы: Excel нужен в том числе тогда, когда база недоступна.
import fs from 'node:fs'
import path from 'node:path'

export const DEFAULT_EXCEL_PATH = './data/leads.xlsx'

const mirrorFile = () => path.resolve('./data/excel-path.json')

/** Полный путь, в который сейчас пишутся заявки: админка, затем переменная LEADS_EXCEL_PATH, затем значение по умолчанию */
export function resolveExcelPath(): string {
  try {
    const saved = JSON.parse(fs.readFileSync(mirrorFile(), 'utf8'))?.path
    if (typeof saved === 'string' && saved.trim()) return path.resolve(saved.trim())
  } catch {
    // зеркала нет или оно повреждено, используем значения по умолчанию
  }
  return path.resolve(process.env.LEADS_EXCEL_PATH || DEFAULT_EXCEL_PATH)
}

/** Запоминает путь из админки. Пустое значение удаляет зеркало. */
export function saveExcelPathMirror(p: string | null | undefined): void {
  const value = p?.trim()
  if (!value) {
    fs.rmSync(mirrorFile(), { force: true })
    return
  }
  fs.mkdirSync(path.dirname(mirrorFile()), { recursive: true })
  fs.writeFileSync(mirrorFile(), JSON.stringify({ path: value }), 'utf8')
}

/** Возвращает текст ошибки или null, если путь подходит */
export function checkExcelPath(p: string): string | null {
  const full = path.resolve(p)
  if (!/\.xlsx$/i.test(full)) return 'Путь должен заканчиваться на .xlsx, например D:\\Заявки\\leads.xlsx'
  try {
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) return 'Указана папка, а нужен файл (.xlsx)'
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.accessSync(path.dirname(full), fs.constants.W_OK)
  } catch {
    return 'Нет доступа к папке: её нельзя создать или в неё нельзя писать'
  }
  return null
}
