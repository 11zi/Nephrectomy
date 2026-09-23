<!-- 系统消息 Snackbar，统一封装应用内 toast。 -->
<script setup lang="ts">
import { ref } from 'vue'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-vue-next'

export interface SysMsgSnackBarInstance {
  close: () => void
}

export type SysMsgSnackBarType = 'info' | 'error' | 'success'

interface ToastItem {
  id: number
  message: string
  type: SysMsgSnackBarType
  duration: number
}

const iconByType = {
  info: Info,
  error: AlertCircle,
  success: CheckCircle2,
}

const items = ref<ToastItem[]>([])
let nextId = 1

function dismiss(id: number) {
  const index = items.value.findIndex(item => item.id === id)
  if (index >= 0) items.value.splice(index, 1)
}

function show(message: string, type: SysMsgSnackBarType = 'info', duration = 3000): SysMsgSnackBarInstance {
  const id = nextId++
  items.value.push({ id, message, type, duration })
  if (duration > 0) {
    window.setTimeout(() => dismiss(id), duration)
  }
  return {
    close: () => dismiss(id),
  }
}

defineExpose({ show })
</script>

<template>
  <Teleport to="body">
    <div class="sys-snackbar-stack" aria-live="polite" aria-atomic="true">
      <TransitionGroup name="sys-snackbar">
        <div
          v-for="item in items"
          :key="item.id"
          class="sys-snackbar-item"
          :class="`sys-snackbar-${item.type}`"
          role="status"
        >
          <component :is="iconByType[item.type]" class="sys-snackbar-icon" aria-hidden="true" />
          <span class="sys-snackbar-message">{{ item.message }}</span>
          <button
            v-if="item.duration === 0"
            class="sys-snackbar-close"
            type="button"
            title="关闭"
            @click="dismiss(item.id)"
          >
            <X aria-hidden="true" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.sys-snackbar-stack {
  position: fixed;
  left: 50%;
  bottom: calc(var(--app-safe-area-bottom, 0px) + 24px);
  z-index: 99999;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 8px;
  width: min(480px, calc(100vw - 32px));
  pointer-events: none;
  transform: translateX(-50%);
}

.sys-snackbar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  max-width: 100%;
  min-height: 44px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  background: #263238;
  color: #fff;
  box-shadow: 0 10px 28px rgba(18, 28, 34, 0.28);
  pointer-events: auto;
}

.sys-snackbar-error {
  background: #b71c1c;
}

.sys-snackbar-success {
  background: #2e7d32;
}

.sys-snackbar-icon,
.sys-snackbar-close svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sys-snackbar-message {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 14px;
  line-height: 1.35;
}

.sys-snackbar-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  margin: -4px -6px -4px 0;
  border: 0;
  border-radius: 4px;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.sys-snackbar-close:hover {
  background: rgba(255, 255, 255, 0.14);
}

.sys-snackbar-enter-active {
  transition: opacity 0.18s, transform 0.18s;
}

.sys-snackbar-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.sys-snackbar-enter-from,
.sys-snackbar-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
</style>
