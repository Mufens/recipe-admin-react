import request from '@/utils/request'
import type { RecipeDetail } from './model'

/** 获取菜谱详情（关闭自动 toast，404 等错误由页面展示错误态） */
export function fetchRecipeDetail(id: string | number, signal?: AbortSignal) {
  return request.get<RecipeDetail>('/api/detail', {
    params: { id },
    signal,
    errToast: false,
  })
}
