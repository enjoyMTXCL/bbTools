/**
 * 应用设置：localStorage 持久化 + 即时生效
 * 包含：主题模式（浅色/深色/跟随系统）、图表水印开关与文字
 */
import { ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto'

interface AppSettings {
  themeMode: ThemeMode
  watermarkEnabled: boolean
  watermarkText: string
}

const STORAGE_KEY = 'appSettings'

const DEFAULTS: AppSettings = {
  themeMode: 'auto',
  watermarkEnabled: true,
  watermarkText: 'BBTools：请勿过度责怪团员'
}

const loadSettings = (): AppSettings => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // 只取默认项的值，过滤旧版本遗留字段
      const result: AppSettings = { ...DEFAULTS }
      for (const key of Object.keys(DEFAULTS) as (keyof AppSettings)[]) {
        if (parsed[key] !== undefined) (result as unknown as Record<string, unknown>)[key] = parsed[key]
      }
      return result
    }
  } catch (error) {
    console.error('读取设置失败:', error)
  }
  return { ...DEFAULTS }
}

export const settings = ref<AppSettings>(loadSettings())

// 深监听自动持久化
watch(
  settings,
  (val) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  },
  { deep: true }
)

// ========== 主题应用（浅色/深色/跟随系统） ==========
const darkMedia = window.matchMedia('(prefers-color-scheme: dark)')

const applyTheme = () => {
  const dark =
    settings.value.themeMode === 'dark' ||
    (settings.value.themeMode === 'auto' && darkMedia.matches)
  document.documentElement.classList.toggle('dark', dark)
}

watch(() => settings.value.themeMode, applyTheme)
darkMedia.addEventListener('change', () => {
  if (settings.value.themeMode === 'auto') applyTheme()
})
applyTheme()

// ========== 重置全部设置 ==========
export const resetSettings = () => {
  settings.value = { ...DEFAULTS }
}

// ========== 供非组件代码读取的便捷函数 ==========
export const isWatermarkEnabled = (): boolean => settings.value.watermarkEnabled
export const getWatermarkText = (): string => settings.value.watermarkText
