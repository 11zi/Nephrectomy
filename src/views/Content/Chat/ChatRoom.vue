<script setup lang="ts">
import { nextTick, onActivated, onMounted, ref, watch } from 'vue'
import InputBox from './InputBox.vue'
import Message from './Message.vue'
import StateMessage from './StateMessage.vue'
import { useChatStore } from '../../../stores/useChatStore'
import { useRoomStore } from '../../../stores/useRoomStore'

const chatStore = useChatStore()
const roomStore = useRoomStore()
const inputBoxRef = ref<InstanceType<typeof InputBox> | null>(null)
const messageScrollRef = ref<HTMLElement | null>(null)
const isPinnedToBottom = ref(true)
const unreadMessageCount = ref(0)

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
  requestAnimationFrame(scrollMessagesToBottom)
}

function handleMessageScroll() {
  isPinnedToBottom.value = isAtMessageBottom()
  if (isPinnedToBottom.value) unreadMessageCount.value = 0
}

function showLatestMessages() {
  scrollMessagesToBottomAfterRender()
}

async function sendMsg(message: string) {
  const result = await chatStore.sendMessage(message)
  if (!result) return
  mdui.mutation()
}

function formatMessageTime(createdAt: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt))
}

watch(
  () => roomStore.activeRoomId,
  () => {
    isPinnedToBottom.value = true
    unreadMessageCount.value = 0
    scrollMessagesToBottomAfterRender()
  },
)

watch(
  () => chatStore.activeRoomMessages.length,
  (newLength, oldLength) => {
    const addedCount = Math.max(0, newLength - oldLength)
    if (isPinnedToBottom.value) {
      scrollMessagesToBottomAfterRender()
    } else if (addedCount > 0) {
      unreadMessageCount.value += addedCount
    }
  },
  { flush: 'post' },
)

onMounted(scrollMessagesToBottomAfterRender)
onActivated(scrollMessagesToBottomAfterRender)
</script>

<template>
  <div
    class="mdui-container-fluid mdui-m-l-5"
    style="
      height: 100%;
      width: -webkit-fill-available;
      display: flex;
      flex-direction: column;
    "
  >
    <!-- 房间标题栏 -->
    <div
      style="
        flex-shrink: 0;
        padding: 12px 16px;
        background: transparent;
        border-bottom: 1px solid transparent;
        display: flex;
        align-items: center;
        gap: 8px;
      "
    >
      <span style="font-size: 16px; font-weight: 600; color: #37474f">
        {{ chatStore.activeRoom.name }}
      </span>
      <span
        style="font-size: 12px; color: #90a4ae"
      >
        {{ chatStore.activeRoom.memberCount }} 人在线
      </span>
    </div>

    <!-- 消息滚动区，flex: 1 占满剩余空间 -->
    <div
      ref="messageScrollRef"
      class="mdui-row"
      style="flex: 1; overflow-y: auto; width: -webkit-fill-available; min-height: 0; position: relative"
      @scroll="handleMessageScroll"
    >
      <div class="mdui-col-md-6 mdui-col-xs-10 mdui-m-b-2" style="width: 100%">
        <div
          class="mdui-row mdui-m-a-1"
          v-for="message in chatStore.activeRoomMessages"
          :key="message.id"
          style="padding-right: 32px"
        >
          <!-- 用户消息 -->
          <Message
            v-if="message.kind === 'user'"
            :raw_msg="message.content"
            :avatar_url="message.sender.avatarUrl"
            :sender_name="message.sender.nickname"
            :timestamp="formatMessageTime(message.createdAt)"
          />
          <!-- 状态消息 -->
          <StateMessage
            v-else-if="message.kind === 'state'"
            :content="message.content"
            :timestamp="formatMessageTime(message.createdAt)"
          />
          <!-- 命令消息（预留） -->
          <StateMessage
            v-else-if="message.kind === 'command'"
            :content="message.content"
            :timestamp="formatMessageTime(message.createdAt)"
          />
        </div>
      </div>
      <button
        v-if="unreadMessageCount > 0"
        class="new-message-badge mdui-ripple"
        type="button"
        @click="showLatestMessages"
      >
        {{ unreadMessageCount }}
      </button>
    </div>

    <!-- 输入栏，flex-shrink: 0 固定在底部 -->
    <div style="flex-shrink: 0">
      <InputBox ref="inputBoxRef" @sendMsg="sendMsg" />
    </div>

    <!-- 表情面板：独立 flex item，在输入框下方展开，完全在文档流中 -->
    <Transition name="emoji-panel">
      <div v-if="inputBoxRef?.emojiPanelOpen" class="emoji-drawer mdui-color-blue-grey-50">
        <div class="emoji-tabs">
          <button
            class="emoji-tab"
            :class="{ active: inputBoxRef?.emojiTab === 'preset' }"
            @click="inputBoxRef!.emojiTab = 'preset'"
          >预设表情</button>
          <button
            class="emoji-tab"
            :class="{ active: inputBoxRef?.emojiTab === 'custom' }"
            @click="inputBoxRef!.emojiTab = 'custom'"
          >我的表情</button>
        </div>
        <div class="emoji-grid">
          <template v-if="inputBoxRef?.emojiTab === 'preset'">
            <button
              v-for="icon in inputBoxRef?.presetEmojis"
              :key="icon"
              class="emoji-item mdui-ripple"
              @click="inputBoxRef?.insertEmoji(icon)"
              :title="icon"
            >
              <i class="mdui-icon material-icons">{{ icon }}</i>
            </button>
          </template>
          <template v-else>
            <div v-if="!inputBoxRef?.customEmojis?.length" class="emoji-empty">
              暂无自定义表情包
            </div>
            <button
              v-for="icon in inputBoxRef?.customEmojis"
              :key="icon"
              class="emoji-item mdui-ripple"
              @click="inputBoxRef?.insertEmoji(icon)"
              :title="icon"
            >
              <i class="mdui-icon material-icons">{{ icon }}</i>
            </button>
          </template>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.emoji-drawer {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid #cfd8dc;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
  margin-right: 8px;
}

.emoji-tabs {
  display: flex;
  border-bottom: 1px solid #eceff1;
}

.emoji-tab {
  flex: 1;
  padding: 10px 0;
  border: none;
  background: none;
  font-size: 13px;
  color: #78909c;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}
.emoji-tab.active {
  color: #546e7a;
  border-bottom-color: #546e7a;
  font-weight: 600;
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 8px;
  gap: 4px;
  max-height: 180px;
  overflow-y: auto;
}

.emoji-item {
  width: 44px;
  height: 44px;
  border: none;
  background: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #546e7a;
  transition: background 0.15s;
}
.emoji-item:hover { background: #eceff1; }
.emoji-item .mdui-icon { font-size: 28px; }

.emoji-empty {
  width: 100%;
  text-align: center;
  padding: 24px 0;
  font-size: 13px;
  color: #b0bec5;
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

.emoji-panel-enter-active,
.emoji-panel-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  max-height: 260px;
  overflow: hidden;
}
.emoji-panel-enter-from,
.emoji-panel-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
