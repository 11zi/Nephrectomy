<script setup lang="ts">
import { ref } from 'vue'
import InputBox from './InputBox.vue'
import Message from './Message.vue'

const enums = ref([
  { count: '1', msg: '你。。' },
  { count: '2', msg: '## 你说你不想在这里！' },
  { count: '3', msg: '# 我也不想在这里！' },
  { count: '4', msg: '### 但天黑' },
])

const avatar_url_ = 'src/assets/static_image/r19.png'
const inputBoxRef = ref<InstanceType<typeof InputBox> | null>(null)

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
    style="
      height: 100%;
      width: -webkit-fill-available;
      display: flex;
      flex-direction: column;
    "
  >
    <!-- 消息滚动区，flex: 1 占满剩余空间 -->
    <div
      class="mdui-row"
      style="flex: 1; overflow-y: auto; width: -webkit-fill-available; min-height: 0"
    >
      <div class="mdui-col-md-6 mdui-col-xs-10 mdui-m-b-2" style="width: 100%">
        <div
          class="mdui-row mdui-m-a-1"
          v-for="_message in enums"
          :key="_message.count"
          style="padding-right: 32px"
        >
          <Message :raw_msg="_message.msg" :avatar_url="avatar_url_" />
        </div>
      </div>
    </div>

    <!-- 输入栏，flex-shrink: 0 固定在底部 -->
    <div style="flex-shrink: 0">
      <InputBox ref="inputBoxRef" @sendMsg="sendMsg" />
    </div>

    <!-- 表情面板：独立 flex item，在输入框下方展开，完全在文档流中 -->
    <Transition name="emoji-panel">
      <div v-if="inputBoxRef?.emojiPanelOpen" class="emoji-drawer mdui-color-blue-grey-50">
        <div class="emoji-tabs">
          <button
            class="emoji-tab"
            :class="{ active: inputBoxRef?.emojiTab === 'preset' }"
            @click="inputBoxRef!.emojiTab = 'preset'"
          >预设表情</button>
          <button
            class="emoji-tab"
            :class="{ active: inputBoxRef?.emojiTab === 'custom' }"
            @click="inputBoxRef!.emojiTab = 'custom'"
          >我的表情</button>
        </div>
        <div class="emoji-grid">
          <template v-if="inputBoxRef?.emojiTab === 'preset'">
            <button
              v-for="icon in inputBoxRef?.presetEmojis"
              :key="icon"
              class="emoji-item mdui-ripple"
              @click="inputBoxRef?.insertEmoji(icon)"
              :title="icon"
            >
              <i class="mdui-icon material-icons">{{ icon }}</i>
            </button>
          </template>
          <template v-else>
            <div v-if="!inputBoxRef?.customEmojis?.length" class="emoji-empty">
              暂无自定义表情包
            </div>
            <button
              v-for="icon in inputBoxRef?.customEmojis"
              :key="icon"
              class="emoji-item mdui-ripple"
              @click="inputBoxRef?.insertEmoji(icon)"
              :title="icon"
            >
              <i class="mdui-icon material-icons">{{ icon }}</i>
            </button>
          </template>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.emoji-drawer {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid #cfd8dc;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
  margin-right: 8px;
}

.emoji-tabs {
  display: flex;
  border-bottom: 1px solid #eceff1;
}

.emoji-tab {
  flex: 1;
  padding: 10px 0;
  border: none;
  background: none;
  font-size: 13px;
  color: #78909c;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}
.emoji-tab.active {
  color: #546e7a;
  border-bottom-color: #546e7a;
  font-weight: 600;
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 8px;
  gap: 4px;
  max-height: 180px;
  overflow-y: auto;
}

.emoji-item {
  width: 44px;
  height: 44px;
  border: none;
  background: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #546e7a;
  transition: background 0.15s;
}
.emoji-item:hover { background: #eceff1; }
.emoji-item .mdui-icon { font-size: 28px; }

.emoji-empty {
  width: 100%;
  text-align: center;
  padding: 24px 0;
  font-size: 13px;
  color: #b0bec5;
}

.emoji-panel-enter-active,
.emoji-panel-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  max-height: 260px;
  overflow: hidden;
}
.emoji-panel-enter-from,
.emoji-panel-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>