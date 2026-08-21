import request from '@/utils/request'

export interface CategoryOption {
  value: string
  label: string
  children?: CategoryOption[]
}

/** 获取分类树 */
export function fetchCategoryTree(signal?: AbortSignal) {
  return request.get<CategoryOption[]>('/api/category/tree', { signal })
}
