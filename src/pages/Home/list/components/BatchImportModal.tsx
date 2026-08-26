import { CloudUploadOutlined, DownloadOutlined } from '@ant-design/icons'
import { Button, Modal, Upload, message } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { useState } from 'react'
import {
  downloadImportTemplate,
  importRecipes,
  type ImportResult,
} from '../api'
import './BatchImportModal.scss'

interface BatchImportModalProps {
  open: boolean
  onCancel: () => void
  onSuccess: () => void
}

export default function BatchImportModal({
  open,
  onCancel,
  onSuccess,
}: BatchImportModalProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [importing, setImporting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const reset = () => {
    setFileList([])
    setImporting(false)
    setDownloading(false)
  }

  const handleClose = () => {
    if (importing) return
    reset()
    onCancel()
  }

  const handleDownloadTemplate = async () => {
    setDownloading(true)
    try {
      const blob = await downloadImportTemplate()
      const url = URL.createObjectURL(blob)
      const a = Object.assign(document.createElement('a'), {
        href: url,
        download: '菜谱批量导入模板.xlsx',
      })
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // 错误 toast 由拦截器统一处理
    } finally {
      setDownloading(false)
    }
  }

  const handleImport = async () => {
    const file = fileList[0]?.originFileObj
    if (!file) {
      message.warning('请先选择 Excel 文件')
      return
    }

    setImporting(true)
    try {
      const result = await importRecipes(file)
      showImportResult(result)
      if (result.successCount > 0) {
        reset()
        onSuccess()
      }
    } catch {
      // 错误 toast 由拦截器统一处理
    } finally {
      setImporting(false)
    }
  }

  return (
    <Modal
      className="batch-import-modal"
      title="批量导入"
      open={open}
      onCancel={handleClose}
      mask={{ closable: false }}
      destroyOnHidden
      width={400}
      footer={
        <div className="batch-import-modal__footer">
          <Button
            icon={<DownloadOutlined />}
            loading={downloading}
            onClick={() => void handleDownloadTemplate()}
          >
            下载模板
          </Button>
          <div className="batch-import-modal__footer-right">
            <Button onClick={handleClose} disabled={importing}>
              取消
            </Button>
            <Button
              type="primary"
              className="batch-import-modal__import-btn"
              loading={importing}
              onClick={() => void handleImport()}
            >
              导入
            </Button>
          </div>
        </div>
      }
    >
      <Upload.Dragger
        className="batch-import-modal__dragger"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        maxCount={1}
        fileList={fileList}
        beforeUpload={(file) => {
          const name = file.name.toLowerCase()
          if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
            message.error('仅支持 Excel 文件')
            return Upload.LIST_IGNORE
          }
          setFileList([
            {
              uid: file.uid,
              name: file.name,
              status: 'done',
              originFileObj: file,
            },
          ])
          return false
        }}
        onRemove={() => {
          setFileList([])
        }}
      >
        <p className="batch-import-modal__icon">
          <CloudUploadOutlined />
        </p>
        <p className="batch-import-modal__action">点击上传</p>
        <p className="batch-import-modal__hint">仅支持Excel文件</p>
      </Upload.Dragger>
    </Modal>
  )
}

function showImportResult(result: ImportResult) {
  if (result.failCount === 0) {
    message.success(`成功导入 ${result.successCount} 条菜谱`)
    return
  }
  if (result.successCount === 0) {
    const first = result.failed[0]?.message
    message.error(
      first
        ? `导入失败：${first}${result.failCount > 1 ? ` 等 ${result.failCount} 条` : ''}`
        : `全部 ${result.failCount} 条导入失败`,
    )
    return
  }
  message.warning(
    `成功 ${result.successCount} 条，失败 ${result.failCount} 条${
      result.failed[0]?.message ? `（如：${result.failed[0].message}）` : ''
    }`,
  )
}
