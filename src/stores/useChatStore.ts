import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  ChatMessage,
  FetchRoomMessagesQuery,
  FetchRoomMessagesResult,
  MessageId,
  RoomId,
  SendMessagePayload,
  SendMessageResult,
} from '../types/chatTypes'
import { useUserStore } from './useUserStore'
import { DEFAULT_ROOM_ID, useRoomStore } from './useRoomStore'
import { httpChatApi } from '../api/httpChatApi'

const INITIAL_ROOM_MESSAGE_LIMIT = 50

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

  function removeMessage(roomId: RoomId, messageId: MessageId): void {
    const roomMessages = messagesByRoom.value[roomId]
    if (!roomMessages) return
    messagesByRoom.value[roomId] = roomMessages.filter(message => message.id !== messageId)
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
    } finally {
      isLoadingMessages.value = false
    }
  }

  function fetchInitialRoomMessages(roomId: RoomId = roomStore.activeRoomId || DEFAULT_ROOM_ID) {
    return fetchRoomMessages({ roomId, limit: INITIAL_ROOM_MESSAGE_LIMIT })
  }

  /** 发送消息到当前活跃房间 */
  async function sendMessage(
    content: string,
    options: { replyToId?: MessageId | null; mentionedUserIds?: string[] } = {},
  ): Promise<SendMessageResult | null> {
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
      if (options.replyToId) payload.replyToId = options.replyToId
      if (options.mentionedUserIds?.length) {
        payload.mentionedUserIds = Array.from(new Set(options.mentionedUserIds))
      }

      const result = await httpChatApi.sendMessage(payload)
      appendMessage(result.message)
      return result
    } finally {
      isSendingMessage.value = false
    }
  }

  async function recallMessage(message: ChatMessage): Promise<boolean> {
    try {
      await httpChatApi.recallMessage(message.roomId, message.id)
      removeMessage(message.roomId, message.id)
      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error('撤回失败')
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
    removeMessage,
    fetchInitialRoomMessages,
    fetchRoomMessages,
    recallMessage,
    sendMessage,
  }
})
