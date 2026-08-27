import { Button, Empty, Input, Spin, Tree, type TreeDataNode } from 'antd'
import { useMemo, useState, type Key } from 'react'
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
  /** 表格下钻时请求展开；id 递增以支持重复点同一节点 */
  expandRequest?: { key: string; id: number } | null
  onRetry: () => void
  onSelect: (next: NodeSel) => void
}

export default function CategoryNavTree({
  nav,
  loading,
  error,
  selected,
  expandRequest = null,
  onRetry,
  onSelect,
}: Props) {
  const [treeFilter, setTreeFilter] = useState('')
  const [manualExpandedKeys, setManualExpandedKeys] = useState<Key[]>([])
  const [appliedExpandId, setAppliedExpandId] = useState(0)

  const treeData: NavTreeNode[] = useMemo(() => {
    const kw = treeFilter.trim().toLowerCase()
    const match = (name: string, id: string) =>
      !kw ||
      name.toLowerCase().includes(kw) ||
      id.toLowerCase().includes(kw)

    return nav.flatMap((cat) => {
      const children = (cat.children || [])
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

      return [
        {
          key: cat.id,
          title: cat.name,
          kind: 'category',
          id: cat.id,
          children: cat.hasSubs ? children : undefined,
          isLeaf: !cat.hasSubs,
        },
      ]
    })
  }, [nav, treeFilter])

  const filtering = !!treeFilter.trim()
  const expandedKeys = filtering
    ? treeData
        .filter((n) => Array.isArray(n.children) && n.children.length > 0)
        .map((n) => n.key as Key)
    : manualExpandedKeys

  // 表格下钻展开：渲染期校正，避免 effect 内 setState
  if (
    expandRequest &&
    expandRequest.id !== appliedExpandId &&
    !filtering
  ) {
    setAppliedExpandId(expandRequest.id)
    if (!manualExpandedKeys.includes(expandRequest.key)) {
      setManualExpandedKeys([...manualExpandedKeys, expandRequest.key])
    }
  }

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
            expandedKeys={expandedKeys}
            onExpand={(keys) => {
              if (!filtering) setManualExpandedKeys(keys as Key[])
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
