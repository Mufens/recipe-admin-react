import type { CategoryOption } from '@/api/category'

export type PathValue = string | number

export interface RecipeTagView {
  id: number
  name: string
  path_label?: string
}

/**
 * 根据叶子 tagId 在分类树中还原 Cascader 单条路径
 * 例：tagId=312 → ["b","bb",312]
 */
export function resolvePathByTagId(
  tree: CategoryOption[],
  tagId: number,
): PathValue[] {
  for (const cat of tree) {
    for (const mid of cat.children || []) {
      const midChildren = mid.children || []
      if (!midChildren.length && mid.value === tagId) {
        return [cat.value, tagId]
      }
      for (const item of midChildren) {
        if (item.value === tagId) {
          return [cat.value, mid.value, tagId]
        }
      }
    }
  }
  return [tagId]
}

/** 多标签 → Cascader 多路径 */
export function resolveCategoryPaths(
  tree: CategoryOption[],
  tags: RecipeTagView[] | null | undefined,
  fallbackCategoryId?: string | null,
): PathValue[][] {
  const paths = (Array.isArray(tags) ? tags : [])
    .filter((t) => t?.id != null)
    .map((t) => resolvePathByTagId(tree, t.id))

  if (paths.length) return paths
  if (fallbackCategoryId) return [[fallbackCategoryId]]
  return []
}
