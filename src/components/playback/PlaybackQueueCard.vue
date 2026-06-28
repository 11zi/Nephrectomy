<script setup lang="ts">
import { computed } from 'vue'
import type { MediaItem } from '../../types/playbackTypes'
import { REMOVE_VOTE_THRESHOLD } from '../../types/playbackTypes'
import { formatDuration } from '../../utils/formatDuration'

const props = defineProps<{
  item: MediaItem
  index: number
  isCurrent: boolean
  currentUserId?: string
}>()

const emit = defineEmits<{
  voteRemove: [itemId: string]
}>()

const sourceLabel = computed(() => {
  if (props.item.source === 'youtube') return 'YouTube'
  return props.item.type === 'video' ? '直链视频' : '直链音频'
})

const hasVoted = computed(() => {
  return Boolean(props.currentUserId && props.item.removeVotes.includes(props.currentUserId))
})
</script>

<template>
  <article class="queue-card" :class="{ current: isCurrent }">
    <div class="queue-main">
      <div class="queue-title">
        <span class="queue-index">#{{ index + 1 }}</span>
        <span class="queue-name">{{ item.title }}</span>
      </div>
      <div class="queue-meta">
        {{ sourceLabel }} / {{ formatDuration(item.duration) }}
      </div>
      <div class="queue-meta">
        点播：{{ item.requestedBy }}
      </div>
    </div>

    <div class="queue-actions">
      <span v-if="isCurrent" class="queue-status">正在播放</span>
      <button
        class="mdui-btn mdui-btn-dense mdui-ripple vote-button"
        type="button"
        @click="emit('voteRemove', item.id)"
      >
        {{ hasVoted ? '取消切除' : '投票切除' }}
        {{ item.removeVotes.length }}/{{ REMOVE_VOTE_THRESHOLD }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.queue-card {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(84, 110, 122, 0.16);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.68);
  color: #263238;
}

.queue-card.current {
  border-color: rgba(69, 90, 100, 0.58);
  background: rgba(236, 239, 241, 0.92);
}

.queue-main {
  min-width: 0;
}

.queue-title {
  display: flex;
  gap: 6px;
  align-items: baseline;
  font-size: 14px;
  font-weight: 600;
}

.queue-index {
  color: #607d8b;
}

.queue-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #607d8b;
}

.queue-actions {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
}

.queue-status {
  font-size: 12px;
  color: #455a64;
  font-weight: 600;
}

.vote-button {
  color: #455a64;
  font-size: 12px;
}
</style>
