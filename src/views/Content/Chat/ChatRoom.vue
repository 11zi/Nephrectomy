<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import InputBox from './InputBox.vue'
import Message from './Message.vue'
import StateMessage from './StateMessage.vue'
import BaseCard from '../../Card/BaseCard.vue'
import UserInfoCard from '../../Card/UserInfoCard.vue'
import MediaPlayer from '../../../components/playback/MediaPlayer.vue'
import { useChatStore } from '../../../stores/useChatStore'
import { useRoomStore } from '../../../stores/useRoomStore'
import { usePlaybackStore } from '../../../stores/usePlaybackStore'
import { useUserStore } from '../../../stores/useUserStore'
import { useSnackbar } from '../../../composables/useSnackbar'
import type { ChatMessage, UserSummary } from '../../../types/chatTypes'

const chatStore = useChatStore()
const roomStore = useRoomStore()
const playbackStore = usePlaybackStore()
const userStore = useUserStore()
const snackbar = useSnackbar()
const inputBoxRef = ref<InstanceType<typeof InputBox> | null>(null)
const messageScrollRef = ref<HTMLElement | null>(null)
const isPinnedToBottom = ref(true)
const unreadMessageCount = ref(0)
const replyTarget = ref<ChatMessage | null>(null)
const pendingMentionUserIds = ref<string[]>([])
const profileCardUser = ref<UserSummary | null>(null)

const messagesById = computed(() => {
  return new Map(chatStore.activeRoomMessages.map(message => [message.id, message]))
})

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
  if (message.trim().toLowerCase() === 'cut') {
    await cutCurrentPlayback()
    return
  }

  const result = await chatStore.sendMessage(message, {
    replyToId: replyTarget.value?.id ?? null,
    mentionedUserIds: pendingMentionUserIds.value,
  })
  if (!result) return
  replyTarget.value = null
  pendingMentionUserIds.value = []
  mdui.mutation()
}

function quoteMessage(message: ChatMessage) {
  replyTarget.value = message
  inputBoxRef.value?.insertTextAtCursor('')
}

function mentionMessageSender(message: ChatMessage) {
  const senderId = message.sender.id
  if (!pendingMentionUserIds.value.includes(senderId)) {
    pendingMentionUserIds.value.push(senderId)
  }
  inputBoxRef.value?.insertTextAtCursor(`@${message.sender.nickname} `)
}

async function repeatMessage(message: ChatMessage) {
  try {
    await chatStore.sendMessage(message.content)
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : '复读失败')
  }
}

function isCurrentUserPrivileged() {
  const profile = userStore.profile
  if (!profile) return false
  return profile.accountStatus > 0
    || profile.titles.some(title => /管理员|房管|admin|moderator/i.test(title))
}

function canCurrentUserRecall(message: ChatMessage) {
  if (isCurrentUserPrivileged()) return true
  const currentUserId = userStore.currentUser?.id
  if (!currentUserId || message.sender.id !== currentUserId) return false
  return Date.now() - new Date(message.createdAt).getTime() <= 2 * 60 * 1000
}

async function recallMessage(message: ChatMessage) {
  if (!canCurrentUserRecall(message)) {
    snackbar.error('只能撤回自己 2 分钟内发出的消息')
    return
  }

  try {
    await chatStore.recallMessage(message)
    snackbar.show('消息已撤回')
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : '撤回失败')
  }
}

function handleMessageAction(action: '引用' | '@他' | '复读' | '撤回', message: ChatMessage) {
  if (action === '引用') quoteMessage(message)
  if (action === '@他') mentionMessageSender(message)
  if (action === '复读') repeatMessage(message)
  if (action === '撤回') recallMessage(message)
}

function openProfileCard(message: ChatMessage) {
  profileCardUser.value = message.sender
}

function closeProfileCard() {
  profileCardUser.value = null
}

async function cutCurrentPlayback() {
  const currentItem = playbackStore.currentItem
  if (!currentItem) {
    snackbar.show('暂无正在播放')
    return
  }

  try {
    const result = await playbackStore.voteRemove(currentItem.id)
    if (!result) return
    if (result.itemRemoved) {
      snackbar.show('该媒体已被投票切除')
    } else {
      snackbar.show(result.voteAdded ? '已投票切除' : '已取消切除投票')
    }
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : '网络错误，请稍后再试')
  }
}

function handlePlaybackEnded(itemId: string) {
  playbackStore.notifyCurrentEnded(itemId).catch(() => {
    snackbar.error('网络错误，请稍后再试')
  })
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
    playbackStore.fetchPlaybackState().catch(() => {
      snackbar.error('点播状态加载失败')
    })
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

onMounted(() => {
  playbackStore.startListening()
  playbackStore.fetchPlaybackState().catch(() => {
    snackbar.error('点播状态加载失败')
  })
  scrollMessagesToBottomAfterRender()
})

onBeforeUnmount(() => {
  playbackStore.stopListening()
})

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
    <BaseCard
      v-if="profileCardUser"
      panel-name="用户资料"
      :stack-index="0"
      :content-component="UserInfoCard"
      :content-props="{ user: profileCardUser, onClose: closeProfileCard }"
      @close-panel="closeProfileCard"
    />

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
    <div class="chat-body">
      <div v-if="playbackStore.currentItem" class="chat-playback-background">
        <MediaPlayer
          background
          :item="playbackStore.currentItem"
          :status="playbackStore.status"
          :get-target-time="playbackStore.getEstimatedCurrentTime"
          @ended="handlePlaybackEnded"
        />
      </div>

      <div
        ref="messageScrollRef"
        class="mdui-row message-scroll"
        @scroll="handleMessageScroll"
      >
        <div class="mdui-col-md-6 mdui-col-xs-10 mdui-m-b-2 message-list" style="width: 100%">
          <div
            class="mdui-row mdui-m-a-1"
            v-for="message in chatStore.activeRoomMessages"
            :key="message.id"
            style="padding-right: 32px"
          >
            <!-- 用户消息 -->
            <Message
              v-if="message.kind === 'user'"
              :message="message"
              :quoted-message="message.replyToId ? messagesById.get(message.replyToId) ?? null : null"
              :timestamp="formatMessageTime(message.createdAt)"
              @action="handleMessageAction"
              @avatar-click="openProfileCard"
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
    </div>

    <!-- 输入栏，flex-shrink: 0 固定在底部 -->
    <div style="flex-shrink: 0">
      <InputBox
        ref="inputBoxRef"
        :reply-target="replyTarget"
        @sendMsg="sendMsg"
        @cancel-reply="replyTarget = null"
      />
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
.chat-body {
  flex: 1;
  width: -webkit-fill-available;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.message-scroll {
  position: relative;
  z-index: 1;
  width: -webkit-fill-available;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}

.chat-playback-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.82;
}

.chat-playback-background :deep(audio) {
  pointer-events: auto;
}

.message-list {
  position: relative;
  z-index: 1;
}

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
