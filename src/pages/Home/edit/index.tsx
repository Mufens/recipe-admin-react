import {
  Button,
  Card,
  Form,
  Result,
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
import { fetchRecipeDetail } from '../detail/api'
import IngredientRows from '../components/IngredientRows'
import RecipeMetaFields from '../components/RecipeMetaFields'
import StepsFormList from '../components/StepsFormList'
import { resolveCategoryPaths } from '../utils/categoryPath'
import { updateRecipe } from './api'
import type { RecipeEditFormData, RecipeIngredient } from './model'
import '../add/index.scss'

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
        categoryPaths: values.categoryPaths ?? [],
        ingredients: (values.ingredients ?? []).filter((item) => item.name.trim()),
        steps: (values.steps ?? []).filter((step) => step.text.trim()),
      })
      await queryClient.invalidateQueries({ queryKey: ['recipe', id] })
      await queryClient.invalidateQueries({ queryKey: ['recipes'] })
      await queryClient.invalidateQueries({ queryKey: ['ingredientNames'] })
      message.success('保存成功')
      closeCurrentTag()
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
        <Form form={form} layout="vertical" className="add-page__form">
          <Card className="add-page__section" size="small">
            <RecipeMetaFields
              categoryTree={categoryTree}
              categoryPlaceholder="请选择,最多5个"
            />
          </Card>

          <Card title="食材" className="add-page__section" size="small">
            <Form.Item name="ingredients" rules={[ingredientsMinRule]}>
              <IngredientRows />
            </Form.Item>
          </Card>

          <Card title="制作步骤" className="add-page__section" size="small">
            <StepsFormList />
          </Card>
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
