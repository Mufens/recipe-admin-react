import { CloudUploadOutlined, SwapOutlined } from '@ant-design/icons'
import { Button, Select, Space, Upload, message } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { useMemo, useState } from 'react'
import {
  FORMAT_OPTIONS,
  convertFile,
  detectFormat,
  downloadBlob,
  type FileFormat,
} from './utils/convert'
import './index.scss'

export default function Convert() {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [targetFormat, setTargetFormat] = useState<FileFormat | undefined>()
  const [converting, setConverting] = useState(false)

  const sourceFile = fileList[0]?.originFileObj
  const sourceFormat = sourceFile ? detectFormat(sourceFile.name) : null

  const targetOptions = useMemo(
    () => FORMAT_OPTIONS.filter((opt) => opt.value !== sourceFormat),
    [sourceFormat],
  )

  const handleConvert = async () => {
    if (!sourceFile || !sourceFormat) {
      message.warning('请先上传 JSON / Excel / CSV 文件')
      return
    }
    if (!targetFormat) {
      message.warning('请选择目标格式')
      return
    }

    setConverting(true)
    try {
      const { blob, fileName, rowCount } = await convertFile(
        sourceFile,
        sourceFormat,
        targetFormat,
      )
      downloadBlob(blob, fileName)
      message.success(`转换成功，共 ${rowCount} 行，已开始下载`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '转换失败')
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className="convert-page">
      <div className="convert-page__panel">
        <h2 className="convert-page__title">格式转换</h2>
        <p className="convert-page__desc">
          支持 JSON、Excel（.xlsx）、CSV 互相转换；也支持 JSONL（每行一个对象，如
          enrich 输出的 recipes.json）。嵌套字段会写入单元格为 JSON 字符串。
        </p>

        <Upload.Dragger
          className="convert-page__dragger"
          accept=".json,.xlsx,.xls,.csv,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          maxCount={1}
          fileList={fileList}
          beforeUpload={(file) => {
            const format = detectFormat(file.name)
            if (!format) {
              message.error('仅支持 .json / .xlsx / .csv 文件')
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
            setTargetFormat(undefined)
            return false
          }}
          onRemove={() => {
            setFileList([])
            setTargetFormat(undefined)
          }}
        >
          <p className="convert-page__icon">
            <CloudUploadOutlined />
          </p>
          <p className="convert-page__action">点击或拖拽上传</p>
          <p className="convert-page__hint">支持 .json / .xlsx / .csv</p>
        </Upload.Dragger>

        <div className="convert-page__actions">
          <Space wrap size="middle">
            <span className="convert-page__label">
              源格式：{sourceFormat ? sourceFormat.toUpperCase() : '未选择'}
            </span>
            <SwapOutlined />
            <Select
              placeholder="选择目标格式"
              style={{ width: 200 }}
              value={targetFormat}
              onChange={setTargetFormat}
              options={targetOptions}
              disabled={!sourceFormat}
            />
            <Button
              type="primary"
              loading={converting}
              disabled={!sourceFile || !targetFormat}
              onClick={() => void handleConvert()}
            >
              转换并下载
            </Button>
          </Space>
        </div>
      </div>
    </div>
  )
}
