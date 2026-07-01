<script setup lang="ts">
import { onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ChatHeader from './ChatHeader.vue'
import ChatInputArea from './ChatInputArea.vue'
import ChatMessageList from './ChatMessageList.vue'
import ChatPlaybackBackground from './ChatPlaybackBackground.vue'
import BaseCard from '../../Card/BaseCard.vue'
import UserInfoCard from '../../Card/UserInfoCard.vue'
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
const inputAreaRef = ref<InstanceType<typeof ChatInputArea> | null>(null)
const messageListRef = ref<InstanceType<typeof ChatMessageList> | null>(null)
const replyTarget = ref<ChatMessage | null>(null)
const pendingMentionUserIds = ref<string[]>([])
const profileCardUser = ref<UserSummary | null>(null)
const useNewMessageBubble = false

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
}

function quoteMessage(message: ChatMessage) {
  replyTarget.value = message
  inputAreaRef.value?.insertTextAtCursor('')
}

function mentionMessageSender(message: ChatMessage) {
  const senderId = message.sender.id
  if (!pendingMentionUserIds.value.includes(senderId)) {
    pendingMentionUserIds.value.push(senderId)
  }
  inputAreaRef.value?.insertTextAtCursor(`@${message.sender.nickname} `)
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

watch(
  () => roomStore.activeRoomId,
  () => {
    playbackStore.fetchPlaybackState().catch(() => {
      snackbar.error('点播状态加载失败')
    })
    messageListRef.value?.resetAndScrollToBottom()
  },
)

onMounted(() => {
  playbackStore.startListening()
  playbackStore.fetchPlaybackState().catch(() => {
    snackbar.error('点播状态加载失败')
  })
})

onBeforeUnmount(() => {
  playbackStore.stopListening()
})

onActivated(() => {
  messageListRef.value?.scrollMessagesToBottomAfterRender()
})
</script>

<template>
  <div class="chat-room">
    <BaseCard
      v-if="profileCardUser"
      panel-name="用户资料"
      :stack-index="0"
      :content-component="UserInfoCard"
      :content-props="{ user: profileCardUser }"
      @close-panel="closeProfileCard"
    />

    <ChatHeader
      :room-name="chatStore.activeRoom.name"
      :member-count="chatStore.activeRoom.memberCount"
    />

    <div class="chat-body">
      <ChatPlaybackBackground
        :item="playbackStore.currentItem"
        :status="playbackStore.status"
        :get-target-time="playbackStore.getEstimatedCurrentTime"
        @ended="handlePlaybackEnded"
      />
      <ChatMessageList
        ref="messageListRef"
        :messages="chatStore.activeRoomMessages"
        :current-user-id="userStore.currentUser?.id ?? null"
        :use-new-message-bubble="useNewMessageBubble"
        @action="handleMessageAction"
        @avatar-click="openProfileCard"
      />
    </div>

    <ChatInputArea
      ref="inputAreaRef"
      :reply-target="replyTarget"
      @sendMsg="sendMsg"
      @cancel-reply="replyTarget = null"
    />
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
  padding-left: var(--content-left-gap, 0px);
  transition: padding-left 0.22s ease;
}

.chat-body {
  flex: 1;
  width: 100%;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
</style>
