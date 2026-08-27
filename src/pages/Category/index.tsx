import { Button, Input, Pagination, Space } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SmartTable from '@/components/SmartTable'
import { buildCategoryColumns } from './columns'
import CategoryFormModal from './components/CategoryFormModal'
import CategoryNavTree from './components/CategoryNavTree'
import { useCategoryManage } from './hooks/useCategoryManage'
import './index.scss'

export default function CategoryPage() {
  const navigate = useNavigate()
  const m = useCategoryManage()
  const [expandRequest, setExpandRequest] = useState<{
    key: string
    id: number
  } | null>(null)

  const expandCategoryId = (categoryId: string) => {
    setExpandRequest((prev) => ({
      key: categoryId,
      id: (prev?.id ?? 0) + 1,
    }))
  }

  const columns = buildCategoryColumns({
    listKind: m.listKind,
    navigate,
    selectNode: m.selectNode,
    expandCategoryId,
    openRename: m.openRename,
    onDeleteTag: m.deleteTag,
  })

  return (
    <div className="category-page">
      <CategoryNavTree
        nav={m.nav}
        loading={m.navLoading}
        error={m.navError}
        selected={m.selected}
        expandRequest={expandRequest}
        onRetry={() => void m.refetchNav()}
        onSelect={m.selectNode}
      />

      <section className="category-page__main">
        <div className="category-page__main-head">
          <div className="category-page__crumb">
            <Space size={4} separator={<span>/</span>}>
              {m.breadcrumb.map((b, idx) => {
                const active = idx === m.breadcrumb.length - 1
                return (
                  <Button
                    key={`${b.kind}-${b.id || 'root'}-${idx}`}
                    type="link"
                    className={active ? 'is-active' : undefined}
                    onClick={() => {
                      if (active) return
                      const kind =
                        b.kind === 'category' || b.kind === 'sub_category'
                          ? b.kind
                          : ''
                      m.selectNode({
                        kind,
                        id: kind ? b.id || '' : '',
                      })
                    }}
                  >
                    {b.name}
                  </Button>
                )
              })}
            </Space>
          </div>

          <div className="category-page__search">
            <span className="category-page__search-label">名称 / 编码</span>
            <Input
              allowClear
              placeholder="模糊搜索"
              value={m.keywordInput}
              onChange={(e) => m.setKeywordInput(e.target.value)}
              onPressEnter={m.handleSearch}
              style={{ width: 200 }}
            />
            <Space>
              <Button onClick={m.handleReset}>重置</Button>
              <Button type="primary" onClick={m.handleSearch}>
                查询
              </Button>
            </Space>
          </div>
        </div>

        <div className="category-page__table-panel">
          <SmartTable
            toolbar={
              <>
                {m.canAddSub && (
                  <Button type="primary" onClick={m.openCreateSub}>
                    新建分组
                  </Button>
                )}
                {m.canAddTag && (
                  <Button type="primary" onClick={m.openCreateTag}>
                    新增标签
                  </Button>
                )}
              </>
            }
            tableToolbar={false}
            paginationNode={
              <Pagination
                current={m.page}
                pageSize={m.pageSize}
                total={m.total}
                showSizeChanger
                pageSizeOptions={['25', '50', '100']}
                showTotal={(t) => `共 ${t} 条`}
                onChange={(p, ps) => {
                  m.setPage(p)
                  m.setPageSize(ps)
                }}
              />
            }
            rowKey={(r) => `${r.kind}-${r.id}`}
            columns={columns}
            dataSource={m.items}
            loading={m.listLoading}
            pagination={false}
            bordered={false}
            size="middle"
            scroll={{ x: 900 }}
          />
        </div>
      </section>

      <CategoryFormModal
        modal={m.modal}
        form={m.form}
        confirmLoading={m.savePending}
        onCancel={() => m.setModal(null)}
        onOk={() => void m.handleModalOk()}
      />
    </div>
  )
}
