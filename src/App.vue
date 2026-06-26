<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SideBar from './views/SideBar.vue'
import Content from './views/Content.vue'
import AppSnackbar from './components/AppSnackbar.vue'
import { registerSnackbar } from './composables/useSnackbar'
import { useAppInit } from './stores/useAppInit'
import { useUserStore } from './stores/useUserStore'

const snackbarRef = ref<InstanceType<typeof AppSnackbar> | null>(null)
const { isReady, isLoading, error, initApp } = useAppInit()
const userStore = useUserStore()

onMounted(() => {
  if (snackbarRef.value) {
    registerSnackbar(snackbarRef.value.show)
  }
  initApp()
})
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
    <AppSnackbar ref="snackbarRef" />
  </template>

  <!-- 未认证：只显示 Content（登录/注册页），隐藏 SideBar -->
  <template v-else-if="isReady && !userStore.isAuthenticated">
    <Content />
    <AppSnackbar ref="snackbarRef" />
  </template>
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
