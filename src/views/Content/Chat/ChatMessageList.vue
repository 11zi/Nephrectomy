<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import Message from './Message.vue'
import StateMessage from './StateMessage.vue'
import MessageBubbleNew from '../../../components/chat/MessageBubbleNew.vue'
import type { ChatMessage } from '../../../types/chatTypes'
import { buildQuoteThreadsByMessage } from '../../../utils/chatQuoteThread'

type MessageAction = '引用' | '@他' | '复读' | '撤回'

const props = defineProps<{
  messages: ChatMessage[]
  currentUserId?: string | null
  useNewMessageBubble: boolean
}>()

const emit = defineEmits<{
  action: [action: MessageAction, message: ChatMessage]
  avatarClick: [message: ChatMessage]
}>()

const messageScrollRef = ref<HTMLElement | null>(null)
const isPinnedToBottom = ref(true)
const unreadMessageCount = ref(0)
let pendingBottomScroll = 0

const messagesById = computed(() => {
  return new Map(props.messages.map(message => [message.id, message]))
})

const quoteThreadsByMessageId = computed(() => buildQuoteThreadsByMessage(props.messages))

function isAtMessageBottom() {
  const el = messageScrollRef.value
  if (!el) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight <= 8
}

function scrollMessagesToBottom() {
  const el = messageScrollRef.value
  if (!el) return
  el.scrollTop = el.scrollHeight
  isPinnedToBottom.value = true
  unreadMessageCount.value = 0
}

async function scrollMessagesToBottomAfterRender() {
  await nextTick()
  if (pendingBottomScroll) cancelAnimationFrame(pendingBottomScroll)
  pendingBottomScroll = requestAnimationFrame(() => {
    scrollMessagesToBottom()
    pendingBottomScroll = requestAnimationFrame(() => {
      scrollMessagesToBottom()
      pendingBottomScroll = 0
    })
  })
}

function resetAndScrollToBottom() {
  isPinnedToBottom.value = true
  unreadMessageCount.value = 0
  scrollMessagesToBottomAfterRender()
}

function handleMessageScroll() {
  isPinnedToBottom.value = isAtMessageBottom()
  if (isPinnedToBottom.value) unreadMessageCount.value = 0
}

function showLatestMessages() {
  scrollMessagesToBottomAfterRender()
}

function formatMessageTime(createdAt: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt))
}

watch(
  () => props.messages,
  (newMessages, oldMessages = []) => {
    const newLength = newMessages.length
    const oldLength = oldMessages.length
    const addedCount = Math.max(0, newLength - oldLength)
    const latestNewMessage = newMessages[newMessages.length - 1]
    const latestOldMessage = oldMessages[oldMessages.length - 1]
    const roomMessageSetChanged =
      newMessages[0]?.roomId !== oldMessages[0]?.roomId
      || latestNewMessage?.id !== latestOldMessage?.id

    if (isPinnedToBottom.value || roomMessageSetChanged) {
      scrollMessagesToBottomAfterRender()
    } else if (addedCount > 0) {
      unreadMessageCount.value += addedCount
    }
  },
  { flush: 'post' },
)

onMounted(scrollMessagesToBottomAfterRender)

defineExpose({
  resetAndScrollToBottom,
  scrollMessagesToBottomAfterRender,
})
</script>

<template>
  <div
    ref="messageScrollRef"
    class="message-scroll"
    @scroll="handleMessageScroll"
  >
    <div class="message-list">
      <div
        class="message-row-wrap"
        v-for="message in messages"
        :key="message.id"
      >
        <MessageBubbleNew
          v-if="useNewMessageBubble"
          :message="message"
          :quoted-message="message.replyToId ? messagesById.get(message.replyToId) ?? null : null"
          :quote-thread="quoteThreadsByMessageId.get(message.id) ?? null"
          :timestamp="formatMessageTime(message.createdAt)"
          :current-user-id="currentUserId ?? null"
          @action="emit('action', $event, message)"
          @avatar-click="emit('avatarClick', $event)"
        />
        <Message
          v-else-if="message.kind === 'user'"
          :message="message"
          :quoted-message="message.replyToId ? messagesById.get(message.replyToId) ?? null : null"
          :quote-thread="quoteThreadsByMessageId.get(message.id) ?? null"
          :timestamp="formatMessageTime(message.createdAt)"
          @action="emit('action', $event, message)"
          @avatar-click="emit('avatarClick', $event)"
        />
        <StateMessage
          v-else-if="message.kind === 'state'"
          :content="message.content"
          :timestamp="formatMessageTime(message.createdAt)"
        />
        <StateMessage
          v-else-if="message.kind === 'command'"
          :content="message.content"
          :timestamp="formatMessageTime(message.createdAt)"
        />
      </div>
    </div>
    <button
      v-if="unreadMessageCount > 0"
      class="new-message-badge"
      type="button"
      @click="showLatestMessages"
    >
      {{ unreadMessageCount }}
    </button>
  </div>
</template>

<style scoped>
.message-scroll {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.message-list {
  position: relative;
  z-index: 1;
  width: 100%;
  margin-bottom: 8px;
}

.message-row-wrap {
  margin: 4px;
  padding-right: 32px;
}

.new-message-badge {
  position: sticky;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: block;
  min-width: 32px;
  height: 28px;
  margin: 0 auto 8px;
  padding: 0 10px;
  border: none;
  border-radius: 14px;
  background: #546e7a;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  line-height: 28px;
  box-shadow: 0 2px 8px rgba(38, 50, 56, 0.22);
  cursor: pointer;
}

@media (max-width: 600px) {
  .message-list {
    padding-right: 0;
    padding-left: 0;
  }

  .message-row-wrap {
    margin: 4px 6px;
    padding-right: 0;
  }
}
</style>
