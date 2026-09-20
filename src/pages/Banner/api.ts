import request from '@/utils/request'
import type { BannerCover, BannerItem } from './model'

const BASE = '/api/home/banner/manage'

export const fetchBannerManageList = (signal?: AbortSignal) =>
  request.get<BannerItem[]>(BASE, { signal })

export const patchBannerActive = (id: number, isActive: boolean) =>
  request.patch<{ id: number; is_active: number }>(`${BASE}/${id}/active`, {
    is_active: Number(isActive),
  })

export const patchBannerCovers = (id: number, covers: BannerCover[]) =>
  request.patch<{ id: number; covers: BannerCover[] }>(`${BASE}/${id}/covers`, {
    covers,
  })
