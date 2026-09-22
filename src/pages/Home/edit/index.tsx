import {
  Button,
  Cascader,
  Col,
  Form,
  Input,
  Result,
  Row,
  Select,
  Spin,
  message,
} from 'antd'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Rule } from 'antd/es/form'
import PageToolbar from '@/components/PageToolbar'
import { useCategoryTree } from '@/hooks/useCategoryTree'
import { useCloseCurrentTag } from '@/hooks/useCloseCurrentTag'
import { difficultyOptions } from '@/utils/difficulty'
import { fetchRecipeDetail } from '../detail/api'
import IngredientRows from '../components/IngredientRows'
import StepsFormList from '../components/StepsFormList'
import { categoryPathsMaxRule, resolveCategoryPaths } from '../utils/categoryPath'
import { updateRecipe } from './api'
import type { RecipeEditFormData, RecipeIngredient } from './model'
import '../add/index.scss'

const COL_THIRD = { xs: 24, sm: 12, lg: 8 } as const

const RATIO_OPTIONS = [
  { value: '16/9', label: '16/9（横图）' },
  { value: '3/4', label: '3/4（竖图）' },
]

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

export default function Edit() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const closeCurrentTag = useCloseCurrentTag()
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')
  const [form] = Form.useForm<RecipeEditFormData>()
  const [submitting, setSubmitting] = useState(false)

  const { data: categoryTree = [] } = useCategoryTree()
  const {
    data: recipe,
    isFetching: loading,
    isError: queryError,
    refetch,
  } = useQuery({
    queryKey: ['recipe', id],
    queryFn: ({ signal }) => fetchRecipeDetail(id!, signal),
    enabled: !!id,
  })

  useEffect(() => {
    if (!recipe || !categoryTree.length) return
    const ingredients = recipe.ingredients ?? []
    const steps = recipe.steps ?? []
    form.setFieldsValue({
      use_time: recipe.use_time || undefined,
      difficulty: recipe.difficulty || undefined,
      ratio: recipe.ratio === '3/4' ? '3/4' : '16/9',
      ingredients: ingredients.length ? ingredients : [{ name: '', value: '' }],
      steps: steps.length ? steps : [{ text: '', image: '' }],
      categoryPaths: resolveCategoryPaths(categoryTree, recipe.tags),
    })
  }, [recipe, categoryTree, form])

  const handleBack = () => navigate('/recipe/list')

  const handleSave = async () => {
    const values = await form.validateFields().catch(() => null)
    if (!values || !id) return

    setSubmitting(true)
    try {
      await updateRecipe({
        id: Number(id),
        use_time: values.use_time,
        difficulty: values.difficulty,
        ratio: values.ratio,
        categoryPaths: values.categoryPaths,
        ingredients: values.ingredients,
        steps: values.steps,
      })
      await queryClient.invalidateQueries({ queryKey: ['recipe', id] })
      message.success('保存成功')
      closeCurrentTag('refresh')
    } catch {
      // 错误 toast 由拦截器统一处理
    } finally {
      setSubmitting(false)
    }
  }

  if (!id) {
    return (
      <div className="add-page">
        <PageToolbar onBack={handleBack} />
        <div className="add-page__scroll">
          <Result
            status="warning"
            title="缺少菜谱 ID"
            subTitle="请从列表页点击「编辑」进入"
            extra={
              <Button type="link" onClick={handleBack}>
                返回列表
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  if (loading && !recipe) {
    return (
      <div className="add-page">
        <PageToolbar onBack={handleBack} />
        <div className="add-page__scroll">
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Spin size="large" description="加载菜谱..." />
          </div>
        </div>
      </div>
    )
  }

  if (queryError || !recipe) {
    return (
      <div className="add-page">
        <PageToolbar onBack={handleBack} onRefresh={() => void refetch()} />
        <div className="add-page__scroll">
          <Result
            status="error"
            title="加载失败"
            subTitle="未找到该菜谱或接口异常"
            extra={
              <Button type="link" onClick={handleBack}>
                返回列表
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="add-page">
      <PageToolbar onBack={handleBack} onRefresh={() => void refetch()} />
      <div className="add-page__scroll">
        <Form
          form={form}
          layout="horizontal"
          labelAlign="right"
          colon
          labelCol={{ flex: '7em' }}
          wrapperCol={{ flex: 1 }}
          className="add-page__form"
        >
          <section className="add-page__section">
            <h3 className="add-page__heading">基本信息</h3>
            <div className="add-page__fields">
              <Row gutter={24}>
                <Col {...COL_THIRD}>
                  <Form.Item
                    name="categoryPaths"
                    label="分类标签"
                    rules={[categoryPathsMaxRule]}
                  >
                    <Cascader
                      multiple
                      options={categoryTree}
                      showCheckedStrategy={Cascader.SHOW_CHILD}
                      placeholder="请选择,最多5个"
                    />
                  </Form.Item>
                </Col>
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
              </Row>
              <Row gutter={24}>
                <Col {...COL_THIRD}>
                  <Form.Item name="ratio" label="步骤图比例">
                    <Select
                      allowClear
                      options={RATIO_OPTIONS}
                      placeholder="未选默认 16/9"
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
        <Button
          type="primary"
          loading={submitting}
          onClick={() => void handleSave()}
        >
          保存
        </Button>
      </div>
    </div>
  )
}
