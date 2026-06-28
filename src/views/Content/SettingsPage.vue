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
  <div class="settings-page-root">
    <div class="settings-header">
      <div class="settings-title">
        <i class="mdui-icon material-icons">settings</i>
        <span>设置</span>
      </div>

      <button
        class="mdui-btn mdui-btn-icon mdui-ripple"
        type="button"
        title="返回聊天室"
        @click="contentStore.navigateTo('chat')"
      >
        <i class="mdui-icon material-icons">close</i>
      </button>
    </div>

    <div class="settings-scroll">
      <section class="settings-section">
        <div class="section-heading">
          <i class="mdui-icon material-icons">playlist_play</i>
          <span>点播</span>
        </div>

        <label class="setting-row mdui-ripple">
          <div class="setting-copy">
            <div class="setting-title">关闭视频点播功能</div>
            <div class="setting-desc">本地不再显示或播放房间中的视频点播</div>
          </div>
          <label class="mdui-switch">
            <input v-model="settingsStore.disableVideoPlayback" type="checkbox" />
            <i class="mdui-switch-icon"></i>
          </label>
        </label>

        <label class="setting-row mdui-ripple">
          <div class="setting-copy">
            <div class="setting-title">关闭音频点播功能</div>
            <div class="setting-desc">本地不再显示或播放房间中的音频点播</div>
          </div>
          <label class="mdui-switch">
            <input v-model="settingsStore.disableAudioPlayback" type="checkbox" />
            <i class="mdui-switch-icon"></i>
          </label>
        </label>

        <div class="setting-row volume-row">
          <div class="setting-copy">
            <div class="setting-title">总音量</div>
            <div class="setting-desc">控制本地点播播放器音量</div>
          </div>
          <div class="volume-control">
            <input
              class="volume-slider"
              type="range"
              min="0"
              max="100"
              step="1"
              :value="settingsStore.masterVolume"
              :aria-valuetext="volumeText"
              @input="normalizeVolumeInput"
            />
            <span class="volume-value">{{ volumeText }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-page-root {
  height: 100%;
  width: -webkit-fill-available;
  display: flex;
  flex-direction: column;
  background: #eceff1;
  overflow: hidden;
  color: #263238;
}

.settings-header {
  min-height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 16px;
  background: transparent;
}

.settings-title {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #37474f;
}

.settings-title .mdui-icon {
  font-size: 22px;
  color: #607d8b;
}

.settings-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
}

.settings-section {
  max-width: 720px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(84, 110, 122, 0.16);
  border-radius: 8px;
  overflow: hidden;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(84, 110, 122, 0.14);
  color: #455a64;
  font-size: 15px;
  font-weight: 600;
}

.section-heading .mdui-icon {
  font-size: 20px;
  color: #607d8b;
}

.setting-row {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(84, 110, 122, 0.1);
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-copy {
  min-width: 0;
}

.setting-title {
  font-size: 14px;
  font-weight: 600;
  color: #263238;
}

.setting-desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #78909c;
}

.volume-row {
  align-items: flex-start;
}

.volume-control {
  width: min(300px, 44vw);
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
}

.volume-slider {
  flex: 1;
  min-width: 120px;
  accent-color: #546e7a;
}

.volume-value {
  width: 42px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #455a64;
}

@media (max-width: 600px) {
  .settings-scroll {
    padding: 10px;
  }

  .setting-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .setting-row .mdui-switch {
    align-self: flex-end;
  }

  .volume-control {
    width: 100%;
  }
}
</style>
