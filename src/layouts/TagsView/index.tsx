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
import { Tag } from 'antd'
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import TagContextMenu from './components/TagContextMenu'
import TagsScrollNav from './components/TagsScrollNav'
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

  const style: CSSProperties = useMemo(
    () => ({
      cursor: 'pointer',
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-active={active || undefined}
    >
      <TagContextMenu
        tagPath={tag.path}
        active={active}
        activeKey={activeKey}
        onNavigate={onNavigate}
        onDrop={onDrop}
      >
        <Tag
          className={`tags-view__item${active ? ' tags-view__item--active' : ''}`}
          closable={!active}
          onClose={handleClose}
          onClick={handleTagClick}
        >
          {tag.title}
        </Tag>
      </TagContextMenu>
    </div>
  )
})

export default function TagsView() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const { tags, addTag, setTags } = useTagsStore()
  const activeKey = getActiveTagKey(pathname, search)
  const { drop } = useAliveController()

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
      <TagsScrollNav activeKey={activeKey}>
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
          </SortableContext>
        </DndContext>
      </TagsScrollNav>
    </div>
  )
}
