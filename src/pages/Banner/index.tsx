import { Button, Image, Switch, message } from 'antd'
import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import SmartTable from '@/components/SmartTable'
import { type SmartColumn } from '@/components/TableToolbar'
import { imageProps, resolveMediaUrl } from '@/utils/media'
import BannerCoversModal from './BannerCoversModal'
import {
  fetchBannerManageList,
  patchBannerActive,
  patchBannerCovers,
} from './api'
import {
  BANNER_QUERY_KEY,
  LINK_TYPE_OPTIONS,
  RANK_OPTIONS,
  needsFixedCovers,
  type BannerCover,
  type BannerItem,
} from './model'
import './index.scss'

function labelOf(
  options: readonly { value: string; label: string }[],
  value?: string | null,
) {
  return options.find((o) => o.value === value)?.label ?? value ?? '-'
}

export default function BannerPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<BannerItem | null>(null)

  const { data = [], isFetching, refetch } = useQuery({
    queryKey: BANNER_QUERY_KEY,
    queryFn: ({ signal }) => fetchBannerManageList(signal),
  })

  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      patchBannerActive(id, isActive),
    onMutate: ({ id, isActive }) => {
      const prev = queryClient.getQueryData<BannerItem[]>(BANNER_QUERY_KEY)
      queryClient.setQueryData<BannerItem[]>(BANNER_QUERY_KEY, (list = []) =>
        list.map((row) =>
          row.id === id ? { ...row, is_active: Number(isActive) } : row,
        ),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(BANNER_QUERY_KEY, ctx.prev)
    },
    onSuccess: (_data, { isActive }) => {
      message.success(isActive ? '已启用' : '已停用')
    },
  })

  const coversMutation = useMutation({
    mutationFn: ({ id, covers }: { id: number; covers: BannerCover[] }) =>
      patchBannerCovers(id, covers),
    onSuccess: ({ covers }, { id }) => {
      queryClient.setQueryData<BannerItem[]>(BANNER_QUERY_KEY, (list = []) =>
        list.map((row) => (row.id === id ? { ...row, covers } : row)),
      )
      message.success('已保存封面')
      setEditing(null)
    },
  })

  const columns: SmartColumn<BannerItem>[] = [
    {
      title: '排序',
      key: 'sort_order',
      dataIndex: 'sort_order',
      width: 72,
      fixed: 'left',
    },
    {
      title: '封面',
      key: 'covers',
      dataIndex: 'covers',
      width: 168,
      className: 'banner-page__cover-cell',
      render: (_: BannerCover[] | undefined, row: BannerItem) => {
        if (needsFixedCovers(row.layout)) {
          const thumbs = (row.covers ?? []).slice(0, 3)
          return (
            <div className="banner-page__covers">
              {thumbs.length ? (
                thumbs.map((cover) => {
                  const src = resolveMediaUrl(cover.img)
                  return src ? (
                    <Image
                      key={cover.id}
                      src={src}
                      width={40}
                      height={40}
                      style={{ objectFit: 'cover' }}
                      {...imageProps}
                    />
                  ) : null
                })
              ) : (
                <span className="banner-page__muted">未设置</span>
              )}
            </div>
          )
        }
        const src = resolveMediaUrl(row.img)
        return src ? (
          <Image
            src={src}
            width={56}
            height={40}
            style={{ objectFit: 'cover' }}
            {...imageProps}
          />
        ) : (
          <span className="banner-page__muted">自动</span>
        )
      },
    },
    {
      title: '标题',
      key: 'title',
      dataIndex: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '副标题',
      key: 'subtitle',
      dataIndex: 'subtitle',
      width: 220,
      ellipsis: true,
      render: (val: string | null) => val || '-',
    },
    {
      title: '角标',
      key: 'badge',
      dataIndex: 'badge',
      width: 88,
      render: (val: string | null) => val || '-',
    },
    {
      title: '按钮',
      key: 'cta',
      dataIndex: 'cta',
      width: 110,
      render: (val: string | null) => val || '-',
    },
    {
      title: '跳转',
      key: 'link_type',
      dataIndex: 'link_type',
      width: 160,
      render: (_: unknown, row: BannerItem) => {
        const typeLabel = labelOf(LINK_TYPE_OPTIONS, row.link_type)
        if (row.link_type === 'surprise') return typeLabel
        const valueLabel =
          row.link_type === 'rank'
            ? labelOf(RANK_OPTIONS, row.link_value)
            : row.link_value
        return `${typeLabel} · ${valueLabel || '-'}`
      },
    },
    {
      title: '启用',
      key: 'is_active',
      dataIndex: 'is_active',
      width: 88,
      render: (val: number, row: BannerItem) => (
        <Switch
          checked={Boolean(val)}
          onChange={(checked) =>
            activeMutation.mutate({ id: row.id, isActive: checked })
          }
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 108,
      fixed: 'right',
      render: (_: unknown, row: BannerItem) =>
        needsFixedCovers(row.layout) ? (
          <Button type="link" size="small" onClick={() => setEditing(row)}>
            设置封面
          </Button>
        ) : null,
    },
  ]

  return (
    <div ref={pageRef} className="banner-page">
      <div className="banner-page__panel">
        <SmartTable<BannerItem>
          tableToolbar={{
            loading: isFetching,
            onReload: () => void refetch(),
            storageKey: 'banner-list',
            fullscreenTargetRef: pageRef,
          }}
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={isFetching}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>
      <BannerCoversModal
        row={editing}
        confirmLoading={coversMutation.isPending}
        onCancel={() => setEditing(null)}
        onOk={(covers) => {
          if (!editing) return
          coversMutation.mutate({ id: editing.id, covers })
        }}
      />
    </div>
  )
}
