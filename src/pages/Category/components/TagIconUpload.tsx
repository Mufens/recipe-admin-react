import { LoadingOutlined, PlusOutlined } from '@ant-design/icons'
import { Upload } from 'antd'
import type { UploadProps } from 'antd'
import { useEffect, useState } from 'react'
import { resolveMediaUrl } from '@/utils/media'
import { uploadTagIcon } from '../api'
import './TagIconUpload.scss'

type Props = {
  value?: string | null
  onChange?: (url: string) => void
  onUploadingChange?: (uploading: boolean) => void
}

/** 选图立即传到 OSS，回写 URL；点保存再交给编辑接口 */
export default function TagIconUpload({
  value,
  onChange,
  onUploadingChange,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const preview = blobUrl || resolveMediaUrl(value)

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

  useEffect(() => {
    return () => {
      onUploadingChange?.(false)
    }
  }, [onUploadingChange])

  const customRequest: UploadProps['customRequest'] = async ({
    file,
    onSuccess,
    onError,
  }) => {
    if (!(file instanceof File)) {
      onError?.(new Error('invalid'))
      return
    }

    const local = URL.createObjectURL(file)
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return local
    })
    setUploading(true)
    onUploadingChange?.(true)
    try {
      const result = await uploadTagIcon(file)
      onChange?.(result.icon)
      onSuccess?.(result)
    } catch (e) {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      onError?.(e as Error)
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
    }
  }

  return (
    <Upload
      className="tag-icon-upload"
      listType="picture-card"
      showUploadList={false}
      accept="image/*"
      maxCount={1}
      disabled={uploading}
      customRequest={customRequest}
    >
      {preview ? (
        <div
          className={
            uploading
              ? 'tag-icon-upload__preview is-uploading'
              : 'tag-icon-upload__preview'
          }
        >
          <img
            src={preview}
            alt="封面"
            referrerPolicy="no-referrer"
            className="tag-icon-upload__img"
          />
          <div className="tag-icon-upload__mask">
            {uploading ? <LoadingOutlined /> : <span>替换</span>}
          </div>
        </div>
      ) : (
        <div className="tag-icon-upload__empty">
          {uploading ? <LoadingOutlined /> : <PlusOutlined />}
          <div className="tag-icon-upload__tip">
            {uploading ? '上传中' : '上传'}
          </div>
        </div>
      )}
    </Upload>
  )
}
