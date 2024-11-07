<script setup lang="ts">
import { ref } from 'vue'
import InputBox from './InputBox.vue'
import Message from './Message.vue'
const enums = ref([
  { count: '1', msg: '<p>你。。</p>' },
  { count: '2', msg: '<h2>你说你不想在这里！</h2>' },
  { count: '3', msg: '<h1>我也不想在这里！</h1>' },
  { count: '3', msg: '<h1>我也不想在这里！</h1>' },
  { count: '3', msg: '<h1>我也不想在这里！</h1>' },
  {
    count: '3',
    msg: '<h4>我也不想在这里！style="height: 92%; overflow: scroll; width: calc(100vw-240px)"style="height: 92%; overflow: scroll; width: calc(100vw-240px)"style="height: 92%; overflow: scroll; width: calc(100vw-240px)"style="height: 92%; overflow: scroll; width: calc(100vw-240px)"style="height: 92%; overflow: scroll; width: calc(100vw-240px)"style="height: 92%; overflow: scroll; width: calc(100vw-240px)"style="height: 92%; overflow: scroll; width: calc(100vw-240px)"style="height: 92%; overflow: scroll; width: calc(100vw-240px)"</h1>',
  },
])
const avatar_url_ = '../../assets/static_image/r19.png'
function sendMsg(_msg: { value: string }) {
  console.log(_msg)
  enums.value.push({
    count: enums.value.length.toString(),
    msg: _msg,
  })

  mdui.mutation()
}
</script>
<template>
  <div
    class="mdui-container-fluid mdui-m-l-5"
    style="height: 100%; width: -webkit-fill-available"
  >
    <div
      class="mdui-row"
      style="height: 92%; overflow: scroll; width: calc(100vw-240px)"
    >
      <div class="mdui-col-md-6 mdui-col-xs-10 mdui-m-b-2" style="width: 100%">
        <div
          class="mdui-row mdui-m-a-1"
          v-for="_message in enums"
          :key="_message.count"
          style="padding-right: 120px"
        >
          <Message :html_msg="_message.msg" :avatar_url="avatar_url_"></Message>
        </div>
      </div>
    </div>
    <InputBox @sendMsg="sendMsg" />
  </div>
</template>
