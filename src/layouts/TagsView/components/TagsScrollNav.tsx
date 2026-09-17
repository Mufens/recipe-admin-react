import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type TagsScrollNavProps = {
  activeKey: string
  children: ReactNode
}

export default function TagsScrollNav({
  activeKey,
  children,
}: TagsScrollNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [scrollable, setScrollable] = useState(false)
  const [offset, setOffset] = useState(0)

  const update = useCallback(() => {
    const scrollEl = scrollRef.current
    const listEl = listRef.current
    if (!scrollEl || !listEl) return

    const visible = scrollEl.clientWidth
    const total = listEl.scrollWidth
    const overflow = total > visible
    setScrollable(overflow)
    setOffset((prev) => (overflow ? Math.min(prev, total - visible) : 0))
  }, [])

  const shift = useCallback((dir: -1 | 1) => {
    const visible = scrollRef.current?.clientWidth ?? 0
    const total = listRef.current?.scrollWidth ?? 0
    const max = Math.max(0, total - visible)
    setOffset((prev) => Math.min(max, Math.max(0, prev + dir * visible)))
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

  useEffect(() => {
    update()

    const listEl = listRef.current
    const scrollEl = scrollRef.current
    if (!listEl || !scrollEl) return

    const activeEl = listEl.querySelector<HTMLElement>('[data-active]')
    if (!activeEl) return

    const visible = scrollEl.clientWidth
    const left = activeEl.offsetLeft
    const right = left + activeEl.getBoundingClientRect().width

    setOffset((prev) => {
      if (left < prev) return left
      if (right > prev + visible) return Math.max(0, right - visible)
      return prev
    })
  }, [activeKey, update])

  return (
    <div className="tags-view__nav-wrap">
      {scrollable && (
        <>
          <button
            type="button"
            className="tags-view__nav-prev"
            onClick={() => shift(-1)}
            aria-label="向左滚动"
          >
            <LeftOutlined />
          </button>
          <button
            type="button"
            className="tags-view__nav-next"
            onClick={() => shift(1)}
            aria-label="向右滚动"
          >
            <RightOutlined />
          </button>
        </>
      )}
      <div ref={scrollRef} className="tags-view__nav-scroll">
        <div
          ref={listRef}
          className="tags-view__list"
          style={{ transform: `translateX(${-offset}px)` }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
