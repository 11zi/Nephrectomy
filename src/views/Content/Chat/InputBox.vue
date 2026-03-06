<script setup lang="ts">
import { ref } from 'vue'
import '../../../assets/js/marked.min.js'

const message_send = ref('')
const emit = defineEmits(['sendMsg'])

function sendMsg(msgEvent: KeyboardEvent | MouseEvent | null) {
  // 清理首尾空白后判断是否为空
  if (message_send.value.trim().length === 0) {
    message_send.value = ''
    return
  }
  // Shift+Enter 或 Alt+Enter：换行，不发送
  if (
    msgEvent instanceof KeyboardEvent &&
    (msgEvent.shiftKey || msgEvent.altKey)
  ) {
    return
  }
  // 发送原始 Markdown 文本，不在此处解析
  // XSS 过滤在 Message.vue 渲染时进行
  emit('sendMsg', message_send.value)
  message_send.value = ''
}
</script>

<template>
  <div
    class="mdui-row mdui-m-r-4"
    style="position: fixed; width: inherit; bottom: 8px"
  >
    <div class="mdui-textfield">
      <img
        src="../../../assets/static_image/r19.png"
        alt="avatar"
        class="mdui-img-rounded mdui-shadow-1 mdui-m-a-1"
        style="position: absolute; bottom: 0px"
        width="48"
        height="48"
      />
      <i
        class="mdui-icon material-icons mdui-ripple icon-plus-round mdui-p-a-1"
        style="right: 8px; border-radius: 50%"
        @click="sendMsg(null)"
        >send</i
      >
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
