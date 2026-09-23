import type { CategoryOption } from '@/api/category'

/**
 * Cascader 路径段：一级/二级为 string，叶子 tag 为正整数 number
 * 例：["b","bb",312]
 * SHOW_CHILD 下勾选父级会写入全部叶子路径。
 */
export type PathValue = string | number

export interface RecipeTagView {
  id: number
  name: string
  path_label?: string
}

function isTagId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isLeafCategoryPath(path: PathValue[] | null | undefined): boolean {
  if (!Array.isArray(path) || !path.length) return false
  return isTagId(path[path.length - 1])
}

/**
 * 根据叶子 tagId 在分类树中还原 Cascader 单条路径
 * 例：tagId=312 → ["b","bb",312]
 */
export function resolvePathByTagId(
  tree: CategoryOption[],
  tagId: number,
): PathValue[] {
  if (!isTagId(tagId)) return []

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
export function resolveCategoryPaths(
  tree: CategoryOption[],
  tags: RecipeTagView[] | null | undefined,
): PathValue[][] {
  return (tags ?? [])
    .filter((t) => isTagId(t.id))
    .map((t) => resolvePathByTagId(tree, t.id))
    .filter((p) => isLeafCategoryPath(p))
}
