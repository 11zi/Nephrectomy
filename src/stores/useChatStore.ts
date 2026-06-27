import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  ChatMessage,
  FetchRoomMessagesQuery,
  FetchRoomMessagesResult,
  RoomId,
  SendMessagePayload,
  SendMessageResult,
} from '../types/chatTypes'
import { useUserStore } from './useUserStore'
import { DEFAULT_ROOM_ID, useRoomStore } from './useRoomStore'
import { httpChatApi } from '../api/httpChatApi'

const INITIAL_ROOM_MESSAGE_LIMIT = 50

function createLocalMessageId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createMessage(
  id: string,
  roomId: string,
  content: string,
  sender: { id: string; nickname: string; avatarUrl: string; motto?: string },
  createdAt = new Date().toISOString(),
): ChatMessage {
  return {
    id,
    roomId,
    kind: 'user',
    sender,
    content,
    createdAt,
    mentionedUserIds: [],
    canRecall: true,
  }
}

function findRoomNode(
  nodes: import('../types/chatTypes').RoomNode[],
  id: RoomId,
): import('../types/chatTypes').RoomNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children.length > 0) {
      const found = findRoomNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

export const useChatStore = defineStore('chat', () => {
  const userStore = useUserStore()
  const roomStore = useRoomStore()

  const messagesByRoom = ref<Record<RoomId, ChatMessage[]>>({})
  const messagePaginationByRoom = ref<Record<RoomId, {
    hasMore: boolean
    nextBeforeMessageId: string | null
  }>>({})

  const isLoadingMessages = ref(false)
  const isSendingMessage = ref(false)
  const isInitialized = ref(false)

  /** 当前活跃房间的摘要信息 */
  const activeRoom = computed(() => {
    const rid = roomStore.activeRoomId
    const found = findRoomNode(roomStore.rooms, rid)
    return found
      ? {
          id: found.id,
          name: found.name,
          description: found.description,
          memberCount: found.memberCount,
          isActive: found.isActive,
        }
      : { id: rid, name: rid, description: '', memberCount: 0, isActive: false }
  })

  const messages = computed<ChatMessage[]>(() => {
    const rid = roomStore.activeRoomId
    return messagesByRoom.value[rid] ?? []
  })

  const activeRoomMessages = computed(() => messages.value)

  function appendMessage(message: ChatMessage): void {
    if (!messagesByRoom.value[message.roomId]) {
      messagesByRoom.value[message.roomId] = []
    }

    const exists = messagesByRoom.value[message.roomId].some(item => item.id === message.id)
    if (!exists) {
      messagesByRoom.value[message.roomId].push(message)
    }
  }

  /** 获取房间历史消息 */
  async function fetchRoomMessages(
    query: FetchRoomMessagesQuery = {
      roomId: roomStore.activeRoomId || DEFAULT_ROOM_ID,
      limit: INITIAL_ROOM_MESSAGE_LIMIT,
    },
  ): Promise<FetchRoomMessagesResult> {
    isLoadingMessages.value = true
    try {
      const result = await httpChatApi.fetchRoomMessages(query)
      if (query.beforeMessageId) {
        const existing = messagesByRoom.value[query.roomId] ?? []
        const existingIds = new Set(existing.map(message => message.id))
        const olderMessages = result.messages.filter(message => !existingIds.has(message.id))
        messagesByRoom.value[query.roomId] = [...olderMessages, ...existing]
      } else {
        messagesByRoom.value[query.roomId] = result.messages
      }
      messagePaginationByRoom.value[query.roomId] = {
        hasMore: result.page?.hasMore ?? result.hasMore,
        nextBeforeMessageId: result.page?.nextBeforeMessageId ?? result.messages[0]?.id ?? null,
      }
      return result
    } catch {
      // API 不可用，降级到本地数据
      const roomMessages = (messagesByRoom.value[query.roomId] ?? []).slice(-query.limit)
      const room = findRoomNode(roomStore.rooms, query.roomId)
      messagePaginationByRoom.value[query.roomId] = {
        hasMore: false,
        nextBeforeMessageId: roomMessages[0]?.id ?? null,
      }
      return {
        room: room
          ? {
              id: room.id,
              name: room.name,
              description: room.description,
              memberCount: room.memberCount,
              isActive: room.isActive,
            }
          : { id: query.roomId, name: query.roomId, description: '', memberCount: 0, isActive: false },
        messages: roomMessages,
        hasMore: false,
      }
    } finally {
      isLoadingMessages.value = false
    }
  }

  function fetchInitialRoomMessages(roomId: RoomId = roomStore.activeRoomId || DEFAULT_ROOM_ID) {
    return fetchRoomMessages({ roomId, limit: INITIAL_ROOM_MESSAGE_LIMIT })
  }

  /** 发送消息到当前活跃房间 */
  async function sendMessage(content: string): Promise<SendMessageResult | null> {
    const trimmedContent = content.trim()
    if (!trimmedContent) return null

    // 未登录用户不能发送消息
    if (!userStore.isAuthenticated || !userStore.currentUser) return null

    isSendingMessage.value = true
    try {
      const roomId = roomStore.activeRoomId || DEFAULT_ROOM_ID

      const payload: SendMessagePayload = {
        roomId,
        content: trimmedContent,
      }

      try {
        const result = await httpChatApi.sendMessage(payload)
        appendMessage(result.message)
        return result
      } catch {
        // API 不可用，本地模拟
        const message = createMessage(
          createLocalMessageId(),
          payload.roomId,
          payload.content,
          userStore.currentUser,
        )
        appendMessage(message)
        return { message }
      }
    } finally {
      isSendingMessage.value = false
    }
  }

  return {
    activeRoom,
    activeRoomMessages,
    isLoadingMessages,
    isSendingMessage,
    isInitialized,
    messagePaginationByRoom,
    messages,
    messagesByRoom,
    appendMessage,
    fetchInitialRoomMessages,
    fetchRoomMessages,
    sendMessage,
  }
})
