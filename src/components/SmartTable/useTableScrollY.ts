import { useActivate } from 'react-activation'
import { useCallback, useEffect, useRef, useState } from 'react'

const MIN_SCROLL_Y = 200
const FALLBACK_HEADER_H = 55

/**
 * 按表格容器实际高度计算 scroll.y，避免用 window 反算偏大裁掉横向滚动条。
 */
export function useTableScrollY() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(400)

  const compute = useCallback(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const { width, height } = wrap.getBoundingClientRect()
    if (!width || !height) return
    const headerH =
      wrap
        .querySelector('.ant-table-header')
        ?.getBoundingClientRect().height ?? FALLBACK_HEADER_H
    setScrollY(Math.max(Math.floor(height - headerH), MIN_SCROLL_Y))
  }, [])

  useEffect(() => {
    compute()
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver(compute)
    ro.observe(wrap)
    window.addEventListener('resize', compute)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', compute)
    }
  }, [compute])

  useActivate(compute)

  return { wrapRef, scrollY }
}
