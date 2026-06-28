import { Router } from 'express'
import { Room } from '../models/Room'
import { User } from '../models/User'
import { authRequired } from '../auth/middleware'
import { postStateMessage } from '../auth/stateMessages'

const router = Router()
const DEFAULT_ROOM_ID = 'plaza'

function normalizeCurrentRoom(roomId?: string | null): string {
  return roomId || DEFAULT_ROOM_ID
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
