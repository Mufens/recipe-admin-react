import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import { flushSync } from 'react-dom'
import type { MouseEvent } from 'react'
import { useThemeStore } from '@/store/theme'
import './index.scss'

function runThemeTransition(
  currentlyDark: boolean,
  apply: () => void,
  { clientX: x, clientY: y }: { clientX: number; clientY: number },
) {
  if (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    typeof document.startViewTransition !== 'function'
  ) {
    apply()
    return
  }

  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )
  const clipPath = [
    `circle(0px at ${x}px ${y}px)`,
    `circle(${radius}px at ${x}px ${y}px)`,
  ]

  const style = document.createElement('style')
  style.textContent = '*, *::before, *::after { transition: none !important; }'
  document.head.appendChild(style)

  try {
    const transition = document.startViewTransition(() => {
      flushSync(apply)
    })

    void transition.ready
      .then(() =>
        document.documentElement.animate(
          {
            clipPath: currentlyDark ? [...clipPath].reverse() : clipPath,
          },
          {
            duration: 500,
            easing: 'ease-in',
            pseudoElement: currentlyDark
              ? '::view-transition-old(root)'
              : '::view-transition-new(root)',
          },
        ).finished,
      )
      .finally(() => style.remove())
  } catch {
    style.remove()
    apply()
  }
}

export default function DarkModeToggle() {
  const isDark = useThemeStore((s) => s.isDark)
  const setDark = useThemeStore((s) => s.setDark)

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    runThemeTransition(isDark, () => setDark(!isDark), e)
  }

  return (
    <Tooltip title={isDark ? '切换亮色' : '切换暗色'}>
      <Button
        type="text"
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        onClick={handleClick}
      />
    </Tooltip>
  )
}
