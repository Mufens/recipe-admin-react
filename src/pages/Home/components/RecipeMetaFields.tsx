import { Cascader, Form, Input, Select } from 'antd'
import type { CategoryOption } from '@/api/category'
import { difficultyOptions } from '@/utils/difficulty'
import { categoryPathsMaxRule } from '../utils/categoryPath'

const RATIO_OPTIONS = [
  { value: '16/9', label: '16/9（横图）' },
  { value: '3/4', label: '3/4（竖图）' },
]

type CategoryFieldProps = {
  categoryTree: CategoryOption[]
  extra?: string
  placeholder?: string
  className?: string
}

type Props = {
  categoryTree: CategoryOption[]
  /** Cascader 下方说明；编辑页可不传 */
  categoryExtra?: string
  categoryPlaceholder?: string
  /** 分类项额外 class，如占满整行 */
  categoryClassName?: string
}

export function CategoryFormItem({
  categoryTree,
  extra,
  placeholder = '请选择分类标签',
  className,
}: CategoryFieldProps) {
  return (
    <Form.Item
      name="categoryPaths"
      label="分类标签"
      extra={extra}
      rules={[categoryPathsMaxRule]}
      className={className}
    >
      <Cascader
        multiple
        options={categoryTree}
        showCheckedStrategy={Cascader.SHOW_CHILD}
        placeholder={placeholder}
        style={{ width: '100%' }}
      />
    </Form.Item>
  )
}

/** 制作时间 / 难度 / 步骤图比例 */
export function RecipeSpecFields() {
  return (
    <>
      <Form.Item name="use_time" label="制作时间">
        <Input placeholder="如：30分钟" maxLength={50} showCount />
      </Form.Item>
      <Form.Item name="difficulty" label="难度">
        <Select
          options={difficultyOptions}
          placeholder="请选择难度"
          allowClear
        />
      </Form.Item>
      <Form.Item name="ratio" label="步骤图比例">
        <Select
          allowClear
          options={RATIO_OPTIONS}
          placeholder="未选默认 16/9"
        />
      </Form.Item>
    </>
  )
}

/** 分类 + 制作时间 / 难度 / 步骤图比例 */
export default function RecipeMetaFields({
  categoryTree,
  categoryExtra,
  categoryPlaceholder = '请选择分类标签',
  categoryClassName,
}: Props) {
  return (
    <>
      <CategoryFormItem
        categoryTree={categoryTree}
        extra={categoryExtra}
        placeholder={categoryPlaceholder}
        className={categoryClassName}
      />
      <RecipeSpecFields />
    </>
  )
}
