<script setup lang="ts">
defineProps<{
  roomName: string
  memberCount: number
}>()
</script>

<template>
  <div class="chat-header">
    <span class="chat-room-name">
      {{ roomName }}
    </span>
    <span class="chat-room-presence">
      {{ memberCount }} 人在线
    </span>
  </div>
</template>

<style scoped>
.chat-header {
  flex-shrink: 0;
  min-width: 0;
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: transparent;
  border-bottom: 1px solid transparent;
}

.chat-room-name {
  min-width: 0;
  overflow: hidden;
  color: #37474f;
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-room-presence {
  flex: 0 0 auto;
  color: #455a64;
  font-size: 12px;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .chat-header {
    min-height: 56px;
    padding: 10px 12px 10px 64px;
    border-bottom-color: rgba(84, 110, 122, 0.12);
  }

  .chat-room-name {
    font-size: 15px;
  }
}
</style>
