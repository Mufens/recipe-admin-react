export interface RecipeStep {
  text: string
  image?: string
}

export interface RecipeIngredient {
  name: string
  value: string
}

export interface RecipeEditFormData {
  use_time?: string
  difficulty?: string
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  /** 多条分类路径；叶子 tag 为正整数 number，一级/二级为 string */
  categoryPaths: (string | number)[][]
}

export interface UpdateRecipePayload extends RecipeEditFormData {
  id: number
}

export interface UpdateRecipeResult {
  id: number
  title: string
}
