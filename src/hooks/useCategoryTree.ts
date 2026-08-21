import { useQuery } from '@tanstack/react-query'
import { fetchCategoryTree } from '@/api/category'

/**
 * 分类树查询 hook
 * - queryKey ['categoryTree'] 跨页面共享同一份缓存
 * - 默认值 [] 让调用方直接拿到数组，免去 ?? []
 */
export function useCategoryTree() {
  return useQuery({
    queryKey: ['categoryTree'],
    queryFn: ({ signal }) => fetchCategoryTree(signal),
  })
}
