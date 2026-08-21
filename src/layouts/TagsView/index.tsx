import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable'
import { useAliveController } from 'react-activation'
import { Dropdown, Tag } from 'antd'
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  getActiveTagKey,
  resolveTagFromLocation,
  type TagItem,
} from '@/router/routes'
import { useTagsStore } from '@/store/tags'
import './index.scss'

interface DraggableTagProps {
  tag: TagItem
  active: boolean
  activeKey: string
  onNavigate: (path: string) => void
  onDrop: (path: string) => void
}

const DraggableTag = memo(function DraggableTag({
  tag,
  active,
  activeKey,
  onNavigate,
  onDrop,
}: DraggableTagProps) {
  const removeTag = useTagsStore((s) => s.removeTag)
  const clearOtherTags = useTagsStore((s) => s.clearOtherTags)
  const clearRightTags = useTagsStore((s) => s.clearRightTags)

  const {
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
    setNodeRef,
  } = useSortable({
    id: tag.path,
    animateLayoutChanges: () => false,
  })

  // 拖拽中高频变化时才重建 style，非拖拽时缓存避免子组件 diff
  const style: CSSProperties = useMemo(
    () => ({
      cursor: isDragging ? 'grabbing' : 'grab',
      transform: transform ? `translate3d(${transform.x}px, 0, 0)` : undefined,
      transition: isDragging ? 'unset' : transition,
      zIndex: isDragging ? 1 : undefined,
      opacity: isDragging ? 0.6 : undefined,
    }),
    [isDragging, transform, transition],
  )

  const handleClose = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const next = removeTag(tag.path)
      onDrop(tag.path)
      if (active && next) onNavigate(next.path)
    },
    [tag.path, active, removeTag, onDrop, onNavigate],
  )

  const handleTagClick = useCallback(() => {
    if (!active) onNavigate(tag.path)
  }, [active, tag.path, onNavigate])

  const menuItems = useMemo(
    () => [
      {
        key: 'close-right',
        label: '关闭右侧标签',
        onClick: () => {
          const removed = clearRightTags(tag.path)
          removed.forEach((t) => onDrop(t.path))
          if (
            activeKey !== tag.path &&
            removed.some((t) => t.path === activeKey)
          ) {
            onNavigate(tag.path)
          }
        },
      },
      {
        key: 'close-others',
        label: '关闭其他标签',
        onClick: () => {
          const removed = clearOtherTags(tag.path)
          removed.forEach((t) => onDrop(t.path))
          if (!active) onNavigate(tag.path)
        },
      },
    ],
    [tag.path, active, activeKey, clearRightTags, clearOtherTags, onDrop, onNavigate],
  )

  return (
    <div
      ref={setNodeRef}
      className="tags-view__sortable"
      style={style}
      {...attributes}
      {...listeners}
      data-active={active || undefined}
    >
      <Dropdown
        trigger={['contextMenu']}
        rootClassName="tags-view-dropdown"
        menu={{ items: menuItems }}
      >
        <Tag
          color={active ? 'blue' : undefined}
          className="tags-view__item"
          closable={!active}
          onClose={handleClose}
          onClick={handleTagClick}
        >
          {tag.title}
        </Tag>
      </Dropdown>
    </div>
  )
})

export default function TagsView() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const { tags, addTag, setTags } = useTagsStore()
  const activeKey = getActiveTagKey(pathname, search)
  const { drop } = useAliveController()

  const scrollRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const [scrollable, setScrollable] = useState(false)
  const [offset, setOffset] = useState(0)

  const update = useCallback(() => {
    const scrollEl = scrollRef.current
    const listEl = listRef.current
    if (!scrollEl || !listEl) return
    const visibleWidth = scrollEl.clientWidth
    const totalWidth = listEl.scrollWidth
    const overflow = totalWidth > visibleWidth
    setScrollable(overflow)
    if (!overflow) {
      setOffset(0)
    } else {
      setOffset((prev) => Math.min(prev, Math.max(0, totalWidth - visibleWidth)))
    }
  }, [])

  const handlePrev = useCallback(() => {
    const visibleWidth = scrollRef.current?.clientWidth ?? 0
    setOffset((prev) => Math.max(0, prev - visibleWidth))
  }, [])

  const handleNext = useCallback(() => {
    const visibleWidth = scrollRef.current?.clientWidth ?? 0
    const totalWidth = listRef.current?.scrollWidth ?? 0
    const maxOffset = Math.max(0, totalWidth - visibleWidth)
    setOffset((prev) => Math.min(maxOffset, prev + visibleWidth))
  }, [])

  useEffect(() => {
    const scrollEl = scrollRef.current
    const listEl = listRef.current
    if (!scrollEl || !listEl) return

    const ro = new ResizeObserver(update)
    ro.observe(scrollEl)
    ro.observe(listEl)

    const mo = new MutationObserver(update)
    mo.observe(listEl, { childList: true })

    update()
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [update])

  //首次挂载初始化；后续路由变化追加标签 
  const initedRef = useRef(false)
  useEffect(() => {
    const tag = resolveTagFromLocation(pathname, search)
    if (!tag) return
    if (!initedRef.current) {
      initedRef.current = true
      setTags([tag])
    } else {
      addTag(tag)
    }
  }, [pathname, search, addTag, setTags])

  useEffect(() => {
    update()

    const listEl = listRef.current
    const scrollEl = scrollRef.current
    if (!listEl || !scrollEl) return

    const activeEl = listEl.querySelector<HTMLElement>('[data-active]')
    if (!activeEl) return

    const visibleWidth = scrollEl.clientWidth
    const tagPos = activeEl.offsetLeft
    const tagWidth = activeEl.getBoundingClientRect().width

    setOffset((prev) => {
      let next = prev
      if (tagPos < prev) {
        next = tagPos
      } else if (tagPos + tagWidth > prev + visibleWidth) {
        next = Math.max(0, tagPos + tagWidth - visibleWidth)
      }
      return next
    })
  }, [activeKey, update])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return
      const currentTags = useTagsStore.getState().tags
      const oldIndex = currentTags.findIndex((t) => t.path === active.id)
      const newIndex = currentTags.findIndex((t) => t.path === over.id)
      if (oldIndex < 0 || newIndex < 0) return
      setTags(arrayMove(currentTags, oldIndex, newIndex))
    },
    [setTags],
  )

  const tagPaths = useMemo(() => tags.map((t) => t.path), [tags])

  const onNavigate = useCallback((path: string) => navigate(path), [navigate])
  const onDrop = useCallback((path: string) => drop(path), [drop])

  return (
    <div className="tags-view">
      <div
        className={`tags-view__nav-wrap${scrollable ? ' is-scrollable' : ''}`}
      >
        {scrollable && (
          <>
            <button
              type="button"
              className="tags-view__nav-prev"
              onClick={handlePrev}
              aria-label="向左滚动"
            />
            <button
              type="button"
              className="tags-view__nav-next"
              onClick={handleNext}
              aria-label="向右滚动"
            />
          </>
        )}
        <div ref={scrollRef} className="tags-view__nav-scroll">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tagPaths}
              strategy={horizontalListSortingStrategy}
            >
              <div
                ref={listRef}
                className="tags-view__list"
                style={{ transform: `translateX(${-offset}px)` }}
              >
                {tags.map((tag) => (
                  <DraggableTag
                    key={tag.path}
                    tag={tag}
                    active={tag.path === activeKey}
                    activeKey={activeKey}
                    onNavigate={onNavigate}
                    onDrop={onDrop}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  )
}
