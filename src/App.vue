<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { LoaderCircle, Menu } from 'lucide-vue-next'
import SideBar from './views/SideBar.vue'
import Content from './views/Content.vue'
import UiPreview from './views/UiPreview.vue'
import SysMsgSnackBar from './components/SysMsgSnackBar.vue'
import { Button } from './components/ui/button'
import { registerSnackbar } from './composables/useSnackbar'
import { useAppInit } from './stores/useAppInit'
import { useUserStore } from './stores/useUserStore'
import { useRoomStore } from './stores/useRoomStore'
import { useRealtimeStore } from './stores/useRealtimeStore'
import { useSidebar } from './composables/useSidebar'

const snackbarRef = ref<InstanceType<typeof SysMsgSnackBar> | null>(null)
const { isReady, isLoading, error, initApp } = useAppInit()
const userStore = useUserStore()
const roomStore = useRoomStore()
const realtimeStore = useRealtimeStore()
const { isSidebarOpen, toggleSidebar } = useSidebar()
const route = useRoute()
const isUiPreview = computed(() => route.path === '/ui-preview')
const mobileMenuButtonClass = computed(() =>
  ['app-mobile-menu-button', isSidebarOpen.value ? 'app-mobile-menu-button-hidden' : '']
    .filter(Boolean)
    .join(' '),
)

onMounted(() => {
  if (isUiPreview.value) return
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
  <UiPreview v-if="isUiPreview" />

  <!-- 全屏加载状态 -->
  <div v-else-if="isLoading" class="init-overlay">
    <LoaderCircle class="init-spinner" aria-hidden="true" />
    <p class="init-text">正在连接服务器…</p>
  </div>

  <!-- 全屏错误提示 -->
  <div v-else-if="error" class="init-overlay">
    <p class="init-error-text">{{ error }}</p>
    <Button @click="initApp">重试</Button>
  </div>

  <!-- 已认证：显示完整布局 -->
  <template v-else-if="isReady && userStore.isAuthenticated">
    <SideBar />
    <Button
      variant="ghost"
      size="icon"
      :class="mobileMenuButtonClass"
      type="button"
      title="打开侧边栏"
      @click="toggleSidebar"
    >
      <Menu />
    </Button>
    <Content />
  </template>

  <!-- 未认证：只显示 Content（登录/注册页），隐藏 SideBar -->
  <template v-else-if="isReady && !userStore.isAuthenticated">
    <Content />
  </template>

  <SysMsgSnackBar ref="snackbarRef" />
</template>

<style>
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

.init-spinner {
  width: 32px;
  height: 32px;
  margin-bottom: 20px;
  color: #90a4ae;
  animation: init-spin 0.9s linear infinite;
}

.init-text {
  color: #455a64;
  font-size: 14px;
  margin: 0;
}

.init-error-text {
  color: #e53935;
  font-size: 14px;
  margin: 0 0 16px;
}

@keyframes init-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
