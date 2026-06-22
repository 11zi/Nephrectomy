import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  ChatMessage,
  FetchRoomMessagesQuery,
  FetchRoomMessagesResult,
  RoomSummary,
  SendMessagePayload,
  SendMessageResult,
  UserSummary,
} from '../types/chatTypes'

const currentUser: UserSummary = {
  id: 'user-hamisky',
  nickname: '哈米斯基',
  avatarUrl: 'src/assets/static_image/r19.png',
  status: '凡是被那把武器伤害的人，都会遭到席卷全身的诅咒',
}

const defaultRoom: RoomSummary = {
  id: 'room-space-station',
  name: '空间站',
  description: '默认聊天室',
  memberCount: 1,
  isActive: true,
}

const initialMessages: ChatMessage[] = [
  createMessage('message-1', '你。。', '2026-06-14T02:00:00.000Z'),
  createMessage('message-2', '## 你说你不想在这里！', '2026-06-14T02:01:00.000Z'),
  createMessage('message-3', '# 我也不想在这里！', '2026-06-14T02:02:00.000Z'),
  createMessage('message-4', '### 但天黑', '2026-06-14T02:03:00.000Z'),
]

function createMessage(id: string, content: string, createdAt = new Date().toISOString()): ChatMessage {
  return {
    id,
    roomId: defaultRoom.id,
    kind: 'user',
    sender: currentUser,
    content,
    createdAt,
    mentionedUserIds: [],
    canRecall: true,
  }
}

function createLocalMessageId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useChatStore = defineStore('chat', () => {
  const activeRoom = ref<RoomSummary>(defaultRoom)
  const messages = ref<ChatMessage[]>(initialMessages)
  const isLoadingMessages = ref(false)
  const isSendingMessage = ref(false)

  const activeRoomMessages = computed(() =>
    messages.value.filter(message => message.roomId === activeRoom.value.id),
  )

  async function fetchRoomMessages(
    query: FetchRoomMessagesQuery = {
      roomId: activeRoom.value.id,
      limit: 50,
    },
  ): Promise<FetchRoomMessagesResult> {
    isLoadingMessages.value = true
    try {
      const roomMessages = messages.value
        .filter(message => message.roomId === query.roomId)
        .slice(-query.limit)

      return {
        room: activeRoom.value,
        messages: roomMessages,
        hasMore: false,
      }
    } finally {
      isLoadingMessages.value = false
    }
  }

  async function sendMessage(content: string): Promise<SendMessageResult | null> {
    const trimmedContent = content.trim()
    if (!trimmedContent) return null

    isSendingMessage.value = true
    try {
      const payload: SendMessagePayload = {
        roomId: activeRoom.value.id,
        senderId: currentUser.id,
        content: trimmedContent,
      }

      const message = createMessage(createLocalMessageId(), payload.content)
      messages.value.push(message)

      return { message }
    } finally {
      isSendingMessage.value = false
    }
  }

  return {
    activeRoom,
    activeRoomMessages,
    currentUser,
    fetchRoomMessages,
    isLoadingMessages,
    isSendingMessage,
    messages,
    sendMessage,
  }
})
