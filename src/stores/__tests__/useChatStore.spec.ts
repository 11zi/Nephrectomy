import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useChatStore } from '../useChatStore'

// 本地存储 token 模拟
localStorage.setItem('auth_token', 'mock-token')

// mock httpApi，让所有请求返回失败，触发 fallback
vi.mock('../../api/httpChatApi', () => ({
  httpChatApi: {
    fetchRoomMessages: vi.fn().mockRejectedValue(new Error('offline')),
    sendMessage: vi.fn().mockRejectedValue(new Error('offline')),
    enterRoom: vi.fn().mockRejectedValue(new Error('offline')),
    fetchRoomList: vi.fn().mockRejectedValue(new Error('offline')),
    fetchProfile: vi.fn().mockRejectedValue(new Error('offline')),
    saveProfile: vi.fn().mockRejectedValue(new Error('offline')),
    // auth methods
    login: vi.fn().mockRejectedValue(new Error('offline')),
    register: vi.fn().mockRejectedValue(new Error('offline')),
    logout: vi.fn().mockRejectedValue(new Error('offline')),
    fetchMe: vi.fn().mockResolvedValue({
      uid: 'user-test',
      nickname: '测试用户',
      avatarUrl: '',
      motto: '',
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
      albums: [],
      visitCount: 0,
      accountStatus: 0,
      currentRoom: 'plaza',
      lastOnline: '',
      onlineDuration: 0,
      registeredAt: '',
      peerId: '',
    }),
    heartbeat: vi.fn().mockResolvedValue({ success: true }),
    fetchBankStatus: vi.fn().mockRejectedValue(new Error('offline')),
    depositBank: vi.fn().mockRejectedValue(new Error('offline')),
    withdrawBank: vi.fn().mockRejectedValue(new Error('offline')),
  },
}))

// mock useUserStore to return an authenticated user
vi.mock('../useUserStore', async () => {
  return {
    useUserStore: () => ({
      currentUser: {
        id: 'user-test',
        nickname: '测试用户',
        avatarUrl: '',
        motto: '',
      },
      profile: null,
      isAuthenticated: true,
      isOnline: true,
      authToken: 'mock-token',
      isLoadingProfile: false,
      isSavingProfile: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      fetchMe: vi.fn(),
      clearAuth: vi.fn(),
      loadProfile: vi.fn(),
      saveProfile: vi.fn(),
    }),
  }
})

describe('useChatStore (API fallback)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with empty messages before fetching', () => {
    const chatStore = useChatStore()

    // 默认房间始终是广场，不存在“未选择房间”的状态。
    expect(chatStore.activeRoom.id).toBe('plaza')
    expect(chatStore.messages).toHaveLength(0)
  })

  it('does not send blank messages', async () => {
    const chatStore = useChatStore()
    const beforeCount = chatStore.messages.length

    const result = await chatStore.sendMessage('   ')

    expect(result).toBeNull()
    expect(chatStore.messages).toHaveLength(beforeCount)
  })

  it('adds a user message to the active room (fallback to local)', async () => {
    const chatStore = useChatStore()
    const { useRoomStore } = await import('../useRoomStore')
    const roomStore = useRoomStore()

    // Set active room first
    roomStore.activeRoomId = 'plaza'

    const result = await chatStore.sendMessage('新的消息')

    expect(result?.message).toMatchObject({
      roomId: 'plaza',
      kind: 'user',
      content: '新的消息',
      canRecall: true,
    })
    expect(chatStore.activeRoomMessages.at(-1)?.content).toBe('新的消息')
  })

  it('can switch rooms and messages are isolated', async () => {
    const chatStore = useChatStore()
    const { useRoomStore } = await import('../useRoomStore')
    const roomStore = useRoomStore()

    // Set active room and pre-populate plaza messages
    roomStore.activeRoomId = 'plaza'
    await chatStore.sendMessage('广场消息')
    expect(chatStore.activeRoomMessages).toHaveLength(1)

    // Switch to a different room
    await roomStore.enterRoom('teahouse')

    // New room should have no messages initially (may have mock rooms loaded)
    const teahouseMsgCount = chatStore.activeRoomMessages.length

    // Send a message in the new room
    await chatStore.sendMessage('茶馆里好')
    expect(chatStore.activeRoomMessages).toHaveLength(teahouseMsgCount + 1)
    expect(chatStore.activeRoomMessages.at(-1)?.content).toBe('茶馆里好')
  })
})
