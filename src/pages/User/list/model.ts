export interface UserItem {
  id: number
  phone: string
  username: string | null
  avatar: string | null
  create_time: string
  province: string | null
  birthday: string | null
  profession: string | null
  home: string | null
  des: string | null
  attention: number
  fan: number
}

export interface UserListResult {
  items: UserItem[]
  total: number
  page: number
  pageSize: number
  pages: number
}
