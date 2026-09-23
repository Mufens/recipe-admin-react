import {
  Button,
  Cascader,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  message,
} from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Rule } from 'antd/es/form'
import PageToolbar from '@/components/PageToolbar'
import { useCategoryTree } from '@/hooks/useCategoryTree'
import { useCloseCurrentTag } from '@/hooks/useCloseCurrentTag'
import { difficultyOptions } from '@/utils/difficulty'
import IngredientRows from '../components/IngredientRows'
import StepsFormList from '../components/StepsFormList'
import { createRecipe } from './api'
import type { RecipeFormData, RecipeIngredient } from './model'
import './index.scss'

const COL_THIRD = { xs: 24, sm: 12, lg: 8 } as const

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
      await createRecipe(values)
      message.success('创建成功')
      closeCurrentTag('reset')
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
          layout="horizontal"
          labelAlign="right"
          colon
          labelCol={{ flex: '7em' }}
          wrapperCol={{ flex: 1 }}
          initialValues={{ steps: [{ text: '' }] }}
          className="add-page__form"
        >
          <section className="add-page__section">
            <h3 className="add-page__heading">基本信息</h3>
            <div className="add-page__fields">
              <Row gutter={24}>
                <Col {...COL_THIRD}>
                  <Form.Item
                    name="title"
                    label="菜谱名称"
                    rules={[{ required: true, message: '请输入菜谱名称' }]}
                  >
                    <Input placeholder="请输入菜谱名称" maxLength={100} />
                  </Form.Item>
                </Col>
                <Col {...COL_THIRD}>
                  <Form.Item name="categoryPaths" label="分类标签">
                    <Cascader
                      multiple
                      options={categoryTree}
                      showCheckedStrategy={Cascader.SHOW_CHILD}
                      placeholder="可多选，最多 5 个"
                    />
                  </Form.Item>
                </Col>
                <Col {...COL_THIRD}>
                  <Form.Item name="up" label="份数">
                    <InputNumber min={0} placeholder="请输入" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col {...COL_THIRD}>
                  <Form.Item name="use_time" label="制作时间">
                    <Input placeholder="如：30分钟" maxLength={50} />
                  </Form.Item>
                </Col>
                <Col {...COL_THIRD}>
                  <Form.Item name="difficulty" label="难度">
                    <Select
                      options={difficultyOptions}
                      placeholder="请选择难度"
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col {...COL_THIRD}>
                  <Form.Item name="ratio" label="步骤图比例">
                    <Select
                      allowClear
                      options={[
                      { value: '16/9', label: '16/9(横图)' },
                      { value: '3/4', label: '3/4(竖图)' }]}
                      placeholder="未选默认 16/9"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col {...COL_THIRD}>
                  <Form.Item name="author_name" label="作者名">
                    <Input placeholder="请输入作者名" maxLength={50} />
                  </Form.Item>
                </Col>
                <Col {...COL_THIRD}>
                  <Form.Item name="author_avatar" label="作者头像 URL">
                    <Input placeholder="请输入作者头像 URL" maxLength={500} />
                  </Form.Item>
                </Col>
                <Col {...COL_THIRD}>
                  <Form.Item
                    name="img"
                    label="封面图 URL"
                    rules={[{ required: true, message: '请输入封面图 URL' }]}
                  >
                    <Input placeholder="请输入封面图 URL" maxLength={500} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col {...COL_THIRD}>
                  <Form.Item name="description" label="简介">
                    <Input.TextArea
                      placeholder="请输入菜谱简介"
                      rows={3}
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>
                </Col>
                <Col {...COL_THIRD}>
                  <Form.Item name="tips" label="小贴士">
                    <Input.TextArea
                      placeholder="请输入小贴士"
                      rows={3}
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>
                </Col>
              </Row>
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
