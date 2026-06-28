<!-- TODO: 私聊页面（占位，待实现） -->
<script setup lang="ts">
import { useContentStore } from '../../stores/useContentStore'
const contentStore = useContentStore()
</script>

<template>
  <div class="app-page">
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
        <i class="mdui-icon material-icons">message</i>
        <span>消息</span>
      </div>
    </div>

    <div class="app-scroll">
      <!-- TODO: 私聊内容待实现 -->
    </div>
  </div>
</template>
