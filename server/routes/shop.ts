import { Router } from 'express'
import { authRequired } from '../auth/middleware'
import { Room } from '../models/Room'
import { User } from '../models/User'

const router = Router()
const ROOM_DOWN_PAYMENT = 300_000
const ROOM_LOAN = 700_000

function generateRoomId(userId: string): string {
  return `room-${userId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 16)}-${Date.now().toString(36)}`
}

function serializeShopRoom(room: any) {
  return {
    id: room.roomId,
    name: room.name,
    description: room.description,
    memberCount: room.memberCount,
    isActive: room.isActive,
    parentId: room.parentId,
    ownerId: room.ownerId,
    loanBalance: room.loanBalance,
    downPayment: room.downPayment,
  }
}

// POST /api/shop/rooms
router.post('/rooms', authRequired, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.userId })
    if (!user) return res.status(404).json({ error: '用户不存在' })
    if ((user.money ?? 0) < ROOM_DOWN_PAYMENT) {
      return res.status(400).json({ error: '余额不足，创建房间需要 30 万首付' })
    }

    const name = typeof req.body?.name === 'string' && req.body.name.trim()
      ? req.body.name.trim().slice(0, 24)
      : `${user.nickname}的房间`
    const description = typeof req.body?.description === 'string'
      ? req.body.description.trim().slice(0, 100)
      : ''

    const room = await Room.create({
      roomId: generateRoomId(user.uid),
      name,
      description: description || '新购入的私人房间',
      ownerId: user.uid,
      loanBalance: ROOM_LOAN,
      downPayment: ROOM_DOWN_PAYMENT,
      memberCount: 0,
      heat: 0,
      isActive: false,
      parentId: null,
      cover: '#607d8b',
      colSpan: 1,
      rowSpan: 1,
    })

    user.money = Math.floor((user.money ?? 0) - ROOM_DOWN_PAYMENT)
    await User.updateOne({ uid: user.uid }, { $set: { money: user.money } })

    res.status(201).json({
      room: serializeShopRoom(room),
      cash: user.money,
    })
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: '房间编号冲突，请重试' })
    }
    res.status(500).json({ error: '购买房间失败' })
  }
})

export default router
