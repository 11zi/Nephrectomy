import { Router } from 'express'
import { Message } from '../models/Message'
import { Room } from '../models/Room'
import { User } from '../models/User'
import { authRequired } from '../auth/middleware'
import { emitRoomMessageCreated, serializeMessage } from '../realtime'

const router = Router()
const DEFAULT_MESSAGE_PAGE_SIZE = 50
const MAX_MESSAGE_PAGE_SIZE = 100

function normalizeMessageLimit(value: unknown): number {
  const limit = Number(value)
  if (!Number.isFinite(limit) || limit <= 0) return DEFAULT_MESSAGE_PAGE_SIZE
  return Math.min(Math.floor(limit), MAX_MESSAGE_PAGE_SIZE)
}

function serializeRoomMessage(message: any) {
  return {
    id: message.messageId,
    roomId: message.roomId,
    kind: message.kind,
    sender: message.sender,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    replyToId: message.replyToId,
    mentionedUserIds: message.mentionedUserIds,
    canRecall: message.canRecall,
  }
}

// GET /api/rooms/:roomId/messages
router.get('/:roomId/messages', async (req, res) => {
  try {
    const roomId = String(req.params.roomId)
    const beforeMessageId = req.query.beforeMessageId as string | undefined
    const limit = normalizeMessageLimit(req.query.limit)

    const room = await Room.findOne({ roomId }).lean()
    if (!room) return res.status(404).json({ error: '房间不存在' })

    const filter: any = { roomId }
    if (beforeMessageId) {
      const anchor = await Message.findOne({ roomId, messageId: beforeMessageId })
        .select({ createdAt: 1, _id: 1 })
        .lean()
      if (!anchor) return res.status(400).json({ error: '分页游标不存在' })

      filter.$or = [
        { createdAt: { $lt: anchor.createdAt } },
        { createdAt: anchor.createdAt, _id: { $lt: anchor._id } },
      ]
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean()

    const hasMore = messages.length > limit
    const pageMessages = hasMore ? messages.slice(0, limit) : messages
    const orderedMessages = pageMessages.reverse().map(serializeRoomMessage)
    const oldestMessage = orderedMessages[0]

    res.json({
      room: {
        id: room.roomId,
        name: room.name,
        description: room.description,
        memberCount: room.memberCount,
        isActive: room.isActive,
      },
      messages: orderedMessages,
      hasMore,
      page: {
        limit,
        hasMore,
        nextBeforeMessageId: hasMore && oldestMessage ? oldestMessage.id : null,
      },
    })
  } catch (err) {
    res.status(500).json({ error: '获取消息失败' })
  }
})

// POST /api/rooms/:roomId/messages
router.post('/:roomId/messages', authRequired, async (req, res) => {
  try {
    const roomId = String(req.params.roomId)
    const { content, replyToId } = req.body

    if (!content?.trim()) {
      return res.status(400).json({ error: '消息不能为空' })
    }

    const room = await Room.findOne({ roomId }).lean()
    if (!room) return res.status(404).json({ error: '房间不存在' })

    // 从认证 token 获取当前用户信息作为 sender
    const user = await User.findOne({ uid: req.userId }).lean()
    if (!user) return res.status(404).json({ error: '用户不存在' })

    const sender = {
      id: user.uid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl || '',
      motto: user.motto ?? '',
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const doc = await Message.create({
      messageId,
      roomId,
      kind: 'user',
      sender,
      content: content.trim(),
      createdAt: new Date(),
      replyToId: replyToId || null,
      mentionedUserIds: [],
      canRecall: true,
    })

    const message = serializeMessage(doc)
    emitRoomMessageCreated(doc)

    res.status(201).json({
      message,
    })
  } catch (err) {
    res.status(500).json({ error: '发送消息失败' })
  }
})

export default router
