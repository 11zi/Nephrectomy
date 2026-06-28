export type UserId = string
export type RoomId = string
export type MessageId = string

export interface UserSummary {
  id: UserId
  nickname: string
  avatarUrl: string
  motto?: string
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
  content: string
  replyToId?: MessageId
  mentionedUserIds?: UserId[]
}

export interface SendMessageResult {
  message: ChatMessage
}

export interface MessageCreatedEvent {
  scope: 'room' | 'private'
  roomId?: RoomId
  conversationId?: string
  message: ChatMessage
}

export interface MessageDeletedEvent {
  scope: 'room'
  roomId: RoomId
  messageId: MessageId
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
  page?: {
    limit: number
    hasMore: boolean
    nextBeforeMessageId: MessageId | null
  }
}

/** 房间树节点——用于房间列表的层级展示，继承核心 RoomSummary */
export interface RoomNode extends RoomSummary {
  parentId: RoomId | null
  children: RoomNode[]
  cover?: string
  colSpan?: number
  rowSpan?: number
}

// ── 用户资料（与 accountTypes.ts 的 AccountProfile 对应） ──

export interface SaveProfilePayload {
  userId: UserId
  profile: Record<string, unknown>
}

export interface SaveProfileResult {
  success: boolean
}

// ── 认证相关类型 ──

export interface AuthCredentials {
  email: string
  password: string
}

export interface RegisterPayload extends AuthCredentials {
  nickname: string
}

export interface AuthResult {
  token: string
  user: import('./accountTypes').AccountProfile
}

export interface HeartbeatResult {
  success: boolean
  income?: number
}
