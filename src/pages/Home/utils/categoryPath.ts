import type { CategoryOption } from '@/api/category'

type PathValue = string | number

/**
 * 根据菜谱已有的一级分类 / 特色分类，在分类树中还原 Cascader 路径
 * 例：category_id=b, sub_category_id=bb, tag_id=312 → ["b","bb",312]
 */
export function resolveCategoryPath(
  tree: CategoryOption[],
  categoryId: string | null | undefined,
  tagId: number | null | undefined,
  subCategoryId?: string | null,
): PathValue[] {
  if (tagId != null) {
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
    if (categoryId && subCategoryId) {
      return [categoryId, subCategoryId, tagId]
    }
    if (categoryId) return [categoryId, tagId]
    return [tagId]
  }

  if (categoryId) return [categoryId]
  return []
}
