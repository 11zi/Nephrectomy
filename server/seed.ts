/**
 * 种子脚本：将房间、用户、消息写入 MongoDB
 * 运行：npm run seed
 *
 * 幂等：先清空再插入，可重复执行。
 */
import bcrypt from 'bcryptjs'
import { connectDb } from './db'
import { Room } from './models/Room'
import { User } from './models/User'
import { Message } from './models/Message'
import { ProfileLike } from './models/ProfileLike'
import { ProfileVisit } from './models/ProfileVisit'

const rooms = [
  { roomId: 'plaza',    name: '广场', description: '所有人闲聊的大厅',   memberCount: 35, heat: 70, isActive: true,  parentId: null, cover: '#546e7a', colSpan: 2, rowSpan: 2 },
  { roomId: 'teahouse', name: '茶馆', description: '品茶闲聊，安静交流', memberCount: 12, heat: 18, isActive: true,  parentId: null, cover: '#4e6b5e', colSpan: 1, rowSpan: 1 },
]

const users = [
  {
    uid: 'user-hamisky',
    nickname: '哈米斯基',
    avatarUrl: 'src/assets/static_image/r19.png',
    motto: '凡是被那把武器伤害的人，都会遭到席卷全身的诅咒',
    gender: true,
    birthday: '1999-06-24',
    age: 27,
    address: 'plaza',
    email: 'hamisky@nephrectomy.local',
    passwordHash: '', // 将在下面使用 bcrypt 加密
    website: 'https://hamisky.example.com',
    community: '同肾社区',
    isOnline: false,
    lastSeenAt: new Date(),
    accountStatus: 1,
    currentRoom: 'plaza',
    lastOnline: new Date(),
    onlineDuration: 3600,
    registeredAt: new Date('2025-01-01'),
    hobbies: ['绘画', '音乐', '游戏'],
    titles: ['创始成员'],
    friends: [],
    following: [],
    followers: [],
    peerId: '',
    likes: 0,
    money: 5200,
    bankDeposit: 12000,
    bankInterestSettledAt: new Date(),
    bankPassiveMinutes: 0,
    stockShares: 0,
    stockAutoBuyPrice: null,
    stockAutoSellPrice: null,
    visitCount: 0,
    albums: [],
  },
]

const messages = [
  {
    messageId: 'msg-seed-1',
    roomId: 'plaza',
    kind: 'user' as const,
    sender: {
      id: 'user-hamisky',
      nickname: '哈米斯基',
      avatarUrl: 'src/assets/static_image/r19.png',
      motto: '凡是被那把武器伤害的人，都会遭到席卷全身的诅咒',
    },
    content: '大家好，欢迎来到广场！',
    createdAt: new Date('2026-06-24T10:00:00Z'),
    replyToId: null,
    mentionedUserIds: [],
    canRecall: true,
  },
  {
    messageId: 'msg-seed-2',
    roomId: 'plaza',
    kind: 'user' as const,
    sender: {
      id: 'user-bot',
      nickname: '小助手',
      avatarUrl: '',
      motto: '',
    },
    content: '这里是公共聊天大厅，大家可以在这里自由交流。',
    createdAt: new Date('2026-06-24T10:01:00Z'),
    replyToId: null,
    mentionedUserIds: [],
    canRecall: false,
  },
  {
    messageId: 'msg-seed-3',
    roomId: 'plaza',
    kind: 'user' as const,
    sender: {
      id: 'user-hamisky',
      nickname: '哈米斯基',
      avatarUrl: 'src/assets/static_image/r19.png',
      motto: '凡是被那把武器伤害的人，都会遭到席卷全身的诅咒',
    },
    content: '今天天气不错，适合聊天。',
    createdAt: new Date('2026-06-24T10:02:00Z'),
    replyToId: null,
    mentionedUserIds: [],
    canRecall: true,
  },
  {
    messageId: 'msg-seed-4',
    roomId: 'plaza',
    kind: 'user' as const,
    sender: {
      id: 'user-hamisky',
      nickname: '哈米斯基',
      avatarUrl: 'src/assets/static_image/r19.png',
      motto: '凡是被那把武器伤害的人，都会遭到席卷全身的诅咒',
    },
    content: '有没有人想一起开个话题？',
    createdAt: new Date('2026-06-24T10:05:00Z'),
    replyToId: null,
    mentionedUserIds: [],
    canRecall: true,
  },
]

async function seed() {
  await connectDb()

  // 清空并重建
  await Room.deleteMany({})
  await User.deleteMany({})
  await Message.deleteMany({})
  await ProfileLike.deleteMany({})
  await ProfileVisit.deleteMany({})

  await Room.insertMany(rooms)
  console.log(`[seed] rooms:     ${rooms.length}`)

  // 为种子用户加密密码（默认密码: password123）
  const hashedPassword = await bcrypt.hash('password123', 10)
  users[0].passwordHash = hashedPassword

  await User.insertMany(users)
  console.log(`[seed] users:     ${users.length}`)

  await Message.insertMany(messages)
  console.log(`[seed] messages:  ${messages.length}`)

  console.log('[seed] done')
  process.exit(0)
}

seed()
