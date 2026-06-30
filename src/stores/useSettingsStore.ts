import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { MediaItem } from '../types/playbackTypes'

const SETTINGS_STORAGE_KEY = 'nephrectomy:user-settings'

interface StoredSettings {
  disableVideoPlayback?: boolean
  disableAudioPlayback?: boolean
  masterVolume?: number
  keepSidebarOpen?: boolean
}

function clampVolume(value: number) {
  if (!Number.isFinite(value)) return 80
  return Math.min(100, Math.max(0, Math.round(value)))
}

function readStoredSettings(): StoredSettings {
  if (typeof window === 'undefined') return {}

  try {
    const rawValue = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!rawValue) return {}
    const parsed = JSON.parse(rawValue) as StoredSettings
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const storedSettings = readStoredSettings()

  const disableVideoPlayback = ref(Boolean(storedSettings.disableVideoPlayback))
  const disableAudioPlayback = ref(Boolean(storedSettings.disableAudioPlayback))
  const masterVolume = ref(clampVolume(storedSettings.masterVolume ?? 80))
  const keepSidebarOpen = ref(Boolean(storedSettings.keepSidebarOpen))

  const normalizedVolume = computed(() => masterVolume.value / 100)

  function isPlaybackAllowed(item: MediaItem | null) {
    if (!item) return true
    if (item.type === 'video') return !disableVideoPlayback.value
    if (item.type === 'music') return !disableAudioPlayback.value
    return true
  }

  function getPlaybackDisabledText(item: MediaItem | null) {
    if (!item) return ''
    if (item.type === 'video' && disableVideoPlayback.value) return '视频点播已关闭'
    if (item.type === 'music' && disableAudioPlayback.value) return '音频点播已关闭'
    return ''
  }

  watch(
    [disableVideoPlayback, disableAudioPlayback, masterVolume, keepSidebarOpen],
    () => {
      if (typeof window === 'undefined') return
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
          disableVideoPlayback: disableVideoPlayback.value,
          disableAudioPlayback: disableAudioPlayback.value,
          masterVolume: clampVolume(masterVolume.value),
          keepSidebarOpen: keepSidebarOpen.value,
        }),
      )
    },
    { deep: false },
  )

  return {
    disableVideoPlayback,
    disableAudioPlayback,
    masterVolume,
    keepSidebarOpen,
    normalizedVolume,
    isPlaybackAllowed,
    getPlaybackDisabledText,
  }
})
