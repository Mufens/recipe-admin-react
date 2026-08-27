import { Form, message } from 'antd'
import { useEffect, useState } from 'react'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  createSubCategory,
  createTag,
  deleteTag,
  fetchManageList,
  fetchManageNav,
  renameCategory,
  renameSubCategory,
  updateTag,
} from '../api'
import type {
  CategoryFormValues,
  ManageListItem,
  ManageListParams,
  ManageNavNode,
  ModalMode,
  NodeSel,
} from '../model'
import { DEFAULT_PAGE_SIZE } from '../model'

const ROOT_CRUMB = { id: '', name: '全部分类', kind: '' as const }

function isNodeInNav(nav: ManageNavNode[], selected: NodeSel): boolean {
  if (!selected.kind || !selected.id) return true
  if (selected.kind === 'category') {
    return nav.some((n) => n.id === selected.id)
  }
  return nav.some((n) =>
    (n.children || []).some((s) => s.id === selected.id),
  )
}

const SAVE_MSG: Record<NonNullable<ModalMode>['type'], string> = {
  rename: '保存成功',
  createSub: '分组已建好',
  createTag: '标签已挂上',
}

export function useCategoryManage() {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<NodeSel>({ kind: '', id: '' })
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [modal, setModal] = useState<ModalMode>(null)
  const [form] = Form.useForm<CategoryFormValues>()

  const selectNode = (next: NodeSel) => {
    setSelected(next)
    setKeywordInput('')
    setKeyword('')
    setPage(1)
  }

  const {
    data: nav = [],
    isLoading: navLoading,
    isError: navError,
    refetch: refetchNav,
  } = useQuery({
    queryKey: ['categoryManageNav'],
    queryFn: ({ signal }) => fetchManageNav(signal),
  })

  // nav 刷新后若选中已失效，在渲染期校正（避免 effect 内级联 setState）
  if (!navLoading && !isNodeInNav(nav, selected)) {
    selectNode({ kind: '', id: '' })
  }

  const listParams: ManageListParams = {
    nodeKind: selected.kind,
    nodeId: selected.id,
    keyword,
    page,
    pageSize,
  }

  const { data: listData, isFetching: listLoading } = useQuery({
    queryKey: ['categoryManageList', listParams],
    queryFn: ({ signal }) => fetchManageList(listParams, signal),
    placeholderData: keepPreviousData,
  })

  const items = listData?.items ?? []
  const total = listData?.total ?? 0
  const listKind = listData?.listKind ?? 'category'
  const canAddSub = listData?.canAddSub ?? false
  const canAddTag = listData?.canAddTag ?? false
  const breadcrumb = listData?.breadcrumb?.length
    ? listData.breadcrumb
    : [ROOT_CRUMB]

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['categoryManageNav'] }),
      queryClient.invalidateQueries({ queryKey: ['categoryManageList'] }),
      queryClient.invalidateQueries({ queryKey: ['categoryTree'] }),
    ])
  }

  const saveMut = useMutation({
    mutationFn: async ({
      mode,
      values,
    }: {
      mode: NonNullable<ModalMode>
      values: CategoryFormValues
    }) => {
      if (mode.type === 'rename') {
        const { kind, row } = mode
        if (kind === 'category') {
          await renameCategory({ id: String(row.id), name: values.name })
        } else if (kind === 'sub_category') {
          await renameSubCategory({ id: String(row.id), name: values.name })
        } else {
          await updateTag({
            id: Number(row.id),
            name: values.name,
            type: values.type,
            icon: values.icon,
          })
        }
        return
      }
      if (mode.type === 'createSub') {
        await createSubCategory({
          parentId: mode.parentId,
          name: values.name,
          id: values.id,
        })
        return
      }
      await createTag({
        parentKind: mode.parentKind,
        parentId: mode.parentId,
        name: values.name,
        type: values.type,
        icon: values.icon,
      })
    },
    onSuccess: async (_data, { mode }) => {
      message.success(SAVE_MSG[mode.type])
      setModal(null)
      await invalidateAll()
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteTag(id),
    onSuccess: async () => {
      message.success('已删掉')
      await invalidateAll()
    },
  })

  const openRename = (row: ManageListItem) => {
    setModal({ type: 'rename', kind: row.kind, row })
  }

  const openCreateSub = () => {
    if (selected.kind !== 'category' || !selected.id) return
    const cat = nav.find((n) => n.id === selected.id)
    setModal({
      type: 'createSub',
      parentId: selected.id,
      parentName: cat?.name || selected.id,
    })
  }

  const openCreateTag = () => {
    if (!selected.kind || !selected.id) return
    const parentName =
      breadcrumb.find((b) => b.id === selected.id)?.name || selected.id
    setModal({
      type: 'createTag',
      parentKind: selected.kind,
      parentId: selected.id,
      parentName,
    })
  }

  // Modal destroyOnHidden 后 Form 才挂载，需等打开后再灌值
  useEffect(() => {
    if (!modal) return
    if (modal.type === 'rename') {
      const values: CategoryFormValues = { name: modal.row.name }
      if (modal.kind === 'tag') {
        values.type = modal.row.type || ''
        values.icon = modal.row.icon || ''
      }
      form.setFieldsValue(values)
    } else if (modal.type === 'createSub') {
      form.setFieldsValue({ name: '', id: '' })
    } else {
      form.setFieldsValue({ name: '', type: '', icon: '' })
    }
  }, [modal, form])

  const handleModalOk = async () => {
    const values = await form.validateFields()
    if (!modal) return
    await saveMut.mutateAsync({ mode: modal, values })
  }

  return {
    nav,
    navLoading,
    navError,
    refetchNav,
    selected,
    selectNode,
    keywordInput,
    setKeywordInput,
    handleSearch: () => {
      setKeyword(keywordInput)
      setPage(1)
    },
    handleReset: () => {
      setKeywordInput('')
      setKeyword('')
      setPage(1)
      setPageSize(DEFAULT_PAGE_SIZE)
    },
    page,
    pageSize,
    setPage,
    setPageSize,
    items,
    total,
    listKind,
    listLoading,
    breadcrumb,
    canAddSub,
    canAddTag,
    modal,
    setModal,
    form,
    savePending: saveMut.isPending,
    deleteTag: (id: number) => deleteMut.mutate(id),
    openRename,
    openCreateSub,
    openCreateTag,
    handleModalOk,
  }
}
