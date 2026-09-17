import { theme as antdTheme, type ThemeConfig } from 'antd'

/** Ant Design ConfigProvider 主题：算法 + 主色 + 布局/菜单覆盖 */
export function buildAntdTheme(
  isDark: boolean,
  colorPrimary: string,
): ThemeConfig {
  const surface = isDark ? '#141414' : '#ffffff'

  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    cssVar: {},
    token: {
      colorPrimary,
      colorInfo: colorPrimary,
      colorLink: colorPrimary,
    },
    components: {
      Layout: {
        siderBg: surface,
        headerBg: surface,
        bodyBg: isDark ? '#000000' : '#f5f5f5',
      },
      Menu: isDark
        ? {
            darkItemBg: surface,
            darkSubMenuItemBg: surface,
            darkPopupBg: '#1f1f1f',
          }
        : undefined,
      Tag: {
        defaultBg: surface,
      },
    },
  }
}
