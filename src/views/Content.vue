<!-- src/views/Content.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from '../stores/useContentStore'
import { useSettingsStore } from '../stores/useSettingsStore'

const contentStore = useContentStore()
const settingsStore = useSettingsStore()

// 动态导入避免循环依赖
import ChatRoom from './Content/Chat/ChatRoom.vue'
import ChatRoomList from './Content/ChatRoomList.vue'
import PrivateMessage from './Content/PrivateMessage.vue'
import AccountEdit from './Content/AccountEdit.vue'
import UserProfile from './Content/UserProfile.vue'
import SettingsPage from './Content/SettingsPage.vue'
import LoginPage from './Content/Login.vue'
import RegisterPage from './Content/Register.vue'

const currentComponent = computed(() => {
  switch (contentStore.currentPage) {
    case 'room-list':        return ChatRoomList
    case 'implicit-room-list': return ChatRoomList
    case 'private-message':  return PrivateMessage
    case 'account-edit':     return AccountEdit
    case 'user-profile':     return UserProfile
    case 'settings':         return SettingsPage
    case 'login':            return LoginPage
    case 'register':         return RegisterPage
    case 'chat':
    default:                 return ChatRoom
  }
})

// 登录/注册页面不缓存（避免表单残留敏感数据）
const cacheablePages = new Set(['chat', 'room-list', 'private-message', 'account-edit', 'settings'])
const currentPage = computed(() => contentStore.currentPage)
const isImplicitRoomList = computed(() => contentStore.currentPage === 'implicit-room-list')

// ── 触摸滑动手势 ──────────────────────────────────────────
const SWIPE_MIN_X = 40
const SWIPE_MAX_Y = 80

let touchStartX = 0
let touchStartY = 0

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX
  const dy = e.changedTouches[0].clientY - touchStartY
  if (Math.abs(dy) > SWIPE_MAX_Y) return

  const sidebar = document.querySelector('.mdui-drawer') as HTMLElement | null
  if (!sidebar) return

  if (dx > SWIPE_MIN_X) {
    // 右滑：开启侧边栏
    sidebar.classList.remove('mdui-drawer-close')
    sidebar.classList.add('mdui-drawer-open')
    document.body.style.paddingLeft = '240px'
    document.documentElement.style.setProperty('--sidebar-width', '240px')
  } else if (dx < -SWIPE_MIN_X) {
    if (settingsStore.keepSidebarOpen) return

    // 左滑：关闭侧边栏
    sidebar.classList.remove('mdui-drawer-open')
    sidebar.classList.add('mdui-drawer-close')
    document.body.style.paddingLeft = '0px'
    document.documentElement.style.setProperty('--sidebar-width', '0px')
  }
}
</script>

<template>
  <div
    style="height: 100%; overflow: hidden;"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <KeepAlive v-if="cacheablePages.has(currentPage)">
      <component :is="currentComponent" :implicit-teleport="isImplicitRoomList" />
    </KeepAlive>
    <component v-else :is="currentComponent" :key="currentPage" :implicit-teleport="isImplicitRoomList" />
  </div>
</template>
