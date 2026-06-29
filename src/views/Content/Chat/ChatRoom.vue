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
  <div class="chat-room">
    <BaseCard
      v-if="profileCardUser"
      panel-name="用户资料"
      :stack-index="0"
      :content-component="UserInfoCard"
      :content-props="{ user: profileCardUser, onClose: closeProfileCard }"
      @close-panel="closeProfileCard"
    />

    <!-- 房间标题栏 -->
    <div class="chat-header">
      <span class="chat-room-name">
        {{ chatStore.activeRoom.name }}
      </span>
      <span class="chat-room-presence">
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
            class="mdui-row mdui-m-a-1 message-row-wrap"
            v-for="message in chatStore.activeRoomMessages"
            :key="message.id"
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
    <div class="chat-input-shell">
      <InputBox
        ref="inputBoxRef"
        :reply-target="replyTarget"
        @sendMsg="sendMsg"
        @cancel-reply="replyTarget = null"
      />
    </div>

    <!-- 表情面板：独立 flex item，在输入框下方展开，完全在文档流中 -->
    <Transition name="emoji-panel">
      <div v-if="inputBoxRef?.emojiPanelOpen" class="emoji-drawer mdui-color-white">
        <div class="emoji-tabs mdui-tab">
          <button
            class="emoji-tab mdui-ripple"
            :class="{ active: inputBoxRef?.emojiTab === 'preset' }"
            @click="inputBoxRef!.emojiTab = 'preset'"
          >预设表情</button>
          <button
            class="emoji-tab mdui-ripple"
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
            <button
              class="emoji-item emoji-add-item mdui-ripple"
              type="button"
              title="从链接添加表情"
              @click="inputBoxRef?.openAddCustomEmojiDialog()"
            >
              <i class="mdui-icon material-icons">add</i>
            </button>
            <button
              v-for="url in inputBoxRef?.customEmojis"
              :key="url"
              class="emoji-item mdui-ripple"
              type="button"
              @click="inputBoxRef?.insertCustomEmoji(url)"
              :title="url"
            >
              <img class="emoji-custom-image" :src="url" alt="表情" loading="lazy" referrerpolicy="no-referrer" />
            </button>
            <div v-if="!inputBoxRef?.customEmojis?.length" class="emoji-empty">
              暂无自定义表情
            </div>
          </template>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.chat-room {
  height: 100%;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  flex-shrink: 0;
  min-width: 0;
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: transparent;
  border-bottom: 1px solid transparent;
}

.chat-room-name {
  min-width: 0;
  overflow: hidden;
  color: #37474f;
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-room-presence {
  flex: 0 0 auto;
  color: #90a4ae;
  font-size: 12px;
  white-space: nowrap;
}

.chat-body {
  flex: 1;
  width: 100%;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.message-scroll {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
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

.message-row-wrap {
  padding-right: 32px;
}

.chat-input-shell {
  flex: 0 0 auto;
  padding-bottom: var(--app-safe-area-bottom);
  background: rgba(236, 239, 241, 0.86);
}

.emoji-drawer {
  flex-shrink: 0;
  margin-right: 8px;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.12);
}

.emoji-tabs {
  display: flex;
  height: 48px;
  border-bottom: 1px solid #eeeeee;
}

.emoji-tab {
  flex: 1;
  position: relative;
  min-width: 72px;
  padding: 0 16px;
  border: none;
  background: none;
  color: rgba(0, 0, 0, 0.54);
  font-size: 13px;
  line-height: 48px;
  cursor: pointer;
  transition: color 0.15s;
}
.emoji-tab.active {
  color: #2196f3;
}

.emoji-tab.active::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  background: #2196f3;
  content: '';
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 188px;
  padding: 12px;
  overflow-y: auto;
}

.emoji-item {
  width: 44px;
  height: 44px;
  border: none;
  background: none;
  border-radius: 4px;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.66);
  overflow: hidden;
  transition: background 0.15s, color 0.15s;
}
.emoji-item:hover {
  background: #eeeeee;
  color: #2196f3;
}
.emoji-item .mdui-icon { font-size: 28px; }

.emoji-add-item {
  border: 1px dashed #bdbdbd;
  color: rgba(0, 0, 0, 0.46);
}

.emoji-custom-image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.emoji-empty {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 8px;
  color: rgba(0, 0, 0, 0.38);
  font-size: 13px;
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

@media (max-width: 600px) {
  .chat-header {
    min-height: 56px;
    padding: 10px 12px 10px 64px;
    border-bottom-color: rgba(84, 110, 122, 0.12);
  }

  .chat-room-name {
    font-size: 15px;
  }

  .message-list {
    padding-right: 0;
    padding-left: 0;
  }

  .message-row-wrap {
    margin: 4px 6px !important;
    padding-right: 0;
  }

  .chat-input-shell {
    border-top: 1px solid rgba(84, 110, 122, 0.14);
  }

  .emoji-drawer {
    margin-right: 0;
  }

  .emoji-tabs {
    height: 44px;
  }

  .emoji-tab {
    line-height: 44px;
  }

  .emoji-grid {
    gap: 6px;
    max-height: min(36dvh, 220px);
    padding: 10px;
  }

  .emoji-item {
    width: 42px;
    height: 42px;
  }
}
</style>
