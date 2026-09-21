import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Form, Input } from 'antd'

/** 制作步骤 Form.List（新建 / 编辑共用） */
export default function StepsFormList() {
  return (
    <Form.List name="steps">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...restField }) => (
            <div key={key} className="add-page__step-item">
              <span className="add-page__step-index">{name + 1}</span>
              <div className="add-page__dynamic-row">
                <Form.Item
                  {...restField}
                  name={[name, 'text']}
                  className="add-page__step-text"
                  rules={[
                    { required: true, message: '请输入步骤内容' },
                    { max: 200, message: `步骤内容最多 200 字` },
                  ]}
                >
                  <Input
                    placeholder={`步骤 ${name + 1}`}
                    maxLength={200  }
                    showCount
                  />
                </Form.Item>
                <Form.Item {...restField} name={[name, 'image']}>
                  <Input placeholder="步骤图 URL（可选）" maxLength={500} />
                </Form.Item>
                <MinusCircleOutlined
                  className="add-page__remove-icon"
                  onClick={() => remove(name)}
                />
              </div>
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
  )
}
