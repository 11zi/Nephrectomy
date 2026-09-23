<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Send, X } from 'lucide-vue-next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUserStore } from '../../../stores/useUserStore'
import { useSnackbar } from '../../../composables/useSnackbar'
import { CHAT_INPUT_INSERT_TEXT_EVENT } from '../../../composables/useChatInput'
import {
  PRESET_CHAT_EMOJIS,
  loadCustomChatEmojiUrls,
  normalizeCustomChatEmojiUrl,
  saveCustomChatEmojiUrls,
} from '../../../utils/chatEmoji'
import type { ChatMessage } from '../../../types/chatTypes'

const userStore = useUserStore()
const snackbar = useSnackbar()
const message_send = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const customEmojiDialogOpen = ref(false)
const customEmojiUrl = ref('')
const customEmojiInputRef = ref<InstanceType<typeof Input> | null>(null)
const props = defineProps<{
  replyTarget?: ChatMessage | null
}>()
const emit = defineEmits<{
  sendMsg: [message: string]
  cancelReply: []
}>()

const emojiPanelOpen = ref(false)
const emojiTab = ref<'preset' | 'custom'>('preset')

const presetEmojis = PRESET_CHAT_EMOJIS
const customEmojis = ref<string[]>([])

function currentUserInitials() {
  return userStore.currentUser?.nickname?.slice(0, 2).toUpperCase() ?? 'ME'
}

function toggleEmojiPanel() {
  emojiPanelOpen.value = !emojiPanelOpen.value
}

async function insertTextAtCursor(text: string) {
  const textarea = textareaRef.value
  if (!textarea) {
    message_send.value += text
    return
  }

  const start = textarea.selectionStart ?? message_send.value.length
  const end = textarea.selectionEnd ?? message_send.value.length
  message_send.value = `${message_send.value.slice(0, start)}${text}${message_send.value.slice(end)}`

  await nextTick()
  textarea.focus()
  const cursorPosition = start + text.length
  textarea.setSelectionRange(cursorPosition, cursorPosition)
}

function insertEmoji(iconName: string) {
  insertTextAtCursor(`:${iconName}: `)
}

function insertCustomEmoji(url: string) {
  insertTextAtCursor(`${url} `)
}

async function openAddCustomEmojiDialog() {
  customEmojiUrl.value = ''
  customEmojiDialogOpen.value = true
  await nextTick()
  customEmojiInputRef.value?.$el?.focus()
}

function closeAddCustomEmojiDialog() {
  customEmojiDialogOpen.value = false
  customEmojiUrl.value = ''
}

function submitCustomEmoji() {
  const url = normalizeCustomChatEmojiUrl(customEmojiUrl.value.trim())
  if (!url) {
    snackbar.error('请输入可访问的图片链接')
    return
  }
  if (!customEmojis.value.includes(url)) {
    customEmojis.value = [url, ...customEmojis.value]
    saveCustomChatEmojiUrls(customEmojis.value)
  }
  snackbar.success('表情已添加')
  closeAddCustomEmojiDialog()
}

function handleInsertText(event: Event) {
  const text = (event as CustomEvent<string>).detail
  if (text) insertTextAtCursor(text)
}

function sendMsg(msgEvent: KeyboardEvent | MouseEvent | null) {
  if (message_send.value.trim().length === 0) {
    message_send.value = ''
    return
  }
  if (msgEvent instanceof KeyboardEvent && (msgEvent.shiftKey || msgEvent.altKey)) {
    return
  }
  emit('sendMsg', message_send.value)
  message_send.value = ''
  emojiPanelOpen.value = false
}

// 暴露面板状态给父组件（ChatRoom），让面板在 ChatRoom flex 布局中渲染
defineExpose({
  emojiPanelOpen,
  emojiTab,
  presetEmojis,
  customEmojis,
  insertEmoji,
  insertCustomEmoji,
  openAddCustomEmojiDialog,
  insertTextAtCursor,
})

onMounted(() => {
  customEmojis.value = loadCustomChatEmojiUrls()
  window.addEventListener(CHAT_INPUT_INSERT_TEXT_EVENT, handleInsertText)
})

onBeforeUnmount(() => {
  window.removeEventListener(CHAT_INPUT_INSERT_TEXT_EVENT, handleInsertText)
})
</script>

<template>
  <div class="chat-input-root">
    <div v-if="props.replyTarget" class="input-reply-preview">
      <div class="input-reply-copy">
        <span class="input-reply-label">引用 {{ props.replyTarget.sender.nickname }}</span>
        <span class="input-reply-text">{{ props.replyTarget.content }}</span>
      </div>
      <button
        class="input-reply-close"
        type="button"
        title="取消引用"
        @click="emit('cancelReply')"
      >
        <X :size="18" />
      </button>
    </div>
    <div class="chat-input-row">
      <button
        class="chat-input-avatar-button"
        type="button"
        @click="toggleEmojiPanel"
        :title="emojiPanelOpen ? '收起表情' : '打开表情'"
      >
        <Avatar class="chat-input-avatar">
          <AvatarImage :src="userStore.currentUser?.avatarUrl" alt="avatar" />
          <AvatarFallback>{{ currentUserInitials() }}</AvatarFallback>
        </Avatar>
      </button>
      <textarea
        ref="textareaRef"
        class="chat-input-field"
        id="msg_textarea"
        v-model="message_send"
        @keydown.enter="sendMsg($event)"
        placeholder="说点什么...!"
        rows="2"
      ></textarea>
      <button
        class="chat-input-send"
        type="button"
        title="发送"
        @click="sendMsg(null)"
      >
        <Send :size="20" />
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="customEmojiDialogOpen"
        class="custom-emoji-dialog-backdrop"
        @click.self="closeAddCustomEmojiDialog"
      >
        <form class="custom-emoji-dialog" @submit.prevent="submitCustomEmoji">
          <div class="custom-emoji-dialog-header">
            <div>
              <h2>添加表情</h2>
              <p>支持 jpg、png、webp、gif 链接</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="关闭"
              @click="closeAddCustomEmojiDialog"
            >
              <X />
            </Button>
          </div>
          <label class="custom-emoji-field">
            图片链接
            <Input
              ref="customEmojiInputRef"
              v-model="customEmojiUrl"
              type="url"
              placeholder="https://example.com/emoji.webp"
              @keydown.esc.prevent="closeAddCustomEmojiDialog"
            />
          </label>
          <div class="custom-emoji-dialog-actions">
            <Button type="button" variant="outline" @click="closeAddCustomEmojiDialog">取消</Button>
            <Button type="submit">添加</Button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.chat-input-root {
  position: relative;
  width: 100%;
  min-width: 0;
  padding: 6px 8px 8px;
}

.chat-input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.chat-input-avatar-button,
.chat-input-send {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  padding: 0;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.chat-input-avatar-button:hover,
.chat-input-send:hover {
  transform: translateY(-1px);
}

.chat-input-avatar {
  width: 48px;
  height: 48px;
  box-shadow: 0 2px 6px rgba(38, 50, 56, 0.18);
}

.chat-input-field {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 48px;
  max-height: 128px;
  resize: none;
  border: 1px solid rgba(84, 110, 122, 0.22);
  border-radius: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #263238;
  font: inherit;
  line-height: 1.45;
  outline: none;
  box-shadow: 0 1px 2px rgba(38, 50, 56, 0.08);
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.chat-input-field:focus {
  border-color: #546e7a;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(84, 110, 122, 0.16);
}

.chat-input-send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #546e7a;
  box-shadow: 0 2px 6px rgba(38, 50, 56, 0.2);
}

.input-reply-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 56px 6px;
  padding: 6px 8px;
  border-left: 3px solid #455a64;
  border-radius: 0 6px 6px 0;
  background: rgba(236, 239, 241, 0.9);
}

.input-reply-copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.input-reply-label {
  font-size: 11px;
  font-weight: 600;
  color: #546e7a;
}

.input-reply-text {
  overflow: hidden;
  color: #455a64;
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.input-reply-close {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #546e7a;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.input-reply-close:hover {
  background: rgba(84, 110, 122, 0.12);
  color: #263238;
}

.custom-emoji-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.36);
}

.custom-emoji-dialog {
  width: min(420px, 100%);
  border: 1px solid rgba(84, 110, 122, 0.18);
  border-radius: 8px;
  padding: 18px;
  background: #fff;
  color: #263238;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
}

.custom-emoji-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.custom-emoji-dialog-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
}

.custom-emoji-dialog-header p {
  margin: 4px 0 0;
  color: #607d8b;
  font-size: 13px;
}

.custom-emoji-field {
  display: grid;
  gap: 8px;
  color: #37474f;
  font-size: 13px;
  font-weight: 600;
}

.custom-emoji-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

@media (max-width: 600px) {
  .chat-input-root {
    padding: 6px 8px 8px;
  }

  .chat-input-row {
    gap: 6px;
  }

  .chat-input-avatar-button,
  .chat-input-send {
    width: 44px;
    height: 44px;
  }

  .chat-input-avatar {
    width: 44px;
    height: 44px;
  }

  .chat-input-field {
    min-height: 44px;
    max-height: 104px;
  }

  .input-reply-preview {
    margin: 0 50px 6px;
  }
}
</style>
