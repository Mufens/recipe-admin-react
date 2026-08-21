import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  HolderOutlined,
  SettingOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignTopOutlined,
} from '@ant-design/icons'
import { Checkbox, Popover, Tooltip } from 'antd'
import { useMemo, type CSSProperties, type ReactNode } from 'react'
import {
  sortKeysByFixed,
  type ColumnFixed,
  type TableColumnSettingItem,
} from './types'

type ColumnSettingProps = {
  columns: TableColumnSettingItem[]
  columnOrder: string[]
  visibleKeys: string[]
  fixedMap: Record<string, ColumnFixed | undefined>
  onColumnOrderChange: (keys: string[]) => void
  onVisibleKeysChange: (keys: string[]) => void
  onFixedMapChange: (map: Record<string, ColumnFixed | undefined>) => void
}

function ToolTipIcon({
  title,
  show,
  onClick,
  children,
}: {
  title: string
  show: boolean
  onClick: () => void
  children: ReactNode
}) {
  if (!show) return null
  return (
    <Tooltip title={title}>
      <span
        className="table-toolbar__setting-pin"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onClick()
        }}
      >
        {children}
      </span>
    </Tooltip>
  )
}

function SortableItem({
  item,
  checked,
  fixed,
  onCheck,
  onFixedChange,
}: {
  item: TableColumnSettingItem
  checked: boolean
  fixed?: ColumnFixed
  onCheck: (checked: boolean) => void
  onFixedChange: (fixed?: ColumnFixed) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.key })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      className="table-toolbar__setting-item-row"
      style={style}
    >
      <HolderOutlined
        className="table-toolbar__setting-drag"
        {...attributes}
        {...listeners}
      />
      <Checkbox
        className="table-toolbar__setting-check"
        checked={checked}
        disabled={item.disable}
        onChange={(e) => onCheck(e.target.checked)}
      >
        <span className="table-toolbar__setting-title">{item.title}</span>
      </Checkbox>
      <span className="table-toolbar__setting-option">
        <ToolTipIcon
          title="固定在列首"
          show={fixed !== 'left'}
          onClick={() => onFixedChange('left')}
        >
          <VerticalAlignTopOutlined />
        </ToolTipIcon>
        <ToolTipIcon
          title="不固定"
          show={!!fixed}
          onClick={() => onFixedChange(undefined)}
        >
          <VerticalAlignMiddleOutlined />
        </ToolTipIcon>
        <ToolTipIcon
          title="固定在列尾"
          show={fixed !== 'right'}
          onClick={() => onFixedChange('right')}
        >
          <VerticalAlignBottomOutlined />
        </ToolTipIcon>
      </span>
    </div>
  )
}

function ColumnGroup({
  title,
  showTitle,
  keys,
  columnMap,
  visibleKeys,
  fixedMap,
  onCheck,
  onFixedChange,
}: {
  title: string
  showTitle: boolean
  keys: string[]
  columnMap: Map<string, TableColumnSettingItem>
  visibleKeys: string[]
  fixedMap: Record<string, ColumnFixed | undefined>
  onCheck: (key: string, checked: boolean) => void
  onFixedChange: (key: string, fixed?: ColumnFixed) => void
}) {
  if (!keys.length) return null

  return (
    <div className="table-toolbar__setting-group">
      {showTitle && (
        <div className="table-toolbar__setting-group-title">{title}</div>
      )}
      <SortableContext items={keys} strategy={verticalListSortingStrategy}>
        {keys.map((key) => {
          const item = columnMap.get(key)
          if (!item) return null
          return (
            <SortableItem
              key={key}
              item={item}
              checked={visibleKeys.includes(key)}
              fixed={fixedMap[key]}
              onCheck={(checked) => onCheck(key, checked)}
              onFixedChange={(fixed) => onFixedChange(key, fixed)}
            />
          )
        })}
      </SortableContext>
    </div>
  )
}

export default function ColumnSetting({
  columns,
  columnOrder,
  visibleKeys,
  fixedMap,
  onColumnOrderChange,
  onVisibleKeysChange,
  onFixedMapChange,
}: ColumnSettingProps) {
  const columnMap = useMemo(
    () => new Map(columns.map((c) => [c.key, c])),
    [columns],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  const allKeys = columns.map((c) => c.key)
  const requiredKeys = columns.filter((c) => c.disable).map((c) => c.key)
  const checkedAll = visibleKeys.length === allKeys.length
  const indeterminate =
    visibleKeys.length > 0 && visibleKeys.length < allKeys.length

  const { groups, showGroupTitle } = useMemo(() => {
    const leftKeys = columnOrder.filter((key) => fixedMap[key] === 'left')
    const rightKeys = columnOrder.filter((key) => fixedMap[key] === 'right')
    const middleKeys = columnOrder.filter((key) => !fixedMap[key])
    return {
      groups: [
        { title: '固定在左侧', keys: leftKeys },
        { title: '不固定', keys: middleKeys },
        { title: '固定在右侧', keys: rightKeys },
      ],
      showGroupTitle: leftKeys.length > 0 || rightKeys.length > 0,
    }
  }, [columnOrder, fixedMap])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeKey = String(active.id)
    const overKey = String(over.id)
    const oldIndex = columnOrder.indexOf(activeKey)
    const newIndex = columnOrder.indexOf(overKey)
    if (oldIndex < 0 || newIndex < 0) return

    // 拖到目标列所在固定分组时，同步其固定状态
    const nextFixed = { ...fixedMap, [activeKey]: fixedMap[overKey] }
    if (!nextFixed[activeKey]) delete nextFixed[activeKey]
    const nextOrder = sortKeysByFixed(
      arrayMove(columnOrder, oldIndex, newIndex),
      nextFixed,
    )
    onFixedMapChange(nextFixed)
    onColumnOrderChange(nextOrder)
  }

  const handleCheck = (key: string, checked: boolean) => {
    if (checked) {
      onVisibleKeysChange([...visibleKeys, key])
    } else {
      onVisibleKeysChange(visibleKeys.filter((k) => k !== key))
    }
  }

  const handleFixedChange = (key: string, fixed?: ColumnFixed) => {
    const nextFixed = { ...fixedMap, [key]: fixed }
    if (!fixed) delete nextFixed[key]
    onFixedMapChange(nextFixed)
    onColumnOrderChange(sortKeysByFixed(columnOrder, nextFixed))
  }

  const handleCheckAll = (checked: boolean) => {
    onVisibleKeysChange(checked ? allKeys : requiredKeys)
  }

  const handleReset = () => {
    const defaultFixed: Record<string, ColumnFixed | undefined> = {}
    columns.forEach((col) => {
      if (col.fixed) defaultFixed[col.key] = col.fixed
    })
    onFixedMapChange(defaultFixed)
    onColumnOrderChange(sortKeysByFixed(allKeys, defaultFixed))
    onVisibleKeysChange(allKeys)
  }

  const content = (
    <div className="table-toolbar__setting">
      <div className="table-toolbar__setting-header">
        <Checkbox
          indeterminate={indeterminate}
          checked={checkedAll}
          onChange={(e) => handleCheckAll(e.target.checked)}
        >
          列展示
        </Checkbox>
        <a className="table-toolbar__setting-reset" onClick={handleReset}>
          重置
        </a>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <div className="table-toolbar__setting-list">
          {groups.map((g) => (
            <ColumnGroup
              key={g.title}
              title={g.title}
              showTitle={showGroupTitle}
              keys={g.keys}
              columnMap={columnMap}
              visibleKeys={visibleKeys}
              fixedMap={fixedMap}
              onCheck={handleCheck}
              onFixedChange={handleFixedChange}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )

  return (
    <Popover
      title={null}
      trigger="click"
      placement="bottomRight"
      content={content}
    >
      <Tooltip title="列设置">
        <span className="table-toolbar__icon">
          <SettingOutlined />
        </span>
      </Tooltip>
    </Popover>
  )
}
