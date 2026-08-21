/** 外链图（如下厨房 CDN）会校验 Referer，本地开发需去掉 */
export const imageProps = {
  referrerPolicy: 'no-referrer' as const,
}

/**
 * 解析媒体 URL
 * - 绝对地址原样返回
 * - /static/... 为小程序本地资源，管理后台无法访问，返回 undefined
 */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/static/')) return undefined
  if (url.startsWith('/')) return url
  return url
}
