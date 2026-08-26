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
  categoryPaths: (string | number)[][]
}

export interface UpdateRecipePayload extends RecipeEditFormData {
  id: number
}

export interface UpdateRecipeResult {
  id: number
  title: string
}
