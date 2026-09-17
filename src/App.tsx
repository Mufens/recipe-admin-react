import { AliveScope } from 'react-activation'
import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { useMemo } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRouter from '@/router'
import { buildAntdTheme } from '@/theme/antdTheme'
import { selectColorPrimary, useThemeStore } from '@/store/theme'
import { queryClient } from '@/utils/queryClient'

dayjs.locale('zh-cn')

function AppProviders() {
  const colorPrimary = useThemeStore(selectColorPrimary)
  const isDark = useThemeStore((s) => s.isDark)
  const theme = useMemo(
    () => buildAntdTheme(isDark, colorPrimary),
    [colorPrimary, isDark],
  )

  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <BrowserRouter>
        <AliveScope>
          <AppRouter />
        </AliveScope>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders />
    </QueryClientProvider>
  )
}
