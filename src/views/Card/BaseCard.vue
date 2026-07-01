<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'
import type { Component } from 'vue'
import { Button } from '../../components/ui/button'
import { getNextZIndex } from '../../utils/useZIndex'
import { useSidebar } from '../../composables/useSidebar'

const isDrag = ref(false)
const currentZIndex = ref(8000)
const { isMobileViewport } = useSidebar()

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
  if (isMobileViewport()) return
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
  if (isMobileViewport()) return

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
  if (isMobileViewport()) return

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
  if (isMobileViewport()) return

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
    class="float-card app-floating-card"
    :style="{ zIndex: currentZIndex }"
    @mousedown="bringToFront"
  >
    <div class="app-panel-shell">
      <div
        class="app-drag-header"
        @mousedown="m_d($event)"
        @touchstart="onTouchStart($event)"
      >
        <div class="app-drag-title">
          {{ panelName }}
        </div>
        <Button
          variant="ghost"
          size="icon"
          class="app-panel-close-button"
          @click="_emit('closePanel')"
          @mousedown.stop
          title="关闭"
        >
          <X />
        </Button>
      </div>
      <div
        class="app-drag-extension"
        aria-hidden="true"
        @mousedown="m_d($event)"
        @touchstart="onTouchStart($event)"
      ></div>

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

.app-drag-title {
  flex: 1 1 auto;
  min-width: 0;
  padding-left: 14px;
  overflow: hidden;
  font-size: var(--app-font-lg);
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-panel-close-button {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  margin-right: 8px;
  margin-left: auto;
  border: 0;
  border-radius: var(--app-radius-sm);
  background: transparent;
  color: var(--app-text-soft);
  box-shadow: none;
}

.app-panel-close-button:hover {
  background: rgba(84, 110, 122, 0.12);
  color: var(--app-text);
}

.app-panel-close-button:focus-visible {
  outline: 2px solid rgba(84, 110, 122, 0.28);
  outline-offset: 2px;
}

.app-drag-header {
  min-height: 42px;
  padding: 4px 0;
}

.app-drag-extension {
  position: absolute;
  top: 42px;
  right: 0;
  left: 0;
  z-index: 2;
  height: 10px;
  cursor: grab;
}

.app-drag-extension:active {
  cursor: grabbing;
}

@media (max-width: 768px) {
  .app-panel-shell {
    max-width: calc(100vw - 20px);
  }
}

@media (max-width: 600px) {
  .float-card {
    --mobile-panel-max-height: min(86dvh, calc(var(--app-viewport-height) - var(--app-safe-area-top) - 12px));

    right: 0;
    bottom: 0;
    left: 0;
    top: auto;
    width: 100%;
    height: auto;
    min-width: 0;
    max-width: 100vw;
    max-height: var(--mobile-panel-max-height);
    border-radius: 10px 10px 0 0;
  }

  .app-panel-shell {
    width: 100%;
    max-width: 100%;
    max-height: var(--mobile-panel-max-height);
    border-radius: 10px 10px 0 0;
  }

  .app-drag-header {
    min-height: 44px;
    cursor: default;
    touch-action: pan-y;
    padding: 5px calc(var(--app-safe-area-right) + 0px) 5px calc(var(--app-safe-area-left) + 0px);
  }

  .app-drag-header:active {
    cursor: default;
  }

  .app-drag-title {
    padding-left: calc(var(--app-safe-area-left) + 14px);
    font-size: 16px;
  }

  .app-panel-close-button {
    margin-right: calc(var(--app-safe-area-right) + 8px);
  }

  .app-drag-extension {
    display: none;
  }

  .app-panel-content {
    max-height: calc(var(--mobile-panel-max-height) - 44px);
    overflow: auto;
    overscroll-behavior: contain;
    padding-bottom: var(--app-safe-area-bottom);
  }

  .app-panel-content :deep(> *) {
    width: 100%;
    max-width: 100%;
  }
}
</style>
