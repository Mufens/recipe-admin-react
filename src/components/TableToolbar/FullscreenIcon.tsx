import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import { memo, useEffect, useState } from 'react'

function FullscreenIcon() {
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const handler = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  return fullscreen ? (
    <Tooltip title="全屏">
      <FullscreenExitOutlined />
    </Tooltip>
  ) : (
    <Tooltip title="全屏">
      <FullscreenOutlined />
    </Tooltip>
  )
}

export default memo(FullscreenIcon)
