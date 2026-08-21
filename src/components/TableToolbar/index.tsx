/* eslint-disable react-refresh/only-export-components -- barrel 聚合导出，本身无组件定义，不参与 HMR */
import { ReloadOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import type { ReactNode, RefObject } from 'react'
import ColumnSetting from './ColumnSetting'
import FullscreenIcon from './FullscreenIcon'
import type { ColumnFixed, TableColumnSettingItem } from './types'
import { useFullscreen } from './useFullscreen'
import './index.scss'

export type { ColumnFixed, SmartColumn, TableColumnSettingItem } from './types'
export {
  getColumnKey,
  normalizeFixed,
  sortKeysByFixed,
} from './types'
export { useColumnSetting } from './useColumnSetting'

export type TableToolbarProps = {
  onReload?: () => void
  loading?: boolean
  columns: TableColumnSettingItem[]
  columnOrder: string[]
  visibleKeys: string[]
  fixedMap: Record<string, ColumnFixed | undefined>
  onColumnOrderChange: (keys: string[]) => void
  onVisibleKeysChange: (keys: string[]) => void
  onFixedMapChange: (map: Record<string, ColumnFixed | undefined>) => void
  fullscreenTargetRef: RefObject<HTMLElement | null>
  reload?: boolean
  setting?: boolean
  fullScreen?: boolean
}

export default function TableToolbar({
  onReload,
  loading,
  columns,
  columnOrder,
  visibleKeys,
  fixedMap,
  onColumnOrderChange,
  onVisibleKeysChange,
  onFixedMapChange,
  fullscreenTargetRef,
  reload = true,
  setting = true,
  fullScreen = true,
}: TableToolbarProps) {
  const { toggleFullscreen } = useFullscreen(fullscreenTargetRef)

  const settings: ReactNode[] = []

  if (reload) {
    settings.push(
      <span key="reload" onClick={() => !loading && onReload?.()}>
        <Tooltip title="刷新">
          <ReloadOutlined />
        </Tooltip>
      </span>,
    )
  }

  if (setting) {
    settings.push(
      <ColumnSetting
        key="setting"
        columns={columns}
        columnOrder={columnOrder}
        visibleKeys={visibleKeys}
        fixedMap={fixedMap}
        onColumnOrderChange={onColumnOrderChange}
        onVisibleKeysChange={onVisibleKeysChange}
        onFixedMapChange={onFixedMapChange}
      />,
    )
  }

  if (fullScreen) {
    settings.push(
      <span key="fullScreen" onClick={toggleFullscreen}>
        <FullscreenIcon />
      </span>,
    )
  }

  if (!settings.length) return null

  return (
    <div className="table-toolbar">
      <div className="table-toolbar__setting-items">
        {settings.map((item, index) => (
          <div
            key={index}
            className="table-toolbar__setting-item"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
