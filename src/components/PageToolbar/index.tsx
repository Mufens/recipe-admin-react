import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import './index.scss'

interface PageToolbarProps {
  onRefresh?: () => void
  onBack?: () => void
}

export default function PageToolbar({ onRefresh, onBack }: PageToolbarProps) {
  return (
    <div className="page-toolbar">
      {onRefresh && (
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={onRefresh}
        >
          刷新
        </Button>
      )}
      {onBack && (
        <Button
          type="text"
          size="small"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
        >
          返回
        </Button>
      )}
    </div>
  )
}
