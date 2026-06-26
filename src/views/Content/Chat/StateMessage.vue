<script setup lang="ts">
defineProps<{
  content: string
  timestamp?: string
}>()
</script>

<template>
  <div class="state-msg-row anim_in">
    <div class="state-msg-bubble">
      <i class="mdui-icon material-icons state-icon">info</i>
      <span class="state-msg-text">{{ content }}</span>
      <span v-if="timestamp" class="state-msg-time">{{ timestamp }}</span>
    </div>
  </div>
</template>

<style scoped>
.state-msg-row {
  display: flex;
  justify-content: center;
  padding: 6px 0;
}

.state-msg-bubble {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 12px;
  background: #cfd8dc;
  max-width: 80%;
}

.state-icon {
  font-size: 14px;
  color: #78909c;
  flex-shrink: 0;
}

.state-msg-text {
  font-size: 12px;
  color: #546e7a;
}

.state-msg-time {
  font-size: 11px;
  color: #90a4ae;
  margin-left: 4px;
  white-space: nowrap;
}

.anim_in {
  animation-duration: 200ms;
  animation-fill-mode: both;
  animation-name: fadeIn;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
