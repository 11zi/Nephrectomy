<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import InputBox from './InputBox.vue'
import type { ChatMessage } from '../../../types/chatTypes'
import { PRESET_CHAT_EMOJI_LABELS } from '../../../utils/chatEmoji'

defineProps<{
  replyTarget?: ChatMessage | null
}>()

const emit = defineEmits<{
  sendMsg: [message: string]
  cancelReply: []
}>()

const inputBoxRef = ref<InstanceType<typeof InputBox> | null>(null)

function insertTextAtCursor(text: string) {
  inputBoxRef.value?.insertTextAtCursor(text)
}

defineExpose({
  insertTextAtCursor,
})
</script>

<template>
  <div class="chat-input-shell">
    <InputBox
      ref="inputBoxRef"
      :reply-target="replyTarget"
      @sendMsg="emit('sendMsg', $event)"
      @cancel-reply="emit('cancelReply')"
    />
  </div>

  <Transition name="emoji-panel">
    <div v-if="inputBoxRef?.emojiPanelOpen" class="emoji-drawer">
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
            class="emoji-item"
            @click="inputBoxRef?.insertEmoji(icon)"
            :title="icon"
          >
            <span class="emoji-preset-glyph">{{ PRESET_CHAT_EMOJI_LABELS[icon] }}</span>
          </button>
        </template>
        <template v-else>
          <button
            class="emoji-item emoji-add-item"
            type="button"
            title="从链接添加表情"
            @click="inputBoxRef?.openAddCustomEmojiDialog()"
          >
            <Plus :size="22" />
          </button>
          <button
            v-for="url in inputBoxRef?.customEmojis"
            :key="url"
            class="emoji-item"
            type="button"
            @click="inputBoxRef?.insertCustomEmoji(url)"
            :title="url"
          >
            <img class="emoji-custom-image" :src="url" alt="表情" loading="lazy" referrerpolicy="no-referrer" />
          </button>
          <div v-if="!inputBoxRef?.customEmojis?.length" class="emoji-empty">
            暂无自定义表情
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.chat-input-shell {
  flex: 0 0 auto;
  padding-bottom: var(--app-safe-area-bottom);
  background: rgba(236, 239, 241, 0.86);
}

.emoji-drawer {
  flex-shrink: 0;
  margin-right: 8px;
  border-top: 1px solid #e0e0e0;
  background: #fff;
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.12);
}

.emoji-tabs {
  display: flex;
  height: 48px;
  border-bottom: 1px solid #eeeeee;
}

.emoji-tab {
  flex: 1;
  position: relative;
  min-width: 72px;
  padding: 0 16px;
  border: none;
  background: none;
  color: rgba(0, 0, 0, 0.54);
  font-size: 13px;
  line-height: 48px;
  cursor: pointer;
  transition: color 0.15s;
}

.emoji-tab.active {
  color: #2196f3;
}

.emoji-tab.active::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  background: #2196f3;
  content: '';
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 188px;
  padding: 12px;
  overflow-y: auto;
}

.emoji-item {
  width: 44px;
  height: 44px;
  border: none;
  background: none;
  border-radius: 4px;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.66);
  overflow: hidden;
  transition: background 0.15s, color 0.15s;
}

.emoji-item:hover {
  background: #eeeeee;
  color: #2196f3;
}

.emoji-preset-glyph {
  font-size: 28px;
  line-height: 1;
}

.emoji-add-item {
  border: 1px dashed #bdbdbd;
  color: rgba(0, 0, 0, 0.46);
}

.emoji-custom-image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.emoji-empty {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 8px;
  color: rgba(0, 0, 0, 0.38);
  font-size: 13px;
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

@media (max-width: 600px) {
  .chat-input-shell {
    border-top: 1px solid rgba(84, 110, 122, 0.14);
  }

  .emoji-drawer {
    margin-right: 0;
  }

  .emoji-tabs {
    height: 44px;
  }

  .emoji-tab {
    line-height: 44px;
  }

  .emoji-grid {
    gap: 6px;
    max-height: min(36dvh, 220px);
    padding: 10px;
  }

  .emoji-item {
    width: 42px;
    height: 42px;
  }
}
</style>
