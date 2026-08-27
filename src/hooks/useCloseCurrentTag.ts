import { useCallback } from 'react'
import { useAliveController } from 'react-activation'
import { useLocation, useNavigate } from 'react-router-dom'
import { getActiveTagKey, routeMetaMap } from '@/router/routes'
import { useTagsStore } from '@/store/tags'

/** 关闭当前 tags-view 标签（含 KeepAlive），并回到对应列表页 */
export function useCloseCurrentTag() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const { drop } = useAliveController()

  return useCallback(() => {
    const key = getActiveTagKey(pathname, search)
    useTagsStore.getState().removeTag(key)
    drop(key)
    navigate(routeMetaMap[pathname]?.active ?? '/recipe/list')
  }, [pathname, search, drop, navigate])
}
