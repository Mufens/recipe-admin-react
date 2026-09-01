import { AliveScope } from 'react-activation'
import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { BrowserRouter } from 'react-router-dom'
import AppRouter from '@/router'
import { queryClient } from '@/utils/queryClient'

dayjs.locale('zh-cn')

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
