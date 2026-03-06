<!-- 全局 Snackbar 通知组件，配合 useSnackbar composable 使用 -->
<script setup lang="ts">
import { ref } from 'vue'

export interface SnackbarItem {
  id: number
  message: string
  type: 'info' | 'error' | 'success'
  duration: number
}

const items = ref<SnackbarItem[]>([])
let nextId = 0

function show(message: string, type: SnackbarItem['type'] = 'info', duration = 3000) {
  const id = nextId++
  items.value.push({ id, message, type, duration })
  setTimeout(() => dismiss(id), duration)
}

function dismiss(id: number) {
  const idx = items.value.findIndex(i => i.id === id)
  if (idx !== -1) items.value.splice(idx, 1)
}

// 暴露 show 方法供父组件或 composable 调用
defineExpose({ show })
</script>

<template>
  <Teleport to="body">
    <div class="snackbar-stack">
      <TransitionGroup name="snack">
        <div
          v-for="item in items"
          :key="item.id"
          class="snackbar-item"
          :class="`snackbar-${item.type}`"
          @click="dismiss(item.id)"
        >
          <i class="mdui-icon material-icons snackbar-icon">
            {{ item.type === 'error' ? 'error_outline' : item.type === 'success' ? 'check_circle' : 'info' }}
          </i>
          <span>{{ item.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.snackbar-stack {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  z-index: 99999;
  pointer-events: none;
  align-items: center;
}

.snackbar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  pointer-events: all;
  min-width: 280px;
  max-width: 480px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.25);
  letter-spacing: 0.01em;
}

.snackbar-info    { background: #323232; }
.snackbar-error   { background: #c62828; }
.snackbar-success { background: #2e7d32; }

.snackbar-icon {
  font-size: 20px;
  flex-shrink: 0;
}

/* 动画 */
.snack-enter-active { transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1); }
.snack-leave-active { transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1); }
.snack-enter-from   { opacity: 0; transform: translateY(16px) scale(0.96); }
.snack-leave-to     { opacity: 0; transform: translateY(8px) scale(0.96); }
</style>