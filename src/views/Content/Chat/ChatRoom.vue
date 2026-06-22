<script setup lang="ts">
import { ref } from 'vue'
import InputBox from './InputBox.vue'
import Message from './Message.vue'
import { useChatStore } from '../../../stores/useChatStore'

const chatStore = useChatStore()
const inputBoxRef = ref<InstanceType<typeof InputBox> | null>(null)

async function sendMsg(message: string) {
  const result = await chatStore.sendMessage(message)
  if (!result) return
  mdui.mutation()
}

function formatMessageTime(createdAt: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt))
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
          v-for="message in chatStore.activeRoomMessages"
          :key="message.id"
          style="padding-right: 32px"
        >
          <Message
            :raw_msg="message.content"
            :avatar_url="message.sender.avatarUrl"
            :sender_name="message.sender.nickname"
            :timestamp="formatMessageTime(message.createdAt)"
          />
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
