/** 难度下拉（精简四档；列表里历史值仍靠 difficultyColor 着色） */
export const difficultyOptions = [
  { value: '零厨艺', label: '零厨艺' },
  { value: '简单', label: '简单' },
  { value: '普通', label: '普通' },
  { value: '有点挑战', label: '有点挑战' },
]

/** 难度对应的 antd Tag 颜色 */
export type DifficultyColor = 'default' | 'green' | 'orange' | 'red' | 'blue'

/**
 * 根据难度文本返回 Tag 颜色。
 * 用正则匹配，兼容历史同义难度（容易做 / 中等 / 困难 等）。
 */
export function difficultyColor(d?: string | null): DifficultyColor {
  if (!d) return 'default'
  if (/简单|零厨艺|容易/.test(d)) return 'green'
  if (/普通|中等|一般/.test(d)) return 'orange'
  if (/挑战|困难|压力/.test(d)) return 'red'
  return 'blue'
}
