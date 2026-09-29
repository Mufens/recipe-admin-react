export const FEEDBACK_REASONS = [
  { code: 'irrelevant', label: '推荐不相关' },
  { code: 'ingredient_mismatch', label: '食材不匹配' },
  { code: 'dietary_conflict', label: '不符合忌口' },
  { code: 'inaccurate', label: '回答不准确' },
] as const

export type FeedbackReasonCode = (typeof FEEDBACK_REASONS)[number]['code']

export interface LowSatisfactionItem {
  question: string
  questionType: string
  downCount: number
  upCount: number
  reasons: Record<FeedbackReasonCode, number>
  latestAnswer: string
  latestNote: string
  lastFeedbackAt: string | null
}

export interface LowSatisfactionResult {
  items: LowSatisfactionItem[]
  total: number
  page: number
  pageSize: number
  pages: number
}
