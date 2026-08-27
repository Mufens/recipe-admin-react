import { Form, Input, Modal, type FormInstance } from 'antd'
import type { CategoryFormValues, ModalMode } from '../model'

type Props = {
  modal: ModalMode
  form: FormInstance<CategoryFormValues>
  confirmLoading: boolean
  onCancel: () => void
  onOk: () => void
}

function modalTitle(modal: NonNullable<ModalMode>) {
  if (modal.type === 'rename') return `修改「${modal.row.name}」`
  if (modal.type === 'createSub') return `在「${modal.parentName}」下加分组`
  return `往「${modal.parentName}」挂标签`
}

export default function CategoryFormModal({
  modal,
  form,
  confirmLoading,
  onCancel,
  onOk,
}: Props) {
  return (
    <Modal
      title={modal ? modalTitle(modal) : ''}
      open={!!modal}
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={confirmLoading}
      destroyOnHidden
      okText="保存"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        {modal?.type === 'rename' && (
          <Form.Item label="编码">
            <Input value={String(modal.row.id)} disabled />
          </Form.Item>
        )}
        {modal?.type === 'createSub' && (
          <Form.Item
            label="编码（可选）"
            name="id"
            extra="不填会自动生成，如 b → bd"
          >
            <Input placeholder="例如 bd" maxLength={10} />
          </Form.Item>
        )}
        <Form.Item
          label="名称"
          name="name"
          rules={[{ required: true, message: '写个名字吧' }]}
        >
          <Input placeholder="好认一点的名字" maxLength={50} />
        </Form.Item>
        {(modal?.type === 'createTag' ||
          (modal?.type === 'rename' && modal.kind === 'tag')) && (
          <>
            <Form.Item label="类型标记" name="type">
              <Input placeholder="可选，如 popular / dessert" maxLength={50} />
            </Form.Item>
            <Form.Item label="图标 URL" name="icon">
              <Input placeholder="可选，不填用默认图" maxLength={255} />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  )
}
