import request from '@/utils/request'
import type { UserListResult } from './model'

export interface UserListParams {
  keyword: string
  page: number
  pageSize: number
}

/** 获取用户列表 */
export function fetchUserList(params: UserListParams, signal?: AbortSignal) {
  return request.post<UserListResult>('/api/users/list', params, { signal })
}
