<script setup lang="ts">
import { ref } from 'vue'
import { Send } from 'lucide-vue-next'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

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
    <Input
      v-model="url"
      class="playback-input"
      placeholder="粘贴 YouTube 或直链媒体"
      :disabled="submitting"
      @keydown.enter.prevent="submit"
    />
    <Button
      class="app-button"
      type="button"
      :disabled="submitting"
      @click="submit"
    >
      <Send />
      发送
    </Button>
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
  font-size: 13px;
}

.playback-input-bar .app-button {
  flex: 0 0 auto;
  min-width: 64px;
}
</style>
