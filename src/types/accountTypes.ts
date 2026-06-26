// ── 用户账户相关的类型定义 ──

export interface AccountProfile {
  uid: string
  avatarUrl: string
  nickname: string
  motto: string
  gender: boolean // true=男, false=女
  birthday: string
  age: number
  address: string
  hobbies: string[]
  friends: string[]
  email: string
  website: string
  community: string
  titles: string[]

  // 只读字段（不在表单中编辑）
  likes: number
  following: string[]
  followers: string[]
  money: number
  bankDeposit: number
  stockShares: number
  stockAutoBuyPrice: number | null
  stockAutoSellPrice: number | null
  albums: string[]
  visitCount: number
  accountStatus: number
  currentRoom: string
  lastOnline: string
  onlineDuration: number
  registeredAt: string
  peerId: string
}

// ── 校验 ──

export interface ValidationError {
  field: string
  message: string
}

const NICKNAME_MAX = 24
const MOTTO_MAX = 100
const HOBBY_MAX_COUNT = 5
const HOBBY_MAX_LEN = 20

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function isValidDate(date: string): boolean {
  if (!date) return true
  const d = new Date(date)
  return !isNaN(d.getTime()) && date === d.toISOString().slice(0, 10)
}

export function validateProfile(profile: AccountProfile): ValidationError[] {
  const errors: ValidationError[] = []

  if (!profile.nickname.trim()) {
    errors.push({ field: 'nickname', message: '昵称不能为空' })
  } else if (profile.nickname.trim().length > NICKNAME_MAX) {
    errors.push({ field: 'nickname', message: `昵称不能超过 ${NICKNAME_MAX} 个字符` })
  }

  if (profile.motto.length > MOTTO_MAX) {
    errors.push({ field: 'motto', message: `签名不能超过 ${MOTTO_MAX} 个字符` })
  }

  if (profile.birthday && !isValidDate(profile.birthday)) {
    errors.push({ field: 'birthday', message: '生日格式不正确，请使用 yyyy-mm-dd' })
  }

  if (profile.hobbies.length > HOBBY_MAX_COUNT) {
    errors.push({ field: 'hobbies', message: `爱好最多添加 ${HOBBY_MAX_COUNT} 个` })
  }
  for (const h of profile.hobbies) {
    if (h.trim().length > HOBBY_MAX_LEN) {
      errors.push({ field: 'hobbies', message: `每个爱好不能超过 ${HOBBY_MAX_LEN} 个字符` })
      break
    }
  }

  if (profile.email && !isValidEmail(profile.email)) {
    errors.push({ field: 'email', message: '邮箱格式不正确' })
  }

  if (profile.website && !isValidUrl(profile.website)) {
    errors.push({ field: 'website', message: '个人网站需要是合法的 URL，例如 https://example.com' })
  }

  return errors
}
