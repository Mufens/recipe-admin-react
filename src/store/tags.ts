import { create } from 'zustand'
import { type TagItem } from '@/router/routes'

interface TagsState {
  tags: TagItem[]
  addTag: (tag: TagItem) => void
  removeTag: (path: string) => TagItem | undefined
  setTags: (tags: TagItem[]) => void
  clearOtherTags: (path: string) => TagItem[]
  clearRightTags: (path: string) => TagItem[]
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],

  addTag: (tag) => {
    const { tags } = get()
    if (tags.some((t) => t.path === tag.path)) return
    set({ tags: [...tags, tag] })
  },

  removeTag: (path) => {
    const { tags } = get()
    // 至少保留一个标签
    if (tags.length <= 1) return undefined
    const index = tags.findIndex((t) => t.path === path)
    if (index === -1) return undefined

    const next = tags.filter((t) => t.path !== path)
    set({ tags: next })
    return next[Math.min(index, next.length - 1)]
  },

  setTags: (tags) => set({ tags }),

  clearOtherTags: (path) => {
    const { tags } = get()
    const current = tags.find((t) => t.path === path)
    if (!current) return []
    const removed = tags.filter((t) => t.path !== path)
    set({ tags: [current] })
    return removed
  },

  clearRightTags: (path) => {
    const { tags } = get()
    const index = tags.findIndex((t) => t.path === path)
    if (index === -1) return []
    const removed = tags.slice(index + 1)
    set({ tags: tags.slice(0, index + 1) })
    return removed
  },
}))
