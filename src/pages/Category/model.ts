/** 左侧树可选中的节点（不含 tag） */
export type NodeKind = 'category' | 'sub_category'

export type NodeSel = {
  kind: NodeKind | ''
  id: string
}

export const DEFAULT_PAGE_SIZE = 25

export interface ManageNavNode {
  id: string
  name: string
  children: {
    id: string
    name: string
  }[]
}

export interface ManageListItem {
  id: string | number
  name: string
  kind: 'category' | 'sub_category' | 'tag'
  type: string | null
  icon: string | null
  /** 一级/二级为下级数量，标签为关联菜谱数 */
  count: number
}

export interface ManageListResult {
  items: ManageListItem[]
  total: number
  page: number
  pageSize: number
  listKind: 'category' | 'sub_category' | 'tag'
  canAddSub: boolean
  canAddTag: boolean
}

export interface ManageListParams {
  nodeKind: NodeKind | ''
  nodeId: string
  keyword: string
  page: number
  pageSize: number
}

export type ModalMode =
  | { type: 'rename'; kind: ManageListItem['kind']; row: ManageListItem }
  | { type: 'createSub'; parentId: string; parentName: string }
  | { type: 'createTag'; parentKind: NodeKind; parentId: string; parentName: string }
  | null

export type CategoryFormValues = {
  name: string
  id?: string
  type?: string
  icon?: string
}
