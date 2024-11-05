<script setup lang="ts">
import { ref, Text } from 'vue'
import '../../assets/js/marked.min.js'

function parseMD(text) {
  return marked.parse(text)
}

const enums = ref([
  { count: '1', msg: '你' },
  { count: '2', msg: '你说你不想在这里！' },
  { count: '3', msg: '我也不想在这里！' },
])
const message_send = ref('')
function sendMsg(msgEvent: { shiftKey: boolean; altKey: boolean } | null) {
  if (message_send.value.length == 0) return 0
  if (msgEvent == null || (!msgEvent.shiftKey && !msgEvent.altKey)) {
    message_send.value = parseMD(message_send.value)
    console.log(message_send)
    enums.value.push({
      count: enums.value.length.toString(),
      msg: message_send.value,
    })
    console.log(message_send.value)
    message_send.value = ''
    // 刷新组件似乎有一点问题：提交后输入框显示为两行，未及时刷新
    mdui.mutation()
    return 1
  }
}
</script>
<template>
  <div
    class="mdui-container mdui-m-l-4"
    style="height: 100%; width: -webkit-fill-available"
  >
    <div class="mdui-row">
      <div class="mdui-col-md-6 mdui-col-xs-10">
        <div class="mdui-row" v-for="_message in enums" :key="_message.count">
          <div class="mdui-typo-body-1 mdui-valign">
            <img
              src="../../assets/static_image/r19.png"
              alt="avatar"
              class="mdui-img-circle mdui-shadow-2 mdui-m-a-1"
              width="40"
              height="40"
            />
            <div v-html="_message.msg"></div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="mdui-row mdui-m-r-4"
      style="position: absolute; width: inherit; bottom: 8px"
    >
      <div class="mdui-textfield">
        <img
          src="../../assets/static_image/r19.png"
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
          style="margin-left: 64px"
        ></textarea>
      </div>
    </div>
  </div>
</template>
