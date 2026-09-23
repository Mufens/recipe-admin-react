import { Button, Empty, Input, Spin, Tree, type TreeDataNode } from 'antd'
import { useMemo, useState } from 'react'
import type { ManageNavNode, NodeKind, NodeSel } from '../model'

type NavTreeNode = TreeDataNode & {
  kind: NodeKind
  id: string
}

type Props = {
  nav: ManageNavNode[]
  loading: boolean
  error: boolean
  selected: NodeSel
  expandedKeys: string[]
  onRetry: () => void
  onSelect: (next: NodeSel) => void
  onExpand: (keys: string[]) => void
}

export default function CategoryNavTree({
  nav,
  loading,
  error,
  selected,
  expandedKeys,
  onRetry,
  onSelect,
  onExpand,
}: Props) {
  const [treeFilter, setTreeFilter] = useState('')

  const treeData: NavTreeNode[] = useMemo(() => {
    const kw = treeFilter.trim().toLowerCase()
    const match = (name: string, id: string) =>
      !kw ||
      name.toLowerCase().includes(kw) ||
      id.toLowerCase().includes(kw)

    return nav.flatMap((cat) => {
      const subs = cat.children || []
      const children = subs
        .filter((sub) => match(sub.name, sub.id))
        .map(
          (sub): NavTreeNode => ({
            key: sub.id,
            title: sub.name,
            kind: 'sub_category',
            id: sub.id,
            isLeaf: true,
          }),
        )

      const selfHit = match(cat.name, cat.id)
      if (!selfHit && children.length === 0 && kw) return []

      const hasSubs = subs.length > 0
      return [
        {
          key: cat.id,
          title: cat.name,
          kind: 'category',
          id: cat.id,
          children: hasSubs ? children : undefined,
          isLeaf: !hasSubs,
        },
      ]
    })
  }, [nav, treeFilter])

  const filtering = !!treeFilter.trim()
  const shownExpandedKeys = filtering
    ? treeData
        .filter((n) => Array.isArray(n.children) && n.children.length > 0)
        .map((n) => String(n.key))
    : expandedKeys

  const selectedKeys =
    selected.kind && selected.id ? [selected.id] : []

  return (
    <aside className="category-page__aside">
      <div className="category-page__aside-head">分类导航</div>
      <div className="category-page__aside-filter">
        <Input
          allowClear
          placeholder="搜索分类"
          value={treeFilter}
          onChange={(e) => setTreeFilter(e.target.value)}
        />
      </div>
      <div className="category-page__tree">
        {loading ? (
          <div className="category-page__tree-state">
            <Spin size="small" />
          </div>
        ) : error ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="导航加载失败"
          >
            <Button size="small" onClick={onRetry}>
              重试
            </Button>
          </Empty>
        ) : treeData.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无分类" />
        ) : (
          <Tree
            blockNode
            treeData={treeData}
            selectedKeys={selectedKeys}
            expandedKeys={shownExpandedKeys}
            onExpand={(keys) => {
              if (!filtering) onExpand(keys.map(String))
            }}
            onSelect={(keys, { node }) => {
              if (!keys.length) {
                onSelect({ kind: '', id: '' })
                return
              }
              const n = node as NavTreeNode
              if (n.kind && n.id) onSelect({ kind: n.kind, id: n.id })
            }}
          />
        )}
      </div>
    </aside>
  )
}
