import request from '@/utils/request'
import type { CreateRecipeResult, RecipeFormData } from './model'

/** 创建菜谱 */
export function createRecipe(data: RecipeFormData) {
  return request.post<CreateRecipeResult>('/api/detail/create', data)
}
