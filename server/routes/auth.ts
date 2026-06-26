import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../models/User'
import { signToken } from '../auth/jwt'
import { authRequired } from '../auth/middleware'
import { postStateMessage } from '../auth/stateMessages'
import type { ISenderSummary } from '../models/Message'
import { settlePassiveIncome } from '../bank/service'

const router = Router()
const DEFAULT_ROOM_ID = 'plaza'

function normalizeCurrentRoom(roomId?: string | null): string {
  return roomId || DEFAULT_ROOM_ID
}

/** 根据 User document 构建 sender 摘要（用于 state message） */
function senderFromUser(user: any): ISenderSummary {
  return {
    id: user.uid,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl || '',
    motto: user.motto ?? '',
  }
}

/** 将 User document 序列化为前端需要的 profile 结构 */
function serializeProfile(user: any) {
  return {
    uid: user.uid,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    motto: user.motto,
    gender: user.gender,
    birthday: user.birthday,
    age: user.age,
    address: user.address,
    email: user.email,
    website: user.website,
    community: user.community,
    accountStatus: user.accountStatus,
    currentRoom: normalizeCurrentRoom(user.currentRoom),
    lastOnline: user.lastOnline,
    onlineDuration: user.onlineDuration,
    registeredAt: user.registeredAt,
    hobbies: user.hobbies,
    titles: user.titles,
    friends: user.friends,
    following: user.following,
    followers: user.followers,
    peerId: user.peerId,
    likes: user.likes,
    money: user.money,
    bankDeposit: user.bankDeposit ?? 0,
    visitCount: user.visitCount,
    albums: user.albums,
  }
}

function generateUid(): string {
  return `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

async function postAuthStateMessage(roomId: string, user: any, content: string): Promise<void> {
  try {
    await postStateMessage(roomId, senderFromUser(user), content)
  } catch (err) {
    console.warn('[auth] state message skipped:', err)
  }
}

// ── POST /api/auth/register ──
router.post('/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body

    // 防御：req.body 可能是字符串或 null
    if (typeof email !== 'string' || typeof password !== 'string' || typeof nickname !== 'string') {
      return res.status(400).json({ error: '邮箱、密码、昵称均为必填项' })
    }
    if (!email.trim() || !password.trim() || !nickname.trim()) {
      return res.status(400).json({ error: '邮箱、密码、昵称均为必填项' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: '邮箱格式不正确' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度不能少于 6 位' })
    }
    if (nickname.trim().length > 24) {
      return res.status(400).json({ error: '昵称不能超过 24 个字符' })
    }

    // 检查邮箱是否已注册
    const existing = await User.findOne({ email: email.trim() }).lean()
    if (existing) {
      return res.status(409).json({ error: '该邮箱已被注册' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const uid = generateUid()

    const user = await User.create({
      uid,
      nickname: nickname.trim(),
      email: email.trim(),
      passwordHash,
      avatarUrl: '',
      motto: '',
      gender: true,
      birthday: '',
      age: -1,
      address: '',
      website: '',
      community: '',
      accountStatus: 1,
      currentRoom: DEFAULT_ROOM_ID,
      isOnline: true,
      lastSeenAt: new Date(),
      lastOnline: new Date(),
      onlineDuration: 0,
      registeredAt: new Date(),
      hobbies: [],
      titles: [],
      friends: [],
      following: [],
      followers: [],
      peerId: '',
      likes: 0,
      money: 0,
      bankDeposit: 0,
      bankInterestSettledAt: new Date(),
      bankPassiveMinutes: 0,
      visitCount: 0,
      albums: [],
    })

    const profile = serializeProfile(user)
    const token = signToken(uid)

    await postAuthStateMessage(DEFAULT_ROOM_ID, user, `${user.nickname} 加入了社区！欢迎~`)

    res.status(201).json({ token, user: profile })
  } catch (err) {
    console.error('[auth] register error:', err)
    res.status(500).json({ error: '注册失败，请稍后重试' })
  }
})

// ── POST /api/auth/login ──
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // 防御：req.body 可能是字符串（Content-Type 缺失时某些客户端的行为）
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: '邮箱和密码均为必填项' })
    }
    if (!email.trim() || !password.trim()) {
      return res.status(400).json({ error: '邮箱和密码均为必填项' })
    }

    const user = await User.findOne({ email: email.trim() })
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }

    // 防御：旧用户可能没有 passwordHash 字段（如从旧版迁移时漏填）
    if (!user.passwordHash) {
      console.error(`[auth] login error: user ${user.uid} has no passwordHash`)
      return res.status(500).json({ error: '账号数据异常，请联系管理员重置密码' })
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }

    // 登录只更新在线状态，避免旧用户文档的无关字段校验导致登录失败。
    const currentRoom = normalizeCurrentRoom(user.currentRoom)
    user.isOnline = true
    user.currentRoom = currentRoom
    user.lastSeenAt = new Date()
    await User.updateOne(
      { uid: user.uid },
      {
        $set: {
          isOnline: true,
          currentRoom,
          lastSeenAt: user.lastSeenAt,
        },
      },
    )

    const profile = serializeProfile(user)
    const token = signToken(user.uid)

    res.json({ token, user: profile })
  } catch (err) {
    console.error('[auth] login error:', err)
    res.status(500).json({ error: '登录失败，请稍后重试' })
  }
})

// ── POST /api/auth/logout ──
router.post('/logout', authRequired, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.userId })
    if (!user) return res.status(404).json({ error: '用户不存在' })

    user.isOnline = false
    user.lastSeenAt = new Date()
    await User.updateOne(
      { uid: user.uid },
      {
        $set: {
          isOnline: false,
          lastSeenAt: user.lastSeenAt,
        },
      },
    )

    res.json({ success: true })
  } catch (err) {
    console.error('[auth] logout error:', err)
    res.status(500).json({ error: '登出失败' })
  }
})

// ── GET /api/auth/me ──
router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.userId }).lean()
    if (!user) return res.status(404).json({ error: '用户不存在' })

    res.json(serializeProfile(user))
  } catch (err) {
    console.error('[auth] me error:', err)
    res.status(500).json({ error: '获取用户信息失败' })
  }
})

// ── POST /api/auth/heartbeat ──
router.post('/heartbeat', authRequired, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.userId })
    if (!user) return res.status(404).json({ error: '用户不存在' })

    const now = new Date()
    const income = await settlePassiveIncome(user, now)
    user.isOnline = true
    user.lastSeenAt = now
    await User.updateOne(
      { uid: user.uid },
      {
        $set: {
          isOnline: true,
          lastSeenAt: now,
          money: user.money,
          onlineDuration: user.onlineDuration,
          bankPassiveMinutes: user.bankPassiveMinutes,
        },
      },
    )

    res.json({ success: true, income })
  } catch (err) {
    res.status(500).json({ error: '心跳更新失败' })
  }
})

export default router
