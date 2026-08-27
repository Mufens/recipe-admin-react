import { DeleteOutlined, ImportOutlined, PlusCircleOutlined, UploadOutlined } from '@ant-design/icons'
import {
  Button,
  Cascader,
  Form,
  Image,
  Input,
  Modal,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Tag,
  message,
} from 'antd'
import { useMemo, useRef, useState, type Key } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import SmartTable from '@/components/SmartTable'
import { type SmartColumn } from '@/components/TableToolbar'
import { useCategoryTree } from '@/hooks/useCategoryTree'
import { difficultyColor } from '@/utils/difficulty'
import { imageProps, resolveMediaUrl } from '@/utils/media'
import { resolvePathByTagId } from '../utils/categoryPath'
import {
  deleteRecipes,
  exportRecipes,
  fetchIngredientNames,
  fetchRecipeList,
  type SearchMode,
} from './api'
import BatchImportModal from './components/BatchImportModal'
import { type RecipeItem } from './model'
import './index.scss'

export type HomeLocationState = {
  filterTagId?: number
  filterNonce?: number
}

export default function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const pageRef = useRef<HTMLDivElement>(null)

  const [exporting, setExporting] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

  const [idInput, setIdInput] = useState('')
  const [searchIds, setSearchIds] = useState('')

  const [selectedCategory, setSelectedCategory] = useState<(string | number)[][]>([])
  const [categoryInput, setCategoryInput] = useState<(string | number)[][]>([])

  const [searchIngredients, setSearchIngredients] = useState<number[]>([])
  const [ingredientInput, setIngredientInput] = useState<number[]>([])
  const [ingredientMode, setIngredientMode] = useState<SearchMode>('exact')
  const [ingredientModeInput, setIngredientModeInput] = useState<SearchMode>('exact')

  const { data: categoryTree = [] } = useCategoryTree()
  const { data: ingredientOptions = [] } = useQuery({
    queryKey: ['ingredientNames'],
    queryFn: () => fetchIngredientNames(),
    staleTime: 5 * 60 * 1000,
  })

  // 分类管理「关联菜谱」跳转：带 filterTagId 进入 → 写入分类筛选
  const locState = (location.state || {}) as HomeLocationState
  const filterTagId = locState.filterTagId
  const filterNonce = locState.filterNonce
  const tagFilterPath = useMemo(() => {
    if (filterTagId == null || !categoryTree.length) return null
    return resolvePathByTagId(categoryTree, filterTagId)
  }, [filterTagId, categoryTree])
  const [appliedNonce, setAppliedNonce] = useState<number | null>(null)
  if (
    filterTagId != null &&
    filterNonce != null &&
    tagFilterPath &&
    filterNonce !== appliedNonce
  ) {
    setAppliedNonce(filterNonce)
    setCategoryInput([tagFilterPath])
    setSelectedCategory([tagFilterPath])
    setSelectedRowKeys([])
    setPage(1)
  }

  const { data: listData, isFetching: loading, refetch } = useQuery({
    queryKey: [
      'recipes',
      keyword,
      page,
      pageSize,
      selectedCategory,
      searchIds,
      searchIngredients,
      ingredientMode,
    ],
    queryFn: ({ signal }) =>
      fetchRecipeList(
        {
          keyword,
          page,
          pageSize,
          categoryIds: selectedCategory,
          ids: searchIds,
          ingredients: searchIngredients,
          ingredientMode,
        },
        signal,
      ),
  })
  const data = listData?.items ?? []
  const total = listData?.total ?? 0

  const handleSearch = () => {
    setSelectedRowKeys([])
    setKeyword(keywordInput)
    setSelectedCategory(categoryInput)
    setSearchIds(idInput)
    setSearchIngredients(ingredientInput)
    setIngredientMode(ingredientModeInput)
    setPage(1)
  }

  const handleReset = () => {
    setKeywordInput('')
    setKeyword('')
    setSelectedCategory([])
    setCategoryInput([])
    setIdInput('')
    setSearchIds('')
    setIngredientInput([])
    setSearchIngredients([])
    setIngredientMode('exact')
    setIngredientModeInput('exact')
    setPage(1)
    setPageSize(25)
    setSelectedRowKeys([])
  }

  const handlePageChange = (p: number, ps: number) => {
    setPage(p)
    setPageSize(ps)
  }

  const handleAdd = () => {
    navigate('/recipe/add')
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await exportRecipes({
        keyword,
        ids: selectedRowKeys.map(String).join(','),
        categoryIds: selectedCategory,
        ingredients: searchIngredients,
        ingredientMode,
      })
      const url = URL.createObjectURL(blob)
      const a = Object.assign(document.createElement('a'), {
        href: url,
        download: '菜谱列表.xlsx',
      })
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // 错误 toast 由拦截器统一处理
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async (ids: Key[]) => {
    if (!ids.length) {
      message.warning('请选择要删除的菜谱')
      return
    }
    setDeleting(true)
    try {
      await deleteRecipes(ids)
      message.success('删除成功')
      const idSet = new Set(ids.map(String))
      setSelectedRowKeys((prev) => prev.filter((k) => !idSet.has(String(k))))
      await refetch()
    } catch {
      // 错误 toast 由拦截器统一处理
    } finally {
      setDeleting(false)
    }
  }

  const handleBatchDelete = () => {
    if (!selectedRowKeys.length) {
      message.warning('请先勾选要删除的菜谱')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定删除选中的 ${selectedRowKeys.length} 条菜谱吗？删除后不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => handleDelete(selectedRowKeys),
    })
  }

  const baseColumns: SmartColumn<RecipeItem>[] = useMemo(
    () => [
      {
        title: '编号',
        key: 'id',
        dataIndex: 'id',
        width: 80,
        fixed: 'left',
        render: (id: number) => (
          <Link to={`/detail?id=${id}`} style={{ textDecoration: 'none' }}>
            {id}
          </Link>
        ),
      },
      {
        title: '封面',
        key: 'img',
        dataIndex: 'img',
        width: 120,
        render: (img: string) => (
          <Image
            width={80}
            height={60}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            src={resolveMediaUrl(img)}
            {...imageProps}
          />
        ),
      },
      {
        title: '菜谱名称',
        key: 'title',
        dataIndex: 'title',
        width: 200,
        ellipsis: true,
        render: (title: string) => (
          <span style={{ fontWeight: 500 }}>{title}</span>
        ),
      },
      {
        title: '分类标签',
        key: 'tags',
        dataIndex: 'tags',
        width: 280,
        render: (_: unknown, record) => {
          const tags = record.tags ?? []
          if (!tags.length) return '-'
          return (
            <Space size={[4, 4]} wrap>
              {tags.map((t) => (
                <Tag key={t.id || t.name} color="purple">
                  {t.path_label || t.name}
                </Tag>
              ))}
            </Space>
          )
        },
      },
      {
        title: '作者',
        key: 'author_name',
        dataIndex: 'author_name',
        width: 150,
        ellipsis: true,
        render: (name: string, record) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {resolveMediaUrl(record.author_avatar) && (
              <Image
                width={24}
                height={24}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
                src={resolveMediaUrl(record.author_avatar)}
                preview={false}
                {...imageProps}
              />
            )}
            <span>{name}</span>
          </div>
        ),
      },
      {
        title: '难度',
        key: 'difficulty',
        dataIndex: 'difficulty',
        width: 100,
        render: (val: string | null) => {
          if (!val) return '-'
          return <Tag color={difficultyColor(val)}>{val}</Tag>
        },
      },
      {
        title: '制作时间',
        key: 'use_time',
        dataIndex: 'use_time',
        width: 100,
        render: (val: string | null) => val || '-',
      },
      {
        title: '收藏数',
        key: 'star',
        dataIndex: 'star',
        width: 100,
        sorter: (a, b) => a.star - b.star,
      },
    ],
    [],
  )

  const columns: SmartColumn<RecipeItem>[] = [
    ...baseColumns,
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_: unknown, record) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/recipe/edit?id=${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该菜谱？"
            description="删除后不可恢复"
            okText="删除"
            okType="danger"
            cancelText="取消"
            onConfirm={() => void handleDelete([record.id])}
          >
            <Button type="link" danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div ref={pageRef} className="home-page">
      <Form
        className="home-page__search"
        layout="inline"
        onFinish={handleSearch}
      >
        <Form.Item label="菜谱名称">
          <Input
            allowClear
            placeholder="模糊搜素"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            style={{ width: 200 }}
          />
        </Form.Item>
        <Form.Item label="编号">
          <Input
            allowClear
            placeholder="多个用,英文逗号分隔"
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            style={{ width: 200 }}
          />
        </Form.Item>
        <Form.Item label="分类筛选">
          <Cascader
            multiple
            maxTagCount="responsive"
            options={categoryTree}
            value={categoryInput}
            onChange={(val) => {
              setCategoryInput(val ?? [])
            }}
            allowClear
            changeOnSelect
            placeholder="请选择"
            style={{ width: 320 }}
          />
        </Form.Item>
        <Form.Item label="食材筛选">
          <Space.Compact style={{ width: 400 }}>
            <Select
              value={ingredientModeInput}
              onChange={setIngredientModeInput}
              options={[
                { label: '精确', value: 'exact' },
                { label: '模糊', value: 'fuzzy' },
              ]}
              style={{ width: 80 }}
            />
            <Select
              mode="multiple"
              maxTagCount="responsive"
              options={ingredientOptions.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              value={ingredientInput}
              onChange={(val) => setIngredientInput(val ?? [])}
              allowClear
              showSearch={{ optionFilterProp: 'label' }}
              placeholder="请选择"
              style={{ width: 320 }}
            />
          </Space.Compact>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button htmlType="button" onClick={handleReset}>
              重置
            </Button>
            <Button type="primary" htmlType="submit">
              查询
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <div className="home-page__panel">
        <SmartTable<RecipeItem>
          toolbar={
            <>
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={() => void handleAdd()}
              >
                新增
              </Button>
              <Button
                icon={<ImportOutlined />}
                onClick={() => setImportOpen(true)}
              >
                批量导入
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={deleting}
                disabled={!selectedRowKeys.length}
                onClick={handleBatchDelete}
              >
                删除
              </Button>
              <Button
                icon={<UploadOutlined />}
                loading={exporting}
                onClick={() => void handleExport()}
              >
                导出
              </Button>
            </>
          }
          tableToolbar={{
            loading,
            onReload: () => void refetch(),
            storageKey: 'home-list',
            fullscreenTargetRef: pageRef,
          }}
          paginationNode={
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              pageSizeOptions={['25', '50', '100', '250']}
              showSizeChanger
              showTotal={(t) => `共 ${t} 条`}
              onChange={handlePageChange}
            />
          }
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            preserveSelectedRowKeys: true,
          }}
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>

      <BatchImportModal
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        onSuccess={() => {
          setImportOpen(false)
          void refetch()
        }}
      />
    </div>
  )
}
