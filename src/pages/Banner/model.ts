export const BANNER_QUERY_KEY = ['banners-manage'] as const

export const LINK_TYPE_OPTIONS = [
  { value: 'search', label: '搜索' },
  { value: 'rank', label: '榜单' },
  { value: 'recipe', label: '菜谱详情' },
  { value: 'surprise', label: '手气转盘' },
] as const

export const RANK_OPTIONS = [
  { value: 'popular', label: '本周热门' },
  { value: 'follow', label: '跟做榜' },
  { value: 'newStar', label: '新秀菜谱' },
  { value: 'potential', label: '潜力新菜' },
  { value: 'collect', label: '收藏榜' },
  { value: 'tenCollect', label: '10人收藏' },
] as const

export type BannerLinkType = (typeof LINK_TYPE_OPTIONS)[number]['value']
export type BannerLayout = 'surprise' | 'collage' | 'mood' | 'story'

export function needsFixedCovers(layout?: string | null) {
  return layout === 'collage' || layout === 'story'
}

export interface BannerCover {
  id: number
  title: string
  img: string
}

export interface BannerItem {
  id: number
  img: string | null
  title: string
  subtitle: string | null
  badge: string | null
  layout: BannerLayout
  cta: string | null
  link_type: BannerLinkType
  link_value: string | null
  covers: BannerCover[]
  sort_order: number
  is_active: number
}
