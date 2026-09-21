import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
} from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import type { Rule } from 'antd/es/form'
import PageToolbar from '@/components/PageToolbar'
import { useCategoryTree } from '@/hooks/useCategoryTree'
import { useCloseCurrentTag } from '@/hooks/useCloseCurrentTag'
import IngredientRows from '../components/IngredientRows'
import {
  CategoryFormItem,
  RecipeSpecFields,
} from '../components/RecipeMetaFields'
import StepsFormList from '../components/StepsFormList'
import { createRecipe } from './api'
import type { RecipeFormData, RecipeIngredient } from './model'
import './index.scss'

const INITIAL_VALUES: Partial<RecipeFormData> = {
  ingredients: [],
  steps: [{ text: '' }],
  categoryPaths: [],
}

const ingredientsMinRule: Rule = {
  validator: (_, value: RecipeIngredient[] | undefined) => {
    const realItems = (value ?? []).filter(
      (item) => item.name.trim() && !item.name.startsWith('#'),
    )
    return realItems.length > 0
      ? Promise.resolve()
      : Promise.reject(new Error('请至少添加一个食材'))
  },
}

export default function Add() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const closeCurrentTag = useCloseCurrentTag()
  const [form] = Form.useForm<RecipeFormData>()
  const [submitting, setSubmitting] = useState(false)

  const { data: categoryTree = [] } = useCategoryTree()

  const handleBack = () => navigate('/recipe/list')

  const handleSave = async () => {
    const values = await form.validateFields().catch(() => null)
    if (!values) return

    setSubmitting(true)
    try {
      const payload: RecipeFormData = {
        ...values,
        categoryPaths: values.categoryPaths ?? [],
        ingredients: (values.ingredients ?? []).filter((item) => item.name.trim()),
        steps: (values.steps ?? []).filter((step) => step.text.trim()),
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
          initialValues={INITIAL_VALUES}
          className="add-page__form"
        >
          <section className="add-page__section">
            <h3 className="add-page__heading">基本信息</h3>
            <div className="add-page__grid">
              <Form.Item
                name="title"
                label="菜谱名称"
                rules={[{ required: true, message: '请输入菜谱名称' }]}
              >
                <Input placeholder="请输入菜谱名称" maxLength={100} showCount />
              </Form.Item>
              <CategoryFormItem
                categoryTree={categoryTree}
                extra="可多选，最多 5 个"
              />
              <Form.Item name="up" label="份数">
                <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
              </Form.Item>
              <RecipeSpecFields />
              <Form.Item name="author_name" label="作者名">
                <Input placeholder="请输入作者名" maxLength={50} showCount />
              </Form.Item>
              <Form.Item name="author_avatar" label="作者头像 URL">
                <Input placeholder="请输入作者头像 URL" maxLength={500} />
              </Form.Item>
              <Form.Item
                name="img"
                label="封面图 URL"
                rules={[{ required: true, message: '请输入封面图 URL' }]}
              >
                <Input placeholder="请输入封面图 URL" maxLength={500} showCount />
              </Form.Item>
              <Form.Item name="description" label="简介">
                <Input.TextArea
                  placeholder="请输入菜谱简介"
                  rows={3}
                  maxLength={500}
                  showCount
                />
              </Form.Item>
              <Form.Item name="tips" label="小贴士">
                <Input.TextArea
                  placeholder="请输入小贴士"
                  rows={3}
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </div>
          </section>

          <section className="add-page__section">
            <h3 className="add-page__heading">食材</h3>
            <Form.Item name="ingredients" rules={[ingredientsMinRule]}>
              <IngredientRows />
            </Form.Item>
          </section>

          <section className="add-page__section">
            <h3 className="add-page__heading">制作步骤</h3>
            <StepsFormList />
          </section>
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
