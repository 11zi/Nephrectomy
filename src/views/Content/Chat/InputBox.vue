<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
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
import '../../../assets/js/marked.min.js'

const userStore = useUserStore()
const snackbar = useSnackbar()
const message_send = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
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

function openAddCustomEmojiDialog() {
  let dialogController: { close: () => void } | null = null

  mdui.dialog({
    title: '添加表情',
    content: `
      <div class="mdui-textfield">
        <label class="mdui-textfield-label">图片链接</label>
        <input class="mdui-textfield-input custom-emoji-url-input" type="url" />
        <div class="mdui-textfield-helper">支持 jpg、png、webp、gif 链接</div>
      </div>
    `,
    buttons: [
      {
        text: '取消',
        close: true,
      },
      {
        text: '添加',
        bold: true,
        close: false,
        onClick: () => {
          const input = document.querySelector<HTMLInputElement>('.custom-emoji-url-input')
          const url = normalizeCustomChatEmojiUrl(input?.value.trim() ?? '')
          if (!url) {
            snackbar.error('请输入可访问的图片链接')
            return
          }
          if (!customEmojis.value.includes(url)) {
            customEmojis.value = [url, ...customEmojis.value]
            saveCustomChatEmojiUrls(customEmojis.value)
          }
          snackbar.success('表情已添加')
          dialogController?.close()
        },
      },
    ],
    history: false,
    onOpened: (dialog) => {
      dialogController = dialog
      mdui.updateTextFields?.()
      document.querySelector<HTMLInputElement>('.custom-emoji-url-input')?.focus()
    },
  })
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
  <div class="mdui-row" style="position: relative; width: 100%">
    <div v-if="props.replyTarget" class="input-reply-preview">
      <div class="input-reply-copy">
        <span class="input-reply-label">引用 {{ props.replyTarget.sender.nickname }}</span>
        <span class="input-reply-text">{{ props.replyTarget.content }}</span>
      </div>
      <button
        class="mdui-btn mdui-btn-icon mdui-ripple input-reply-close"
        type="button"
        title="取消引用"
        @click="emit('cancelReply')"
      >
        <i class="mdui-icon material-icons">close</i>
      </button>
    </div>
    <div class="mdui-textfield">
      <img
        :src="userStore.currentUser?.avatarUrl"
        alt="avatar"
        class="mdui-img-rounded mdui-shadow-1 mdui-m-a-1"
        style="position: absolute; bottom: 0px; cursor: pointer"
        width="48"
        height="48"
        @click="toggleEmojiPanel"
        :title="emojiPanelOpen ? '收起表情' : '打开表情'"
      />
      <i
        class="mdui-icon material-icons mdui-ripple icon-plus-round mdui-p-a-1"
        style="right: 8px; border-radius: 50%"
        @click="sendMsg(null)"
      >send</i>
      <textarea
        ref="textareaRef"
        class="mdui-textfield-input"
        id="msg_textarea"
        v-model="message_send"
        @keydown.enter="sendMsg($event)"
        placeholder="说点什么...!"
        rows="2"
        style="margin-left: 64px"
      ></textarea>
    </div>
  </div>
</template>

<style scoped>
.input-reply-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 8px 0 64px;
  padding: 6px 8px;
  border-left: 3px solid #78909c;
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
  color: #78909c;
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.input-reply-close {
  flex: 0 0 auto;
}
</style>
