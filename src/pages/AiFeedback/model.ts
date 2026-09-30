export const FEEDBACK_REASONS = [
  { code: 'irrelevant', label: '推荐不相关' },
  { code: 'ingredient_mismatch', label: '食材不匹配' },
  { code: 'dietary_conflict', label: '不符合忌口' },
  { code: 'inaccurate', label: '回答不准确' },
  { code: 'other', label: '其他' },
] as const

export type FeedbackReasonCode = (typeof FEEDBACK_REASONS)[number]['code']

export interface LowSatisfactionItem {
  id: number
  question: string
  questionType: string
  vote: 'up' | 'down'
  reason: string
  answer: string
  note: string
  feedbackAt: string | null
}

export interface LowSatisfactionResult {
  items: LowSatisfactionItem[]
  total: number
  page: number
  pageSize: number
  pages: number
}
