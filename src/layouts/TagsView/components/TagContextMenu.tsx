import { Dropdown } from 'antd'
import { useMemo, type ReactElement } from 'react'
import { useTagsStore } from '@/store/tags'

type TagContextMenuProps = {
  tagPath: string
  active: boolean
  activeKey: string
  onNavigate: (path: string) => void
  onDrop: (path: string) => void
  children: ReactElement
}

export default function TagContextMenu({
  tagPath,
  active,
  activeKey,
  onNavigate,
  onDrop,
  children,
}: TagContextMenuProps) {
  const clearOtherTags = useTagsStore((s) => s.clearOtherTags)
  const clearRightTags = useTagsStore((s) => s.clearRightTags)

  const items = useMemo(
    () => [
      {
        key: 'close-right',
        label: '关闭右侧标签',
        onClick: () => {
          const removed = clearRightTags(tagPath)
          removed.forEach((t) => onDrop(t.path))
          if (activeKey !== tagPath && removed.some((t) => t.path === activeKey)) {
            onNavigate(tagPath)
          }
        },
      },
      {
        key: 'close-others',
        label: '关闭其他标签',
        onClick: () => {
          const removed = clearOtherTags(tagPath)
          removed.forEach((t) => onDrop(t.path))
          if (!active) onNavigate(tagPath)
        },
      },
    ],
    [tagPath, active, activeKey, clearRightTags, clearOtherTags, onDrop, onNavigate],
  )

  return (
    <Dropdown
      trigger={['contextMenu']}
      rootClassName="tags-view-dropdown"
      menu={{ items }}
    >
      {children}
    </Dropdown>
  )
}
