import { Router } from 'express'
import { User } from '../models/User'
import { authRequired } from '../auth/middleware'

const router = Router()

// GET /api/profile
router.get('/', authRequired, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.userId }).lean()

    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    res.json({
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
      currentRoom: user.currentRoom,
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
      visitCount: user.visitCount,
      albums: user.albums,
    })
  } catch (err) {
    res.status(500).json({ error: '获取资料失败' })
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

    res.json({
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
      currentRoom: user.currentRoom,
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
      visitCount: user.visitCount,
      albums: user.albums,
    })
  } catch (err) {
    res.status(500).json({ error: '保存资料失败' })
  }
})

export default router
