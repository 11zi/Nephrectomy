<!-- src/views/Content.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from '../stores/useContentStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useSidebar } from '../composables/useSidebar'

const contentStore = useContentStore()
const settingsStore = useSettingsStore()
const { openSidebar, closeSidebar, isMobileViewport } = useSidebar()

// 动态导入避免循环依赖
import ChatRoom from './Content/Chat/ChatRoom.vue'
import ChatRoomList from './Content/ChatRoomList.vue'
import RoomInfoPage from './Content/RoomInfoPage.vue'
import ShopPage from './Content/ShopPage.vue'
import PrivateMessage from './Content/PrivateMessage.vue'
import AccountEdit from './Content/AccountEdit.vue'
import UserProfile from './Content/UserProfile.vue'
import SettingsPage from './Content/SettingsPage.vue'
import LoginPage from './Content/Login.vue'
import RegisterPage from './Content/Register.vue'

const currentComponent = computed(() => {
  switch (contentStore.currentPage) {
    case 'room-list':        return ChatRoomList
    case 'room-info':        return RoomInfoPage
    case 'shop':             return ShopPage
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
const cacheablePages = new Set(['chat', 'room-list', 'room-info', 'shop', 'private-message', 'account-edit', 'settings'])
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

  if (dx > SWIPE_MIN_X) {
    openSidebar()
  } else if (dx < -SWIPE_MIN_X) {
    if (settingsStore.keepSidebarOpen && !isMobileViewport()) return
    closeSidebar()
  }
}
</script>

<template>
  <div
    class="content-shell"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <KeepAlive v-if="cacheablePages.has(currentPage)">
      <component :is="currentComponent" :implicit-teleport="isImplicitRoomList" />
    </KeepAlive>
    <component v-else :is="currentComponent" :key="currentPage" :implicit-teleport="isImplicitRoomList" />
  </div>
</template>

<style scoped>
.content-shell {
  height: 100%;
  min-width: 0;
  overflow: hidden;
  transform: translateX(0);
  transition: transform var(--sidebar-transition-duration) var(--sidebar-transition-easing);
}

@media (max-width: 600px) {
  .content-shell {
    transition: none;
  }
}
</style>
