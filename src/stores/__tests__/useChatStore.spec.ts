import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useChatStore } from '../useChatStore'

describe('useChatStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with default room messages', () => {
    const chatStore = useChatStore()

    expect(chatStore.activeRoom.name).toBe('空间站')
    expect(chatStore.activeRoomMessages.length).toBeGreaterThan(0)
  })

  it('does not send blank messages', async () => {
    const chatStore = useChatStore()
    const beforeCount = chatStore.messages.length

    const result = await chatStore.sendMessage('   ')

    expect(result).toBeNull()
    expect(chatStore.messages).toHaveLength(beforeCount)
  })

  it('adds a user message to the active room', async () => {
    const chatStore = useChatStore()

    const result = await chatStore.sendMessage('新的消息')

    expect(result?.message).toMatchObject({
      roomId: chatStore.activeRoom.id,
      kind: 'user',
      content: '新的消息',
      sender: chatStore.currentUser,
      canRecall: true,
    })
    expect(chatStore.activeRoomMessages.at(-1)?.content).toBe('新的消息')
  })
})
