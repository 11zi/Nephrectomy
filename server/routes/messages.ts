import { Router } from 'express'
import { Message } from '../models/Message'
import { Room } from '../models/Room'
import { User } from '../models/User'
import { authRequired } from '../auth/middleware'
import { emitRoomMessageCreated, serializeMessage } from '../realtime'

const router = Router()

// GET /api/rooms/:roomId/messages
router.get('/:roomId/messages', async (req, res) => {
  try {
    const roomId = String(req.params.roomId)
    const beforeMessageId = req.query.beforeMessageId as string | undefined
    const limit = Math.min(Number(req.query.limit) || 50, 100)

    const room = await Room.findOne({ roomId }).lean()
    if (!room) return res.status(404).json({ error: '房间不存在' })

    const filter: any = { roomId }
    if (beforeMessageId) {
      const anchor = await Message.findOne({ messageId: beforeMessageId }).lean()
      if (anchor) {
        filter.createdAt = { $lt: anchor.createdAt }
      }
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    const total = await Message.countDocuments(filter)

    res.json({
      room: {
        id: room.roomId,
        name: room.name,
        description: room.description,
        memberCount: room.memberCount,
        isActive: room.isActive,
      },
      messages: messages
        .reverse()
        .map((m) => ({
          id: m.messageId,
          roomId: m.roomId,
          kind: m.kind,
          sender: m.sender,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          replyToId: m.replyToId,
          mentionedUserIds: m.mentionedUserIds,
          canRecall: m.canRecall,
        })),
      hasMore: messages.length >= limit && limit < total,
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
