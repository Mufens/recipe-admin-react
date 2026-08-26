import type { ColumnsType, ColumnType } from 'antd/es/table'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react'
import { getColumnKey } from '@/components/TableToolbar'

const MIN_WIDTH = 48
const EDGE = 6
const RESIZING_CLS = 'smart-table--resizing'
const TH_CLS = 'smart-table__th-resizable'
const STYLE_ATTR = 'data-smart-table-resize'
const COL_KEY_ATTR = 'data-col-key'

type DragState = {
  key: string
  startX: number
  startWidth: number
  lastWidth: number
  root: HTMLElement
}

function resolveWidth(width: ColumnType['width']): number | undefined {
  if (typeof width === 'number' && Number.isFinite(width)) return width
  if (typeof width === 'string' && /^\d+(\.\d+)?px$/.test(width)) {
    return Number.parseFloat(width)
  }
  return undefined
}

/** 按列 key 写死宽，抵抗 antd 内容重测把宽度弹回 */
function syncWidthStyles(root: HTMLElement, map: Record<string, number>) {
  const entries = Object.entries(map)
  let styleEl = root.querySelector<HTMLStyleElement>(`style[${STYLE_ATTR}]`)
  if (!entries.length) {
    styleEl?.remove()
    return
  }
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.setAttribute(STYLE_ATTR, '')
    root.appendChild(styleEl)
  }
  styleEl.textContent = entries
    .map(([key, w]) => {
      const px = `${w}px`
      const sel = `[${COL_KEY_ATTR}="${CSS.escape(key)}"]`
      return `${sel}{width:${px}!important;min-width:${px}!important;max-width:${px}!important;box-sizing:border-box!important}`
    })
    .join('')
}

/**
 * 表头右边缘拖拽改列宽（会话内临时）。
 * 拖动中不 setState；宽度用 data-col-key + 样式表锁定，避免松手被重测弹回。
 */
export function useResizableColumns<T extends object>(
  columns: ColumnsType<T>,
  enabled: boolean,
  wrapRef: RefObject<HTMLElement | null>,
) {
  const [widthMap, setWidthMap] = useState<Record<string, number>>({})
  const widthMapRef = useRef(widthMap)
  const dragRef = useRef<DragState | null>(null)
  const rafRef = useRef(0)

  useEffect(() => {
    widthMapRef.current = widthMap
    const root = wrapRef.current
    if (root) syncWidthStyles(root, widthMap)
  }, [widthMap, wrapRef])

  useEffect(() => {
    if (!enabled) return

    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const next = Math.max(
        MIN_WIDTH,
        Math.round(drag.startWidth + (e.clientX - drag.startX)),
      )
      if (next === drag.lastWidth) return
      drag.lastWidth = next
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0
        const d = dragRef.current
        if (!d) return
        syncWidthStyles(d.root, {
          ...widthMapRef.current,
          [d.key]: d.lastWidth,
        })
      })
    }

    const onUp = () => {
      const drag = dragRef.current
      if (!drag) return
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
      const nextMap = { ...widthMapRef.current, [drag.key]: drag.lastWidth }
      syncWidthStyles(drag.root, nextMap)
      setWidthMap(nextMap)
      dragRef.current = null
      document.body.classList.remove(RESIZING_CLS)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [enabled])

  return useMemo(() => {
    if (!enabled) return columns
    return columns.map((col) => {
      const key = getColumnKey(col)
      if (!key) return col
      const width = widthMap[key] ?? resolveWidth(col.width)
      if (width == null) return col

      const prevOnHeaderCell = col.onHeaderCell
      const prevOnCell = col.onCell
      const sizeStyle: CSSProperties = {
        width,
        minWidth: width,
        maxWidth: width,
      }

      return {
        ...col,
        width,
        onCell: (record, rowIndex) => {
          const prev = prevOnCell?.(record, rowIndex) ?? {}
          return {
            ...prev,
            [COL_KEY_ATTR]: key,
            style: { ...(prev.style as CSSProperties | undefined), ...sizeStyle },
          }
        },
        onHeaderCell: (column) => {
          const prev = prevOnHeaderCell?.(column) ?? {}
          return {
            ...prev,
            [COL_KEY_ATTR]: key,
            className: `${prev.className ?? ''} ${TH_CLS}`.trim(),
            style: { ...(prev.style as CSSProperties | undefined), ...sizeStyle },
            onMouseDown: (e: ReactMouseEvent<HTMLTableCellElement>) => {
              prev.onMouseDown?.(e)
              if (e.defaultPrevented || e.button !== 0) return
              const th = e.currentTarget
              if (th.getBoundingClientRect().right - e.clientX > EDGE) return
              const root = wrapRef.current
              if (!root) return
              e.preventDefault()
              e.stopPropagation()

              dragRef.current = {
                key,
                startX: e.clientX,
                startWidth: width,
                lastWidth: width,
                root,
              }
              document.body.classList.add(RESIZING_CLS)
            },
          }
        },
      }
    }) as ColumnsType<T>
  }, [columns, enabled, widthMap, wrapRef])
}
