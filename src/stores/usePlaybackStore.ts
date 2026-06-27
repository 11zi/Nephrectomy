import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { playbackApi } from '../api/playbackApi'
import { useRoomStore } from './useRoomStore'
import type { MediaItem, PlaybackSocketEvent, PlaybackStatePayload, PlaybackStatus } from '../types/playbackTypes'

export const PLAYBACK_STATE_EVENT = 'nephrectomy:playback-state'

export const usePlaybackStore = defineStore('playback', () => {
  const queue = ref<MediaItem[]>([])
  const currentItemId = ref<string | undefined>()
  const status = ref<PlaybackStatus>('idle')
  const startedAtServerTime = ref<number | undefined>()
  const offsetWhenStarted = ref<number | undefined>()
  const pausedAt = ref<number | undefined>()
  const updatedAt = ref(0)
  const serverNowOffset = ref(0)
  const loading = ref(false)
  const submitting = ref(false)

  const roomStore = useRoomStore()

  const currentItem = computed(() => {
    return queue.value.find(item => item.id === currentItemId.value) ?? null
  })

  function applyPlayback(playback: PlaybackStatePayload) {
    queue.value = playback.queue
    currentItemId.value = playback.currentItemId
    status.value = playback.status
    startedAtServerTime.value = playback.startedAtServerTime
    offsetWhenStarted.value = playback.offsetWhenStarted
    pausedAt.value = playback.pausedAt
    updatedAt.value = playback.updatedAt
    serverNowOffset.value = playback.serverNow - Date.now()
  }

  function getEstimatedCurrentTime(): number {
    if (status.value === 'paused') return pausedAt.value ?? 0
    if (status.value !== 'playing') return 0
    if (startedAtServerTime.value == null) return offsetWhenStarted.value ?? 0

    const serverNow = Date.now() + serverNowOffset.value
    return Math.max(0, (offsetWhenStarted.value ?? 0) + (serverNow - startedAtServerTime.value) / 1000)
  }

  async function fetchPlaybackState() {
    if (!roomStore.activeRoomId) return
    loading.value = true
    try {
      const playback = await playbackApi.getPlaybackState(roomStore.activeRoomId)
      applyPlayback(playback)
    } finally {
      loading.value = false
    }
  }

  async function submitUrl(url: string) {
    if (!roomStore.activeRoomId) return
    submitting.value = true
    try {
      const result = await playbackApi.submitPlaybackUrl(roomStore.activeRoomId, url)
      applyPlayback(result.playback)
    } finally {
      submitting.value = false
    }
  }

  async function voteRemove(itemId: string) {
    if (!roomStore.activeRoomId) return null
    const result = await playbackApi.voteRemovePlaybackItem(roomStore.activeRoomId, itemId)
    applyPlayback(result.playback)
    return result
  }

  async function notifyCurrentEnded(itemId: string) {
    if (!roomStore.activeRoomId) return
    const result = await playbackApi.notifyCurrentEnded(roomStore.activeRoomId, itemId)
    applyPlayback(result.playback)
  }

  function handleSocketEvent(event: Event) {
    const detail = (event as CustomEvent<PlaybackSocketEvent>).detail
    if (!detail?.playback) return
    if (detail.playback.roomId !== roomStore.activeRoomId) return
    applyPlayback(detail.playback)
  }

  function startListening() {
    window.removeEventListener(PLAYBACK_STATE_EVENT, handleSocketEvent)
    window.addEventListener(PLAYBACK_STATE_EVENT, handleSocketEvent)
  }

  function stopListening() {
    window.removeEventListener(PLAYBACK_STATE_EVENT, handleSocketEvent)
  }

  return {
    queue,
    currentItemId,
    currentItem,
    status,
    loading,
    submitting,
    applyPlayback,
    fetchPlaybackState,
    submitUrl,
    voteRemove,
    notifyCurrentEnded,
    getEstimatedCurrentTime,
    startListening,
    stopListening,
  }
})
