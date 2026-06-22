import type {
  FetchRoomMessagesQuery,
  FetchRoomMessagesResult,
  RoomId,
  RoomSummary,
  SendMessagePayload,
  SendMessageResult,
} from '../types/chatTypes'

export interface ChatApi {
  fetchRoomMessages(query: FetchRoomMessagesQuery): Promise<FetchRoomMessagesResult>
  sendMessage(payload: SendMessagePayload): Promise<SendMessageResult>
  enterRoom(roomId: RoomId): Promise<RoomSummary>
}
