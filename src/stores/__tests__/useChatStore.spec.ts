import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useChatStore } from '../useChatStore'

const apiMocks = vi.hoisted(() => ({
  fetchRoomMessages: vi.fn(),
  sendMessage: vi.fn(),
  enterRoom: vi.fn(),
}))

// 本地存储 token 模拟
localStorage.setItem('auth_token', 'mock-token')

// mock httpApi：需要落库的数据必须由服务端成功返回后才写入 store
vi.mock('../../api/httpChatApi', () => ({
  httpChatApi: {
    fetchRoomMessages: apiMocks.fetchRoomMessages,
    sendMessage: apiMocks.sendMessage,
    enterRoom: apiMocks.enterRoom,
    fetchRoomList: vi.fn().mockRejectedValue(new Error('offline')),
    fetchProfile: vi.fn().mockRejectedValue(new Error('offline')),
    fetchPublicProfile: vi.fn().mockRejectedValue(new Error('offline')),
    likeProfile: vi.fn().mockRejectedValue(new Error('offline')),
    saveProfile: vi.fn().mockRejectedValue(new Error('offline')),
    recallMessage: vi.fn().mockRejectedValue(new Error('offline')),
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
      stockShares: 0,
      stockAutoBuyPrice: null,
      stockAutoSellPrice: null,
      albums: [],
      visitCount: 0,
      accountStatus: 0,
      currentRoom: 'plaza',
      lastOnline: '',
      onlineDuration: 0,
      registeredAt: '',
      peerId: '',
      likedToday: false,
      recentLikeUsers: [],
    }),
    heartbeat: vi.fn().mockResolvedValue({ success: true }),
    fetchBankStatus: vi.fn().mockRejectedValue(new Error('offline')),
    depositBank: vi.fn().mockRejectedValue(new Error('offline')),
    withdrawBank: vi.fn().mockRejectedValue(new Error('offline')),
    rollDice: vi.fn().mockRejectedValue(new Error('offline')),
    fetchStockStatus: vi.fn().mockRejectedValue(new Error('offline')),
    buyStock: vi.fn().mockRejectedValue(new Error('offline')),
    sellStock: vi.fn().mockRejectedValue(new Error('offline')),
    setStockAutoPrices: vi.fn().mockRejectedValue(new Error('offline')),
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
      fetchPublicProfile: vi.fn(),
      likeProfile: vi.fn(),
    }),
  }
})

describe('useChatStore', () => {
  beforeEach(() => {
    apiMocks.fetchRoomMessages.mockReset()
    apiMocks.sendMessage.mockReset()
    apiMocks.enterRoom.mockReset()
    apiMocks.fetchRoomMessages.mockRejectedValue(new Error('offline'))
    apiMocks.sendMessage.mockRejectedValue(new Error('offline'))
    apiMocks.enterRoom.mockRejectedValue(new Error('offline'))
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

  it('does not add a message when server send fails', async () => {
    const chatStore = useChatStore()
    const { useRoomStore } = await import('../useRoomStore')
    const roomStore = useRoomStore()

    roomStore.activeRoomId = 'plaza'

    await expect(chatStore.sendMessage('新的消息')).rejects.toThrow('offline')
    expect(chatStore.activeRoomMessages).toHaveLength(0)
  })

  it('adds a user message returned by the server', async () => {
    const chatStore = useChatStore()
    const { useRoomStore } = await import('../useRoomStore')
    const roomStore = useRoomStore()

    roomStore.activeRoomId = 'plaza'
    apiMocks.sendMessage.mockResolvedValue({
      message: {
        id: 'msg-test',
        roomId: 'plaza',
        kind: 'user',
        sender: {
          id: 'user-test',
          nickname: '测试用户',
          avatarUrl: '',
          motto: '',
        },
        content: '新的消息',
        createdAt: new Date().toISOString(),
        mentionedUserIds: [],
        canRecall: true,
      },
    })

    const result = await chatStore.sendMessage('新的消息')
    expect(result?.message).toMatchObject({
      roomId: 'plaza',
      kind: 'user',
      content: '新的消息',
      canRecall: true,
    })
    expect(chatStore.activeRoomMessages.at(-1)?.content).toBe('新的消息')
  })

  it('keeps messages isolated by room when server sends succeed', async () => {
    const chatStore = useChatStore()
    const { useRoomStore } = await import('../useRoomStore')
    const roomStore = useRoomStore()

    roomStore.activeRoomId = 'plaza'
    apiMocks.sendMessage.mockImplementation(async (payload) => ({
      message: {
        id: `msg-${payload.roomId}-${payload.content}`,
        roomId: payload.roomId,
        kind: 'user',
        sender: {
          id: 'user-test',
          nickname: '测试用户',
          avatarUrl: '',
          motto: '',
        },
        content: payload.content,
        createdAt: new Date().toISOString(),
        replyToId: payload.replyToId,
        mentionedUserIds: payload.mentionedUserIds ?? [],
        canRecall: true,
      },
    }))

    await chatStore.sendMessage('广场消息')
    expect(chatStore.activeRoomMessages).toHaveLength(1)

    roomStore.activeRoomId = 'teahouse'

    const teahouseMsgCount = chatStore.activeRoomMessages.length

    await chatStore.sendMessage('茶馆里好')
    expect(chatStore.activeRoomMessages).toHaveLength(teahouseMsgCount + 1)
    expect(chatStore.activeRoomMessages.at(-1)?.content).toBe('茶馆里好')
  })
})
