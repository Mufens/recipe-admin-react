export interface RecipeTag {
  id: number
  name: string
  path_label?: string
}

export interface RecipeItem {
  id: number
  img: string
  title: string
  use_time: string | null
  difficulty: string | null
  star: number
  author_name: string
  author_avatar: string | null
  /** 列表浏览桶 */
  category_id: string | null
  tags: RecipeTag[]
}

export interface RecipeListResult {
  items: RecipeItem[]
  total: number
  page: number
  pageSize: number
  pages: number
}
