<script setup lang="ts">
import { ref } from 'vue'
import '../../../assets/js/marked.min.js'

const message_send = ref('')
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

function insertEmoji(iconName: string) {
  message_send.value += `:${iconName}: `
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
})
</script>

<template>
  <div class="mdui-row" style="position: relative; width: 100%">
    <div class="mdui-textfield">
      <img
        src="../../../assets/static_image/r19.png"
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