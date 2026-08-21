import type { ColumnType } from 'antd/es/table'
import type { ReactNode } from 'react'

export type ColumnFixed = 'left' | 'right'

export type TableColumnSettingItem = {
  key: string
  title: ReactNode
  /** 不可隐藏（如序号、操作列） */
  disable?: boolean
  /** 初始固定位置 */
  fixed?: ColumnFixed
}

/** 列定义扩展：在 antd ColumnType 基础上增加列设置相关的元信息 */
export type SmartColumn<T> = ColumnType<T> & {
  /** 在列设置面板中不可隐藏（如序号、操作列） */
  settingDisable?: boolean
}

/** 取列唯一标识：优先 key，其次 dataIndex */
export function getColumnKey<T>(col: ColumnType<T>): string {
  return String(col.key ?? col.dataIndex ?? '')
}

/** 把 antd 的 fixed（true | 'left' | 'right'）归一为 ColumnFixed | undefined */
export function normalizeFixed(
  fixed: ColumnType['fixed'],
): ColumnFixed | undefined {
  if (fixed === true || fixed === 'left') return 'left'
  if (fixed === 'right') return 'right'
  return undefined
}

/** 按固定位置重排：左固定 → 不固定 → 右固定 */
export function sortKeysByFixed(
  order: string[],
  fixedMap: Record<string, ColumnFixed | undefined>,
): string[] {
  const left: string[] = []
  const middle: string[] = []
  const right: string[] = []
  order.forEach((key) => {
    const fixed = fixedMap[key]
    if (fixed === 'left') left.push(key)
    else if (fixed === 'right') right.push(key)
    else middle.push(key)
  })
  return [...left, ...middle, ...right]
}
