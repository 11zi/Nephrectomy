// 全局 Snackbar 单例，任意组件调用 useSnackbar() 即可弹出通知

import { ref } from 'vue'
import type {
  SysMsgSnackBarInstance,
  SysMsgSnackBarType,
} from '../components/SysMsgSnackBar.vue'

type ShowFn = (message: string, type?: SysMsgSnackBarType, duration?: number) => SysMsgSnackBarInstance

// 单例：保存注册进来的 show 函数
const _show = ref<ShowFn | null>(null)

export function registerSnackbar(fn: ShowFn) {
  _show.value = fn
}

export function useSnackbar() {
  function show(message: string, type: SysMsgSnackBarType = 'info', duration = 3000): SysMsgSnackBarInstance | null {
    return _show.value?.(message, type, duration) ?? null
  }
  function error(message: string)   { show(message, 'error') }
  function success(message: string) { show(message, 'success') }
  function persistentError(message: string) { return show(message, 'error', 0) }

  return { show, error, success, persistentError }
}
