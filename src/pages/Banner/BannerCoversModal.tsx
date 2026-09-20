import { Image, Input, Modal, Spin } from 'antd'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { imageProps, resolveMediaUrl } from '@/utils/media'
import { fetchRecipeList } from '@/pages/Home/list/api'
import type { BannerCover, BannerItem } from './model'

type Slot = BannerCover | null

type Props = {
  row: BannerItem | null
  confirmLoading: boolean
  onCancel: () => void
  onOk: (covers: BannerCover[]) => void
}

function toSlots(covers?: BannerCover[]): Slot[] {
  const next: Slot[] = [null, null, null]
  ;(covers ?? []).slice(0, 3).forEach((item, i) => {
    next[i] = item
  })
  return next
}

function firstEmpty(slots: Slot[]) {
  const idx = slots.findIndex((item) => !item)
  return idx >= 0 ? idx : 0
}

/** row 变化时用 key 重挂载，避免在 effect 里 setState */
export default function BannerCoversModal({ row, ...rest }: Props) {
  if (!row) {
    return (
      <Modal open={false} onCancel={rest.onCancel} destroyOnHidden />
    )
  }
  return <BannerCoversEditor key={row.id} row={row} {...rest} />
}

function BannerCoversEditor({
  row,
  confirmLoading,
  onCancel,
  onOk,
}: Omit<Props, 'row'> & { row: BannerItem }) {
  const initialSlots = toSlots(row.covers)
  const [keyword, setKeyword] = useState('')
  const [slots, setSlots] = useState<Slot[]>(initialSlots)
  const [active, setActive] = useState(() => firstEmpty(initialSlots))

  const { data, isFetching } = useQuery({
    queryKey: ['banner-cover-recipes', keyword],
    queryFn: ({ signal }) =>
      fetchRecipeList(
        {
          keyword,
          page: 1,
          pageSize: 18,
          categoryIds: [],
          ids: '',
          ingredients: [],
          ingredientMode: 'exact',
          difficulty: '',
          createTimeFrom: '',
          createTimeTo: '',
        },
        signal,
      ),
  })

  const selectedIds = useMemo(
    () => new Set(slots.filter(Boolean).map((item) => item!.id)),
    [slots],
  )
  const filled = slots.filter(Boolean) as BannerCover[]

  const pick = (cover: BannerCover) => {
    if (selectedIds.has(cover.id)) return
    const next = [...slots]
    next[active] = cover
    setSlots(next)
    const empty = next.findIndex((item) => !item)
    setActive(empty >= 0 ? empty : active)
  }

  const clearSlot = (index: number) => {
    setSlots((prev) => {
      const next = [...prev]
      next[index] = null
      return next
    })
    setActive(index)
  }

  return (
    <Modal
      title={`设置「${row.title}」的三张封面`}
      open
      onCancel={onCancel}
      onOk={() => onOk(filled)}
      okButtonProps={{ disabled: filled.length !== 3 }}
      confirmLoading={confirmLoading}
      destroyOnHidden
      okText="保存"
      width={720}
    >
      <div className="banner-covers">
        <div className="banner-covers__slots">
          {slots.map((item, index) => {
            const src = resolveMediaUrl(item?.img)
            return (
              <button
                key={index}
                type="button"
                className={`banner-covers__slot${active === index ? ' is-active' : ''}`}
                onClick={() => setActive(index)}
              >
                {src ? (
                  <Image
                    src={src}
                    width="100%"
                    height={108}
                    preview={false}
                    style={{ objectFit: 'cover' }}
                    {...imageProps}
                  />
                ) : (
                  <span>第 {index + 1} 张</span>
                )}
                {item ? (
                  <span
                    className="banner-covers__clear"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearSlot(index)
                    }}
                  >
                    移除
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        <Input.Search
          allowClear
          placeholder="搜索菜谱，点选填入上方空位"
          onSearch={setKeyword}
          onChange={(e) => {
            if (!e.target.value) setKeyword('')
          }}
        />

        <Spin spinning={isFetching}>
          <div className="banner-covers__grid">
            {(data?.items ?? []).map((recipe) => {
              const src = resolveMediaUrl(recipe.img)
              const picked = selectedIds.has(recipe.id)
              return (
                <button
                  key={recipe.id}
                  type="button"
                  className={`banner-covers__pick${picked ? ' is-picked' : ''}`}
                  disabled={picked || !src}
                  onClick={() =>
                    pick({
                      id: recipe.id,
                      title: recipe.title,
                      img: recipe.img,
                    })
                  }
                >
                  {src ? (
                    <Image
                      src={src}
                      width="100%"
                      height={84}
                      preview={false}
                      style={{ objectFit: 'cover' }}
                      {...imageProps}
                    />
                  ) : (
                    <span className="banner-covers__empty">无图</span>
                  )}
                  <span className="banner-covers__name">{recipe.title}</span>
                </button>
              )
            })}
          </div>
        </Spin>
      </div>
    </Modal>
  )
}
