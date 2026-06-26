import mongoose, { Schema, type Document } from 'mongoose'

export interface IUser extends Document {
  uid: string

  // ── 基础信息 ──
  nickname: string
  avatarUrl: string
  motto: string // 签名
  gender: boolean // true=男, false=女
  birthday: string
  age: number
  address: string // 住址（room_id）

  // ── 联系 ──
  email: string
  website: string
  community: string // 社区

  // ── 认证 ──
  passwordHash: string

  // ── 在线状态 ──
  isOnline: boolean
  lastSeenAt: Date

  // ── 状态 ──
  accountStatus: number // 账户状态
  currentRoom: string // 坐标（当前所在 room_id）
  lastOnline: Date // 最后在线
  onlineDuration: number // 在线时间（分钟）
  registeredAt: Date // 注册时间

  // ── 社交 ──
  hobbies: string[] // 爱好
  titles: string[] // 称号
  friends: string[] // 好友 uid[]
  following: string[] // 关注
  followers: string[] // 粉丝
  peerId: string // 同框（当前同屏用户 acc_id）

  // ── 资产 ──
  likes: number // 赞
  money: number // 金钱
  bankDeposit: number // 银行存款
  bankInterestSettledAt: Date // 上次存款利息结算时间
  bankPassiveMinutes: number // 尚未结算的在线收益分钟数
  stockShares: number // 持股数
  stockAutoBuyPrice: number | null // 自动买入价
  stockAutoSellPrice: number | null // 自动卖出价
  visitCount: number // 访问量
  albums: string[] // 相册 photo_id[]
}

const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true },

    nickname: { type: String, required: true, maxlength: 24 },
    avatarUrl: { type: String, default: '' },
    motto: { type: String, default: '', maxlength: 100 },
    gender: { type: Boolean, default: true },
    birthday: { type: String, default: '' },
    age: { type: Number, default: -1 },
    address: { type: String, default: '' },

    email: { type: String, default: '' },
    website: { type: String, default: '' },
    community: { type: String, default: '' },

    passwordHash: { type: String, required: true },

    isOnline: { type: Boolean, default: false },
    lastSeenAt: { type: Date, default: Date.now },

    accountStatus: { type: Number, default: 0 },
    currentRoom: { type: String, default: 'plaza' },
    lastOnline: { type: Date, default: Date.now },
    onlineDuration: { type: Number, default: 1 },
    registeredAt: { type: Date, default: Date.now },

    hobbies: { type: [String], default: [], validate: [limit(5), '最多 5 个爱好'] },
    titles: { type: [String], default: [] },
    friends: { type: [String], default: [] },
    following: { type: [String], default: [] },
    followers: { type: [String], default: [] },
    peerId: { type: String, default: '' },

    likes: { type: Number, default: 0 },
    money: { type: Number, default: 0 },
    bankDeposit: { type: Number, default: 0 },
    bankInterestSettledAt: { type: Date, default: Date.now },
    bankPassiveMinutes: { type: Number, default: 0 },
    stockShares: { type: Number, default: 0 },
    stockAutoBuyPrice: { type: Number, default: null },
    stockAutoSellPrice: { type: Number, default: null },
    visitCount: { type: Number, default: 0 },
    albums: { type: [String], default: [] },
  },
  { timestamps: true },
)

function limit(max: number) {
  return (v: string[]) => v.length <= max
}

UserSchema.index({ email: 1 }, { unique: true, sparse: true })

export const User = mongoose.model<IUser>('User', UserSchema)
