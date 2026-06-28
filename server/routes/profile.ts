import { Router } from 'express'
import { User } from '../models/User'
import { ProfileLike } from '../models/ProfileLike'
import { ProfileVisit } from '../models/ProfileVisit'
import { authRequired } from '../auth/middleware'

const router = Router()
const DEFAULT_ROOM_ID = 'plaza'

function normalizeCurrentRoom(roomId?: string | null): string {
  return roomId || DEFAULT_ROOM_ID
}

function todayKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function serializeProfile(user: any, likedToday = false, recentLikeUsers: Array<{ uid: string; nickname: string }> = []) {
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
    stockShares: user.stockShares ?? 0,
    stockAutoBuyPrice: user.stockAutoBuyPrice ?? null,
    stockAutoSellPrice: user.stockAutoSellPrice ?? null,
    visitCount: user.visitCount,
    albums: user.albums,
    likedToday,
    recentLikeUsers,
  }
}

async function getRecentLikeUsers(targetUserId: string) {
  const likes = await ProfileLike.find({ targetUserId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean()

  return likes.map(like => ({
    uid: like.likerUserId,
    nickname: like.likerSnapshot.nickname,
  }))
}

async function getPublicProfile(targetUserId: string, viewerUserId: string) {
  let user = await User.findOne({ uid: targetUserId }).lean()
  if (!user) return null

  if (targetUserId !== viewerUserId) {
    try {
      await ProfileVisit.create({
        targetUserId,
        visitorUserId: viewerUserId,
        visitDate: todayKey(),
        createdAt: new Date(),
      })
      await User.updateOne({ uid: targetUserId }, { $inc: { visitCount: 1 } })
      user = await User.findOne({ uid: targetUserId }).lean()
      if (!user) return null
    } catch (err: any) {
      if (err?.code !== 11000) throw err
    }
  }

  const [likedToday, recentLikeUsers] = await Promise.all([
    ProfileLike.exists({
      targetUserId,
      likerUserId: viewerUserId,
      likeDate: todayKey(),
    }),
    getRecentLikeUsers(targetUserId),
  ])

  return serializeProfile(user, Boolean(likedToday), recentLikeUsers)
}

// GET /api/profile
router.get('/', authRequired, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.userId }).lean()

    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    res.json(serializeProfile(user))
  } catch (err) {
    res.status(500).json({ error: '获取资料失败' })
  }
})

// GET /api/profile/:userId
router.get('/:userId', authRequired, async (req, res) => {
  try {
    const profile = await getPublicProfile(String(req.params.userId), String(req.userId))
    if (!profile) return res.status(404).json({ error: '用户不存在' })
    res.json(profile)
  } catch (err) {
    res.status(500).json({ error: '获取资料失败' })
  }
})

// POST /api/profile/:userId/like
router.post('/:userId/like', authRequired, async (req, res) => {
  try {
    const targetUserId = String(req.params.userId)
    const likerUserId = String(req.userId)

    if (targetUserId === likerUserId) {
      return res.status(400).json({ error: '不能给自己点赞' })
    }

    const [targetUser, likerUser] = await Promise.all([
      User.findOne({ uid: targetUserId }),
      User.findOne({ uid: likerUserId }).lean(),
    ])
    if (!targetUser || !likerUser) return res.status(404).json({ error: '用户不存在' })

    try {
      await ProfileLike.create({
        targetUserId,
        likerUserId,
        likeDate: todayKey(),
        createdAt: new Date(),
        likerSnapshot: {
          nickname: likerUser.nickname,
        },
      })
    } catch (err: any) {
      if (err?.code === 11000) {
        return res.status(400).json({ error: '今天已经点赞过了' })
      }
      throw err
    }

    targetUser.likes = (targetUser.likes ?? 0) + 1
    await targetUser.save()

    const profile = await getPublicProfile(targetUserId, likerUserId)
    res.json(profile)
  } catch (err) {
    res.status(500).json({ error: '点赞失败' })
  }
})

// PUT /api/profile
router.put('/', authRequired, async (req, res) => {
  try {
    const allowed = [
      'nickname', 'avatarUrl', 'motto', 'gender', 'birthday', 'age',
      'address', 'email', 'website', 'community', 'hobbies', 'titles',
      'albums',
    ]
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key]
    }

    const user = await User.findOneAndUpdate(
      { uid: req.userId },
      { $set: update },
      { new: true },
    ).lean()

    if (!user) return res.status(404).json({ error: '用户不存在' })

    res.json(serializeProfile(user))
  } catch (err) {
    res.status(500).json({ error: '保存资料失败' })
  }
})

export default router
