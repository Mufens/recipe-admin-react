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
} from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import PageToolbar from '@/components/PageToolbar'
import { useCategoryTree } from '@/hooks/useCategoryTree'
import { useCloseCurrentTag } from '@/hooks/useCloseCurrentTag'
import { difficultyOptions } from '@/utils/difficulty'
import IngredientRows, {
  type RecipeIngredient,
} from '../components/IngredientRows'
import { createRecipe } from './api'
import type { RecipeFormData } from './model'
import { categoryPathsMaxRule } from '../utils/categoryPath'
import './index.scss'

export default function Add() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const closeCurrentTag = useCloseCurrentTag()
  const [form] = Form.useForm<RecipeFormData>()
  const [submitting, setSubmitting] = useState(false)

  const initialValues = useMemo<Partial<RecipeFormData>>(
    () => ({
      ingredients: [],
      steps: [{ text: '' }],
      categoryPaths: [],
    }),
    [],
  )

  const { data: categoryTree = [] } = useCategoryTree()

  const handleBack = () => navigate('/recipe/list')

  const handleSave = async () => {
    const values = await form.validateFields().catch(() => null)
    if (!values) return

    setSubmitting(true)
    try {
      const payload: RecipeFormData = {
        ...values,
        categoryPaths: values.categoryPaths || [],
        ingredients: (values.ingredients || []).filter(
          (item) => item && item.name.trim(),
        ),
        steps: (values.steps || []).filter((step) => step?.text?.trim()),
      }
      await createRecipe(payload)
      await queryClient.invalidateQueries({ queryKey: ['recipes'] })
      await queryClient.invalidateQueries({ queryKey: ['ingredientNames'] })
      message.success('创建成功')
      closeCurrentTag()
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

            <Form.Item
              name="categoryPaths"
              label="分类标签"
              extra="可多选，最多 5 个。例：水产海鲜/虾/基围虾"
              rules={[categoryPathsMaxRule]}
            >
              <Cascader
                multiple
                maxTagCount="responsive"
                options={categoryTree}
                showCheckedStrategy={Cascader.SHOW_CHILD}
                placeholder="请选择分类标签"
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

            <Form.Item name="up" label="份数">
              <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
            </Form.Item>

            <div className="add-page__row">
              <Form.Item name="author_name" label="作者名" className="add-page__col">
                <Input placeholder="请输入作者名" maxLength={50} showCount />
              </Form.Item>
              <Form.Item
                name="author_avatar"
                label="作者头像 URL"
                className="add-page__col"
              >
                <Input placeholder="请输入作者头像 URL" maxLength={500} />
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
