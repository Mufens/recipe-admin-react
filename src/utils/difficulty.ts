/** 难度下拉选项（与库内常见值对齐） */
export const difficultyOptions = [
  { value: '零厨艺', label: '零厨艺' },
  { value: '容易做', label: '容易做' },
  { value: '简单', label: '简单' },
  { value: '普通', label: '普通' },
  { value: '中等', label: '中等' },
  { value: '有点挑战', label: '有点挑战' },
  { value: '困难', label: '困难' },
  { value: '压力略大', label: '压力略大' },
]

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
