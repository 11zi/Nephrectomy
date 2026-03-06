// 全局 Snackbar 单例，任意组件调用 useSnackbar() 即可弹出通知

import { ref } from 'vue'
import type { SnackbarItem } from '../components/AppSnackbar.vue'

type ShowFn = (message: string, type?: SnackbarItem['type'], duration?: number) => void

// 单例：保存注册进来的 show 函数
const _show = ref<ShowFn | null>(null)

export function registerSnackbar(fn: ShowFn) {
  _show.value = fn
}

export function useSnackbar() {
  function show(message: string, type: SnackbarItem['type'] = 'info', duration = 3000) {
    _show.value?.(message, type, duration)
  }
  function error(message: string)   { show(message, 'error') }
  function success(message: string) { show(message, 'success') }

  return { show, error, success }
}