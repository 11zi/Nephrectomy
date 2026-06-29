<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useSettingsStore } from '../../stores/useSettingsStore'
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
  setVolume(volume: number): void
}

const props = defineProps<{
  item: MediaItem | null
  status: PlaybackStatus
  getTargetTime: () => number
  background?: boolean
}>()

const emit = defineEmits<{
  ended: [itemId: string]
}>()

const mediaEl = ref<HTMLVideoElement | HTMLAudioElement | null>(null)
const youtubeEl = ref<HTMLElement | null>(null)
const settingsStore = useSettingsStore()
let youtubePlayer: YoutubePlayer | null = null
let youtubeReadyPromise: Promise<void> | null = null

const playbackAllowed = computed(() => settingsStore.isPlaybackAllowed(props.item))
const playbackDisabledText = computed(() => settingsStore.getPlaybackDisabledText(props.item))

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

function syncDirectVolume() {
  if (mediaEl.value) {
    mediaEl.value.volume = settingsStore.normalizedVolume
  }
}

function syncYoutubeVolume() {
  youtubePlayer?.setVolume(settingsStore.masterVolume)
}

async function syncDirectMedia() {
  await nextTick()
  const el = mediaEl.value
  if (!el || !props.item) return

  const targetTime = props.getTargetTime()
  const applySync = () => {
    syncDirectVolume()
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
    height: '100%',
    videoId: props.item.youtubeVideoId,
    playerVars: {
      start: Math.floor(Math.max(0, targetTime)),
      playsinline: 1,
    },
    events: {
      onReady: () => {
        if (!youtubePlayer) return
        syncYoutubeVolume()
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
  if (!props.item || !playbackAllowed.value) {
    mediaEl.value?.pause()
    return
  }
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

watch(
  () => playbackAllowed.value,
  () => syncCurrentMedia(),
)

watch(
  () => settingsStore.masterVolume,
  () => {
    syncDirectVolume()
    syncYoutubeVolume()
  },
)

onBeforeUnmount(destroyYoutubePlayer)
</script>

<template>
  <div class="media-player" :class="{ 'background-player': background }">
    <div v-if="!item" class="empty-player">
      暂无正在播放
    </div>

    <div v-else-if="!playbackAllowed" class="empty-player disabled-player">
      {{ playbackDisabledText }}
    </div>

    <div v-else-if="item.youtubeVideoId" ref="youtubeEl" class="youtube-player"></div>

    <component
      v-else-if="directMediaTag"
      :is="directMediaTag"
      ref="mediaEl"
      class="direct-player"
      :src="item.directUrl"
      :controls="!background || item.type === 'music'"
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

.media-player.background-player {
  width: 100%;
  height: 100%;
  padding: 0;
  border-bottom: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.empty-player {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96px;
  color: #455a64;
  font-size: 13px;
}

.youtube-player {
  width: 100%;
  min-height: 180px;
}

.background-player .youtube-player {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.background-player .youtube-player :deep(iframe) {
  aspect-ratio: 16 / 9;
  width: 100%;
  height: auto;
  max-width: 100%;
  max-height: 100%;
}

.direct-player {
  width: 100%;
  max-height: 220px;
  display: block;
  background: #263238;
}

.background-player .direct-player {
  width: 100%;
  height: 100%;
  max-height: none;
  object-fit: contain;
  background: transparent;
}

.background-player audio.direct-player {
  width: min(560px, calc(100% - 32px));
  height: 54px;
  align-self: center;
  background: rgba(255, 255, 255, 0.76);
  border-radius: 6px;
}
</style>
