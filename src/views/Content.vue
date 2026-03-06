<!-- src/views/Content.vue -->
<!-- 主内容区容器，根据 store 中的 currentPage 切换渲染的页面 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from '../stores/useContentStore'
import ChatRoom from './Content/Chat/ChatRoom.vue'
import ChatRoomList from './Content/ChatRoomList.vue'
import PrivateMessage from './Content/PrivateMessage.vue'
import AccountEdit from './Content/AccountEdit.vue'

const contentStore = useContentStore()

const currentComponent = computed(() => {
  switch (contentStore.currentPage) {
    case 'room-list':       return ChatRoomList
    case 'private-message': return PrivateMessage
    case 'account-edit':     return AccountEdit
    case 'chat':
    default:                return ChatRoom
  }
})
</script>

<template>
  <!-- keep-alive 让 ChatRoom 在切换走后保留状态（聊天记录不丢失） -->
  <KeepAlive>
    <component :is="currentComponent" />
  </KeepAlive>
</template>