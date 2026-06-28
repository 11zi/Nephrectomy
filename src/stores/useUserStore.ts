import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserSummary } from '../types/chatTypes'
import type { AccountProfile, PublicProfile } from '../types/accountTypes'
import { httpChatApi } from '../api/httpChatApi'
import { DEFAULT_ROOM_ID, useRoomStore } from './useRoomStore'

// ── 默认值 ──
const defaultUser: UserSummary = {
  id: 'user-hamisky',
  nickname: '哈米斯基',
  avatarUrl: 'src/assets/static_image/r19.png',
  motto: '凡是被那把武器伤害的人，都会遭到席卷全身的诅咒',
}

function makeDefaultProfile(user: UserSummary): AccountProfile {
  return {
    uid: user.id,
    avatarUrl: user.avatarUrl,
    nickname: user.nickname,
    motto: user.motto ?? '',
    gender: true,
    birthday: '',
    age: -1,
    address: '',
    hobbies: [],
    friends: [],
    email: '',
    website: '',
    community: '',
    titles: [],
    likes: 0,
    following: [],
    followers: [],
    money: 0,
    bankDeposit: 0,
    stockShares: 0,
    stockAutoBuyPrice: null,
    stockAutoSellPrice: null,
    albums: [],
    visitCount: 0,
    accountStatus: 0,
    currentRoom: DEFAULT_ROOM_ID,
    lastOnline: '',
    onlineDuration: 0,
    registeredAt: '',
    peerId: '',
  }
}

function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

function setToken(token: string): void {
  localStorage.setItem('auth_token', token)
}

function clearToken(): void {
  localStorage.removeItem('auth_token')
}

export const useUserStore = defineStore('user', () => {
  // ── 认证状态 ──
  const currentUser = ref<UserSummary | null>(null)
  const profile = ref<AccountProfile | null>(null)
  const isAuthenticated = computed(() => currentUser.value !== null)
  const isOnline = ref(false)
  const authToken = ref<string | null>(getToken())

  // ── 资料加载状态 ──
  const isLoadingProfile = ref(false)
  const isSavingProfile = ref(false)

  // ── 心跳定时器 ──
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null

  function startHeartbeat() {
    stopHeartbeat()
    isOnline.value = true
    heartbeatTimer = setInterval(async () => {
      try {
        await httpChatApi.heartbeat()
        isOnline.value = true
      } catch {
        isOnline.value = false
      }
    }, 30_000)
  }

  function syncCurrentRoom(p: AccountProfile): void {
    useRoomStore().setActiveRoom(p.currentRoom)
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
    isOnline.value = false
  }

  // ── 认证方法 ──

  /** 登录：调用 API → 设置状态 → 启动心跳 */
  async function login(email: string, password: string): Promise<AccountProfile> {
    const result = await httpChatApi.login({ email, password })
    setToken(result.token)
    authToken.value = result.token
    profile.value = result.user
    syncCurrentRoom(result.user)
    currentUser.value = {
      id: result.user.uid,
      nickname: result.user.nickname,
      avatarUrl: result.user.avatarUrl,
      motto: result.user.motto,
    }
    startHeartbeat()
    return result.user
  }

  /** 注册：调用 API → 设置状态 → 启动心跳 */
  async function register(email: string, password: string, nickname: string): Promise<AccountProfile> {
    const result = await httpChatApi.register({ email, password, nickname })
    setToken(result.token)
    authToken.value = result.token
    profile.value = result.user
    syncCurrentRoom(result.user)
    currentUser.value = {
      id: result.user.uid,
      nickname: result.user.nickname,
      avatarUrl: result.user.avatarUrl,
      motto: result.user.motto,
    }
    startHeartbeat()
    return result.user
  }

  /** 登出：调用 API → 清空状态 → 停止心跳 */
  async function logout(): Promise<void> {
    stopHeartbeat()
    try {
      await httpChatApi.logout()
    } catch {
      // 即使 API 失败也执行本地清理
    }
    clearToken()
    authToken.value = null
    currentUser.value = null
    profile.value = null
    isOnline.value = false
  }

  /** 页面刷新时用已存 token 验证并恢复用户状态 */
  async function fetchMe(): Promise<AccountProfile> {
    isLoadingProfile.value = true
    try {
      const p = await httpChatApi.fetchMe()
      profile.value = { ...p }
      syncCurrentRoom(p)
      currentUser.value = {
        id: p.uid,
        nickname: p.nickname,
        avatarUrl: p.avatarUrl,
        motto: p.motto,
      }
      startHeartbeat()
      return { ...profile.value }
    } catch {
      // token 无效，清理
      clearAuth()
      throw new Error('登录已过期')
    } finally {
      isLoadingProfile.value = false
    }
  }

  /** 强制清除所有认证状态（token 过期等场景） */
  function clearAuth(): void {
    stopHeartbeat()
    clearToken()
    authToken.value = null
    currentUser.value = null
    profile.value = null
    isOnline.value = false
  }

  /** 显式从 API 加载用户资料 */
  async function loadProfile(): Promise<AccountProfile> {
    isLoadingProfile.value = true
    try {
      const p = await httpChatApi.fetchProfile()
      if (p && p.nickname) {
        profile.value = { ...p }
        syncCurrentRoom(p)
        syncCurrentUser(p)
      }
    } catch {
      // API 不可用，保持当前值
    } finally {
      isLoadingProfile.value = false
    }
    return { ...profile.value! }
  }

  async function saveProfile(p: AccountProfile): Promise<AccountProfile> {
    isSavingProfile.value = true
    try {
      const saved = await httpChatApi.saveProfile(p)
      profile.value = { ...saved }
      syncCurrentRoom(saved)
      syncCurrentUser(saved)
      return { ...profile.value }
    } catch {
      throw new Error('保存失败，请稍后重试')
    } finally {
      isSavingProfile.value = false
    }
  }

  function fetchPublicProfile(userId: string): Promise<PublicProfile> {
    return httpChatApi.fetchPublicProfile(userId)
  }

  function likeProfile(userId: string): Promise<PublicProfile> {
    return httpChatApi.likeProfile(userId)
  }

  function syncCurrentUser(p: AccountProfile) {
    if (!currentUser.value) return
    currentUser.value = {
      ...currentUser.value,
      nickname: p.nickname || currentUser.value.nickname,
      motto: p.motto ?? currentUser.value.motto,
      avatarUrl: p.avatarUrl || currentUser.value.avatarUrl,
    }
  }

  // ── 监听 auth:unauthorized 事件 ──
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:unauthorized', () => {
      clearAuth()
    })
  }

  return {
    currentUser,
    profile,
    isAuthenticated,
    isOnline,
    authToken,
    isLoadingProfile,
    isSavingProfile,
    login,
    register,
    logout,
    fetchMe,
    clearAuth,
    loadProfile,
    saveProfile,
    fetchPublicProfile,
    likeProfile,
  }
})
