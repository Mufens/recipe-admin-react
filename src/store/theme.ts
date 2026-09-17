import { create } from 'zustand'
import {
  DEFAULT_CUSTOM_COLOR,
  DEFAULT_THEME_KEY,
  getThemePreset,
  isPresetThemeKey,
  type PresetThemeKey,
  type ThemeKey,
} from '@/theme/presets'

const KEYS = {
  theme: 'recipe-admin-theme',
  custom: 'recipe-admin-theme-custom',
  mode: 'recipe-admin-theme-mode',
} as const

function syncHtmlThemeClass(isDark: boolean) {
  const root = document.documentElement
  root.classList.toggle('dark', isDark)
  root.style.colorScheme = isDark ? 'dark' : 'light'
}

function storageGet(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // private mode / quota
  }
}

function loadThemeKey(): ThemeKey {
  const raw = storageGet(KEYS.theme)
  if (raw === 'custom' || isPresetThemeKey(raw)) return raw
  return DEFAULT_THEME_KEY
}

function loadCustomColor(): string {
  const raw = storageGet(KEYS.custom)
  return raw && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)
    ? raw
    : DEFAULT_CUSTOM_COLOR
}

export interface ThemeState {
  themeKey: ThemeKey
  customColor: string
  isDark: boolean
  setPreset: (key: PresetThemeKey) => void
  /** 无参：启用自定义；有参：写入自定义色并启用 */
  setCustom: (color?: string) => void
  setDark: (dark: boolean) => void
}

export function selectColorPrimary(s: ThemeState): string {
  return s.themeKey === 'custom'
    ? s.customColor
    : getThemePreset(s.themeKey).colorPrimary
}

const initialThemeKey = loadThemeKey()
const initialCustomColor = loadCustomColor()
const initialDark = storageGet(KEYS.mode) === 'dark'

syncHtmlThemeClass(initialDark)

export const useThemeStore = create<ThemeState>((set) => ({
  themeKey: initialThemeKey,
  customColor: initialCustomColor,
  isDark: initialDark,

  setPreset: (key) => {
    storageSet(KEYS.theme, key)
    set({ themeKey: key })
  },

  setCustom: (color) => {
    storageSet(KEYS.theme, 'custom')
    if (color) {
      storageSet(KEYS.custom, color)
      set({ themeKey: 'custom', customColor: color })
    } else {
      set({ themeKey: 'custom' })
    }
  },

  setDark: (dark) => {
    storageSet(KEYS.mode, dark ? 'dark' : 'light')
    set({ isDark: dark })
    syncHtmlThemeClass(dark)
  },
}))
