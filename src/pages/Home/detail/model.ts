/** GET /api/detail?id= 返回的 result */
export interface RecipeStep {
  text: string
  image?: string
}

export interface RecipeIngredient {
  name: string
  value: string
}

export interface RecipeDetail {
  id: number
  img: string
  title: string
  use_time: string | null
  difficulty: string | null
  person: number | null
  up: number | null
  pictures: string[] | null
  author_id: number | null
  author_name: string | null
  author_avatar: string | null
  description: string | null
  ingredients: RecipeIngredient[] | null
  steps: RecipeStep[] | null
  star: number
  ratio: string | null
  tips: string | null
  tag_id: number | null
  category_id: string | null
  tag_name: string | null
  cat_name: string | null
  subcat_name: string | null
}
