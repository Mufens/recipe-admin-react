/** 难度对应的 antd Tag 颜色 */
export type DifficultyColor = 'default' | 'green' | 'orange' | 'red' | 'blue'

/**
 * 根据难度文本返回 Tag 颜色。
 * 用正则匹配，兼容“简单/零厨艺/容易”等同义难度。
 */
export function difficultyColor(d?: string | null): DifficultyColor {
  if (!d) return 'default'
  if (/简单|零厨艺|容易/.test(d)) return 'green'
  if (/中等|一般/.test(d)) return 'orange'
  if (/挑战|困难|压力/.test(d)) return 'red'
  return 'blue'
}
