import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getColumnKey,
  normalizeFixed,
  sortKeysByFixed,
  type ColumnFixed,
  type SmartColumn,
  type TableColumnSettingItem,
} from './types'

/** 持久化到 localStorage 的列设置状态 */
type PersistedState = {
  columnOrder: string[]
  visibleKeys: string[]
  fixedMap: Record<string, ColumnFixed | undefined>
}

/** localStorage key 前缀，防止与其他模块冲突 */
const STORAGE_PREFIX = 'smart-table'

/** 读取持久化的列设置，容错：解析失败/结构非法/隐私模式均返回 null */
function readPersisted(storageKey: string): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const p = parsed as Partial<PersistedState>
    if (!Array.isArray(p.columnOrder) || !Array.isArray(p.visibleKeys))
      return null
    return {
      columnOrder: p.columnOrder,
      visibleKeys: p.visibleKeys,
      fixedMap:
        p.fixedMap && typeof p.fixedMap === 'object' ? p.fixedMap : {},
    }
  } catch {
    return null
  }
}

/** 写入持久化，容错：配额超限/隐私模式/序列化失败静默失败 */
function writePersisted(storageKey: string, state: PersistedState) {
  try {
    localStorage.setItem(
      STORAGE_PREFIX + storageKey,
      JSON.stringify(state),
    )
  } catch {
    // ignore
  }
}

/**
 * 计算初始 state：有持久化且 keys 匹配则用持久化；
 * 列有增删时 merge（保留仍存在的列设置 + 新列用默认）；
 * 无持久化或失效则用默认。
 */
function computeInitialState(
  defaultKeys: string[],
  defaultFixedMap: Record<string, ColumnFixed | undefined>,
  storageKey?: string,
): PersistedState {
  const fallback: PersistedState = {
    columnOrder: sortKeysByFixed(defaultKeys, defaultFixedMap),
    visibleKeys: defaultKeys,
    fixedMap: defaultFixedMap,
  }
  if (!storageKey) return fallback

  const persisted = readPersisted(storageKey)
  if (!persisted) return fallback

  const defaultSet = new Set(defaultKeys)
  const persistedOrderSet = new Set(persisted.columnOrder)

  // 保留持久化中仍存在的列 + 补充新增列（新列默认显示、默认固定）
  const retainedOrder = persisted.columnOrder.filter((k) =>
    defaultSet.has(k),
  )
  const addedKeys = defaultKeys.filter((k) => !persistedOrderSet.has(k))
  const mergedOrder = [...retainedOrder, ...addedKeys]

  // visibleKeys：保留持久化中仍存在的 + 新增列默认显示
  const retainedVisible = persisted.visibleKeys.filter((k) =>
    defaultSet.has(k),
  )
  const addedVisible = addedKeys
  const mergedVisible = [...retainedVisible, ...addedVisible]

  // fixedMap：保留持久化中仍存在的 + 新列用默认固定
  const mergedFixed: Record<string, ColumnFixed | undefined> = {}
  defaultKeys.forEach((k) => {
    if (persisted.fixedMap[k]) {
      mergedFixed[k] = persisted.fixedMap[k]
    } else if (defaultFixedMap[k]) {
      mergedFixed[k] = defaultFixedMap[k]
    }
  })

  return {
    columnOrder: sortKeysByFixed(mergedOrder, mergedFixed),
    visibleKeys: mergedVisible,
    fixedMap: mergedFixed,
  }
}

/**
 * 列设置状态管理 hook。
 *
 * 输入原始列定义，派生：
 * - settingColumns：列设置面板所需的元信息（key/title/disable/fixed）
 * - displayColumns：经过排序、过滤、固定覆盖后真正喂给 Table 的列
 * - 三个 state（columnOrder/visibleKeys/fixedMap）及 setter
 *
 * 受控/非受控：默认非受控（state 内部持有）；列集合真正变化时自动重置。
 *
 * 持久化：传入 storageKey 则启用 localStorage 持久化，不同列表用不同 key
 * 区分存储；列增删时 merge 保留用户既有设置。
 */
export function useColumnSetting<T extends object>(
  columns: ColumnsType<T>,
  storageKey?: string,
) {
  const settingColumns: TableColumnSettingItem[] = useMemo(
    () =>
      columns.map((col) => ({
        key: getColumnKey(col),
        title: col.title as string,
        disable: (col as SmartColumn<T>).settingDisable ?? false,
        fixed: normalizeFixed(col.fixed),
      })),
    [columns],
  )

  const defaultKeys = useMemo(
    () => settingColumns.map((c) => c.key),
    [settingColumns],
  )
  const defaultFixedMap = useMemo(() => {
    const map: Record<string, ColumnFixed | undefined> = {}
    settingColumns.forEach((col) => {
      if (col.fixed) map[col.key] = col.fixed
    })
    return map
  }, [settingColumns])

  const computeInitial = useCallback(
    (): PersistedState =>
      computeInitialState(defaultKeys, defaultFixedMap, storageKey),
    [defaultKeys, defaultFixedMap, storageKey],
  )

  const [initialState] = useState(computeInitial)

  const [columnOrder, setColumnOrder] = useState<string[]>(
    initialState.columnOrder,
  )
  const [visibleKeys, setVisibleKeys] = useState<string[]>(
    initialState.visibleKeys,
  )
  const [fixedMap, setFixedMap] = useState<
    Record<string, ColumnFixed | undefined>
  >(initialState.fixedMap)

  // 列集合真正变化时重置 state（重新计算 initial，含持久化 merge）。
  // 翻页时 columns 引用会变（useMemo 依赖 page/pageSize），但 keys 集合不变
  // → signature 不变 → 保留用户的列设置。
  const keysSignature = JSON.stringify(defaultKeys)
  const prevSigRef = useRef(keysSignature)
  useEffect(() => {
    if (prevSigRef.current === keysSignature) return
    prevSigRef.current = keysSignature
    const initial = computeInitial()
    setColumnOrder(initial.columnOrder)
    setVisibleKeys(initial.visibleKeys)
    setFixedMap(initial.fixedMap)
  }, [keysSignature, computeInitial])

  useEffect(() => {
    if (!storageKey) return
    writePersisted(storageKey, { columnOrder, visibleKeys, fixedMap })
  }, [storageKey, columnOrder, visibleKeys, fixedMap])

  const displayColumns = useMemo(() => {
    const map = new Map(columns.map((col) => [getColumnKey(col), col]))
    return columnOrder
      .filter((key) => visibleKeys.includes(key))
      .map((key) => {
        const col = map.get(key)
        if (!col) return null
        const fixed = fixedMap[key]
        return {
          ...col,
          fixed: fixed ?? undefined,
        }
      })
      .filter(Boolean) as ColumnsType<T>
  }, [columns, columnOrder, visibleKeys, fixedMap])

  return {
    settingColumns,
    displayColumns,
    columnOrder,
    visibleKeys,
    fixedMap,
    setColumnOrder,
    setVisibleKeys,
    setFixedMap,
  }
}
