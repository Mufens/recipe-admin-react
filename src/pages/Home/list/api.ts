import request from '@/utils/request'
import type { RecipeListResult } from './model'

export interface RecipeListParams {
  keyword: string
  page: number
  pageSize: number
  categoryIds: string[][]
  ids: string
  ingredients: string[]
}

export interface ExportParams {
  keyword: string
  ids: string
  categoryIds: string[][]
  ingredients: string[]
}

/** 获取菜谱列表 */
export function fetchRecipeList(params: RecipeListParams, signal?: AbortSignal) {
  return request.post<RecipeListResult>('/api/detail/list', params, { signal })
}

/** 导出菜谱 Excel */
export function exportRecipes(params: ExportParams) {
  return request.post<Blob>('/api/detail/export', params, { responseType: 'blob' })
}

/** 获取所有食材名称（供搜索下拉） */
export function fetchIngredientNames() {
  return request.get<string[]>('/api/detail/ingredient-names')
}