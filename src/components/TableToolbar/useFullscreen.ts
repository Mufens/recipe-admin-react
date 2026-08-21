import { useCallback, type RefObject } from 'react'

export function useFullscreen(targetRef: RefObject<HTMLElement | null>) {
  const toggleFullscreen = useCallback(() => {
    const el = targetRef.current
    if (!el || !document.fullscreenEnabled) return

    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void el.requestFullscreen()
    }
  }, [targetRef])

  return { toggleFullscreen }
}
