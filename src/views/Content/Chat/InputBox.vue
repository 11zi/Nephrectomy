<script setup lang="ts">
import { ref, Text, VueElement } from 'vue'
import '../../../assets/js/marked.min.js'
import InputBox from './InputBox.vue'
function parseMD(text) {
  return marked.parse(text)
}

const message_send = ref('')
const emit = defineEmits(['sendMsg'])
function sendMsg(msgEvent: { shiftKey: boolean; altKey: boolean } | null) {
  if (message_send.value == '\n' || message_send.value.length == 0) {
    message_send.value = ''
    return 0
  }
  if (msgEvent == null || (!msgEvent.shiftKey && !msgEvent.altKey)) {
    message_send.value = parseMD(message_send.value)
    emit('sendMsg', message_send.value)
    message_send.value = ''
    // 刷新组件似乎有一点问题：提交后输入框显示为两行，未及时刷新
    mdui.mutation()
    return 1
  }
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
        v-on:click="sendMsg()"
        >send</i
      >
      <textarea
        class="mdui-textfield-input"
        id="msg_textarea"
        v-model="message_send"
        @keyup.enter="sendMsg"
        placeholder="说点什么...!"
        rows="2"
        style="margin-left: 64px"
      ></textarea>
    </div>
  </div>
</template>
