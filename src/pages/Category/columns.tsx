import { Button, Image, Popconfirm, Space } from 'antd'
import type { NavigateFunction } from 'react-router-dom'
import { type SmartColumn } from '@/components/TableToolbar'
import { imageProps, resolveMediaUrl } from '@/utils/media'
import type { ManageListItem, NodeSel } from './model'

type BuildColumnsOpts = {
  listKind: 'category' | 'sub_category' | 'tag'
  navigate: NavigateFunction
  selectNode: (next: NodeSel) => void
  expandCategoryId: (categoryId: string) => void
  openRename: (row: ManageListItem) => void
  onDeleteTag: (id: number) => void
}

export function buildCategoryColumns({
  listKind,
  navigate,
  selectNode,
  expandCategoryId,
  openRename,
  onDeleteTag,
}: BuildColumnsOpts): SmartColumn<ManageListItem>[] {
  const cols: SmartColumn<ManageListItem>[] = [
    {
      title: '编码',
      key: 'id',
      dataIndex: 'id',
      width: 120,
    },
  ]

  if (listKind === 'tag') {
    cols.push({
      title: '图标',
      key: 'icon',
      dataIndex: 'icon',
      width: 72,
      render: (icon: string | null) => {
        const src = resolveMediaUrl(icon)
        if (!src) return '-'
        return (
          <Image
            width={40}
            height={40}
            src={src}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            {...imageProps}
          />
        )
      },
    })
  }

  cols.push(
    {
      title: '名称',
      key: 'name',
      dataIndex: 'name',
      width: 180,
      ellipsis: true,
      render: (name: string, row) => {
        if (row.kind === 'tag') return <span>{name}</span>
        return (
          <Button
            type="link"
            className="category-page__name-link"
            onClick={() => {
              if (row.kind === 'category') {
                selectNode({ kind: 'category', id: String(row.id) })
                expandCategoryId(String(row.id))
              } else if (row.kind === 'sub_category') {
                selectNode({ kind: 'sub_category', id: String(row.id) })
                if (row.parentId) expandCategoryId(row.parentId)
              }
            }}
          >
            {name}
          </Button>
        )
      },
    },
    {
      title: listKind === 'tag' ? '关联菜谱' : '下级数量',
      key: 'count',
      width: 100,
      render: (_: unknown, row) => {
        if (listKind !== 'tag') return row.childCount ?? 0
        const count = row.recipeCount ?? 0
        if (count <= 0) return 0
        return (
          <Button
            type="link"
            className="category-page__name-link"
            onClick={() =>
              navigate('/recipe/list', {
                state: {
                  filterTagId: Number(row.id),
                  filterNonce: Date.now(),
                },
              })
            }
          >
            {count}
          </Button>
        )
      },
    },
    {
      title: '备注/类型',
      key: 'type',
      dataIndex: 'type',
      width: 120,
      ellipsis: true,
      render: (v: string | null) => v || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: unknown, row) => (
        <Space size={0}>
          <Button type="link" size="small" onClick={() => openRename(row)}>
            修改
          </Button>
          {row.kind === 'tag' && (
            <Popconfirm
              title="确认删掉这个标签？"
              description="有菜谱在用时会拦下来"
              okText="删除"
              okType="danger"
              cancelText="取消"
              onConfirm={() => onDeleteTag(Number(row.id))}
            >
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  )

  return cols
}
