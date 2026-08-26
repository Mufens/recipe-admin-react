import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Cascader,
  Form,
  Input,
  Result,
  Select,
  Spin,
  message,
} from 'antd'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageToolbar from '@/components/PageToolbar'
import { useCategoryTree } from '@/hooks/useCategoryTree'
import { difficultyOptions } from '@/utils/difficulty'
import { fetchRecipeDetail } from '../detail/api'
import IngredientRows from '../components/IngredientRows'
import { resolveCategoryPaths } from '../utils/categoryPath'
import { updateRecipe } from './api'
import type { RecipeEditFormData, RecipeIngredient } from './model'
import '../add/index.scss'

export default function Edit() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
    const ingredients = Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : []
    const steps = Array.isArray(recipe.steps) ? recipe.steps : []
    form.setFieldsValue({
      use_time: recipe.use_time || undefined,
      difficulty: recipe.difficulty || undefined,
      ingredients: ingredients.length ? ingredients : [{ name: '', value: '' }],
      steps: steps.length ? steps : [{ text: '', image: '' }],
      categoryPaths: resolveCategoryPaths(
        categoryTree,
        recipe.tags,
        recipe.category_id,
      ),
    })
  }, [recipe, categoryTree, form])

  const handleBack = () => navigate('/home')

  const handleSave = async () => {
    if (!id) return
    const values = await form.validateFields().catch(() => null)
    if (!values) return

    setSubmitting(true)
    try {
      await updateRecipe({
        id: Number(id),
        use_time: values.use_time,
        difficulty: values.difficulty,
        categoryPaths: values.categoryPaths || [],
        ingredients: (values.ingredients || []).filter(
          (item) => item && item.name.trim(),
        ),
        steps: (values.steps || []).filter((step) => step?.text?.trim()),
      })
      await queryClient.invalidateQueries({ queryKey: ['recipe', id] })
      await queryClient.invalidateQueries({ queryKey: ['recipes'] })
      await queryClient.invalidateQueries({ queryKey: ['ingredientNames'] })
      message.success('保存成功')
      navigate(`/detail?id=${id}`)
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
          <Card
            className="add-page__section"
            size="small"
          >
            <Form.Item
              name="categoryPaths"
              label="分类标签"
              extra="可多选"
            >
              <Cascader
                multiple
                maxTagCount="responsive"
                options={categoryTree}
                changeOnSelect
                placeholder="请选择一条或多条分类路径"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <div className="add-page__row">
              <Form.Item
                name="use_time"
                label="制作时间"
                className="add-page__col"
              >
                <Input placeholder="如：30分钟" maxLength={50} showCount />
              </Form.Item>
              <Form.Item
                name="difficulty"
                label="难度"
                className="add-page__col"
              >
                <Select
                  options={difficultyOptions}
                  placeholder="请选择难度"
                  allowClear
                />
              </Form.Item>
            </div>
          </Card>

          <Card title="食材" className="add-page__section" size="small">
            <Form.Item
              name="ingredients"
              rules={[
                {
                  validator: (_, value: RecipeIngredient[] | undefined) => {
                    const realItems = (value ?? []).filter(
                      (item) =>
                        item?.name?.trim() && !item.name.startsWith('#'),
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
                        <Input
                          placeholder="请输入步骤图 URL（可选）"
                          maxLength={500}
                        />
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
