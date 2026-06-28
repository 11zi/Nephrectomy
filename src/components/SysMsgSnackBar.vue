<!-- 系统消息 Snackbar，统一封装 MDUI snackbar。 -->
<script setup lang="ts">
export interface SysMsgSnackBarInstance {
  close: () => void
}

export type SysMsgSnackBarType = 'info' | 'error' | 'success'

const iconByType: Record<SysMsgSnackBarType, string> = {
  info: 'info',
  error: 'error_outline',
  success: 'check_circle',
}

const colorByType: Record<SysMsgSnackBarType, string> = {
  info: '',
  error: 'red-700',
  success: 'green-700',
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function show(message: string, type: SysMsgSnackBarType = 'info', duration = 3000): SysMsgSnackBarInstance {
  const safeMessage = escapeHtml(message)
  const icon = iconByType[type]

  return mdui.snackbar({
    message: `<span class="sys-snackbar-content"><i class="mdui-icon material-icons">${icon}</i><span>${safeMessage}</span></span>`,
    timeout: duration,
    position: 'bottom',
    buttonText: duration === 0 ? '关闭' : '',
    buttonColor: colorByType[type],
    closeOnButtonClick: true,
    closeOnOutsideClick: duration !== 0,
  })
}

defineExpose({ show })
</script>

<template>
  <span style="display: none;" />
</template>

<style>
.sys-snackbar-content {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 24px;
  line-height: 1.35;
}

.sys-snackbar-content .mdui-icon {
  flex-shrink: 0;
  font-size: 20px;
  line-height: 1;
}
</style>
