import { Router } from 'express'
import { Room } from '../models/Room'
import { User, ensureUserIdentityId } from '../models/User'
import { authOptional, authRequired } from '../auth/middleware'
import { postStateMessage } from '../auth/stateMessages'

const router = Router()
const DEFAULT_ROOM_ID = 'plaza'
const ROOM_LOAN_MIN_PAYMENT = 1
const USER_SUMMARY_SELECT = 'uid identityId nickname avatarUrl motto'

function normalizeCurrentRoom(roomId?: string | null): string {
  return roomId || DEFAULT_ROOM_ID
}

type RoomUserSummary = {
  uid: string
  identityId?: string
  nickname: string
  avatarUrl: string
  motto?: string
}

function userSummary(user: any): RoomUserSummary {
  return {
    uid: user.uid,
    identityId: user.identityId,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl || '',
    motto: user.motto ?? '',
  }
}

function roomMemberCount(room: any): number {
  return Array.isArray(room.memberIds) ? room.memberIds.length : 0
}

function roomSubscriberCount(room: any): number {
  return Array.isArray(room.subscriberIds) ? room.subscriberIds.length : 0
}

async function getOnlineCount(roomId: string): Promise<number> {
  return User.countDocuments({ currentRoom: roomId, isOnline: true })
}

async function serializeRoomDetail(room: any, owner?: any | null, viewerUserId?: string) {
  const memberIds = Array.isArray(room.memberIds) ? room.memberIds : []
  const subscriberIds = Array.isArray(room.subscriberIds) ? room.subscriberIds : []
  const [onlineCount, members, subscribers] = await Promise.all([
    getOnlineCount(room.roomId),
    memberIds.length > 0
      ? User.find({ uid: { $in: memberIds } }).select(USER_SUMMARY_SELECT).lean()
      : Promise.resolve([]),
    subscriberIds.length > 0
      ? User.find({ uid: { $in: subscriberIds } }).select(USER_SUMMARY_SELECT).lean()
      : Promise.resolve([]),
  ])

  return {
    id: room.roomId,
    name: room.name,
    description: room.description,
    memberCount: memberIds.length,
    onlineCount,
    subscriberCount: subscriberIds.length,
    heat: room.heat ?? 0,
    isActive: onlineCount > 0,
    parentId: room.parentId,
    cover: room.cover,
    colSpan: room.colSpan,
    rowSpan: room.rowSpan,
    ownerId: room.ownerId ?? null,
    ownerName: owner?.nickname ?? '',
    loanBalance: Math.max(0, Math.floor(room.loanBalance ?? 0)),
    downPayment: Math.max(0, Math.floor(room.downPayment ?? 0)),
    isHidden: Boolean(room.isHidden),
    ownerOnly: Boolean(room.ownerOnly),
    demolishedAt: room.demolishedAt ? new Date(room.demolishedAt).toISOString() : null,
    isSubscribed: Boolean(viewerUserId && subscriberIds.includes(viewerUserId)),
    isMember: Boolean(viewerUserId && memberIds.includes(viewerUserId)),
    members: members.map(userSummary),
    subscribers: subscribers.map(userSummary),
  }
}

function canAccessRoom(room: any, userId?: string): boolean {
  if (!room.isHidden && !room.ownerOnly) return true
  return Boolean(userId && room.ownerId === userId)
}

function parseAmount(value: unknown): number | null {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < ROOM_LOAN_MIN_PAYMENT) return null
  return Math.floor(amount)
}

/** 将扁平房间列表组装为树 */
function buildRoomTree(
  rooms: InstanceType<typeof Room>[],
  onlineCounts: Map<string, number>,
  viewerUserId?: string,
) {
  const map = new Map<string, any>()
  const roots: any[] = []

  for (const r of rooms) {
    map.set(r.roomId, {
      id: r.roomId,
      name: r.name,
      description: r.description,
      ownerId: r.ownerId ?? null,
      loanBalance: r.loanBalance ?? 0,
      downPayment: r.downPayment ?? 0,
      isHidden: Boolean(r.isHidden),
      ownerOnly: Boolean(r.ownerOnly),
      demolishedAt: r.demolishedAt ? new Date(r.demolishedAt).toISOString() : null,
      memberCount: roomMemberCount(r),
      subscriberCount: roomSubscriberCount(r),
      onlineCount: onlineCounts.get(r.roomId) ?? 0,
      isSubscribed: Boolean(viewerUserId && Array.isArray(r.subscriberIds) && r.subscriberIds.includes(viewerUserId)),
      isMember: Boolean(viewerUserId && Array.isArray(r.memberIds) && r.memberIds.includes(viewerUserId)),
      isActive: (onlineCounts.get(r.roomId) ?? 0) > 0,
      parentId: r.parentId,
      cover: r.cover,
      colSpan: r.colSpan,
      rowSpan: r.rowSpan,
      children: [],
    })
  }

  for (const r of rooms) {
    const node = map.get(r.roomId)
    if (r.parentId && map.has(r.parentId)) {
      map.get(r.parentId).children.push(node)
    } else if (!r.parentId) {
      roots.push(node)
    }
  }

  return roots
}

// GET /api/rooms
router.get('/', authOptional, async (req, res) => {
  try {
    const docs = await Room.find({
      $or: [
        { isHidden: { $ne: true } },
        { ownerId: req.userId ?? null },
      ],
    }).lean()
    if (docs.length === 0) {
      return res.json([])
    }
    const onlineRows = await User.aggregate([
      { $match: { isOnline: true, currentRoom: { $in: docs.map(room => room.roomId) } } },
      { $group: { _id: '$currentRoom', count: { $sum: 1 } } },
    ])
    const onlineCounts = new Map<string, number>(
      onlineRows.map(row => [String(row._id), Number(row.count)]),
    )
    const tree = buildRoomTree(docs as any, onlineCounts, req.userId)
    res.json(tree)
  } catch (err) {
    res.status(500).json({ error: '获取房间列表失败' })
  }
})

// GET /api/rooms/:roomId
router.get('/:roomId', authRequired, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: String(req.params.roomId) }).lean()
    if (!room) return res.status(404).json({ error: '房间不存在' })
    if (!canAccessRoom(room, req.userId)) return res.status(404).json({ error: '房间不存在' })

    const owner = room.ownerId
      ? await User.findOne({ uid: room.ownerId }).select('uid nickname').lean()
      : null

    res.json(await serializeRoomDetail(room, owner, req.userId))
  } catch (err) {
    res.status(500).json({ error: '获取房间信息失败' })
  }
})

// POST /api/rooms/:roomId/repay
router.post('/:roomId/repay', authRequired, async (req, res) => {
  try {
    const amount = parseAmount(req.body?.amount)
    if (!amount) return res.status(400).json({ error: '还款金额需要是正整数' })

    const [room, user] = await Promise.all([
      Room.findOne({ roomId: String(req.params.roomId) }),
      User.findOne({ uid: req.userId }),
    ])
    if (!room) return res.status(404).json({ error: '房间不存在' })
    if (!user) return res.status(404).json({ error: '用户不存在' })
    if (room.ownerId !== user.uid) return res.status(403).json({ error: '只能偿还自己房间的贷款' })
    if ((room.loanBalance ?? 0) <= 0) return res.status(400).json({ error: '这个房间没有待还贷款' })
    if ((user.money ?? 0) < amount) return res.status(400).json({ error: '余额不足' })

    const payment = Math.min(amount, Math.floor(room.loanBalance ?? 0))
    user.money = Math.floor((user.money ?? 0) - payment)
    room.loanBalance = Math.floor((room.loanBalance ?? 0) - payment)

    await Promise.all([
      User.updateOne({ uid: user.uid }, { $set: { money: user.money } }),
      Room.updateOne({ roomId: room.roomId }, { $set: { loanBalance: room.loanBalance } }),
    ])

    res.json(await serializeRoomDetail(room, user, user.uid))
  } catch (err) {
    res.status(500).json({ error: '还款失败' })
  }
})

// POST /api/rooms/:roomId/demolish
router.post('/:roomId/demolish', authRequired, async (req, res) => {
  try {
    const [room, user] = await Promise.all([
      Room.findOne({ roomId: String(req.params.roomId) }),
      User.findOne({ uid: req.userId }).lean(),
    ])

    if (!room) return res.status(404).json({ error: '房间不存在' })
    if (!user) return res.status(404).json({ error: '用户不存在' })
    if (!room.ownerId) return res.status(400).json({ error: '公共房间不能拆除' })
    if (room.ownerId !== user.uid) return res.status(403).json({ error: '只能拆除自己的房间' })

    room.loanBalance = 0
    room.isHidden = true
    room.ownerOnly = true
    room.demolishedAt = new Date()
    await room.save()

    res.json(await serializeRoomDetail(room, user, user.uid))
  } catch (err) {
    res.status(500).json({ error: '拆除房间失败' })
  }
})

// POST /api/rooms/:roomId/reopen
router.post('/:roomId/reopen', authRequired, async (req, res) => {
  try {
    const [room, user] = await Promise.all([
      Room.findOne({ roomId: String(req.params.roomId) }),
      User.findOne({ uid: req.userId }).lean(),
    ])

    if (!room) return res.status(404).json({ error: '房间不存在' })
    if (!user) return res.status(404).json({ error: '用户不存在' })
    if (room.ownerId !== user.uid) return res.status(403).json({ error: '只能恢复自己的房间' })

    room.isHidden = false
    room.ownerOnly = false
    room.demolishedAt = null
    await room.save()

    res.json(await serializeRoomDetail(room, user, user.uid))
  } catch (err) {
    res.status(500).json({ error: '恢复房间失败' })
  }
})

// POST /api/rooms/:roomId/subscribe
router.post('/:roomId/subscribe', authRequired, async (req, res) => {
  try {
    const [room, user] = await Promise.all([
      Room.findOne({ roomId: String(req.params.roomId) }),
      User.findOne({ uid: req.userId }).lean(),
    ])
    if (!room) return res.status(404).json({ error: '房间不存在' })
    if (!user) return res.status(404).json({ error: '用户不存在' })
    if (!canAccessRoom(room, user.uid)) return res.status(404).json({ error: '房间不存在' })

    const subscriberIds = new Set(Array.isArray(room.subscriberIds) ? room.subscriberIds : [])
    subscriberIds.add(user.uid)
    room.subscriberIds = Array.from(subscriberIds)
    await room.save()

    const owner = room.ownerId
      ? await User.findOne({ uid: room.ownerId }).select('uid nickname').lean()
      : null
    res.json(await serializeRoomDetail(room, owner, user.uid))
  } catch (err) {
    res.status(500).json({ error: '订阅房间失败' })
  }
})

// DELETE /api/rooms/:roomId/subscribe
router.delete('/:roomId/subscribe', authRequired, async (req, res) => {
  try {
    const [room, user] = await Promise.all([
      Room.findOne({ roomId: String(req.params.roomId) }),
      User.findOne({ uid: req.userId }).lean(),
    ])
    if (!room) return res.status(404).json({ error: '房间不存在' })
    if (!user) return res.status(404).json({ error: '用户不存在' })
    if (!canAccessRoom(room, user.uid)) return res.status(404).json({ error: '房间不存在' })

    room.subscriberIds = (Array.isArray(room.subscriberIds) ? room.subscriberIds : [])
      .filter(uid => uid !== user.uid)
    await room.save()

    const owner = room.ownerId
      ? await User.findOne({ uid: room.ownerId }).select('uid nickname').lean()
      : null
    res.json(await serializeRoomDetail(room, owner, user.uid))
  } catch (err) {
    res.status(500).json({ error: '取消订阅失败' })
  }
})

// POST /api/rooms/:roomId/members
router.post('/:roomId/members', authRequired, async (req, res) => {
  try {
    const targetUserId = typeof req.body?.userId === 'string' ? req.body.userId : ''
    const [room, owner, targetUser] = await Promise.all([
      Room.findOne({ roomId: String(req.params.roomId) }),
      User.findOne({ uid: req.userId }).lean(),
      targetUserId ? User.findOne({ uid: targetUserId }).lean() : null,
    ])

    if (!room) return res.status(404).json({ error: '房间不存在' })
    if (!owner) return res.status(404).json({ error: '用户不存在' })
    if (room.ownerId !== owner.uid) return res.status(403).json({ error: '只有房主可以添加成员' })
    if (!targetUser) return res.status(404).json({ error: '订阅用户不存在' })

    const subscriberIds = Array.isArray(room.subscriberIds) ? room.subscriberIds : []
    if (!subscriberIds.includes(targetUser.uid)) {
      return res.status(400).json({ error: '只能添加已订阅房间的用户' })
    }

    const memberIds = new Set(Array.isArray(room.memberIds) ? room.memberIds : [])
    memberIds.add(targetUser.uid)
    room.memberIds = Array.from(memberIds)
    room.memberCount = room.memberIds.length
    await room.save()

    res.json(await serializeRoomDetail(room, owner, owner.uid))
  } catch (err) {
    res.status(500).json({ error: '添加房间成员失败' })
  }
})

// POST /api/rooms/:roomId/enter
router.post('/:roomId/enter', authRequired, async (req, res) => {
  try {
    const targetRoomId = String(req.params.roomId)
    const room = await Room.findOne({ roomId: targetRoomId }).lean()
    if (!room) return res.status(404).json({ error: '房间不存在' })

    // 获取当前用户
    const user = await User.findOne({ uid: req.userId })
    if (!user) return res.status(404).json({ error: '用户不存在' })
    await ensureUserIdentityId(user)
    if (!canAccessRoom(room, user.uid)) {
      return res.status(403).json({ error: '这个房间暂时只允许房主进入' })
    }

    const prevRoom = normalizeCurrentRoom(user.currentRoom)
    const isImplicit = req.body?.implicit === true
    const isSameRoom = prevRoom === targetRoomId
    const prevRoomDoc = !isSameRoom
      ? await Room.findOne({ roomId: prevRoom }).lean()
      : null

    // 更新用户当前房间
    if (user.currentRoom !== targetRoomId) {
      user.currentRoom = targetRoomId
      await user.save()
    }

    // 发状态消息：进入新房间
    const sender = {
      id: user.uid,
      identityId: user.identityId,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl || '',
      motto: user.motto ?? '',
    }

    if (!isImplicit && !isSameRoom) {
      await postStateMessage(prevRoom, sender, `${user.nickname} 离开了 ${prevRoomDoc?.name ?? '房间'}`)
      await postStateMessage(targetRoomId, sender, `${user.nickname} 来到了 ${room.name}`)
    }

    const onlineCount = await getOnlineCount(room.roomId)
    res.json({
      id: room.roomId,
      name: room.name,
      description: room.description,
      memberCount: roomMemberCount(room),
      onlineCount,
      subscriberCount: roomSubscriberCount(room),
      isSubscribed: Array.isArray(room.subscriberIds) && room.subscriberIds.includes(user.uid),
      isMember: Array.isArray(room.memberIds) && room.memberIds.includes(user.uid),
      isActive: onlineCount > 0,
    })
  } catch (err) {
    res.status(500).json({ error: '进入房间失败' })
  }
})

export default router
