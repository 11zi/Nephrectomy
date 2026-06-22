export type UserId = string
export type RoomId = string
export type MessageId = string

export interface UserSummary {
  id: UserId
  nickname: string
  avatarUrl: string
  status?: string
}

export interface RoomSummary {
  id: RoomId
  name: string
  description?: string
  memberCount: number
  isActive: boolean
}

export type ChatMessageKind = 'user' | 'state' | 'command'

export interface ChatMessage {
  id: MessageId
  roomId: RoomId
  kind: ChatMessageKind
  sender: UserSummary
  content: string
  createdAt: string
  replyToId?: MessageId
  mentionedUserIds: UserId[]
  canRecall: boolean
}

export interface SendMessagePayload {
  roomId: RoomId
  senderId: UserId
  content: string
  replyToId?: MessageId
}

export interface SendMessageResult {
  message: ChatMessage
}

export interface FetchRoomMessagesQuery {
  roomId: RoomId
  beforeMessageId?: MessageId
  limit: number
}

export interface FetchRoomMessagesResult {
  room: RoomSummary
  messages: ChatMessage[]
  hasMore: boolean
}
