// 用户账户相关的类型定义

export type Gender = 'male' | 'female' | 'other' | 'undisclosed'

export interface AccountProfile {
  /** 头像 URL，本地预览时为 base64 DataURL */
  avatar: string
  /** 昵称，1-24字 */
  nickname: string
  /** 状态签名，最多60字 */
  status: string
  /** 性别 */
  gender: Gender
  /** 生日，ISO 格式 yyyy-mm-dd，可为空 */
  birthday: string
  /** 住址（房间uid），可为空 */
  address: string
  /** 爱好，最多5个，每个不超过20字 */
  hobbies: string[]
  /** 好友列表（用户uid），只读展示，不在此表单编辑 */
  friends: string[]
  /** 邮箱，可为空 */
  email: string
  /** 个人网站，可为空 */
  website: string
}

// ---- 校验规则 ----

export interface ValidationError {
  field: keyof AccountProfile
  message: string
}

const NICKNAME_MAX = 24
const STATUS_MAX = 60
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
  if (!date) return true // 允许为空
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

  if (profile.status.length > STATUS_MAX) {
    errors.push({ field: 'status', message: `状态签名不能超过 ${STATUS_MAX} 个字符` })
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