import request from '@/utils/request'
import type { RecipeListResult } from './model'

export type SearchMode = 'exact' | 'fuzzy'

export interface RecipeListParams {
  keyword: string
  page: number
  pageSize: number
  categoryIds: (string | number)[][]
  ids: string
  /** 标准食材 id 列表 */
  ingredients: number[]
  ingredientMode: SearchMode
}

export interface ExportParams {
  keyword: string
  ids: string
  categoryIds: (string | number)[][]
  ingredients: number[]
  ingredientMode: SearchMode
}

export interface ImportResult {
  total: number
  successCount: number
  failCount: number
  success: { row: number; id: number; title: string }[]
  failed: { row: number; message: string }[]
}

/** 获取菜谱列表 */
export function fetchRecipeList(params: RecipeListParams, signal?: AbortSignal) {
  return request.post<RecipeListResult>('/api/detail/list', params, { signal })
}

/** 导出菜谱 Excel */
export function exportRecipes(params: ExportParams) {
  return request.post<Blob>('/api/detail/export', params, { responseType: 'blob' })
}

/** 下载批量导入模板 */
export function downloadImportTemplate() {
  return request.get<Blob>('/api/detail/import-template', {
    responseType: 'blob',
  })
}

/** 批量导入菜谱 Excel */
export function importRecipes(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<ImportResult>('/api/detail/import', formData, {
    timeout: 120000,
  })
}

export interface DeleteRecipesResult {
  requested: number
  deleted: number
  ids: number[]
}

/** 删除菜谱（单条或批量，ids 英文逗号分隔） */
export function deleteRecipes(ids: Array<string | number | bigint>) {
  return request.post<DeleteRecipesResult>('/api/detail/delete', {
    ids: ids.map(String).join(','),
  })
}

export interface FoodMaterialOption {
  id: number
  name: string
}

/** 获取标准食材字典（下拉） */
export function fetchIngredientNames() {
  return request.get<FoodMaterialOption[]>('/api/detail/ingredient-names')
}
