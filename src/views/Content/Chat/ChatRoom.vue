<script setup lang="ts">
import { ref } from 'vue'
import InputBox from './InputBox.vue'
import Message from './Message.vue'

// 存储原始 Markdown 文本，而非解析后的 HTML
const enums = ref([
  { count: '1', msg: '你。。' },
  { count: '2', msg: '## 你说你不想在这里！' },
  { count: '3', msg: '# 我也不想在这里！' },
  { count: '4', msg: '### 但天黑' },
])

const avatar_url_ = 'src/assets/static_image/r19.png'

function sendMsg(_msg: string) {
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
      style="height: 92%; overflow-y: auto; width: calc(100vw - 240px)"
    >
      <div class="mdui-col-md-6 mdui-col-xs-10 mdui-m-b-2" style="width: 100%">
        <div
          class="mdui-row mdui-m-a-1"
          v-for="_message in enums"
          :key="_message.count"
          style="padding-right: 120px"
        >
          <!-- raw_msg 传原始文本，解析和过滤在 Message.vue 内部进行 -->
          <Message :raw_msg="_message.msg" :avatar_url="avatar_url_" />
        </div>
      </div>
    </div>
    <InputBox @sendMsg="sendMsg" />
  </div>
</template>
