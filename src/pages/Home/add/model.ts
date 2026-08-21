export interface RecipeStep {
  text: string
  image?: string
}

export interface RecipeFormData {
  img: string
  title: string
  use_time?: string
  difficulty?: string
  person?: number | null
  up?: number | null
  description?: string
  ingredients: string[]
  steps: RecipeStep[]
  tips?: string
  categoryPath: (string | number)[]
}

export interface CreateRecipeResult {
  id: number
  title: string
}
