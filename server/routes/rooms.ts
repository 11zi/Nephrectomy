import { Router } from 'express'
import { Room } from '../models/Room'
import { User } from '../models/User'
import { authRequired } from '../auth/middleware'
import { postStateMessage } from '../auth/stateMessages'

const router = Router()
const DEFAULT_ROOM_ID = 'plaza'
const ROOM_LOAN_MIN_PAYMENT = 1

function normalizeCurrentRoom(roomId?: string | null): string {
  return roomId || DEFAULT_ROOM_ID
}

function serializeRoomDetail(room: any, owner?: any | null) {
  return {
    id: room.roomId,
    name: room.name,
    description: room.description,
    memberCount: room.memberCount,
    heat: room.heat ?? 0,
    isActive: room.isActive,
    parentId: room.parentId,
    cover: room.cover,
    colSpan: room.colSpan,
    rowSpan: room.rowSpan,
    ownerId: room.ownerId ?? null,
    ownerName: owner?.nickname ?? '',
    loanBalance: Math.max(0, Math.floor(room.loanBalance ?? 0)),
    downPayment: Math.max(0, Math.floor(room.downPayment ?? 0)),
  }
}

function parseAmount(value: unknown): number | null {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < ROOM_LOAN_MIN_PAYMENT) return null
  return Math.floor(amount)
}

/** 将扁平房间列表组装为树 */
function buildRoomTree(rooms: InstanceType<typeof Room>[]) {
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
      memberCount: r.memberCount,
      isActive: r.isActive,
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
router.get('/', async (_req, res) => {
  try {
    const docs = await Room.find().lean()
    if (docs.length === 0) {
      return res.json([])
    }
    const tree = buildRoomTree(docs as any)
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

    const owner = room.ownerId
      ? await User.findOne({ uid: room.ownerId }).select('uid nickname').lean()
      : null

    res.json(serializeRoomDetail(room, owner))
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

    res.json(serializeRoomDetail(room, user))
  } catch (err) {
    res.status(500).json({ error: '还款失败' })
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
      nickname: user.nickname,
      avatarUrl: user.avatarUrl || '',
      motto: user.motto ?? '',
    }

    if (!isImplicit && !isSameRoom) {
      await postStateMessage(prevRoom, sender, `${user.nickname} 离开了 ${prevRoomDoc?.name ?? '房间'}`)
      await postStateMessage(targetRoomId, sender, `${user.nickname} 来到了 ${room.name}`)
    }

    res.json({
      id: room.roomId,
      name: room.name,
      description: room.description,
      memberCount: room.memberCount,
      isActive: room.isActive,
    })
  } catch (err) {
    res.status(500).json({ error: '进入房间失败' })
  }
})

export default router
