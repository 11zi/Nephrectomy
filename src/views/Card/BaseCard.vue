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
  contentProps: {
    type: Object,
    default: () => ({}),
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
    class="mdui-card float-card app-floating-card"
    :style="{ zIndex: currentZIndex }"
    @mousedown="bringToFront"
  >
    <div class="app-panel-shell">
      <div
        class="mdui-card-actions app-drag-header"
        @mousedown="m_d($event)"
        @touchstart="onTouchStart($event)"
      >
        <div class="mdui-card-primary-title app-drag-title">
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

      <div class="app-panel-content">
        <component v-if="contentComponent" :is="contentComponent" v-bind="contentProps" />
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

.app-drag-header .mdui-card-primary-title {
  flex: 1 1 auto;
  min-width: 0;
}
.app-drag-header .mdui-btn {
  flex: 0 0 auto;
  margin-left: auto;
}

@media (max-width: 768px) {
  .app-panel-shell {
    max-width: calc(100vw - 20px);
  }
}
</style>
