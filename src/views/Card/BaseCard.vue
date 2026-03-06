<script setup lang="ts">
import { ref } from 'vue'

// 全局 z-index 计数器，所有 BaseCard 实例共享
// 模块级变量，不需要响应式
let globalZIndex = 8000

const isDrag = ref(false)
const currentZIndex = ref(globalZIndex)

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

/** 将当前卡片提升到最顶层 */
function bringToFront() {
  globalZIndex++
  currentZIndex.value = globalZIndex
}

// 拖拽只绑定在标题栏（drag-handle），见模板
function m_d(_e: MouseEvent) {
  bringToFront()
  isDrag.value = true
  cardOffSet.left = _e.clientX - parseInt(cardPos.value.left)
  cardOffSet.top = _e.clientY - parseInt(cardPos.value.top)
  // 阻止拖拽时触发文本选中
  _e.preventDefault()
}

function m_m(_e: MouseEvent) {
  if (!isDrag.value) return
  cardPos.value.left = _e.clientX - cardOffSet.left + 'px'
  cardPos.value.top = _e.clientY - cardOffSet.top + 'px'
}

function m_u() {
  isDrag.value = false
  cardOffSet = { top: 0, left: 0 }
}
</script>

<template>
  <div
    class="mdui-card float-card"
    :style="{ zIndex: currentZIndex }"
    @mousedown="bringToFront"
    @mousemove="m_m($event)"
    @mouseup="m_u()"
  >
    <div class="mdui-card-media">
      <div style="width: 24vw; height: 48vh" class="mdui-color-blue-grey-200">
        <img
          class="mdui-img-fluid"
          src="../../../src/assets/static_image/xuan5.jpg"
          alt="静态图片"
          style="-webkit-user-drag: none"
        />
      </div>

      <!-- 标题栏作为拖拽手柄，preventDefault 只在这里生效 -->
      <div class="mdui-card-media-covered mdui-card-media-covered-top">
        <div class="mdui-card-actions drag-handle" @mousedown="m_d($event)">
          <div class="mdui-card-primary-title mdui-float-left mdui-p-l-2">
            {{ panelName }}
          </div>
          <!-- .stop 阻止冒泡，防止关闭按钮触发拖拽的 preventDefault -->
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
  position: absolute;
  width: 24vw;
  height: 48vh;
  top: v-bind('cardPos.top');
  left: v-bind('cardPos.left');
}

/* 拖拽手柄：手型光标 + 禁止选中文本 */
.drag-handle {
  cursor: grab;
  user-select: none;
}
.drag-handle:active {
  cursor: grabbing;
}
</style>
