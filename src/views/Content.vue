<!-- src/views/Content.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from '../stores/useContentStore'

const contentStore = useContentStore()

// 动态导入避免循环依赖
import ChatRoom from './Content/Chat/ChatRoom.vue'
import ChatRoomList from './Content/ChatRoomList.vue'
import PrivateMessage from './Content/PrivateMessage.vue'
import AccountEdit from './Content/AccountEdit.vue'

const currentComponent = computed(() => {
  switch (contentStore.currentPage) {
    case 'room-list':        return ChatRoomList
    case 'private-message':  return PrivateMessage
    case 'account-edit':     return AccountEdit
    case 'chat':
    default:                 return ChatRoom
  }
})

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
  } else if (dx < -SWIPE_MIN_X) {
    // 左滑：关闭侧边栏
    sidebar.classList.remove('mdui-drawer-open')
    sidebar.classList.add('mdui-drawer-close')
    document.body.style.paddingLeft = '0px'
  }
}
</script>

<template>
  <div
    style="height: 100%"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <KeepAlive>
      <component :is="currentComponent" />
    </KeepAlive>
  </div>
</template>