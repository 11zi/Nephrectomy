<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { getNextZIndex } from '../../utils/useZIndex'

const isDrag = ref(false)
const currentZIndex = ref(8000)

const props = defineProps({
  panelName: String,
  stackIndex: {
    type: Number,
    default: 0,
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
    <div class="mdui-card-media">
      <div class="card-surface"></div>

      <div class="mdui-card-media-covered mdui-card-media-covered-top">
        <div
          class="mdui-card-actions drag-handle"
          @mousedown="m_d($event)"
          @touchstart="onTouchStart($event)"
        >
          <div class="mdui-card-primary-title mdui-float-left mdui-p-l-2">
            {{ panelName }}
          </div>
          <button
            class="mdui-btn mdui-btn-icon mdui-ripple mdui-ripple-white mdui-float-right"
            @click="_emit('closePanel')"
            @mousedown.stop
          >
            <i class="mdui-icon material-icons">close</i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.float-card {
  position: fixed;
  width: 24vw;
  height: 48vh;
  top: v-bind('cardPos.top');
  left: v-bind('cardPos.left');
}

@media (max-width: 768px) {
  .float-card {
    width: 80vw;
    height: 60vh;
  }
}

.drag-handle {
  cursor: grab;
  user-select: none;
}
.drag-handle:active {
  cursor: grabbing;
}

/* ── 程序化背景：渐变底色 + 噪声颗粒 + 暗角 ── */
.card-surface {
  width: 24vw;
  height: 48vh;
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

@media (max-width: 768px) {
  .card-surface {
    width: 80vw;
    height: 60vh;
  }
}
</style>
