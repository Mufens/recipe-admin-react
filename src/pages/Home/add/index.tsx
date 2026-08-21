import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Cascader,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Switch,
  Tooltip,
} from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageToolbar from '@/components/PageToolbar'
import { useCategoryTree } from '@/hooks/useCategoryTree'
import { createRecipe } from './api'
import type { RecipeIngredient, RecipeFormData } from './model'
import './index.scss'

const difficultyOptions = [
  { value: '零厨艺', label: '零厨艺' },
  { value: '简单', label: '简单' },
  { value: '中等', label: '中等' },
  { value: '困难', label: '困难' },
  { value: '压力略大', label: '压力略大' },
]

/** 食材行式输入组件：支持普通食材和 # 开头的小标题 */
function IngredientRows() {
  const form = Form.useFormInstance()
  const value = Form.useWatch('ingredients', form) as
    | RecipeIngredient[]
    | undefined
  const list = Array.isArray(value) ? value : []
  const setList = (next: RecipeIngredient[]) =>
    form.setFieldValue('ingredients', next)

  const handleAdd = () => {
    setList([...list, { name: '', value: '' }])
  }

  const handleAddHeader = () => {
    setList([...list, { name: '#', value: '' }])
  }

  const handleRemove = (index: number) => {
    setList(list.filter((_, i) => i !== index))
  }

  const handleChange = (
    index: number,
    field: keyof RecipeIngredient,
    val: string,
  ) => {
    const next = list.map((item, i) =>
      i === index ? { ...item, [field]: val } : item,
    )
    setList(next)
  }

  const toggleHeader = (index: number) => {
    const item = list[index]
    if (!item) return
    const isHeader = item.name.startsWith('#')
    setList(
      list.map((it, i) => {
        if (i !== index) return it
        return {
          name: isHeader ? item.name.replace(/^#/, '') : `#${item.name}`,
          value: isHeader ? item.value : '',
        }
      }),
    )
  }

  return (
    <div>
      {list.map((item, index) => {
        const isHeader = item.name.startsWith('#')
        return (
          <div key={index} className="add-page__list-item">
            <div className="add-page__dynamic-row">
              <Form.Item>
                <Input
                  value={isHeader ? item.name.slice(1) : item.name}
                  onChange={(e) =>
                    handleChange(
                      index,
                      'name',
                      isHeader ? `#${e.target.value}` : e.target.value,
                    )
                  }
                  placeholder={isHeader ? '小标题，如：酱料：' : '食材名称'}
                  maxLength={100}
                />
              </Form.Item>
              {!isHeader && (
                <Form.Item>
                  <Input
                    value={item.value}
                    onChange={(e) =>
                      handleChange(index, 'value', e.target.value)
                    }
                    placeholder="用量，如：20克"
                    maxLength={100}
                  />
                </Form.Item>
              )}
              <Tooltip title={isHeader ? '切换为普通食材' : '切换为小标题'}>
                <Switch
                  size="small"
                  checked={isHeader}
                  onChange={() => toggleHeader(index)}
                  style={{ marginTop: 8, flexShrink: 0 }}
                />
              </Tooltip>
              <MinusCircleOutlined
                className="add-page__remove-icon"
                onClick={() => handleRemove(index)}
              />
            </div>
          </div>
        )
      })}
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          type="dashed"
          onClick={handleAdd}
          block
          icon={<PlusOutlined />}
        >
          添加食材
        </Button>
        <Button type="dashed" onClick={handleAddHeader} style={{ flexShrink: 0 }}>
          + 小标题
        </Button>
      </div>
    </div>
  )
}

export default function Add() {
  const navigate = useNavigate()
  const [form] = Form.useForm<RecipeFormData>()
  const [submitting, setSubmitting] = useState(false)

  const initialValues = useMemo<Partial<RecipeFormData>>(
    () => ({
      ingredients: [],
      steps: [{ text: '' }],
      categoryPath: [],
    }),
    [],
  )

  const { data: categoryTree = [] } = useCategoryTree()

  const handleBack = () => navigate('/home')

  const handleSave = async () => {
    const values = await form.validateFields().catch(() => null)
    if (!values) return

    setSubmitting(true)
    try {
      const payload: RecipeFormData = {
        ...values,
        ingredients: (values.ingredients || []).filter(
          (item) => item && item.name.trim(),
        ),
        steps: (values.steps || []).filter((step) => step?.text?.trim()),
      }
      const result = await createRecipe(payload)
      message.success('创建成功')
      navigate(`/detail?id=${result.id}`)
    } catch {
      // 错误 toast 由拦截器统一处理
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="add-page">
      <PageToolbar onBack={handleBack} />
      <div className="add-page__scroll">
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
          className="add-page__form"
        >
          <Card title="基础信息" className="add-page__section" size="small">
            <Form.Item
              name="title"
              label="菜谱名称"
              rules={[{ required: true, message: '请输入菜谱名称' }]}
            >
              <Input placeholder="请输入菜谱名称" maxLength={100} showCount />
            </Form.Item>

            <Form.Item
              name="img"
              label="封面图 URL"
              rules={[{ required: true, message: '请输入封面图 URL' }]}
            >
              <Input.TextArea
                placeholder="请输入封面图 URL"
                rows={2}
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Form.Item name="categoryPath" label="分类">
              <Cascader
                options={categoryTree}
                changeOnSelect
                placeholder="请选择分类"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <div className="add-page__row">
              <Form.Item name="use_time" label="制作时间" className="add-page__col">
                <Input placeholder="如：30分钟" maxLength={50} showCount />
              </Form.Item>
              <Form.Item name="difficulty" label="难度" className="add-page__col">
                <Select
                  options={difficultyOptions}
                  placeholder="请选择难度"
                  allowClear
                />
              </Form.Item>
            </div>

            <div className="add-page__row">
              <Form.Item name="person" label="做过人数" className="add-page__col">
                <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="up" label="份数" className="add-page__col">
                <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <Form.Item name="description" label="简介">
              <Input.TextArea
                placeholder="请输入菜谱简介"
                rows={4}
                maxLength={5000}
                showCount
              />
            </Form.Item>

            <Form.Item name="tips" label="小贴士">
              <Input.TextArea
                placeholder="请输入小贴士"
                rows={2}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Card>

          <Card title="食材" className="add-page__section" size="small">
            <Form.Item
              name="ingredients"
              rules={[
                {
                  validator: (_, value: RecipeIngredient[] | undefined) => {
                    const realItems = (value ?? []).filter(
                      (item) => item?.name?.trim() && !item.name.startsWith('#'),
                    )
                    return realItems.length > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error('请至少添加一个食材'))
                  },
                },
              ]}
            >
              <IngredientRows />
            </Form.Item>
          </Card>

          <Card title="制作步骤" className="add-page__section" size="small">
            <Form.List name="steps">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <div key={field.key} className="add-page__step-item">
                      <Form.Item
                        {...field}
                        name={[field.name, 'text']}
                        label={`步骤 ${field.name + 1}`}
                        rules={[{ required: true, message: '请输入步骤内容' }]}
                      >
                        <Input.TextArea
                          placeholder="请输入步骤内容"
                          rows={3}
                          maxLength={2000}
                          showCount
                        />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'image']}
                        label="步骤图 URL"
                      >
                        <Input placeholder="请输入步骤图 URL（可选）" maxLength={500} />
                      </Form.Item>
                      <MinusCircleOutlined
                        className="add-page__remove-icon add-page__remove-icon--step"
                        onClick={() => remove(field.name)}
                      />
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() => add({ text: '', image: '' })}
                    block
                    icon={<PlusOutlined />}
                  >
                    添加步骤
                  </Button>
                </>
              )}
            </Form.List>
          </Card>
        </Form>
      </div>

      <div className="add-page__footer">
        <Button onClick={handleBack}>返回</Button>
        <Button type="primary" loading={submitting} onClick={() => void handleSave()}>
          保存
        </Button>
      </div>
    </div>
  )
}
