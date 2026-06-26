import { Message, type ISenderSummary } from '../models/Message'

/**
 * 在当前房间发布一条 kind: 'state' 的系统消息
 */
export async function postStateMessage(
  roomId: string,
  sender: ISenderSummary,
  content: string,
): Promise<void> {
  const messageId = `state-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  await Message.create({
    messageId,
    roomId,
    kind: 'state',
    sender,
    content,
    createdAt: new Date(),
    replyToId: null,
    mentionedUserIds: [],
    canRecall: false,
  })
}
