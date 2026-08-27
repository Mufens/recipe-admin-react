import request from '@/utils/request'

export interface CategoryOption {
  /** 一级/二级为 string；叶子 tag 为正整数 number */
  value: string | number
  label: string
  children?: CategoryOption[]
}

/** 获取分类树 */
export function fetchCategoryTree(signal?: AbortSignal) {
  return request.get<CategoryOption[]>('/api/category/tree', { signal })
}
