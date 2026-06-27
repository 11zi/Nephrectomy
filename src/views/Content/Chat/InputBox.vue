<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useUserStore } from '../../../stores/useUserStore'
import { CHAT_INPUT_INSERT_TEXT_EVENT } from '../../../composables/useChatInput'
import '../../../assets/js/marked.min.js'

const userStore = useUserStore()
const message_send = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const emit = defineEmits(['sendMsg'])

const emojiPanelOpen = ref(false)
const emojiTab = ref<'preset' | 'custom'>('preset')

const presetEmojis = [
  'sentiment_very_satisfied', 'sentiment_satisfied', 'sentiment_neutral',
  'sentiment_dissatisfied', 'sentiment_very_dissatisfied', 'mood',
  'mood_bad', 'insert_emoticon', 'face', 'tag_faces',
  'thumb_up', 'thumb_down', 'favorite', 'star', 'whatshot',
  'cake', 'local_fire_department', 'bolt', 'water_drop', 'eco',
]
const customEmojis = [
  'person', 'pets', 'child_care', 'elderly', 'accessibility',
  'directions_run', 'self_improvement', 'sports_esports', 'music_note', 'brush',
]

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
  insertTextAtCursor,
})

onMounted(() => {
  window.addEventListener(CHAT_INPUT_INSERT_TEXT_EVENT, handleInsertText)
})

onBeforeUnmount(() => {
  window.removeEventListener(CHAT_INPUT_INSERT_TEXT_EVENT, handleInsertText)
})
</script>

<template>
  <div class="mdui-row" style="position: relative; width: 100%">
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
