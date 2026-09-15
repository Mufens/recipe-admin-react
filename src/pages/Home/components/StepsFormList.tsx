import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Form, Input } from 'antd'

/** 制作步骤 Form.List（新建 / 编辑共用） */
export default function StepsFormList() {
  return (
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
              <Form.Item {...field} name={[field.name, 'image']} label="步骤图 URL">
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
  )
}
