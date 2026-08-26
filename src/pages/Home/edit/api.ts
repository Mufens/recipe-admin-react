import request from '@/utils/request'
import type { UpdateRecipePayload, UpdateRecipeResult } from './model'

/** 更新菜谱（食材 / 步骤 / 分类 / 难度 / 制作时间） */
export function updateRecipe(data: UpdateRecipePayload) {
  return request.post<UpdateRecipeResult>('/api/detail/update', data)
}
