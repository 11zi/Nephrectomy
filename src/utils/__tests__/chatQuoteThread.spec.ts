import { describe, expect, it } from 'vitest'
import { buildQuoteThread } from '../chatQuoteThread'
import type { ChatMessage } from '../../types/chatTypes'

const sender = {
  id: 'user-1',
  nickname: '测试用户',
  avatarUrl: '',
}

function message(id: string, content: string, replyToId?: string): ChatMessage {
  return {
    id,
    roomId: 'plaza',
    kind: 'user',
    sender,
    content,
    createdAt: new Date(2026, 0, 1).toISOString(),
    replyToId,
    mentionedUserIds: [],
    canRecall: true,
  }
}

describe('chat quote thread', () => {
  it('keeps sibling branches when a quoted message has multiple replies', () => {
    const messages = [
      message('root', '原始消息'),
      message('left', '第一个引用', 'root'),
      message('right', '第二个引用', 'root'),
      message('next', '继续引用左分支', 'left'),
    ]

    const thread = buildQuoteThread(messages, messages[3])

    expect(thread?.message.id).toBe('root')
    expect(thread?.children.map(child => child.message.id)).toEqual(['left', 'right'])
    expect(thread?.children[0].isPath).toBe(true)
    expect(thread?.children[1].isPath).toBe(false)
  })

  it('only uses messages that already exist before the current message', () => {
    const messages = [
      message('root', '原始消息'),
      message('left', '第一个引用', 'root'),
      message('current', '继续引用左分支', 'left'),
      message('future', '之后才出现的引用', 'root'),
    ]

    const thread = buildQuoteThread(messages, messages[2])

    expect(thread?.children.map(child => child.message.id)).toEqual(['left'])
  })
})
