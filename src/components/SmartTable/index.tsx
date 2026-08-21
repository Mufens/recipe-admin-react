import { useActivate } from 'react-activation'
import { Table } from 'antd'
import type { TableProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import TableToolbar, {
  useColumnSetting,
  type ColumnFixed,
} from '@/components/TableToolbar'
import './index.scss'

/** SmartTable 工具栏配置：零配置即可获得列设置/刷新/全屏 */
export type TableToolbarOptions = {
  /** 刷新按钮，默认 true */
  reload?: boolean
  /** 列设置齿轮，默认 true */
  setting?: boolean
  /** 全屏按钮，默认 true */
  fullScreen?: boolean
  /** 刷新按钮 loading 态（禁用点击） */
  loading?: boolean
  /** 点击刷新触发（数据请求由使用方控制） */
  onReload?: () => void
  /**
   * 列设置持久化 key。传入则启用 localStorage 持久化，
   * 不同列表用不同 key 区分存储；列增删时自动 merge 保留既有设置。
   */
  storageKey?: string
  // —— 高级：受控覆盖。不传则使用内部 state，传了即接管 ——
  columnOrder?: string[]
  visibleKeys?: string[]
  fixedMap?: Record<string, ColumnFixed | undefined>
  onColumnOrderChange?: (keys: string[]) => void
  onVisibleKeysChange?: (keys: string[]) => void
  onFixedMapChange?: (map: Record<string, ColumnFixed | undefined>) => void
}

interface SmartTableProps<T extends object = object> extends TableProps<T> {
  /** 左侧自定义工具栏（按钮区） */
  toolbar?: ReactNode
  /** 底部分页节点 */
  paginationNode?: ReactNode
  /**
   * 工具栏配置。传 false 完全隐藏工具栏；
   * 不传或传对象则显示（列设置/刷新/全屏内置，零配置）。
   */
  tableToolbar?: TableToolbarOptions | false
}

export default function SmartTable<T extends object>({
  toolbar,
  paginationNode,
  tableToolbar,
  scroll,
  columns,
  ...tableProps
}: SmartTableProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const pagerRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState<number>(400)

  const computeScrollY = useCallback(() => {
    const wrap = wrapRef.current
    const pager = pagerRef.current
    if (!wrap || !pager) return
    const wrapRect = wrap.getBoundingClientRect()
    const pagerRect = pager.getBoundingClientRect()
    // keep-alive 隐藏期间容器尺寸为 0，此时计算无意义，跳过
    if (wrapRect.width === 0 || pagerRect.width === 0) return
    const headerEl = wrap.querySelector('.ant-table-header') as HTMLElement | null
    const headerHeight = headerEl?.getBoundingClientRect().height ?? 55
    const gap = 16
    const height = window.innerHeight - wrapRect.top - pagerRect.height - headerHeight - gap
    setScrollY(Math.max(height, 200))
  }, [])

  useEffect(() => {
    computeScrollY()
    const ro = new ResizeObserver(computeScrollY)
    if (wrapRef.current) ro.observe(wrapRef.current)
    if (pagerRef.current) ro.observe(pagerRef.current)
    window.addEventListener('resize', computeScrollY)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', computeScrollY)
    }
  }, [computeScrollY])

  useActivate(computeScrollY)

  const mergedScroll = useMemo(
    () => ({ ...(scroll || {}), y: scrollY }),
    [scroll, scrollY],
  )

  // tableToolbar === false 隐藏工具栏；否则显示（含默认配置）
  const opts = tableToolbar === false ? null : tableToolbar
  // columns 为 undefined 时稳定空数组引用，避免 useColumnSetting 内部 useMemo 重算
  const normalizedColumns = useMemo(
    () => columns ?? ([] as ColumnsType<T>),
    [columns],
  )
  // 内置列设置状态：输入原始 columns，产出 displayColumns + setting 元信息 + state
  // opts?.storageKey 启用 localStorage 持久化（不同列表用不同 key）
  const col = useColumnSetting<T>(normalizedColumns, opts?.storageKey)
  // 受控优先：opts 传了用 opts，没传用内部 state
  const columnOrder = opts?.columnOrder ?? col.columnOrder
  const visibleKeys = opts?.visibleKeys ?? col.visibleKeys
  const fixedMap = opts?.fixedMap ?? col.fixedMap
  const handleColumnOrderChange = (next: string[]) => {
    col.setColumnOrder(next)
    opts?.onColumnOrderChange?.(next)
  }
  const handleVisibleKeysChange = (next: string[]) => {
    col.setVisibleKeys(next)
    opts?.onVisibleKeysChange?.(next)
  }
  const handleFixedMapChange = (
    next: Record<string, ColumnFixed | undefined>,
  ) => {
    col.setFixedMap(next)
    opts?.onFixedMapChange?.(next)
  }

  const showToolbarArea = toolbar || opts !== null

  return (
    <div ref={rootRef} className="smart-table">
      {showToolbarArea ? (
        <div className="smart-table__toolbar">
          <div className="smart-table__toolbar-left">{toolbar}</div>
          {opts !== null ? (
            <TableToolbar
              columns={col.settingColumns}
              columnOrder={columnOrder}
              visibleKeys={visibleKeys}
              fixedMap={fixedMap}
              onColumnOrderChange={handleColumnOrderChange}
              onVisibleKeysChange={handleVisibleKeysChange}
              onFixedMapChange={handleFixedMapChange}
              loading={opts?.loading}
              onReload={opts?.onReload}
              reload={opts?.reload ?? true}
              setting={opts?.setting ?? true}
              fullScreen={opts?.fullScreen ?? true}
              fullscreenTargetRef={rootRef}
            />
          ) : null}
        </div>
      ) : null}
      <div ref={wrapRef} className="smart-table__wrap">
        <Table<T> bordered {...tableProps} columns={col.displayColumns} scroll={mergedScroll} />
      </div>
      {paginationNode ? (
        <div ref={pagerRef} className="smart-table__pagination">
          {paginationNode}
        </div>
      ) : null}
    </div>
  )
}
