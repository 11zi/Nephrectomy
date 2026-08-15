import { Router } from 'express'
import { Message } from '../models/Message'
import { Room } from '../models/Room'
import { User, ensureUserIdentityId } from '../models/User'
import { authOptional, authRequired } from '../auth/middleware'
import { emitRoomMessageCreated, emitRoomMessageDeleted, serializeMessage } from '../realtime'

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

function normalizeUserIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(
    value
      .map(item => typeof item === 'string' ? item.trim() : '')
      .filter(Boolean),
  ))
}

function isPrivilegedUser(user: any): boolean {
  const titles = Array.isArray(user?.titles) ? user.titles : []
  return Number(user?.accountStatus ?? 0) > 0
    || titles.some((title: string) => /管理员|房管|admin|moderator/i.test(title))
}

function canAccessRoom(room: any, userId?: string): boolean {
  if (!room.isHidden && !room.ownerOnly) return true
  return Boolean(userId && room.ownerId === userId)
}

function roomMemberCount(room: any): number {
  return Array.isArray(room.memberIds) ? room.memberIds.length : 0
}

async function getOnlineCount(roomId: string): Promise<number> {
  return User.countDocuments({ currentRoom: roomId, isOnline: true })
}

// GET /api/rooms/:roomId/messages
router.get('/:roomId/messages', authOptional, async (req, res) => {
  try {
    const roomId = String(req.params.roomId)
    const beforeMessageId = req.query.beforeMessageId as string | undefined
    const limit = normalizeMessageLimit(req.query.limit)

    const room = await Room.findOne({ roomId }).lean()
    if (!room) return res.status(404).json({ error: '房间不存在' })
    if (!canAccessRoom(room, req.userId)) {
      return res.status(403).json({ error: '这个房间暂时只允许房主进入' })
    }

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
    const onlineCount = await getOnlineCount(room.roomId)

    res.json({
      room: {
        id: room.roomId,
        name: room.name,
        description: room.description,
        memberCount: roomMemberCount(room),
        onlineCount,
        subscriberCount: Array.isArray(room.subscriberIds) ? room.subscriberIds.length : 0,
        isSubscribed: Boolean(req.userId && Array.isArray(room.subscriberIds) && room.subscriberIds.includes(req.userId)),
        isMember: Boolean(req.userId && Array.isArray(room.memberIds) && room.memberIds.includes(req.userId)),
        isActive: onlineCount > 0,
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
    await ensureUserIdentityId(user)
    if (!canAccessRoom(room, user.uid)) {
      return res.status(403).json({ error: '这个房间暂时只允许房主进入' })
    }

    const sender = {
      id: user.uid,
      identityId: user.identityId,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl || '',
      motto: user.motto ?? '',
    }

    let normalizedReplyToId: string | null = null
    const mentionedUserIds = normalizeUserIds(req.body.mentionedUserIds)

    if (replyToId) {
      const replyMessage = await Message.findOne({ roomId, messageId: String(replyToId) }).lean()
      if (!replyMessage) return res.status(400).json({ error: '引用消息不存在' })
      normalizedReplyToId = replyMessage.messageId
      if (replyMessage.sender?.id && replyMessage.sender.id !== user.uid) {
        mentionedUserIds.push(replyMessage.sender.id)
      }
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const doc = await Message.create({
      messageId,
      roomId,
      kind: 'user',
      sender,
      content: content.trim(),
      createdAt: new Date(),
      replyToId: normalizedReplyToId,
      mentionedUserIds: Array.from(new Set(mentionedUserIds)).filter(uid => uid !== user.uid),
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

// DELETE /api/rooms/:roomId/messages/:messageId
router.delete('/:roomId/messages/:messageId', authRequired, async (req, res) => {
  try {
    const roomId = String(req.params.roomId)
    const messageId = String(req.params.messageId)

    const [message, user] = await Promise.all([
      Message.findOne({ roomId, messageId }),
      User.findOne({ uid: req.userId }).lean(),
    ])

    if (!message) return res.status(404).json({ error: '消息不存在' })
    if (!user) return res.status(404).json({ error: '用户不存在' })

    const isOwner = message.sender.id === user.uid
    const isRecent = Date.now() - message.createdAt.getTime() <= 2 * 60 * 1000
    const canRecall = isPrivilegedUser(user) || (isOwner && isRecent)

    if (!canRecall) {
      return res.status(403).json({ error: '只能撤回自己 2 分钟内发出的消息' })
    }

    await message.deleteOne()
    emitRoomMessageDeleted(roomId, messageId)
    res.json({ success: true, messageId })
  } catch (err) {
    res.status(500).json({ error: '撤回消息失败' })
  }
})

export default router
