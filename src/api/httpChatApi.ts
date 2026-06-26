import type { ChatApi } from './chatApi'
import type {
  AuthCredentials,
  AuthResult,
  FetchRoomMessagesQuery,
  FetchRoomMessagesResult,
  HeartbeatResult,
  RegisterPayload,
  RoomId,
  RoomNode,
  RoomSummary,
  SendMessagePayload,
  SendMessageResult,
} from '../types/chatTypes'
import type { AccountProfile } from '../types/accountTypes'

const BASE = '/api'

// ── Token 管理 ──

function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

function setToken(token: string): void {
  localStorage.setItem('auth_token', token)
}

function clearToken(): void {
  localStorage.removeItem('auth_token')
}

// ── 请求封装 ──

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // 合并 options.headers（如果有），以自定义 header 覆盖默认值
  const { headers: optHeaders, ...restOpts } = options ?? ({} as RequestInit & { headers?: Record<string, string> })
  const mergedHeaders = { ...headers, ...(optHeaders ?? {}) }

  const res = await fetch(`${BASE}${url}`, {
    ...restOpts,
    headers: mergedHeaders,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    if (res.status === 401) {
      clearToken()
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

// ── API 实现 ──

export const httpChatApi: ChatApi = {
  // ── 聊天消息 ──

  async fetchRoomMessages(query: FetchRoomMessagesQuery): Promise<FetchRoomMessagesResult> {
    const params = new URLSearchParams({ limit: String(query.limit) })
    if (query.beforeMessageId) params.set('beforeMessageId', query.beforeMessageId)
    return request<FetchRoomMessagesResult>(
      `/rooms/${query.roomId}/messages?${params.toString()}`,
    )
  },

  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResult> {
    return request<SendMessageResult>(`/rooms/${payload.roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async enterRoom(roomId: RoomId, options: { implicit?: boolean } = {}): Promise<RoomSummary> {
    return request<RoomSummary>(`/rooms/${roomId}/enter`, {
      method: 'POST',
      body: JSON.stringify(options),
    })
  },

  async fetchRoomList(): Promise<RoomNode[]> {
    return request<RoomNode[]>('/rooms')
  },

  // ── 用户资料 ──

  async fetchProfile(): Promise<AccountProfile> {
    return request<AccountProfile>('/profile')
  },

  async saveProfile(profile: AccountProfile): Promise<AccountProfile> {
    return request<AccountProfile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    })
  },

  // ── 认证 ──

  async login(credentials: AuthCredentials): Promise<AuthResult> {
    const result = await request<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    setToken(result.token)
    return result
  },

  async register(payload: RegisterPayload): Promise<AuthResult> {
    const result = await request<AuthResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setToken(result.token)
    return result
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' })
    } catch {
      // 即使请求失败也清理本地 token
    }
    clearToken()
  },

  async fetchMe(): Promise<AccountProfile> {
    return request<AccountProfile>('/auth/me')
  },

  async heartbeat(): Promise<HeartbeatResult> {
    return request<HeartbeatResult>('/auth/heartbeat', { method: 'POST' })
  },
}
