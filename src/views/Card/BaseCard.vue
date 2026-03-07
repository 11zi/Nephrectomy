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

let cardOffSet = { left: 0, top: 0 }

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

// ── touch 拖拽 ──────────────────────────────────────────
function onTouchMove(_e: TouchEvent) {
  _e.stopPropagation()
  cardPos.value.left = _e.touches[0].clientX - cardOffSet.left + 'px'
  cardPos.value.top  = _e.touches[0].clientY - cardOffSet.top  + 'px'
}

function onTouchDragEnd(_e: TouchEvent) {
  _e.stopPropagation()
  isDrag.value = false
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchDragEnd)
}

function onTouchStart(_e: TouchEvent) {
  _e.stopPropagation()  // 阻止冒泡，防止 Content.vue 的侧边栏手势误判
  bringToFront()
  isDrag.value = true
  cardOffSet.left = _e.touches[0].clientX - parseInt(cardPos.value.left)
  cardOffSet.top  = _e.touches[0].clientY - parseInt(cardPos.value.top)

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
      <div style="width: 24vw; height: 48vh; overflow: hidden" class="mdui-color-blue-grey-200">
        <img
          src="../../../src/assets/static_image/xuan5.jpg"
          alt="静态图片"
          style="-webkit-user-drag: none; width: 100%; height: 100%; object-fit: cover; display: block"
        />
      </div>

      <div class="mdui-card-media-covered mdui-card-media-covered-top">
        <div class="mdui-card-actions drag-handle" @mousedown="m_d($event)" @touchstart="onTouchStart($event)">
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
</style>