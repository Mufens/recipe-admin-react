/** GET /api/detail?id= 返回的 result */
export interface RecipeStep {
  text: string
  image?: string
}

export interface RecipeIngredient {
  name: string
  value: string
}

export interface RecipeTag {
  id: number
  name: string
  path_label?: string
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
  /** 列表浏览桶；编辑回退用 */
  category_id: string | null
  tags: RecipeTag[]
}
