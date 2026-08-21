export interface RecipeItem {
  id: number
  img: string
  title: string
  use_time: string | null
  difficulty: string | null
  star: number
  author_name: string
  author_avatar: string | null
  tag_id: number | null
  category_id: string | null
  tag_name: string | null
  cat_name: string | null
  subcat_name: string | null
}

export interface RecipeListResult {
  items: RecipeItem[]
  total: number
  page: number
  pageSize: number
  pages: number
}
