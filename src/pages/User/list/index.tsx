import { Avatar, Form, Input, Pagination, Space, Button } from 'antd'
import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UserOutlined } from '@ant-design/icons'
import SmartTable from '@/components/SmartTable'
import { type SmartColumn } from '@/components/TableToolbar'
import { resolveMediaUrl } from '@/utils/media'
import { fetchUserList } from './api'
import { type UserItem } from './model'
import './index.scss'

export default function UserList() {
  const pageRef = useRef<HTMLDivElement>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')

  const { data: listData, isFetching: loading, refetch } = useQuery({
    queryKey: ['users', keyword, page, pageSize],
    queryFn: ({ signal }) =>
      fetchUserList({ keyword, page, pageSize }, signal),
  })
  const data = listData?.items ?? []
  const total = listData?.total ?? 0

  const handleSearch = () => {
    setKeyword(keywordInput)
    setPage(1)
  }

  const handleReset = () => {
    setKeywordInput('')
    setKeyword('')
    setPage(1)
    setPageSize(25)
  }

  const handlePageChange = (p: number, ps: number) => {
    setPage(p)
    setPageSize(ps)
  }

  const columns: SmartColumn<UserItem>[] = useMemo(
    () => [
      {
        title: 'ID',
        key: 'id',
        dataIndex: 'id',
        width: 120,
      },
      {
        title: '头像',
        key: 'avatar',
        dataIndex: 'avatar',
        width: 80,
          render: (avatar: string | null) => {
          const src = resolveMediaUrl(avatar)
          return src ? (
            <Avatar size={40} src={src} />
          ) : (
            <Avatar size={40} icon={<UserOutlined />} />
          )
        },
      },
      {
        title: '用户名',
        key: 'username',
        dataIndex: 'username',
        width: 140,
        ellipsis: true,
        render: (name: string | null) => name || '未命名用户',
      },
      {
        title: '手机号',
        key: 'phone',
        dataIndex: 'phone',
        width: 140,
      },
      {
        title: '省份',
        key: 'province',
        dataIndex: 'province',
        width: 100,
        render: (val: string | null) => val || '-',
      },
      {
        title: '家乡',
        key: 'home',
        dataIndex: 'home',
        width: 180,
        ellipsis: true,
        render: (val: string | null) => val || '-',
      },
      {
        title: '职业',
        key: 'profession',
        dataIndex: 'profession',
        width: 120,
        ellipsis: true,
        render: (val: string | null) => val || '-',
      },
      {
        title: '生日',
        key: 'birthday',
        dataIndex: 'birthday',
        width: 120,
        render: (val: string | null) => val || '-',
      },
      {
        title: '简介',
        key: 'des',
        dataIndex: 'des',
        width: 200,
        ellipsis: true,
        render: (val: string | null) => val || '-',
      },
      {
        title: '关注',
        key: 'attention',
        dataIndex: 'attention',
        width: 80,
      },
      {
        title: '粉丝',
        key: 'fan',
        dataIndex: 'fan',
        width: 80,
      },
      {
        title: '注册时间',
        key: 'create_time',
        dataIndex: 'create_time',
        width: 180,
        render: (val: string) => val || '-',
      },
    ],
    [],
  )

  return (
    <div ref={pageRef} className="user-page">
      <Form
        className="user-page__search"
        layout="inline"
        onFinish={handleSearch}
      >
        <Form.Item label="关键词">
          <Input
            allowClear
            placeholder="用户名 / 手机号 / ID"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            style={{ width: 220 }}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button onClick={handleReset}>重置</Button>
            <Button type="primary" htmlType="submit">
              查询
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <div className="user-page__panel">
        <SmartTable<UserItem>
          tableToolbar={{
            loading,
            onReload: () => void refetch(),
            storageKey: 'user-list',
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
