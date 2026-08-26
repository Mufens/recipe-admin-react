import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Form, Input, Switch, Tooltip } from 'antd'

export interface RecipeIngredient {
  name: string
  value: string
}

/** 食材行式输入：支持普通食材和 # 开头的小标题 */
export default function IngredientRows() {
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
    <div className="ingredient-rows">
      <div className="ingredient-rows__toolbar">
        <Button type="dashed" onClick={handleAdd} icon={<PlusOutlined />}>
          添加食材
        </Button>
      </div>
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
    </div>
  )
}
