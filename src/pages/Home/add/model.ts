export interface RecipeStep {
  text: string
  image?: string
}

export interface RecipeIngredient {
  name: string
  value: string
}

export interface RecipeFormData {
  img: string
  title: string
  use_time?: string
  difficulty?: string
  up?: number | null
  description?: string
  author_name?: string
  author_avatar?: string
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  tips?: string
  /** 多条分类路径；叶子 tag 为正整数 number，一级/二级为 string */
  categoryPaths: (string | number)[][]
}

export interface CreateRecipeResult {
  id: number
  title: string
}
