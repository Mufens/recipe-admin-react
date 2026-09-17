export type ThemeKey =
  | 'blue'
  | 'orange'
  | 'purple'
  | 'matcha'
  | 'strawberry'
  | 'grape'
  | 'honey'
  | 'custom'

export type PresetThemeKey = Exclude<ThemeKey, 'custom'>

export interface ThemePreset {
  key: PresetThemeKey
  label: string
  colorPrimary: string
}

/** 食材柔和配色 */
export const themePresets: ThemePreset[] = [
  { key: 'blue', label: '蓝莓蓝', colorPrimary: '#7a9ec7' },
  { key: 'orange', label: '蜜柑橙', colorPrimary: '#e89652' },
  { key: 'purple', label: '芋圆紫', colorPrimary: '#ab9bd1' },
  { key: 'matcha', label: '抹茶绿', colorPrimary: '#8fad7e' },
  { key: 'strawberry', label: '草莓粉', colorPrimary: '#d98b9a' },
  { key: 'grape', label: '青提绿', colorPrimary: '#6fafa0' },
  { key: 'honey', label: '蜂蜜金', colorPrimary: '#d4a574' },
]

export const DEFAULT_THEME_KEY: ThemeKey = 'blue'
export const DEFAULT_CUSTOM_COLOR = themePresets[0].colorPrimary

const presetMap = Object.fromEntries(
  themePresets.map((p) => [p.key, p]),
) as Record<PresetThemeKey, ThemePreset>

export function getThemePreset(key: PresetThemeKey): ThemePreset {
  return presetMap[key]
}

export function isPresetThemeKey(key: string | null): key is PresetThemeKey {
  return key != null && key in presetMap
}
