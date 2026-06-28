<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import PlaybackInputBar from './PlaybackInputBar.vue'
import PlaybackQueueCard from './PlaybackQueueCard.vue'
import { usePlaybackStore } from '../../stores/usePlaybackStore'
import { useRoomStore } from '../../stores/useRoomStore'
import { useUserStore } from '../../stores/useUserStore'
import { useSnackbar } from '../../composables/useSnackbar'

const playbackStore = usePlaybackStore()
const roomStore = useRoomStore()
const userStore = useUserStore()
const snackbar = useSnackbar()
const inputBarRef = ref<InstanceType<typeof PlaybackInputBar> | null>(null)

async function submitUrl(url: string) {
  if (!url.trim()) {
    snackbar.show('请输入点播链接')
    return
  }

  try {
    await playbackStore.submitUrl(url)
    inputBarRef.value?.clear()
    snackbar.success('已加入点播队列')
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : '网络错误，请稍后再试')
  }
}

async function voteRemove(itemId: string) {
  try {
    const result = await playbackStore.voteRemove(itemId)
    if (!result) return
    if (result.itemRemoved) {
      snackbar.show('该媒体已被投票切除')
    } else {
      snackbar.show(result.voteAdded ? '已投票切除' : '已取消切除投票')
    }
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : '网络错误，请稍后再试')
  }
}

onMounted(() => {
  playbackStore.startListening()
  playbackStore.fetchPlaybackState().catch(() => {
    snackbar.error('点播状态加载失败')
  })
})

onBeforeUnmount(() => {
  playbackStore.stopListening()
})

watch(
  () => roomStore.activeRoomId,
  () => {
    playbackStore.fetchPlaybackState().catch(() => {
      snackbar.error('点播状态加载失败')
    })
  },
)
</script>

<template>
  <section class="playback-panel">
    <div class="queue-header">
      <div>
        <div class="queue-heading">点播队列</div>
        <div class="queue-subtitle">{{ roomStore.activeRoomId }}</div>
      </div>
      <span class="queue-count">{{ playbackStore.queue.length }}</span>
    </div>

    <div class="queue-list">
      <div v-if="playbackStore.loading" class="queue-empty">加载中...</div>
      <div v-else-if="playbackStore.queue.length === 0" class="queue-empty">暂无点播</div>
      <template v-else>
        <PlaybackQueueCard
          v-for="(item, index) in playbackStore.queue"
          :key="item.id"
          :item="item"
          :index="index"
          :is-current="item.id === playbackStore.currentItemId"
          :current-user-id="userStore.currentUser?.id"
          @vote-remove="voteRemove"
        />
      </template>
    </div>

    <PlaybackInputBar
      ref="inputBarRef"
      :submitting="playbackStore.submitting"
      @submit="submitUrl"
    />
  </section>
</template>

<style scoped>
.playback-panel {
  width: 420px;
  max-width: calc(100vw - 40px);
  color: #263238;
}

.queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
}

.queue-heading {
  font-size: 16px;
  font-weight: 600;
}

.queue-subtitle {
  margin-top: 2px;
  font-size: 12px;
  color: var(--app-text-muted);
}

.queue-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  border-radius: 13px;
  background: var(--app-accent-soft);
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-soft);
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 120px;
  max-height: 300px;
  overflow-y: auto;
  padding: 0 12px 12px;
}

.queue-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 104px;
  border: 1px dashed rgba(84, 110, 122, 0.28);
  border-radius: 6px;
  background: rgba(247, 250, 251, 0.48);
  color: var(--app-text-muted);
  font-size: 13px;
}
</style>
