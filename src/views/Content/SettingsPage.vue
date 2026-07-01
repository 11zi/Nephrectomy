<script setup lang="ts">
import { computed } from 'vue'
import { ListVideo, SlidersHorizontal, X } from 'lucide-vue-next'
import { Button } from '../../components/ui/button'
import { Switch } from '../../components/ui/switch'
import { useContentStore } from '../../stores/useContentStore'
import { PLAYBACK_RESOLUTION_OPTIONS, useSettingsStore } from '../../stores/useSettingsStore'

const contentStore = useContentStore()
const settingsStore = useSettingsStore()

const volumeText = computed(() => `${settingsStore.masterVolume}%`)

function normalizeVolumeInput(event: Event) {
  const input = event.target as HTMLInputElement
  settingsStore.masterVolume = Number(input.value)
}
</script>

<template>
  <div class="app-page settings-page">
    <div class="app-page-header">
      <Button
        class="app-header-icon-button"
        variant="ghost"
        size="icon"
        type="button"
        title="返回聊天室"
        @click="contentStore.navigateTo('chat')"
      >
        <X />
      </Button>

      <div class="app-page-title">
        <span>设置</span>
      </div>
    </div>

    <div class="app-scroll settings-scroll">
      <section class="app-panel">
        <div class="app-panel-header">
          <ListVideo />
          <span>点播</span>
        </div>

        <label class="app-row">
          <div class="app-copy">
            <div class="app-copy-title">关闭视频点播功能</div>
            <div class="app-copy-desc">本地不再显示或播放房间中的视频点播</div>
          </div>
          <Switch v-model="settingsStore.disableVideoPlayback" />
        </label>

        <label class="app-row">
          <div class="app-copy">
            <div class="app-copy-title">关闭音频点播功能</div>
            <div class="app-copy-desc">本地不再显示或播放房间中的音频点播</div>
          </div>
          <Switch v-model="settingsStore.disableAudioPlayback" />
        </label>

        <div class="app-row settings-volume-row">
          <div class="app-copy">
            <div class="app-copy-title">总音量</div>
            <div class="app-copy-desc">控制本地点播播放器音量</div>
          </div>
          <div class="app-control-cluster settings-volume-control">
            <input
              class="app-slider"
              type="range"
              min="0"
              max="100"
              step="1"
              :value="settingsStore.masterVolume"
              :aria-valuetext="volumeText"
              @input="normalizeVolumeInput"
            />
            <span class="app-value-label">{{ volumeText }}</span>
          </div>
        </div>

        <label class="app-row">
          <div class="app-copy">
            <div class="app-copy-title">点播分辨率</div>
            <div class="app-copy-desc">优先使用所选清晰度，源站不支持时自动降级</div>
          </div>
          <select
            v-model="settingsStore.playbackResolution"
            class="settings-resolution-select"
          >
            <option
              v-for="option in PLAYBACK_RESOLUTION_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
      </section>

      <section class="app-panel">
        <div class="app-panel-header">
          <SlidersHorizontal />
          <span>其他</span>
        </div>

        <label class="app-row">
          <div class="app-copy">
            <div class="app-copy-title">保持侧边栏打开</div>
            <div class="app-copy-desc">切换页面或点击外部区域时不自动收起侧边栏</div>
          </div>
          <Switch v-model="settingsStore.keepSidebarOpen" />
        </label>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-scroll {
  display: grid;
  align-content: start;
  gap: 14px;
  max-width: 760px;
  width: 100%;
  margin: 0 auto;
  padding-bottom: calc(16px + var(--app-safe-area-bottom));
}

.settings-scroll .app-panel {
  max-width: 100%;
}

.settings-volume-row {
  align-items: flex-start;
}

.settings-volume-control {
  width: min(300px, 44vw);
  padding-top: 4px;
}

.settings-resolution-select {
  width: min(180px, 36vw);
  height: 38px;
  flex: 0 0 auto;
  border: 1px solid var(--app-line);
  border-radius: var(--app-radius-sm);
  padding: 0 34px 0 12px;
  color: var(--app-text);
  background: var(--app-surface-strong);
  outline: none;
  cursor: pointer;
}

.settings-resolution-select:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

@media (max-width: 600px) {
  .settings-scroll {
    padding: 10px;
    padding-bottom: calc(16px + var(--app-safe-area-bottom));
  }

  .settings-volume-control {
    width: 100%;
  }

  .settings-resolution-select {
    width: 100%;
  }
}
</style>
