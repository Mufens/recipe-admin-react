import request from '@/utils/request'
import type {
  ManageListParams,
  ManageListResult,
  ManageNavNode,
  NodeKind,
} from './model'

export function fetchManageNav(signal?: AbortSignal) {
  return request.get<ManageNavNode[]>('/api/category/manage/nav', { signal })
}

export function fetchManageList(params: ManageListParams, signal?: AbortSignal) {
  return request.post<ManageListResult>('/api/category/manage/list', params, {
    signal,
  })
}

export function renameCategory(data: { id: string; name: string }) {
  return request.patch('/api/category/manage/category', data)
}

export function createSubCategory(data: {
  parentId: string
  name: string
  id?: string
}) {
  return request.post('/api/category/manage/sub-category', data)
}

export function renameSubCategory(data: { id: string; name: string }) {
  return request.patch('/api/category/manage/sub-category', data)
}

export function createTag(data: {
  name: string
  parentKind: NodeKind
  parentId: string
  type?: string
  icon?: string
}) {
  return request.post('/api/category/manage/tag', data)
}

export function updateTag(data: {
  id: number
  name: string
  type?: string
  icon?: string
}) {
  return request.patch('/api/category/manage/tag', data)
}

export function deleteTag(id: number) {
  return request.delete(`/api/category/manage/tag/${id}`)
}
