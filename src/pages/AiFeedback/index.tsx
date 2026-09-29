import { Form, Input, Pagination, Select, Space, Button } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import SmartTable from '@/components/SmartTable'
import { type SmartColumn } from '@/components/TableToolbar'
import { fetchLowSatisfaction } from './api'
import {
  FEEDBACK_REASONS,
  type FeedbackReasonCode,
  type LowSatisfactionItem,
} from './model'
import './index.scss'

const QUESTION_TYPE_LABEL: Record<string, string> = {
  recipe: '菜谱',
  health: '饮食',
  flavor: '口味',
  leftovers: '手头食材',
  favorites: '收藏推荐',
}

function formatTime(val: string | null) {
  if (!val) return '-'
  const d = dayjs(val)
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : '-'
}

export default function AiFeedbackPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [reason, setReason] = useState<'' | FeedbackReasonCode>('')
  const [reasonInput, setReasonInput] = useState<'' | FeedbackReasonCode>('')

  const { data: listData, isFetching: loading, refetch } = useQuery({
    queryKey: ['ai-feedback', keyword, reason, page, pageSize],
    queryFn: ({ signal }) =>
      fetchLowSatisfaction({ keyword, reason, page, pageSize }, signal),
  })
  const data = listData?.items ?? []
  const total = listData?.total ?? 0

  const handleSearch = () => {
    setKeyword(keywordInput)
    setReason(reasonInput)
    setPage(1)
  }

  const handleReset = () => {
    setKeywordInput('')
    setKeyword('')
    setReasonInput('')
    setReason('')
    setPage(1)
    setPageSize(25)
  }

  const columns: SmartColumn<LowSatisfactionItem>[] = useMemo(
    () => [
      {
        title: '问题',
        key: 'question',
        dataIndex: 'question',
        width: 220,
        fixed: 'left',
        ellipsis: true,
      },
      {
        title: '类型',
        key: 'questionType',
        dataIndex: 'questionType',
        width: 100,
        render: (val: string) => QUESTION_TYPE_LABEL[val] || val || '-',
      },
      {
        title: '踩',
        key: 'downCount',
        dataIndex: 'downCount',
        width: 72,
      },
      {
        title: '赞',
        key: 'upCount',
        dataIndex: 'upCount',
        width: 72,
      },
      ...FEEDBACK_REASONS.map((item) => ({
        title: item.label,
        key: item.code,
        width: 120,
        render: (_: unknown, row: LowSatisfactionItem) =>
          row.reasons?.[item.code] ?? 0,
      })),
      {
        title: '最近回答',
        key: 'latestAnswer',
        dataIndex: 'latestAnswer',
        width: 280,
        ellipsis: true,
        render: (val: string) => val || '-',
      },
      {
        title: '补充说明',
        key: 'latestNote',
        dataIndex: 'latestNote',
        width: 180,
        ellipsis: true,
        render: (val: string) => val || '-',
      },
      {
        title: '最近反馈',
        key: 'lastFeedbackAt',
        dataIndex: 'lastFeedbackAt',
        width: 160,
        render: (val: string | null) => formatTime(val),
      },
    ],
    [],
  )

  return (
    <div ref={pageRef} className="ai-feedback-page">
      <Form
        className="ai-feedback-page__search"
        layout="inline"
        onFinish={handleSearch}
      >
        <Form.Item label="问题">
          <Input
            allowClear
            placeholder="问题关键词"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            style={{ width: 220 }}
          />
        </Form.Item>
        <Form.Item label="原因">
          <Select
            allowClear
            placeholder="全部原因"
            value={reasonInput || undefined}
            onChange={(val) => setReasonInput(val || '')}
            options={FEEDBACK_REASONS.map((item) => ({
              value: item.code,
              label: item.label,
            }))}
            style={{ width: 160 }}
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

      <div className="ai-feedback-page__panel">
        <SmartTable<LowSatisfactionItem>
          tableToolbar={{
            loading,
            onReload: () => void refetch(),
            storageKey: 'ai-feedback',
            fullscreenTargetRef: pageRef,
          }}
          paginationNode={
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              pageSizeOptions={['25', '50', '100']}
              showSizeChanger
              showTotal={(t) => `共 ${t} 条`}
              onChange={(p, ps) => {
                setPage(p)
                setPageSize(ps)
              }}
            />
          }
          rowKey={(row) => `${row.questionType}:${row.question}`}
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
