import {
  ClockCircleOutlined,
  FireOutlined,
  StarOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Card,
  Collapse,
  Descriptions,
  Empty,
  Image,
  Result,
  Spin,
  Tag,
  Typography,
} from 'antd'
import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageToolbar from '@/components/PageToolbar'
import { fetchRecipeDetail } from './api'
import { difficultyColor } from '@/utils/difficulty'
import { imageProps, resolveMediaUrl } from '@/utils/media'
import type { RecipeDetail } from './model'
import './index.scss'

const { Title, Paragraph, Text } = Typography

const stepPreview = (text: string) => {
  const line = text.split('\n')[0].trim()
  if (line.length <= 36) return line
  return `${line.slice(0, 36)}…`
}

function RecipeSteps({
  steps,
}: {
  steps: NonNullable<RecipeDetail['steps']>
}) {
  const stepKeys = useMemo(
    () => steps.map((_, index: number) => String(index)),
    [steps],
  )
  const [activeStepKeys, setActiveStepKeys] = useState<string[]>(stepKeys)
  const allExpanded =
    steps.length > 0 && activeStepKeys.length === steps.length

  return (
    <Card
      title={`制作步骤（${steps.length}）`}
      className="detail-page__section"
      size="small"
      extra={
        <Button
          type="link"
          size="small"
          onClick={() => setActiveStepKeys(allExpanded ? [] : stepKeys)}
        >
          {allExpanded ? '全部收起' : '全部展开'}
        </Button>
      }
    >
      <Collapse
        className="detail-page__steps"
        activeKey={activeStepKeys}
        onChange={(keys) =>
          setActiveStepKeys(Array.isArray(keys) ? keys : [keys])
        }
        items={steps.map((step, index) => ({
          key: String(index),
          label: (
            <span className="detail-page__step-label">
              <span className="detail-page__step-index">{index + 1}</span>
              <span className="detail-page__step-preview">
                {stepPreview(step.text)}
              </span>
            </span>
          ),
          children: (
            <div>
              <div className="detail-page__step-body">
                <p key={index} className="detail-page__step-line">
                  {step.text}
                </p>
              </div>
              {step.image ? (
                <Image
                  src={resolveMediaUrl(step.image)}
                  alt={`步骤 ${index + 1}`}
                  className="detail-page__step-image"
                  {...imageProps}
                />
              ) : null}
            </div>
          ),
        }))}
      />
    </Card>
  )
}

export default function Detail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')

  const { data: recipe, isFetching: loading, isError: queryError, refetch } = useQuery({
    queryKey: ['recipe', id],
    queryFn: ({ signal }) => fetchRecipeDetail(id!, signal),
    enabled: !!id,
  })
  const error = queryError || (!loading && !recipe)

  const handleRefresh = useCallback(() => void refetch(), [refetch])
  const handleBack = useCallback(() => navigate('/recipe/list'), [navigate])

  if (!id) {
    return (
      <div className="detail-page">
        <PageToolbar onBack={handleBack} />
        <div className="detail-page__scroll">
          <Result
            status="warning"
            title="缺少菜谱 ID"
            subTitle="请从列表页点击「详情」进入，或检查 URL 是否包含 ?id= 参数"
            extra={
              <Button type="link" onClick={() => navigate('/recipe/list')}>
                返回列表
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="detail-page">
        <PageToolbar onRefresh={handleRefresh} onBack={handleBack} />
        <div className="detail-page__scroll">
          <div className="detail-page__center">
            <Spin size="large" description="加载菜谱详情..." />
          </div>
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="detail-page">
        <PageToolbar onRefresh={handleRefresh} onBack={handleBack} />
        <div className="detail-page__scroll">
          <Result
            status="error"
            title="加载失败"
            subTitle="未找到该菜谱或接口异常"
            extra={
              <Button type="link" onClick={() => navigate('/recipe/list')}>
                返回列表
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const ingredients = recipe.ingredients ?? []
  const steps = recipe.steps ?? []
  const pictures = Array.isArray(recipe.pictures)
    ? recipe.pictures.filter(Boolean)
    : []

  return (
    <div className="detail-page">
      <PageToolbar onRefresh={handleRefresh} onBack={handleBack} />
      <div className="detail-page__scroll">
        <Card variant="borderless" style={{ marginBottom: 16 }}>
          <div className="detail-page__hero">
          <div className="detail-page__cover">
            <Image
              src={resolveMediaUrl(recipe.img)}
              alt={recipe.title}
              preview
              {...imageProps}
            />
          </div>
          <div className="detail-page__hero-main">
            <Title level={2} className="detail-page__title">
              {recipe.title}
            </Title>

            <div className="detail-page__meta">
              {(recipe.tags ?? []).map((t) => (
                <Tag key={t.id || t.name} color="purple">
                  {t.path_label || t.name}
                </Tag>
              ))}
              {recipe.difficulty && (
                <Tag
                  color={difficultyColor(recipe.difficulty)}
                  icon={<FireOutlined />}
                >
                  {recipe.difficulty}
                </Tag>
              )}
              {recipe.use_time && (
                <Tag icon={<ClockCircleOutlined />}>{recipe.use_time}</Tag>
              )}
              {typeof recipe.up === 'number' && <Tag>{recipe.up} 人份</Tag>}
              {typeof recipe.person === 'number' && (
                <Tag icon={<TeamOutlined />}>{recipe.person} 人做过</Tag>
              )}
              <Tag color="gold" icon={<StarOutlined />}>
                收藏 {(recipe.star ?? 0).toLocaleString()}
              </Tag>
              {recipe.ratio && <Tag>步骤图 {recipe.ratio}</Tag>}
            </div>

            <div className="detail-page__author">
              <Avatar
                size={36}
                src={resolveMediaUrl(recipe.author_avatar)}
                icon={
                  !resolveMediaUrl(recipe.author_avatar) ? (
                    <UserOutlined />
                  ) : undefined
                }
              />
              <div>
                <Text strong>{recipe.author_name || '未知作者'}</Text>
                {typeof recipe.author_id === 'number' && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ID: {recipe.author_id}
                    </Text>
                  </div>
                )}
              </div>
            </div>

            {recipe.description && (
              <Paragraph className="detail-page__desc">
                {recipe.description}
              </Paragraph>
            )}
          </div>
        </div>

        <Descriptions column={{ xs: 1, sm: 2, md: 4 }} size="small">
          <Descriptions.Item label="菜谱 ID">{recipe.id}</Descriptions.Item>
          <Descriptions.Item label="分类标签" span={3}>
            {recipe.tags?.length
              ? recipe.tags.map((t) => t.path_label || t.name).join('；')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="难度">
            {recipe.difficulty || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="制作时间">
            {recipe.use_time || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="收藏数">
            {(recipe.star ?? 0).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {recipe.tips && (
        <Card title="小贴士" className="detail-page__section" size="small">
          <div className="detail-page__tips">{recipe.tips}</div>
        </Card>
      )}

      <Card
        title={`食材（${ingredients.filter((i) => !i.name.startsWith('#')).length}）`}
        className="detail-page__section"
        size="small"
      >
        {ingredients.length > 0 ? (
          <ul className="detail-page__ingredients">
            {ingredients.map((item, index) => {
              const isHeader = item.name.startsWith('#')
              if (isHeader) {
                return (
                  <li
                    key={`h-${index}`}
                    className="detail-page__ingredient detail-page__ingredient--header"
                  >
                    {item.name.slice(1)}
                  </li>
                )
              }
              return (
                <li
                  key={`${item.name}-${index}`}
                  className="detail-page__ingredient"
                >
                  <span>{item.name}</span>
                  {item.value && (
                    <span className="detail-page__ingredient-value">
                      {item.value}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <Empty
            description="暂无食材信息"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      {steps.length > 0 ? (
        <RecipeSteps key={recipe.id} steps={steps} />
      ) : (
        <Card
          title="制作步骤（0）"
          className="detail-page__section"
          size="small"
        >
          <Empty description="暂无步骤" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      )}

      {pictures.length > 0 && (
        <Card
          title={`成品晒图（${pictures.length}）`}
          className="detail-page__section"
          size="small"
        >
          <Image.PreviewGroup>
            <div className="detail-page__gallery">
              {pictures.map((url, index) => (
                <Image
                  key={`${url}-${index}`}
                  src={resolveMediaUrl(url)}
                  width={120}
                  height={120}
                  style={{ objectFit: 'cover' }}
                  className="detail-page__gallery-item"
                  {...imageProps}
                />
              ))}
            </div>
          </Image.PreviewGroup>
        </Card>
      )}
      </div>
    </div>
  )
}
