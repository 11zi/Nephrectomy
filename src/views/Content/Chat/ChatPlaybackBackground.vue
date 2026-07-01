<script setup lang="ts">
import MediaPlayer from '../../../components/playback/MediaPlayer.vue'
import type { MediaItem, PlaybackStatus } from '../../../types/playbackTypes'

defineProps<{
  item: MediaItem | null
  status: PlaybackStatus
  getTargetTime: () => number
}>()

defineEmits<{
  ended: [itemId: string]
}>()
</script>

<template>
  <div v-if="item" class="chat-playback-background">
    <MediaPlayer
      background
      :item="item"
      :status="status"
      :get-target-time="getTargetTime"
      @ended="$emit('ended', $event)"
    />
  </div>
</template>

<style scoped>
.chat-playback-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.82;
}

.chat-playback-background :deep(audio) {
  pointer-events: auto;
}
</style>
