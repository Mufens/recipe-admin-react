import { Table } from 'antd'
import type { TableProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useRef, type ReactNode, type RefObject } from 'react'
import TableToolbar, {
  useColumnSetting,
  type ColumnFixed,
} from '@/components/TableToolbar'
import { useResizableColumns } from './useResizableColumns'
import { useTableScrollY } from './useTableScrollY'
import './index.scss'

export type TableToolbarOptions = {
  reload?: boolean
  setting?: boolean
  fullScreen?: boolean
  /** 表头右边缘拖拽调列宽，默认 true */
  resizable?: boolean
  loading?: boolean
  onReload?: () => void
  /** 列设置持久化 key；列增删时 merge 保留既有设置 */
  storageKey?: string
  /** 全屏目标，默认 SmartTable 根节点；传入可把搜索区一并全屏 */
  fullscreenTargetRef?: RefObject<HTMLElement | null>
  columnOrder?: string[]
  visibleKeys?: string[]
  fixedMap?: Record<string, ColumnFixed | undefined>
  onColumnOrderChange?: (keys: string[]) => void
  onVisibleKeysChange?: (keys: string[]) => void
  onFixedMapChange?: (map: Record<string, ColumnFixed | undefined>) => void
}

export type SmartTableProps<T extends object = object> = TableProps<T> & {
  toolbar?: ReactNode
  paginationNode?: ReactNode
  /** false 隐藏工具栏；对象或省略则显示（列设置/刷新/全屏） */
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
  const { wrapRef, scrollY } = useTableScrollY()

  const hideChrome = tableToolbar === false
  const opts = hideChrome ? undefined : tableToolbar
  const normalizedColumns = useMemo(
    () => columns ?? ([] as ColumnsType<T>),
    [columns],
  )
  const col = useColumnSetting<T>(normalizedColumns, opts?.storageKey)

  const displayColumns = useResizableColumns(
    col.displayColumns,
    opts?.resizable ?? true,
    wrapRef,
  )

  const showToolbar = Boolean(toolbar) || !hideChrome

  return (
    <div ref={rootRef} className="smart-table">
      {showToolbar ? (
        <div className="smart-table__toolbar">
          <div className="smart-table__toolbar-left">{toolbar}</div>
          {!hideChrome ? (
            <TableToolbar
              columns={col.settingColumns}
              columnOrder={opts?.columnOrder ?? col.columnOrder}
              visibleKeys={opts?.visibleKeys ?? col.visibleKeys}
              fixedMap={opts?.fixedMap ?? col.fixedMap}
              onColumnOrderChange={(next) => {
                col.setColumnOrder(next)
                opts?.onColumnOrderChange?.(next)
              }}
              onVisibleKeysChange={(next) => {
                col.setVisibleKeys(next)
                opts?.onVisibleKeysChange?.(next)
              }}
              onFixedMapChange={(next) => {
                col.setFixedMap(next)
                opts?.onFixedMapChange?.(next)
              }}
              loading={opts?.loading}
              onReload={opts?.onReload}
              reload={opts?.reload ?? true}
              setting={opts?.setting ?? true}
              fullScreen={opts?.fullScreen ?? true}
              fullscreenTargetRef={opts?.fullscreenTargetRef ?? rootRef}
            />
          ) : null}
        </div>
      ) : null}

      <div ref={wrapRef} className="smart-table__wrap">
        <Table<T>
          bordered
          {...tableProps}
          columns={displayColumns}
          scroll={{ ...scroll, y: scrollY }}
        />
      </div>

      {paginationNode ? (
        <div className="smart-table__pagination">{paginationNode}</div>
      ) : null}
    </div>
  )
}
