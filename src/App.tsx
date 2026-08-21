import { AliveScope } from 'react-activation'
import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { BrowserRouter } from 'react-router-dom'
import AppRouter from '@/router'
import { queryClient } from '@/utils/queryClient'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhCN}>
        <BrowserRouter>
          <AliveScope>
            <AppRouter />
          </AliveScope>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  )
}
