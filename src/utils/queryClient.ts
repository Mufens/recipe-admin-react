import { QueryClient } from '@tanstack/react-query'

/**
 * 全局 QueryClient 实例
 * - staleTime 1 分钟：避免组件挂载即重复请求（默认 0 太激进）
 * - refetchOnWindowFocus false：后台管理系统，切窗焦点不重发
 * 需要更激进缓存/重试策略时在此调整
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
})
