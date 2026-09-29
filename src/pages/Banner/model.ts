export const BANNER_QUERY_KEY = ['banners-manage'] as const

export type BannerLinkType = 'search' | 'rank' | 'recipe' | 'surprise'
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
