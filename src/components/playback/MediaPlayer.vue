<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { MediaItem, PlaybackStatus } from '../../types/playbackTypes'

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement, options: Record<string, unknown>) => YoutubePlayer
      PlayerState: { ENDED: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

interface YoutubePlayer {
  destroy(): void
  loadVideoById(options: { videoId: string; startSeconds?: number }): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  playVideo(): void
  pauseVideo(): void
}

const props = defineProps<{
  item: MediaItem | null
  status: PlaybackStatus
  getTargetTime: () => number
}>()

const emit = defineEmits<{
  ended: [itemId: string]
}>()

const mediaEl = ref<HTMLVideoElement | HTMLAudioElement | null>(null)
const youtubeEl = ref<HTMLElement | null>(null)
let youtubePlayer: YoutubePlayer | null = null
let youtubeReadyPromise: Promise<void> | null = null

const directMediaTag = computed(() => {
  if (!props.item?.directUrl) return null
  return props.item.type === 'video' ? 'video' : 'audio'
})

function ensureYoutubeApiReady(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve()
  if (youtubeReadyPromise) return youtubeReadyPromise

  youtubeReadyPromise = new Promise((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.()
      resolve()
    }

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
    }
  })

  return youtubeReadyPromise
}

function destroyYoutubePlayer() {
  youtubePlayer?.destroy()
  youtubePlayer = null
}

async function syncDirectMedia() {
  await nextTick()
  const el = mediaEl.value
  if (!el || !props.item) return

  const targetTime = props.getTargetTime()
  const applySync = () => {
    if (Number.isFinite(targetTime)) {
      el.currentTime = Math.max(0, targetTime)
    }
    if (props.status === 'playing') {
      el.play().catch(() => {})
    } else {
      el.pause()
    }
  }

  if (el.readyState >= 1) {
    applySync()
  } else {
    el.addEventListener('loadedmetadata', applySync, { once: true })
  }
}

async function syncYoutubeMedia() {
  await nextTick()
  if (!props.item?.youtubeVideoId || !youtubeEl.value) return
  await ensureYoutubeApiReady()

  destroyYoutubePlayer()
  const targetTime = props.getTargetTime()
  youtubePlayer = new window.YT!.Player(youtubeEl.value, {
    width: '100%',
    height: '180',
    videoId: props.item.youtubeVideoId,
    playerVars: {
      start: Math.floor(Math.max(0, targetTime)),
      playsinline: 1,
    },
    events: {
      onReady: () => {
        if (!youtubePlayer) return
        youtubePlayer.seekTo(Math.max(0, targetTime), true)
        if (props.status === 'playing') {
          youtubePlayer.playVideo()
        } else {
          youtubePlayer.pauseVideo()
        }
      },
      onStateChange: (event: { data: number }) => {
        if (event.data === window.YT?.PlayerState.ENDED && props.item) {
          emit('ended', props.item.id)
        }
      },
    },
  })
}

function syncCurrentMedia() {
  destroyYoutubePlayer()
  if (!props.item) return
  if (props.item.youtubeVideoId) {
    syncYoutubeMedia()
  } else if (props.item.directUrl) {
    syncDirectMedia()
  }
}

watch(
  () => props.item?.id,
  () => syncCurrentMedia(),
  { immediate: true },
)

onBeforeUnmount(destroyYoutubePlayer)
</script>

<template>
  <div class="media-player">
    <div v-if="!item" class="empty-player">
      暂无正在播放
    </div>

    <div v-else-if="item.youtubeVideoId" ref="youtubeEl" class="youtube-player"></div>

    <component
      v-else-if="directMediaTag"
      :is="directMediaTag"
      ref="mediaEl"
      class="direct-player"
      :src="item.directUrl"
      controls
      playsinline
      @ended="emit('ended', item.id)"
    />
  </div>
</template>

<style scoped>
.media-player {
  padding: 12px;
  background: rgba(255, 255, 255, 0.72);
  border-bottom: 1px solid rgba(84, 110, 122, 0.16);
}

.empty-player {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96px;
  color: #78909c;
  font-size: 13px;
}

.youtube-player {
  width: 100%;
  min-height: 180px;
}

.direct-player {
  width: 100%;
  max-height: 220px;
  display: block;
  background: #263238;
}
</style>
