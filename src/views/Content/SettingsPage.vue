<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from '../../stores/useContentStore'
import { useSettingsStore } from '../../stores/useSettingsStore'

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
      <button
        class="mdui-btn mdui-btn-icon mdui-ripple"
        type="button"
        title="返回聊天室"
        @click="contentStore.navigateTo('chat')"
      >
        <i class="mdui-icon material-icons">close</i>
      </button>

      <div class="app-page-title">
        <span>设置</span>
      </div>
    </div>

    <div class="app-scroll settings-scroll">
      <section class="app-panel">
        <div class="app-panel-header">
          <i class="mdui-icon material-icons">playlist_play</i>
          <span>点播</span>
        </div>

        <label class="app-row mdui-ripple">
          <div class="app-copy">
            <div class="app-copy-title">关闭视频点播功能</div>
            <div class="app-copy-desc">本地不再显示或播放房间中的视频点播</div>
          </div>
          <label class="mdui-switch app-switch">
            <input v-model="settingsStore.disableVideoPlayback" type="checkbox" />
            <i class="mdui-switch-icon"></i>
          </label>
        </label>

        <label class="app-row mdui-ripple">
          <div class="app-copy">
            <div class="app-copy-title">关闭音频点播功能</div>
            <div class="app-copy-desc">本地不再显示或播放房间中的音频点播</div>
          </div>
          <label class="mdui-switch app-switch">
            <input v-model="settingsStore.disableAudioPlayback" type="checkbox" />
            <i class="mdui-switch-icon"></i>
          </label>
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
      </section>

      <section class="app-panel">
        <div class="app-panel-header">
          <i class="mdui-icon material-icons">tune</i>
          <span>其他</span>
        </div>

        <label class="app-row mdui-ripple">
          <div class="app-copy">
            <div class="app-copy-title">保持侧边栏打开</div>
            <div class="app-copy-desc">切换页面或点击外部区域时不自动收起侧边栏</div>
          </div>
          <label class="mdui-switch app-switch">
            <input v-model="settingsStore.keepSidebarOpen" type="checkbox" />
            <i class="mdui-switch-icon"></i>
          </label>
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

@media (max-width: 600px) {
  .settings-scroll {
    padding: 10px;
    padding-bottom: calc(16px + var(--app-safe-area-bottom));
  }

  .settings-volume-control {
    width: 100%;
  }
}
</style>
