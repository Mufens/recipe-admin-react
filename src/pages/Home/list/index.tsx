import { PlusCircleOutlined, UploadOutlined } from '@ant-design/icons'
import {
  Button,
  Cascader,
  Form,
  Image,
  Input,
  Pagination,
  Space,
  Tag,
} from 'antd'
import { useMemo, useState, type Key } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import SmartTable from '@/components/SmartTable'
import { type SmartColumn } from '@/components/TableToolbar'
import { useCategoryTree } from '@/hooks/useCategoryTree'
import { difficultyColor } from '@/utils/difficulty'
import { imageProps, resolveMediaUrl } from '@/utils/media'
import { exportRecipes, fetchRecipeList } from './api'
import { type RecipeItem } from './model'
import './index.scss'

export default function Home() {
  const navigate = useNavigate()

  const [exporting, setExporting] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

  const [idInput, setIdInput] = useState('')
  const [searchIds, setSearchIds] = useState('')

  const [selectedCategory, setSelectedCategory] = useState<string[][]>([])
  const [categoryInput, setCategoryInput] = useState<string[][]>([])

  const { data: categoryTree = [] } = useCategoryTree()

  const { data: listData, isFetching: loading, refetch } = useQuery({
    queryKey: ['recipes', keyword, page, pageSize, selectedCategory, searchIds],
    queryFn: ({ signal }) =>
      fetchRecipeList(
        { keyword, page, pageSize, categoryIds: selectedCategory, ids: searchIds },
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
    setPage(1)
  }

  const handleReset = () => {
    setKeywordInput('')
    setKeyword('')
    setSelectedCategory([])
    setCategoryInput([])
    setIdInput('')
    setSearchIds('')
    setPage(1)
    setPageSize(25)
    setSelectedRowKeys([])
  }

  const handlePageChange = (p: number, ps: number) => {
    setPage(p)
    setPageSize(ps)
  }

  const handleAdd = () => {
    navigate('/add')
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await exportRecipes({
        keyword,
        ids: selectedRowKeys.map(String).join(','),
        categoryIds: selectedCategory,
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

  const columns: SmartColumn<RecipeItem>[] = useMemo(
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
        width: 100,
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
        title: '一级分类',
        key: 'cat_name',
        dataIndex: 'cat_name',
        width: 100,
        render: (val: string | null) => {
          if (!val) return '-'
          return <Tag color="blue">{val}</Tag>
        },
      },
      {
        title: '二级分类',
        key: 'subcat_name',
        dataIndex: 'subcat_name',
        width: 100,
        render: (val: string | null) => {
          if (!val) return '-'
          return <Tag color="cyan">{val}</Tag>
        },
      },
      {
        title: '三级分类',
        key: 'tag_name',
        dataIndex: 'tag_name',
        width: 100,
        render: (val: string | null) => {
          if (!val) return '-'
          return <Tag color="purple">{val}</Tag>
        },
      },
      {
        title: '作者',
        key: 'author_name',
        dataIndex: 'author_name',
        width: 100,
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
        width: 80,
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

  return (
    <div className="home-page">
      <Form
        className="home-page__search"
        layout="inline"
        onFinish={handleSearch}
      >
        <Form.Item label="菜谱名称">
          <Input
            allowClear
            placeholder="请输入"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            style={{ width: 200 }}
          />
        </Form.Item>
        <Form.Item label="编号">
          <Input
            allowClear
            placeholder="多个用逗号分隔，如 11,33"
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
            placeholder="请选择分类"
            style={{ width: 320 }}
          />
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
                icon={<PlusCircleOutlined />}
                onClick={() => void handleAdd()}
              >
                新增
              </Button>
              <Button
                type="primary"
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
    </div>
  )
}
