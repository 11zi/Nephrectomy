<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import type { Component } from 'vue'
import { getNextZIndex } from '../../utils/useZIndex'

const isDrag = ref(false)
const currentZIndex = ref(8000)

const props = defineProps({
  panelName: String,
  stackIndex: {
    type: Number,
    default: 0,
  },
  contentComponent: {
    type: Object as () => Component | null,
    default: null,
  },
})
const _emit = defineEmits(['closePanel'])

const STACK_OFFSET = 28
const cardPos = ref({
  top: `${120 + props.stackIndex * STACK_OFFSET}px`,
  left: `${240 + props.stackIndex * STACK_OFFSET}px`,
})

const cardOffSet = { left: 0, top: 0 }

function bringToFront() {
  currentZIndex.value = getNextZIndex()
}

function onDragMove(_e: MouseEvent) {
  cardPos.value.left = _e.clientX - cardOffSet.left + 'px'
  cardPos.value.top = _e.clientY - cardOffSet.top + 'px'
}

function onDragEnd() {
  isDrag.value = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

function m_d(_e: MouseEvent) {
  bringToFront()
  isDrag.value = true
  cardOffSet.left = _e.clientX - parseInt(cardPos.value.left)
  cardOffSet.top = _e.clientY - parseInt(cardPos.value.top)
  _e.preventDefault()

  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

// touch drag
function onTouchMove(_e: TouchEvent) {
  _e.stopPropagation()
  cardPos.value.left = _e.touches[0].clientX - cardOffSet.left + 'px'
  cardPos.value.top = _e.touches[0].clientY - cardOffSet.top + 'px'
}

function onTouchDragEnd(_e: TouchEvent) {
  _e.stopPropagation()
  isDrag.value = false
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchDragEnd)
}

function onTouchStart(_e: TouchEvent) {
  _e.stopPropagation()
  bringToFront()
  isDrag.value = true
  cardOffSet.left = _e.touches[0].clientX - parseInt(cardPos.value.left)
  cardOffSet.top = _e.touches[0].clientY - parseInt(cardPos.value.top)

  document.addEventListener('touchmove', onTouchMove)
  document.addEventListener('touchend', onTouchDragEnd)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchDragEnd)
})
</script>

<template>
  <div
    class="mdui-card float-card"
    :style="{ zIndex: currentZIndex }"
    @mousedown="bringToFront"
  >
    <div class="card-surface">
      <div
        class="mdui-card-actions drag-handle"
        @mousedown="m_d($event)"
        @touchstart="onTouchStart($event)"
      >
        <div class="mdui-card-primary-title mdui-p-l-1">
          {{ panelName }}
        </div>
        <button
          class="mdui-btn mdui-btn-icon mdui-ripple"
          @click="_emit('closePanel')"
          @mousedown.stop
        >
          <i class="mdui-icon material-icons">close</i>
        </button>
      </div>

      <div class="card-content">
        <component v-if="contentComponent" :is="contentComponent" />
        <slot v-else></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.float-card {
  position: fixed;
  width: fit-content;
  height: fit-content;
  min-width: 280px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  top: v-bind('cardPos.top');
  left: v-bind('cardPos.left');
  overflow: hidden;
}

@media (max-width: 768px) {
  .float-card {
    max-width: calc(100vw - 20px);
  }
}

.drag-handle {
  cursor: grab;
  user-select: none;
  min-height: 48px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #263238;
  background: rgba(255, 255, 255, 0.78);
  border-bottom: 1px solid rgba(84, 110, 122, 0.16);
}
.drag-handle .mdui-card-primary-title {
  flex: 1 1 auto;
  min-width: 0;
}
.drag-handle .mdui-btn {
  flex: 0 0 auto;
  margin-left: auto;
}
.drag-handle:active {
  cursor: grabbing;
}

/* ── 程序化背景：渐变底色 + 噪声颗粒 + 暗角 ── */
.card-surface {
  width: 100%;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  overflow: hidden;
  position: relative;

  /* 底层：线性渐变，上方亮（暖灰）→ 底部暗（带紫） */
  background: linear-gradient(-180deg, #cfd8dc 0%, #607d8b 75%);
}

/* 噪声颗粒 — 底图作为 overlay 叠加，opacity 控制强度 */
.card-surface::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('../../assets/static_image/noise_pic.png') center / 256px 256px repeat;
  opacity: 0.10;
  mix-blend-mode: overlay;
  pointer-events: none;
}

/* 暗角 — 径向渐变，中心透明，边缘暗紫 */
.card-surface::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 40% 45%,
    transparent 40%,
    rgba(0, 0, 0, 0.15) 70%,
    rgba(10, 5, 20, 0.55) 100%
  );
  pointer-events: none;
}

.card-content {
  position: relative;
  max-height: calc(100vh - 104px);
  overflow: auto;
}

@media (max-width: 768px) {
  .card-surface {
    max-width: calc(100vw - 20px);
  }
}
</style>
