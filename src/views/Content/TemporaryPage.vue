<script setup lang="ts">
import { ref, Text } from 'vue'

const enums = ref([
  { count: '1', msg: '你' },
  { count: '2', msg: '你说你不想在这里！' },
  { count: '3', msg: '我也不想在这里！' },
])
const message_send = ref('')
function sendMsg(msgEvent: { shiftKey: boolean; altKey: boolean } | null) {
  if (msgEvent == null || (!msgEvent.shiftKey && !msgEvent.altKey)) {
    enums.value.push({
      count: enums.value.length.toString(),
      msg: message_send.value,
    })
    console.log(message_send.value)
    message_send.value = '' // 当侧边栏打开后，清空数值失效了，不再同步
    mdui.mutation()
  }
}
</script>
<template>
  <div
    class="mdui-container"
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
            <p>{{ _message.msg }}</p>
          </div>
        </div>
      </div>
    </div>
    <div
      class="mdui-row"
      style="position: absolute; width: inherit; bottom: 8px"
    >
      <div class="mdui-textfield">
        <img
          src="../../assets/static_image/r19.png"
          alt="avatar"
          class="mdui-img-rounded mdui-shadow-1 mdui-m-a-1"
          style="position: absolute; top: 0px"
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
