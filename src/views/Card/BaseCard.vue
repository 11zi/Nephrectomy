<script setup lang="ts">
import { ref } from 'vue'

const isDrag = ref(false)
const cardPos = ref({
  top: '120px',
  left: '240px',
})
const _emit = defineEmits(['closePanel'])
const props = defineProps({ panelName: String })
let cardOffSet = {
  left: 0,
  top: 0,
}

function m_d(_e: Event) {
  isDrag.value = true
  cardOffSet.left = _e.clientX - parseInt(cardPos.value.left)
  cardOffSet.top = _e.clientY - parseInt(cardPos.value.top)
  m_m(_e)
}
function m_m(_e: Event) {
  if (!isDrag.value) return
  cardPos.value.left = _e.clientX - cardOffSet.left + 'px'
  cardPos.value.top = _e.clientY - cardOffSet.top + 'px'
}
function m_u() {
  isDrag.value = false
  cardOffSet = {
    top: 0,
    left: 0,
  }
}
</script>
<template>
  <div
    class="mdui-card float-card"
    id="card-id"
    v-on:mousedown="m_d($event)"
    v-on:mousemove="m_m($event)"
    v-on:mouseup="m_u()"
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

      <div class="mdui-card-media-covered mdui-card-media-covered-top">
        <div class="mdui-card-actions">
          <div class="mdui-card-primary-title mdui-float-left mdui-p-l-2">
            {{ panelName }}
          </div>
          <button
            class="mdui-btn mdui-btn-icon mdui-ripple mdui-ripple-white mdui-float-right"
            @click="_emit('closePanel')"
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
  z-index: 8000;
}
</style>
