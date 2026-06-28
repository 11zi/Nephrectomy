<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: [url: string]
}>()

const url = ref('')

function submit() {
  emit('submit', url.value)
}

function clear() {
  url.value = ''
}

defineExpose({ clear })
</script>

<template>
  <div class="playback-input-bar">
    <div class="mdui-textfield playback-input">
      <input
        v-model="url"
        class="mdui-textfield-input"
        placeholder="粘贴 YouTube 或直链媒体"
        :disabled="submitting"
        @keydown.enter.prevent="submit"
      />
    </div>
    <button
      class="mdui-btn mdui-btn-raised mdui-ripple app-button"
      type="button"
      :disabled="submitting"
      @click="submit"
    >
      发送
    </button>
  </div>
</template>

<style scoped>
.playback-input-bar {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding: 10px 12px 12px;
  border-top: 1px solid rgba(84, 110, 122, 0.18);
  background: rgba(247, 250, 251, 0.72);
}

.playback-input {
  flex: 1 1 auto;
  min-width: 0;
  padding-top: 0;
}

.playback-input :deep(.mdui-textfield-input) {
  font-size: 13px;
}

.playback-input-bar .mdui-btn {
  flex: 0 0 auto;
  min-width: 64px;
}
</style>
