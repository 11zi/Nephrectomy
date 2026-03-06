<!-- 私聊页面（占位，待实现） -->
<script setup lang="ts">
import { useContentStore } from '../../stores/useContentStore'
const contentStore = useContentStore()
</script>

<template>
  <div
    class="mdui-container-fluid mdui-m-l-5"
    style="height: 100%; width: -webkit-fill-available"
  >
    <div class="mdui-row mdui-p-a-3">
      <div class="mdui-typo-display-1 mdui-m-b-2">消息</div>
      <!-- 私聊内容待实现 -->
    </div>
    <button
      class="mdui-btn mdui-btn-raised mdui-ripple"
      @click="contentStore.navigateTo('chat')"
    >
      <i class="mdui-icon material-icons">arrow_back</i>
      返回聊天室
    </button>
  </div>
</template>
