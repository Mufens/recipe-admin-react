import * as XLSX from 'xlsx'

export type FileFormat = 'json' | 'xlsx' | 'csv'

export const FORMAT_OPTIONS: { value: FileFormat; label: string }[] = [
  { value: 'json', label: 'JSON (.json)' },
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV (.csv)' },
]

const EXT_MAP: Record<string, FileFormat> = {
  json: 'json',
  xlsx: 'xlsx',
  xls: 'xlsx',
  csv: 'csv',
}

export function detectFormat(fileName: string): FileFormat | null {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return EXT_MAP[ext] ?? null
}

export function formatToExt(format: FileFormat): string {
  return format === 'xlsx' ? 'xlsx' : format
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function normalizeRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    if (!raw.length) {
      throw new Error('JSON 数组为空')
    }
    return raw.map((item, index) => {
      if (isPlainObject(item)) return item
      throw new Error(`JSON 数组第 ${index + 1} 项必须是对象`)
    })
  }
  if (isPlainObject(raw)) {
    return [raw]
  }
  throw new Error('JSON 需为对象数组，或单个对象')
}

/** 解析标准 JSON，或 JSONL/NDJSON（每行一个对象，如 enrich 输出的 recipes.json） */
export function parseJsonText(text: string): Record<string, unknown>[] {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('JSON 文件为空')
  }

  try {
    return normalizeRows(JSON.parse(trimmed))
  } catch {
    // 整文件不是合法 JSON 时，按 JSONL 逐行解析
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length <= 1) {
    throw new Error(
      'JSON 解析失败。请使用对象数组，或每行一个对象的 JSONL 格式',
    )
  }

  return lines.map((line, index) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(line)
    } catch {
      throw new Error(`第 ${index + 1} 行不是合法 JSON`)
    }
    if (!isPlainObject(parsed)) {
      throw new Error(`第 ${index + 1} 行必须是 JSON 对象`)
    }
    return parsed
  })
}

/** 将单元格值规范为可写入表格的标量；对象/数组转 JSON 字符串 */
function cellValue(value: unknown): string | number | boolean | null {
  if (value == null) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  return JSON.stringify(value)
}

/** 读表格单元格：尝试把 JSON 字符串还原为对象/数组 */
function parseCell(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return value
    }
  }
  return value
}

function rowsToSheetRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const keys = new Set<string>()
  for (const row of rows) {
    Object.keys(row).forEach((k) => keys.add(k))
  }
  const headers = [...keys]
  return rows.map((row) => {
    const out: Record<string, unknown> = {}
    for (const key of headers) {
      out[key] = cellValue(row[key])
    }
    return out
  })
}

function sheetToRows(sheet: XLSX.WorkSheet): Record<string, unknown>[] {
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
  })
  return raw.map((row) => {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(row)) {
      out[key] = parseCell(value)
    }
    return out
  })
}

async function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer()
}

async function readAsText(file: File): Promise<string> {
  return file.text()
}

export async function parseFileToRows(
  file: File,
  format: FileFormat,
): Promise<Record<string, unknown>[]> {
  if (format === 'json') {
    return parseJsonText(await readAsText(file))
  }

  if (format === 'csv') {
    const text = await readAsText(file)
    const workbook = XLSX.read(text, { type: 'string', codepage: 65001 })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!sheet) throw new Error('CSV 内容为空')
    return sheetToRows(sheet)
  }

  // xlsx / xls
  const buffer = await readAsArrayBuffer(file)
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new Error('Excel 中没有工作表')
  return sheetToRows(sheet)
}

export function rowsToBlob(
  rows: Record<string, unknown>[],
  format: FileFormat,
): Blob {
  if (!rows.length) {
    throw new Error('没有可转换的数据行')
  }

  if (format === 'json') {
    const text = `${JSON.stringify(rows, null, 2)}\n`
    return new Blob([text], { type: 'application/json;charset=utf-8' })
  }

  const sheetRows = rowsToSheetRows(rows)
  const sheet = XLSX.utils.json_to_sheet(sheetRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1')

  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(sheet)
    // BOM 便于 Excel 正确识别中文
    return new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  }

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export function buildDownloadName(sourceName: string, target: FileFormat): string {
  const base = sourceName.replace(/\.[^.]+$/, '') || 'converted'
  return `${base}.${formatToExt(target)}`
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: fileName,
  })
  a.click()
  URL.revokeObjectURL(url)
}

export async function convertFile(
  file: File,
  source: FileFormat,
  target: FileFormat,
): Promise<{ blob: Blob; fileName: string; rowCount: number }> {
  if (source === target) {
    throw new Error('源格式与目标格式相同，无需转换')
  }
  const rows = await parseFileToRows(file, source)
  const blob = rowsToBlob(rows, target)
  return {
    blob,
    fileName: buildDownloadName(file.name, target),
    rowCount: rows.length,
  }
}
