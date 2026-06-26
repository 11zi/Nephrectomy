<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import SideBar from './views/SideBar.vue'
import Content from './views/Content.vue'
import SysMsgSnackBar from './components/SysMsgSnackBar.vue'
import { registerSnackbar } from './composables/useSnackbar'
import { useAppInit } from './stores/useAppInit'
import { useUserStore } from './stores/useUserStore'
import { useRoomStore } from './stores/useRoomStore'
import { useRealtimeStore } from './stores/useRealtimeStore'

const snackbarRef = ref<InstanceType<typeof SysMsgSnackBar> | null>(null)
const { isReady, isLoading, error, initApp } = useAppInit()
const userStore = useUserStore()
const roomStore = useRoomStore()
const realtimeStore = useRealtimeStore()

onMounted(() => {
  if (snackbarRef.value) {
    registerSnackbar(snackbarRef.value.show)
  }
  initApp()
})

watch(
  () => userStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      realtimeStore.connect()
      realtimeStore.joinRoom(roomStore.activeRoomId)
    } else {
      realtimeStore.disconnect()
    }
  },
  { immediate: true },
)

watch(
  () => roomStore.activeRoomId,
  (roomId, prevRoomId) => {
    if (!userStore.isAuthenticated) return
    realtimeStore.leaveRoom(prevRoomId)
    realtimeStore.joinRoom(roomId)
  },
)
</script>

<template>
  <!-- 全屏加载状态 -->
  <div v-if="isLoading" class="init-overlay">
    <div class="mdui-spinner mdui-spinner-colorful" style="margin-bottom: 20px;"></div>
    <p class="init-text">正在连接服务器…</p>
  </div>

  <!-- 全屏错误提示 -->
  <div v-else-if="error" class="init-overlay">
    <p class="init-error-text">{{ error }}</p>
    <button class="mdui-btn mdui-btn-raised mdui-ripple mdui-color-blue-grey" @click="initApp">重试</button>
  </div>

  <!-- 已认证：显示完整布局 -->
  <template v-else-if="isReady && userStore.isAuthenticated">
    <SideBar />
    <Content />
  </template>

  <!-- 未认证：只显示 Content（登录/注册页），隐藏 SideBar -->
  <template v-else-if="isReady && !userStore.isAuthenticated">
    <Content />
  </template>

  <SysMsgSnackBar ref="snackbarRef" />
</template>

<style>
/* 全屏 loading/error 遮罩 — mdui 无全屏 overlay 组件，保留最小布局 */
.init-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #263238;
  z-index: 9999;
}

.init-text {
  color: #90a4ae;
  font-size: 14px;
  margin: 0;
}

.init-error-text {
  color: #e53935;
  font-size: 14px;
  margin: 0 0 16px;
}
</style>
