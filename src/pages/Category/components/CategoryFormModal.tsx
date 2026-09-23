import { Form, Input, Modal, type FormInstance } from 'antd'
import { useState } from 'react'
import type { CategoryFormValues, ModalMode } from '../model'
import TagIconUpload from './TagIconUpload.tsx'

type Props = {
  modal: ModalMode
  form: FormInstance<CategoryFormValues>
  confirmLoading: boolean
  onCancel: () => void
  onOk: () => void
}

function modalTitle(modal: NonNullable<ModalMode>) {
  if (modal.type === 'rename') return '修改'
  if (modal.type === 'createSub') return `在「${modal.parentName}」下加分组`
  return `往「${modal.parentName}」挂标签`
}

function sessionKeyOf(modal: ModalMode) {
  if (!modal) return ''
  if (modal.type === 'rename') return `r-${modal.kind}-${modal.row.id}`
  if (modal.type === 'createTag') return `c-${modal.parentKind}-${modal.parentId}`
  return `s-${modal.parentId}`
}

export default function CategoryFormModal({
  modal,
  form,
  confirmLoading,
  onCancel,
  onOk,
}: Props) {
  const [iconUploading, setIconUploading] = useState(false)
  const isTagForm =
    modal?.type === 'createTag' ||
    (modal?.type === 'rename' && modal.kind === 'tag')

  return (
    <Modal
      title={modal ? modalTitle(modal) : ''}
      open={!!modal}
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={confirmLoading}
      okButtonProps={{ disabled: iconUploading }}
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
        {isTagForm && (
          <Form.Item label="类型标记" name="type">
            <Input placeholder="可选，如 popular / dessert" maxLength={50} />
          </Form.Item>
        )}
        {isTagForm && (
          <Form.Item label="分类封面" name="icon">
            <TagIconUpload
              key={sessionKeyOf(modal)}
              onUploadingChange={setIconUploading}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
