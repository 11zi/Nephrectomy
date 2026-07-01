import type { ChatMessage, MessageId } from '../types/chatTypes'

export interface QuoteThreadNode {
  message: ChatMessage
  children: QuoteThreadNode[]
  isPath: boolean
}

export function buildQuoteThread(
  messages: ChatMessage[],
  message: ChatMessage,
): QuoteThreadNode | null {
  if (!message.replyToId) return null

  const messagesById = new Map<MessageId, ChatMessage>()
  const messageIndexById = new Map<MessageId, number>()

  messages.forEach((item, index) => {
    messagesById.set(item.id, item)
    messageIndexById.set(item.id, index)
  })

  const currentIndex = messageIndexById.get(message.id) ?? messages.length
  const target = messagesById.get(message.replyToId)
  const targetIndex = target ? messageIndexById.get(target.id) : undefined
  if (!target || targetIndex === undefined || targetIndex >= currentIndex) return null

  const pathIds: MessageId[] = []
  const visitedPathIds = new Set<MessageId>()
  let cursor: ChatMessage | undefined = target

  while (cursor && !visitedPathIds.has(cursor.id)) {
    const cursorIndex = messageIndexById.get(cursor.id)
    if (cursorIndex === undefined || cursorIndex >= currentIndex) break
    pathIds.unshift(cursor.id)
    visitedPathIds.add(cursor.id)
    cursor = cursor.replyToId ? messagesById.get(cursor.replyToId) : undefined
  }

  if (pathIds.length === 0) return null

  const rootId = pathIds[0]
  const root = messagesById.get(rootId)
  if (!root) return null

  const pathIdSet = new Set(pathIds)
  const childrenByReplyId = new Map<MessageId, ChatMessage[]>()

  for (const item of messages) {
    const itemIndex = messageIndexById.get(item.id)
    if (!item.replyToId || itemIndex === undefined || itemIndex >= currentIndex) continue
    if (!messagesById.has(item.replyToId)) continue
    const siblings = childrenByReplyId.get(item.replyToId) ?? []
    siblings.push(item)
    childrenByReplyId.set(item.replyToId, siblings)
  }

  function buildNode(item: ChatMessage, visitedIds: Set<MessageId>): QuoteThreadNode {
    const nextVisitedIds = new Set(visitedIds)
    nextVisitedIds.add(item.id)

    const children = (childrenByReplyId.get(item.id) ?? [])
      .filter(child => !nextVisitedIds.has(child.id))
      .map(child => buildNode(child, nextVisitedIds))

    return {
      message: item,
      children,
      isPath: pathIdSet.has(item.id),
    }
  }

  return buildNode(root, new Set())
}

export function buildQuoteThreadsByMessage(
  messages: ChatMessage[],
): Map<MessageId, QuoteThreadNode> {
  const threads = new Map<MessageId, QuoteThreadNode>()

  for (const message of messages) {
    const thread = buildQuoteThread(messages, message)
    if (thread) threads.set(message.id, thread)
  }

  return threads
}
