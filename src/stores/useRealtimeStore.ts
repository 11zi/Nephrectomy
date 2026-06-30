import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { io, type Socket } from 'socket.io-client'
import type { MessageCreatedEvent, MessageDeletedEvent, RoomId } from '../types/chatTypes'
import type { SysMsgSnackBarInstance } from '../components/SysMsgSnackBar.vue'
import type { PlaybackSocketEvent } from '../types/playbackTypes'
import { useChatStore } from './useChatStore'
import { useUserStore } from './useUserStore'
import { useSnackbar } from '../composables/useSnackbar'
import { PLAYBACK_STATE_EVENT } from './usePlaybackStore'

type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected'

function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

export const useRealtimeStore = defineStore('realtime', () => {
  const status = ref<RealtimeStatus>('idle')
  const lastError = ref('')
  const joinedRooms = ref<Set<RoomId>>(new Set())
  const isReceivingMessages = computed(() => status.value === 'connected')

  let socket: Socket | null = null
  let offlineSnack: SysMsgSnackBarInstance | null = null
  let offlineTimer: ReturnType<typeof setTimeout> | null = null
  let notificationAudioContext: AudioContext | null = null

  function playMentionSound(): void {
    if (typeof window === 'undefined') return
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return

    notificationAudioContext ??= new AudioContextCtor()
    const context = notificationAudioContext
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, now)
    oscillator.frequency.setValueAtTime(660, now + 0.09)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + 0.24)
  }

  function shouldNotifyMessage(event: MessageCreatedEvent): boolean {
    const currentUserId = useUserStore().currentUser?.id
    if (!currentUserId) return false
    if (event.message.sender.id === currentUserId) return false
    return event.message.mentionedUserIds.includes(currentUserId)
  }

  function clearOfflineTimer(): void {
    if (offlineTimer) {
      clearTimeout(offlineTimer)
      offlineTimer = null
    }
  }

  function closeOfflineSnack(): void {
    offlineSnack?.close()
    offlineSnack = null
  }

  function showOfflineSnack(): void {
    if (offlineSnack) return
    offlineSnack = useSnackbar().persistentError('消息接收中断，正在重连…')
  }

  function scheduleOfflineSnack(): void {
    clearOfflineTimer()
    offlineTimer = setTimeout(() => {
      if (status.value !== 'connected') {
        showOfflineSnack()
      }
    }, 1200)
  }

  function handleConnected(): void {
    const wasOffline = Boolean(offlineSnack)
    status.value = 'connected'
    lastError.value = ''
    clearOfflineTimer()
    closeOfflineSnack()

    for (const roomId of joinedRooms.value) {
      socket?.emit('room:join', roomId)
    }

    if (wasOffline) {
      useSnackbar().success('消息接收已恢复')
    }
  }

  function handleDisconnected(reason: string): void {
    status.value = 'disconnected'
    lastError.value = reason
    scheduleOfflineSnack()
  }

  function connect(): void {
    const token = getToken()
    if (!token) return

    if (socket?.connected || status.value === 'connecting') return

    status.value = 'connecting'
    socket = io({
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
    })

    socket.on('connect', handleConnected)
    socket.on('disconnect', handleDisconnected)
    socket.on('connect_error', (err) => {
      status.value = 'disconnected'
      lastError.value = err.message
      scheduleOfflineSnack()
    })
    socket.on('message:created', (event: MessageCreatedEvent) => {
      if (event.scope === 'room') {
        useChatStore().appendMessage(event.message)
        if (shouldNotifyMessage(event)) {
          playMentionSound()
        }
      }
    })
    socket.on('message:deleted', (event: MessageDeletedEvent) => {
      if (event.scope === 'room') {
        useChatStore().removeMessage(event.roomId, event.messageId)
      }
    })
    socket.on('playback:state', (event: PlaybackSocketEvent) => {
      window.dispatchEvent(new CustomEvent(PLAYBACK_STATE_EVENT, { detail: event }))
    })
  }

  function disconnect(): void {
    clearOfflineTimer()
    closeOfflineSnack()
    socket?.removeAllListeners()
    socket?.disconnect()
    socket = null
    status.value = 'idle'
    lastError.value = ''
    joinedRooms.value = new Set()
  }

  function joinRoom(roomId?: RoomId | null): void {
    if (!roomId) return
    joinedRooms.value.add(roomId)
    socket?.emit('room:join', roomId)
  }

  function leaveRoom(roomId?: RoomId | null): void {
    if (!roomId) return
    joinedRooms.value.delete(roomId)
    socket?.emit('room:leave', roomId)
  }

  return {
    status,
    lastError,
    isReceivingMessages,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
  }
})
