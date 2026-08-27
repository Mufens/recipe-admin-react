export interface TagItem {
  path: string
  title: string
}

export interface RouteMeta {
  title: string
  /** 父级目录名，用于面包屑 */
  parent?: string
  /** 侧边菜单高亮 key，子路由指回列表路径 */
  active?: string
}

/** 路由 path → 页面元信息 */
export const routeMetaMap: Record<string, RouteMeta> = {
  '/recipe/list': { title: '菜谱列表', parent: '菜谱管理' },
  '/categories': { title: '分类管理', parent: '菜谱管理' },
  '/users': { title: '用户管理', parent: '系统管理' },
  '/recipe/detail': { title: '菜谱详情', parent: '菜谱列表', active: '/recipe/list' },
  '/recipe/edit': { title: '编辑菜谱', parent: '菜谱列表', active: '/recipe/list' },
  '/recipe/add': { title: '新增菜谱', parent: '菜谱列表', active: '/recipe/list' },
  '/convert': { title: '格式转换', parent: '菜谱管理' },
  '/access': { title: '权限演示', parent: '菜谱管理' },
  '/table': { title: 'CRUD 示例', parent: '菜谱管理' },
}

/** 路由 path → 标签标题 */
export const routeTitleMap: Record<string, string> = Object.fromEntries(
  Object.entries(routeMetaMap).map(([path, meta]) => [path, meta.title]),
)

/** 统一获取详情/编辑页的唯一 key（供 tag 去重和激活判断共用） */
function getScopedPath(pathname: string, search: string): string {
  if (pathname === '/recipe/detail' || pathname === '/recipe/edit') {
    const id = new URLSearchParams(search).get('id')
    if (id) return `${pathname}?id=${id}`
  }
  return pathname
}

/** 根据当前 location 生成唯一 Tag（详情/编辑页按 id 区分） */
export function resolveTagFromLocation(
  pathname: string,
  search: string,
): TagItem | null {
  const key = getScopedPath(pathname, search)

  if (pathname === '/recipe/detail') {
    const id = new URLSearchParams(search).get('id')
    if (!id) return null
    return { path: key, title: `菜谱详情 ${id}` }
  }

  if (pathname === '/recipe/edit') {
    const id = new URLSearchParams(search).get('id')
    if (!id) return null
    return { path: key, title: `编辑菜谱 ${id}` }
  }

  const title = routeTitleMap[pathname]
  if (!title) return null
  return { path: key, title }
}

/** 当前激活的 tag key */
export function getActiveTagKey(pathname: string, search: string): string {
  return getScopedPath(pathname, search)
}
