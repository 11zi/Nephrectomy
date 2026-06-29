import type {
  AuthCredentials,
  AuthResult,
  FetchRoomMessagesQuery,
  FetchRoomMessagesResult,
  HeartbeatResult,
  BuyRoomPayload,
  BuyRoomResult,
  RoomDetail,
  RegisterPayload,
  RoomId,
  RoomNode,
  RoomSummary,
  SendMessagePayload,
  SendMessageResult,
  MessageId,
} from '../types/chatTypes'
import type { AccountProfile, PublicProfile } from '../types/accountTypes'
import type { BankStatus, BankTransferPayload, DiceResult } from '../types/bankTypes'
import type {
  StockAutoPayload,
  StockStatus,
  StockTradePayload,
  StockTradeResult,
} from '../types/stockTypes'

export interface ChatApi {
  /** 获取房间历史消息 */
  fetchRoomMessages(query: FetchRoomMessagesQuery): Promise<FetchRoomMessagesResult>
  /** 发送消息 */
  sendMessage(payload: SendMessagePayload): Promise<SendMessageResult>
  /** 撤回消息 */
  recallMessage(roomId: RoomId, messageId: MessageId): Promise<{ success: boolean; messageId: MessageId }>
  /** 进入房间 */
  enterRoom(roomId: RoomId, options?: { implicit?: boolean }): Promise<RoomSummary>
  /** 获取房间列表 */
  fetchRoomList(): Promise<RoomNode[]>
  /** 获取房间信息 */
  fetchRoomInfo(roomId: RoomId): Promise<RoomDetail>
  /** 偿还房间贷款 */
  repayRoomLoan(roomId: RoomId, amount: number): Promise<RoomDetail>
  /** 购买房间 */
  buyRoom(payload: BuyRoomPayload): Promise<BuyRoomResult>
  /** 获取当前用户资料 */
  fetchProfile(): Promise<AccountProfile>
  /** 获取公开用户资料 */
  fetchPublicProfile(userId: string): Promise<PublicProfile>
  /** 点赞用户资料 */
  likeProfile(userId: string): Promise<PublicProfile>
  /** 保存用户资料 */
  saveProfile(profile: AccountProfile): Promise<AccountProfile>
  /** 设置暂离/不在窗口状态 */
  setPresenceStatus(payload: { status: string; detail?: string; durationMinutes?: number }): Promise<AccountProfile>
  /** 结束暂离/不在窗口状态 */
  clearPresenceStatus(): Promise<AccountProfile>
  /** 登录 */
  login(credentials: AuthCredentials): Promise<AuthResult>
  /** 注册 */
  register(payload: RegisterPayload): Promise<AuthResult>
  /** 登出 */
  logout(): Promise<void>
  /** 获取当前登录用户信息（刷新时验证 token） */
  fetchMe(): Promise<AccountProfile>
  /** 心跳保活 */
  heartbeat(): Promise<HeartbeatResult>
  /** 获取银行状态 */
  fetchBankStatus(): Promise<BankStatus>
  /** 存入银行 */
  depositBank(payload: BankTransferPayload): Promise<BankStatus>
  /** 从银行提取 */
  withdrawBank(payload: BankTransferPayload): Promise<BankStatus>
  /** 骰子下注 */
  rollDice(payload: BankTransferPayload): Promise<DiceResult>
  /** 获取股票状态 */
  fetchStockStatus(): Promise<StockStatus>
  /** 买入股票 */
  buyStock(payload: StockTradePayload): Promise<StockTradeResult>
  /** 卖出股票 */
  sellStock(payload: StockTradePayload): Promise<StockTradeResult>
  /** 设置股票自动交易价格 */
  setStockAutoPrices(payload: StockAutoPayload): Promise<StockStatus>
}
